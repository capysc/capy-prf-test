import { Page } from './ui';

export const LATEST_RESULTS_DATE = '2026-11-04';
type VerificationPolicy = 'Preferred' | 'Required';

type Comparison = Readonly<{
  number: number;
  creator: readonly [string, string];
  consumer: readonly [string, string];
  verification: readonly [VerificationPolicy, VerificationPolicy];
  creatorKey: string;
  consumerKey: string;
  passes: boolean;
  vendorAction: string;
}>;

const comparisons: readonly Comparison[] = [
  { number: 1, creator: ['iPhone Safari', '1Password'], consumer: ['Chrome · QR', 'iPhone · 1Password'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(D(x))', passes: false,
    vendorAction: '1Password, Apple and Google should check why QR returns a different key from Safari for the same passkey and input. The responsible vendor is not yet known.' },
  { number: 2, creator: ['Chrome · QR', 'iPhone · 1Password'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(D(x))', consumerKey: 'P(x)', passes: false,
    vendorAction: 'Investigate the same key mismatch when data is encrypted through QR and opened in Safari. Check where the two routes hash the input differently.' },
  { number: 3, creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Chrome · QR', 'iPhone · Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no change needed for this tested QR route.' },
  { number: 4, creator: ['Chrome · QR', 'iPhone · Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no change needed for this tested reverse QR route.' },
  { number: 5, creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Desktop Chrome · direct', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no change needed for this tested direct route.' },
  { number: 6, creator: ['Desktop Chrome · direct', 'Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no change needed for this tested reverse direct route.' },
  { number: 7, creator: ['iPhone Chrome', 'Chrome Password Manager'], consumer: ['Desktop Chrome · direct', 'Chrome Password Manager'],
    verification: ['Preferred', 'Required'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Google: investigate the earlier desktop approvals that did not report identity verification. This run worked with required verification and matching keys.' },
  { number: 8, creator: ['Desktop Chrome · direct', 'Chrome Password Manager'], consumer: ['iPhone Chrome', 'Chrome Password Manager'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Google: investigate why the default desktop approval did not report identity verification. The stricter request worked and the keys matched.' },
  { number: 9, creator: ['iPhone Safari', '1Password'], consumer: ['Desktop Chrome · direct', '1Password extension'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: '1Password: this direct extension route worked without changes. The key mismatch appeared in the earlier QR tests.' },
  { number: 10, creator: ['Desktop Chrome · direct', '1Password extension'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: '1Password: check whether this also works with the default verification setting. This run used the stricter setting; it does not prove the default would fail.' },
];

function Verdict({ passes }: Readonly<{ passes: boolean }>) {
  return <span className={`verdict ${passes ? 'verdict-pass' : 'verdict-fail'}`}>
    <span aria-hidden="true">{passes ? '✓' : '−'}</span> {passes ? 'Pass' : 'Fail'}
  </span>;
}

function Outcome({ test }: Readonly<{ test: Comparison }>) {
  return test.passes && test.verification.includes('Required')
    ? <span className="verdict verdict-changes"><span aria-hidden="true">!</span> Needs changes</span>
    : <Verdict passes={test.passes} />;
}

function Path({ value }: Readonly<{ value: readonly [string, string] }>) {
  return <><span className="cell-primary">{value[0]}</span><span className="cell-secondary">{value[1]}</span></>;
}

function Policy({ value }: Readonly<{ value: VerificationPolicy }>) {
  return <span className={value === 'Required' ? 'verification-required' : undefined}>{value}</span>;
}

export function ResultsPage() {
  return <Page title="Passkey Lab" results>
    <section className="results-section" aria-label="Passkey encryption comparisons">
      <p className="section-description">The results table below shows two problems that can stop the same passkey from unlocking encrypted data across devices, browsers and connection methods: different encryption keys, and inconsistent identity verification.</p>
      <p className="section-description">In the first problem, using 1Password through local Safari and through Chrome’s phone QR flow produced different encryption keys, despite using the same passkey and input.</p>
      <p className="section-description">In the second problem, Chrome Password Manager behaved differently in Chrome on iPhone and desktop, despite using the same <code>userVerification: "preferred"</code> setting. The iPhone reported successful identity verification; the desktop did not, so the desktop test stopped before reading the passkey’s encryption keys or checking whether they matched. Desktop runs using <code>"required"</code> reported successful verification and completed the comparison.</p>
      <p className="section-description">Each row is one setup we tested. The Creator encrypted a message; the Consumer tried to open it using the same passkey. The result shows whether that setup worked out of the box, needed changes or failed.</p>
      <div className="results-note">
        <p><strong>Reading the keys</strong></p>
        <p>This notation shows how inconsistent hashing can produce different encryption keys.</p>
        <dl className="key-legend">
          <dt><code>x</code></dt><dd>The original input given to the passkey.</dd>
          <dt><code>D(x)</code></dt><dd>A hashed version of that input, used for comparison.</dd>
          <dt><code>P(x)</code></dt><dd>The encryption key the phone returns for the original input.</dd>
          <dt><code>P(D(x))</code></dt><dd>The encryption key the phone incorrectly derives from the hashed input.</dd>
        </dl>
        <p>In the <code>P(D(x))</code> case, the tested 1Password QR flow behaves as though the input is hashed one extra time compared with local Safari. This produces a different encryption key, preventing data encrypted through one path from opening through the other.</p>
      </div>
      <p className="section-description">“Pass” means decryption worked out of the box. “Needs changes” means decryption worked after additional configuration.</p>
      <div className="table-scroll" role="region" aria-label="Passkey encryption comparisons" tabIndex={0}>
        <table className="comparison-table">
          <caption>Latest results: <time dateTime={LATEST_RESULTS_DATE}>November 4, 2026</time> (Pacific).</caption>
          <thead><tr><th scope="col">Test</th><th scope="col">Creator</th><th scope="col">Consumer</th><th scope="col">Requested verification<br /><span className="column-detail">Creator → Consumer</span></th><th scope="col">Creator key</th><th scope="col">Consumer key</th><th scope="col">Outcome</th><th scope="col">Vendor follow-up / proposed fix</th></tr></thead>
          <tbody>{comparisons.map((test) => <tr key={test.number}>
            <th scope="row" id={`test-${test.number}`}>{String(test.number).padStart(2, '0')}</th>
            <td><Path value={test.creator} /></td><td><Path value={test.consumer} /></td>
            <td className="verification-cell"><Policy value={test.verification[0]} /><span className="cell-secondary">→ <Policy value={test.verification[1]} /></span></td>
            <td className="key-cell"><code>{test.creatorKey}</code></td><td className="key-cell"><code>{test.consumerKey}</code></td>
            <td><Outcome test={test} /></td><td className="vendor-action-cell">{test.vendorAction}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="results-note"><strong>Who needs to fix this?</strong> It is not yet clear whether the fault is in 1Password, Apple’s passkey support or Chrome. The QR and direct-extension tests used different websites and passkeys. <a href="https://github.com/1Password/passkey-rs/blob/1606717bd9888b629905d435bb876b24b1aaddb5/passkey-types/src/webauthn/extensions/mod.rs#L36">1Password’s handling of Apple’s inputs</a> and <a href="https://chromium.googlesource.com/chromium/src/+/main/ios/chrome/credential_provider_extension/passkey_util.mm#37">Chrome’s iOS code</a> are places to investigate; they do not prove which vendor caused the mismatch.</p>
    </section>

    <hr className="section-divider" />

    <section className="results-section contribution-section" aria-labelledby="contribution-heading">
      <div className="section-heading"><h2 id="contribution-heading">Contributing</h2></div>
      <p>Help broaden the evidence with another browser, password manager or access path.</p>
      <ul>
        <li>Include the date, test website, device and software versions. Describe how the passkey was selected on each device: directly, through an extension or by scanning a QR code.</li>
        <li>Record the verification setting and whether each device reported identity verification. Include whether each of the four decryption checks worked, or the exact error if the test stopped.</li>
        <li>Share a summary without keys or passkey identifiers. Copied test data and reports contain these values; remove them before posting publicly.</li>
      </ul>
      <p><a href="https://github.com/capysc/capy-prf-test/issues/new" target="_blank" rel="noopener">Share a result on GitHub</a> or read the <a href="https://github.com/capysc/capy-prf-test#contributing" target="_blank" rel="noopener">contribution guide</a>. Explain what happened and label any guesses about why.</p>
    </section>

  </Page>;
}
