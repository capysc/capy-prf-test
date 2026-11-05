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
} from './prf';

type View =
  | Readonly<{ step: 'device' }>
  | Readonly<{ step: 'start'; device: PrfTestDevice }>
  | Readonly<{ step: 'create'; device: PrfTestDevice }>
  | Readonly<{ step: 'encrypt'; device: PrfTestDevice; credentialId: string }>
  | Readonly<{ step: 'transfer'; packet: PrfUnifiedTest }>
  | Readonly<{ step: 'paste'; device: PrfTestDevice; text: string }>
  | Readonly<{ step: 'check'; device: PrfTestDevice; packet: PrfUnifiedTest }>
  | Readonly<{ step: 'result'; report: PrfUnifiedReport }>;

const DEVICE_LABELS: Readonly<Record<PrfTestDevice, string>> = { phone: 'Phone', desktop: 'Desktop' };
const STEP_LABELS: Readonly<Record<View['step'], string>> = {
  device: '1. Choose this device', start: '2. Start or continue', create: '3. Create a disposable passkey',
  encrypt: '4. Encrypt and prepare the test', transfer: '5. Continue on the other device',
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
  const [status, setStatus] = useState<Readonly<{ busy: boolean; message?: string }>>({ busy: false });
  const packetText = view.step === 'transfer' ? JSON.stringify(view.packet, null, 2) : '';
  const reportText = view.step === 'result' ? JSON.stringify(view.report, null, 2) : '';
  const device = view.step === 'device' ? null : view.step === 'transfer' ? view.packet.sourceDevice
    : view.step === 'result' ? view.report.checkingDevice : view.device;
  const testId = view.step === 'transfer' || view.step === 'check' ? view.packet.testId
    : view.step === 'result' ? view.report.testId : null;

  async function approve(): Promise<void> {
    if (status.busy || (view.step !== 'create' && view.step !== 'encrypt' && view.step !== 'check')) return;
    setStatus({ busy: true });
    try {
      // Each branch invokes its native ceremony directly from this tap.
      // Create and fresh-assertion encryption intentionally use separate taps.
      const next: View = view.step === 'create'
        ? { step: 'encrypt', device: view.device, credentialId: await createSmokeCredential(rpId) }
        : view.step === 'encrypt'
          ? { step: 'transfer', packet: await createUnifiedPrfTest(rpId, view.credentialId, view.device) }
          : { step: 'result', report: await checkUnifiedPrfTest(rpId, view.packet, view.device) };
      setView(next);
      setStatus({ busy: false });
    } catch (error) {
      setStatus({ busy: false, message: `This step could not complete (${failureCode(error)}).` });
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

  return <Page title="Passkey PRF test" lockup="none">
    <p>Compare the encryption keys returned by the same disposable passkey across browsers, devices, and password managers.</p>
    <p>One approval reads both the original input and an extra-hashed input. New tests encrypt a message with each output and check all four combinations on the other device.</p>
    <p><strong>{STEP_LABELS[view.step]}</strong>{device ? ` · ${DEVICE_LABELS[device]}` : ''}</p>
    {testId ? <p><strong>Test ID: {testId}</strong> · Confirm this same ID appears on both devices.</p> : null}

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
      <p>Save a new disposable passkey with the password manager you want to test. Use direct selection or a phone QR code, according to your test.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Create disposable passkey</Button></Controls>
    </> : null}

    {view.step === 'encrypt' ? <>
      <p>The disposable passkey is ready. Approve it once more to encrypt the test message twice: once with the original-input output, and once with the extra-hashed-input output.</p>
      <p>Use the same passkey and the same provider/path you used to create it.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Encrypt both cases and prepare test</Button></Controls>
    </> : null}

    {view.step === 'transfer' ? <>
      <p>Your test is ready. Copy it, then open this same page on {DEVICE_LABELS[view.packet.sourceDevice === 'phone' ? 'desktop' : 'phone']}.</p>
      <p>Choose that device, then <strong>Continue test from another device</strong>. Paste the test and choose <strong>Load test</strong>. You do not need to create another passkey.</p>
      <Field id={`${fieldId}-test`} label="Test for the other device" multiline rows={6} readOnly value={packetText} />
      <Controls><Button busy={status.busy} onClick={() => void copy(`${fieldId}-test`, packetText, 'Test copied. Continue on the other device using this same page.')}>Copy test for other device</Button></Controls>
    </> : null}

    {view.step === 'paste' ? <>
      <p>Paste the test copied using <strong>Copy test for other device</strong>. Loading it checks the packet without asking for a passkey.</p>
      <Field id={`${fieldId}-input`} label="Test from the other device" multiline rows={6} value={view.text} disabled={status.busy} onChange={(text) => {
        setView({ step: 'paste', device: view.device, text });
        setStatus({ busy: false });
      }} />
      <Controls><Button disabled={status.busy || !view.text.trim()} onClick={load}>Load test</Button></Controls>
    </> : null}

    {view.step === 'check' ? <>
      <p>Test loaded from {DEVICE_LABELS[view.packet.sourceDevice]}. One approval checks both input choices against each encrypted message using the same disposable passkey.</p>
      {!view.packet.hashedSample ? <p>This older packet contains only the original-input message. Start a new test to evaluate all four combinations.</p> : null}
      <p>Choose the same passkey using the provider/path you are testing on this device. Direct selection and phone QR are both supported.</p>
      <Controls><Button busy={status.busy} onClick={() => void approve()}>Check Passkey Equality</Button></Controls>
    </> : null}

    {view.step === 'result' ? <>
      <MessageBox role="status" title={view.report.samePrf ? 'Matching keys' : 'Different keys'}>
        <p>{view.report.samePrf ? 'The two devices returned matching PRF keys.' : 'The two devices returned different PRF keys.'}</p>
        <p>{view.report.checkingResult.opensTest ? 'This device opened the encrypted test from the other device.' : 'This device could not open the encrypted test from the other device.'}</p>
      </MessageBox>
      <p>Each case below uses a fresh output from this device. “Extra-hashed” means our page hashes the input once before passing it to WebAuthn.</p>
      <ul>{view.report.decryptionCases.map((entry) => <li key={`${entry.encryptedWith}-${entry.decryptedWith}`}>
        Source {entry.encryptedWith === 'original-input' ? 'original' : 'extra-hashed'} → this device {entry.decryptedWith === 'original-input' ? 'original' : 'extra-hashed'}: <strong>{entry.opensTest === null ? 'Unavailable' : entry.opensTest ? 'PASS' : 'FAIL'}</strong>
      </li>)}</ul>
      <p>{DEVICE_LABELS[view.report.sourceDevice]} → {DEVICE_LABELS[view.report.checkingDevice]}. Copy the combined results below and paste them into our chat. No field extraction is needed.</p>
      <Field id={`${fieldId}-results`} label="Combined results" multiline rows={12} readOnly value={reportText} />
      <Controls><Button busy={status.busy} onClick={() => void copy(`${fieldId}-results`, reportText, 'Results copied. Paste them into our chat.')}>Copy results for chat</Button></Controls>
    </> : null}

    {status.message ? <MessageBox role="status"><p>{status.message}</p></MessageBox> : null}
    {view.step !== 'device' ? <>
      <Controls><Button variant="secondary" disabled={status.busy} onClick={restart}>Restart this test</Button></Controls>
      <p>Restart clears only this page’s test state.</p>
    </> : null}
  </Page>;
}
