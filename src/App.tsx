import { Page, Button, Controls, Field, MessageBox } from './ui';
import { useId, useState } from 'react';
import {
  createSmokeCredential,
  createUnifiedPrfTest,
  parseUnifiedPrfTest,
  checkUnifiedPrfTest,
  type PrfTestDevice,
  type PrfUnifiedTest,
  type PrfUnifiedReport,
  type PrfVerificationPolicy,
} from './prf';

type View =
  | Readonly<{ step: 'device' }>
  | Readonly<{ step: 'start'; device: PrfTestDevice }>
  | Readonly<{ step: 'create'; device: PrfTestDevice }>
  | Readonly<{ step: 'encrypt'; device: PrfTestDevice; credentialId: string }>
  | Readonly<{ step: 'transfer'; packet: PrfUnifiedTest }>
  | Readonly<{ step: 'paste'; device: PrfTestDevice; text: string }>
  | Readonly<{ step: 'check'; device: PrfTestDevice; packet: PrfUnifiedTest }>
  | Readonly<{ step: 'result'; packet: PrfUnifiedTest; report: PrfUnifiedReport }>;

const DEVICE_LABELS: Readonly<Record<PrfTestDevice, string>> = { phone: 'Phone', desktop: 'Desktop' };
const STEP_LABELS: Readonly<Record<View['step'], string>> = {
  device: '1. Choose this device', start: '2. Start or continue', create: '3. Create a disposable passkey',
  encrypt: '4. Encrypt and prepare the test', transfer: '5. Transfer or check the test',
  paste: '3. Load the test', check: '4. Approve the check', result: '5. Combined results',
};

/** Keep clipboard side effects on the browser's own textarea/clipboard APIs. */
function selectField(id: string, length: number): boolean {
  const field = document.getElementById(id);
  if (!(field instanceof HTMLTextAreaElement)) return false;
  field.focus();
  field.select();
  field.setSelectionRange(0, length);
  return true;
}

async function copyField(id: string, value: string): Promise<Readonly<{ copied: boolean; selected: boolean }>> {
  // Try legacy copy during the tap itself, before an await can consume
  // transient activation. Clipboard API and selected-text fallback follow.
  try {
    if (selectField(id, value.length) && document.execCommand('copy')) return { copied: true, selected: true };
  } catch { /* Clipboard API may still work when legacy copy is unavailable. */ }
  try {
    await navigator.clipboard.writeText(value);
    return { copied: true, selected: false };
  } catch {
    const selected = (() => { try { return selectField(id, value.length); } catch { return false; } })();
    return { copied: false, selected };
  }
}

const failureCode = (error: unknown): string => error instanceof SyntaxError ? 'INVALID_TEST'
  : error instanceof DOMException ? error.name : error instanceof Error ? error.message : 'TEST_FAILED';

export function PrfSmokeTest({ rpId }: { readonly rpId: string }) {
  const fieldId = useId();
  const [view, setView] = useState<View>({ step: 'device' });
  const [status, setStatus] = useState<Readonly<{ busy: boolean; message?: string; code?: string }>>({ busy: false });
  const packetText = view.step === 'transfer' ? JSON.stringify(view.packet, null, 2) : '';
  const reportText = view.step === 'result' ? JSON.stringify(view.report, null, 2) : '';
  const overallPassed = view.step === 'result' && view.report.samePrf && view.report.checkingResult.opensTest;
  const device = view.step === 'device' ? null : view.step === 'transfer' ? view.packet.sourceDevice
    : view.step === 'result' ? view.report.checkingDevice : view.device;
  const testId = view.step === 'transfer' || view.step === 'check' ? view.packet.testId
    : view.step === 'result' ? view.report.testId : null;

  async function approve(userVerification: PrfVerificationPolicy = 'preferred'): Promise<void> {
    if (status.busy || (view.step !== 'create' && view.step !== 'encrypt' && view.step !== 'check')) return;
    setStatus({ busy: true });
    try {
      // Each branch invokes its native ceremony directly from this tap.
      // Create and fresh-assertion encryption intentionally use separate taps.
      const next: View = view.step === 'create'
        ? { step: 'encrypt', device: view.device, credentialId: await createSmokeCredential(rpId) }
        : view.step === 'encrypt'
          ? { step: 'transfer', packet: await createUnifiedPrfTest(rpId, view.credentialId, view.device, navigator.credentials, userVerification) }
          : { step: 'result', packet: view.packet, report: await checkUnifiedPrfTest(rpId, view.packet, view.device, navigator.credentials, userVerification) };
      setView(next);
      setStatus({ busy: false });
    } catch (error) {
      const code = failureCode(error);
      setStatus({ busy: false, code, message: code === 'USER_NOT_VERIFIED'
        ? 'Your browser did not report identity verification (USER_NOT_VERIFIED). The test stopped before accepting any encryption keys.'
        : `This step could not complete (${code}).` });
    }
  }

  function load(): void {
    if (view.step !== 'paste' || status.busy) return;
    try {
      const packet = parseUnifiedPrfTest(rpId, view.text);
      setView({ step: 'check', device: view.device, packet });
      setStatus({ busy: false });
    } catch (error) {
      setStatus({ busy: false, message: `The test could not be loaded (${failureCode(error)}). Check that both devices use this same page, then paste the complete test.` });
    }
  }

  async function copy(id: string, value: string, copiedMessage: string): Promise<void> {
    if (status.busy) return;
    setStatus({ busy: true });
    const result = await copyField(id, value);
    setStatus({ busy: false, message: result.copied ? copiedMessage : result.selected
      ? 'Copy was blocked. The full text is selected; use your device’s Copy command.'
      : 'Copy was blocked. Select the full text in the field and use your device’s Copy command.' });
  }

  function restart(): void {
    if (status.busy) return;
    setView({ step: 'device' });
    setStatus({ busy: false });
  }

  return <Page title="Passkey Lab" lockup="none" footer={<>
    <p>Test website: <code>{rpId}</code>. Use this same address on both devices.</p>
    <p>Use only passkeys created for testing. Copied reports include their encryption keys and passkey identifiers.</p>
  </>}>
    <p>We have discovered several scenarios where successfully unlocking a passkey doesn’t guarantee matching encryption keys, particularly across devices, browsers, and password managers.</p>
    <p>This lab checks whether data encrypted with a passkey on one device can be unlocked with that same passkey on another. Use a disposable passkey to find compatibility gaps and help vendors fix them.</p>
    <details className="usage-guide" open={view.step === 'device'}>
      <summary>How to use</summary>
      <ol className="usage-steps">
        <li>On the first device, choose <strong>Phone</strong> or <strong>Desktop</strong>, then <strong>Start new test</strong>. Create a disposable passkey in the password manager you want to test.</li>
        <li>Approve that passkey again to prepare the test, then choose <strong>Copy test for other device</strong>.</li>
        <li>Open this same address on the other device. Choose its device type, then <strong>Continue test from another device</strong>. Paste the copied test and choose <strong>Load test</strong>.</li>
        <li>Choose <strong>Check Passkey Equality</strong> and use the same passkey through your chosen password manager or phone QR flow. The result shows whether the keys match and this device can unlock the test message.</li>
        <li><strong>Optional:</strong> Test the reverse path. Start a new test on the other device, then check it on the first.</li>
      </ol>
    </details>
    <p className="step"><strong>{STEP_LABELS[view.step]}</strong>{device ? ` · ${DEVICE_LABELS[device]}` : ''}</p>
    {testId ? <p className="test-id"><strong>Test ID: {testId}</strong> · Confirm this same ID appears on both devices.</p> : null}

    {view.step === 'device' ? <>
      <p>Which device are you using right now?</p>
      <Controls>
        <Button onClick={() => setView({ step: 'start', device: 'phone' })}>Phone</Button>
        <Button onClick={() => setView({ step: 'start', device: 'desktop' })}>Desktop</Button>
      </Controls>
    </> : null}

    {view.step === 'start' ? <>
      <p>Start a new disposable test here, or continue the test you copied from the other device.</p>
      <Controls>
        <Button onClick={() => setView({ step: 'create', device: view.device })}>Start new test</Button>
        <Button onClick={() => setView({ step: 'paste', device: view.device, text: '' })}>Continue test from another device</Button>
      </Controls>
    </> : null}

    {view.step === 'create' ? <>
      <p>Save a new disposable passkey with the password manager you want to test. Select it directly, or use a phone QR code if that is the connection method you are testing.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Create disposable passkey</Button></Controls>
    </> : null}

    {view.step === 'encrypt' ? <>
      <p>The disposable passkey is ready. Approve it again to prepare the encrypted test for the other device.</p>
      <p>Use the same passkey, password manager and connection method you used when creating it.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Encrypt both cases and prepare test</Button></Controls>
      <p>Start with the default approval. The alternative below asks the browser to require identity verification, using the same passkey.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve('required')}>{status.code === 'USER_NOT_VERIFIED' ? 'Retry with required verification' : 'Encrypt with required verification'}</Button></Controls>
    </> : null}

    {view.step === 'transfer' ? <>
      <p>Your test is ready. Copy it, then open this same page on {DEVICE_LABELS[view.packet.sourceDevice === 'phone' ? 'desktop' : 'phone']}.</p>
      <p>Choose that device, then <strong>Continue test from another device</strong>. Paste the test and choose <strong>Load test</strong>. You do not need to create another passkey.</p>
      <Field id={`${fieldId}-test`} label="Test for the other device" multiline rows={6} readOnly value={packetText} />
      <Controls><Button busy={status.busy} onClick={() => void copy(`${fieldId}-test`, packetText, 'Test copied. Continue on the other device using this same page.')}>Copy test for other device</Button></Controls>
      <p>To compare the default and required verification settings on this device, choose <strong>Check on this device</strong>. This keeps the same passkey and test message.</p>
      <Controls><Button disabled={status.busy} onClick={() => {
        setView({ step: 'check', device: view.packet.sourceDevice, packet: view.packet });
        setStatus({ busy: false });
      }}>Check on this device</Button></Controls>
    </> : null}

    {view.step === 'paste' ? <>
      <p>Paste the test copied using <strong>Copy test for other device</strong>. Loading it checks that the copied data is valid; it does not ask you to approve a passkey yet.</p>
      <Field id={`${fieldId}-input`} label="Test from the other device" multiline rows={6} value={view.text} disabled={status.busy} onChange={(text) => {
        setView({ step: 'paste', device: view.device, text });
        setStatus({ busy: false });
      }} />
      <Controls><Button disabled={status.busy || !view.text.trim()} onClick={load}>Load test</Button></Controls>
    </> : null}

    {view.step === 'check' ? <>
      <p>Test loaded from {DEVICE_LABELS[view.packet.sourceDevice]}. Approve the same passkey to check whether this device can open the test message.</p>
      {!view.packet.hashedSample ? <p>This older packet contains only the original-input message. Start a new test to evaluate all four combinations.</p> : null}
      <p>Select the same passkey through the password manager or phone QR flow you want to test on this device.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Check Passkey Equality</Button></Controls>
      <p>Start with the default check. The second button asks the browser to require identity verification, using the same passkey and test message.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve('required')}>{status.code === 'USER_NOT_VERIFIED' ? 'Retry with required verification' : 'Check with required verification'}</Button></Controls>
    </> : null}

    {view.step === 'result' ? <>
      <MessageBox role="status" title={view.report.samePrf ? 'Matching keys' : 'Different keys'}>
        <p>{view.report.samePrf ? 'The passkey returned matching encryption keys.' : 'The passkey returned different encryption keys.'}</p>
        <p>{view.report.checkingResult.opensTest ? 'This device opened the encrypted test from the other device.' : 'This device could not open the encrypted test from the other device.'}</p>
      </MessageBox>
      <p>This device tried each key against both encrypted messages. “Original” and “extra-hashed” refer to the two test inputs.</p>
      <p>Verification settings: first device <strong>{view.report.sourceUserVerification ?? 'not recorded'}</strong>; this device <strong>{view.report.checkingUserVerification}</strong>. This browser reported that identity verification succeeded.</p>
      <ul>{view.report.decryptionCases.map((entry) => <li key={`${entry.encryptedWith}-${entry.decryptedWith}`}>
        Source {entry.encryptedWith === 'original-input' ? 'original' : 'extra-hashed'} → this device {entry.decryptedWith === 'original-input' ? 'original' : 'extra-hashed'}: <strong>{entry.opensTest === null ? 'Unavailable' : entry.opensTest ? 'PASS' : 'FAIL'}</strong>
      </li>)}</ul>
      <p>{DEVICE_LABELS[view.report.sourceDevice]} → {DEVICE_LABELS[view.report.checkingDevice]}. Copy the report below to save this comparison. Before sharing it publicly, remove the encryption keys and passkey identifier.</p>
      <Field id={`${fieldId}-results`} label="Combined results" multiline rows={12} readOnly value={reportText} />
      <Controls><Button busy={status.busy} onClick={() => void copy(`${fieldId}-results`, reportText, 'Results copied.')}>Copy results</Button></Controls>
      <Controls><Button disabled={status.busy} onClick={() => {
        setView({ step: 'check', device: view.report.checkingDevice, packet: view.packet });
        setStatus({ busy: false });
      }}>Check again</Button></Controls>
    </> : null}

    {status.message ? <MessageBox role="status"><p>{status.message}</p></MessageBox> : null}
    {view.step !== 'device' ? <>
      <Controls><Button variant="secondary" disabled={status.busy} onClick={restart}>Restart this test</Button></Controls>
      <p>Restart clears only this page’s test state.</p>
    </> : null}
    {view.step === 'result' ? <p className={overallPassed ? 'overall-pass' : 'overall-fail'}><strong>Overall Result: {overallPassed ? 'PASS' : 'FAIL'}</strong></p> : null}
  </Page>;
}
