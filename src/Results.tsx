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
    vendorAction: '1Password + Apple: audit PRF input handling at the QR/provider hand-off. Local and QR must evaluate the same input. Check Chrome’s boundary too; owner unconfirmed.' },
  { number: 2, creator: ['Chrome · QR', 'iPhone · 1Password'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(D(x))', consumerKey: 'P(x)', passes: false,
    vendorAction: 'Same QR/provider issue in reverse. Locate the relative extra input transform in 1Password, Apple’s bridge or Chrome before assigning ownership.' },
  { number: 3, creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Chrome · QR', 'iPhone · Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no PRF fix indicated for this tested QR path.' },
  { number: 4, creator: ['Chrome · QR', 'iPhone · Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no PRF fix indicated for the reverse QR path.' },
  { number: 5, creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Desktop Chrome · direct', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no PRF fix indicated for this direct path.' },
  { number: 6, creator: ['Desktop Chrome · direct', 'Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Apple: no PRF fix indicated for the reverse direct path.' },
  { number: 7, creator: ['iPhone Chrome', 'Chrome Password Manager'], consumer: ['Desktop Chrome · direct', 'Chrome Password Manager'],
    verification: ['Preferred', 'Required'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Google: review desktop verification behavior. An earlier preferred attempt lacked actual UV; required passed on the Lab origin. No PRF hash bug is demonstrated here.' },
  { number: 8, creator: ['Desktop Chrome · direct', 'Chrome Password Manager'], consumer: ['iPhone Chrome', 'Chrome Password Manager'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: 'Google: review desktop verification behavior. Creator’s preferred attempt lacked actual UV; required passed. Preferred permits no UV, so this alone is not a confirmed vendor bug.' },
  { number: 9, creator: ['iPhone Safari', '1Password'], consumer: ['Desktop Chrome · direct', '1Password extension'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: '1Password: no PRF fix indicated for the direct extension path; the observed mismatch is on the earlier QR path.' },
  { number: 10, creator: ['Desktop Chrome · direct', '1Password extension'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    vendorAction: '1Password: establish preferred-verification compatibility for this creator flow. This run used required and does not prove preferred fails; no PRF mismatch was observed.' },
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
    <section className="results-section" aria-labelledby="comparison-heading">
      <div className="section-heading"><h2 id="comparison-heading">The full comparison</h2></div>
      <p className="section-description">“Pass” means decryption worked out of the box. “Needs changes” means decryption worked after additional configuration.</p>
      <div className="table-scroll" role="region" aria-labelledby="comparison-heading" tabIndex={0}>
        <table className="comparison-table">
          <caption>Latest results: <time dateTime={LATEST_RESULTS_DATE}>November 4, 2026</time> (Pacific).</caption>
          <thead><tr><th scope="col">Test</th><th scope="col">Creator</th><th scope="col">Consumer</th><th scope="col">Requested verification<br /><span className="column-detail">Creator → Consumer</span></th><th scope="col">Creator key</th><th scope="col">Consumer key</th><th scope="col">Outcome</th><th scope="col">Vendor follow-up / proposed fix</th></tr></thead>
          <tbody>{comparisons.map((test) => <tr key={test.number}>
            <th scope="row"><a href={`#test-${test.number}`} id={`test-${test.number}`} className="test-number">{String(test.number).padStart(2, '0')}</a></th>
            <td><Path value={test.creator} /></td><td><Path value={test.consumer} /></td>
            <td className="verification-cell"><Policy value={test.verification[0]} /><span className="cell-secondary">→ <Policy value={test.verification[1]} /></span></td>
            <td className="key-cell"><code>{test.creatorKey}</code></td><td className="key-cell"><code>{test.consumerKey}</code></td>
            <td><Outcome test={test} /></td><td className="vendor-action-cell">{test.vendorAction}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="results-note">
        <p><strong>Reading the keys</strong></p>
        <dl className="key-legend">
          <dt><code>x</code></dt><dd>The original input given to the passkey.</dd>
          <dt><code>D(x)</code></dt><dd>A hashed version of that input, used for comparison.</dd>
          <dt><code>P(x)</code></dt><dd>The encryption key the phone returns for the original input.</dd>
          <dt><code>P(D(x))</code></dt><dd>The different key the phone returns when given the hashed input.</dd>
        </dl>
        <p><strong>In simpler terms:</strong> the finding is inconsistent input hashing in the tested 1Password QR flow. QR behaves as though the input is hashed one extra time compared with local Safari, producing a different encryption key and preventing data encrypted through one path from opening through the other.</p>
      </div>
      <p className="results-note"><strong>Vendor ownership is unconfirmed.</strong> The QR and direct runs used different origins and credentials. The investigation should check the raw-versus-already-hashed hand-off: <a href="https://github.com/1Password/passkey-rs/blob/1606717bd9888b629905d435bb876b24b1aaddb5/passkey-types/src/webauthn/extensions/mod.rs#L36">1Password’s Apple input contract</a> and <a href="https://chromium.googlesource.com/chromium/src/+/main/ios/chrome/credential_provider_extension/passkey_util.mm#37">Chromium’s iOS adapter</a> identify relevant public boundaries, not proof of the installed bug’s owner.</p>
    </section>

    <section className="results-section contribution-section" aria-labelledby="contribution-heading">
      <div className="section-heading"><h2 id="contribution-heading">Contributing</h2></div>
      <p>Help broaden the evidence with another browser, password manager or access path.</p>
      <ul>
        <li>Include the date, origin, device and software versions, creator/consumer paths and native provider-selection route.</li>
        <li>Record requested verification and actual UV on both devices, plus all four decryption verdicts. Report native popups and app errors separately when no comparison completed.</li>
        <li>Share a sanitized summary. Copied packets and reports contain disposable PRF outputs and credential IDs; leave those out of public submissions.</li>
      </ul>
      <p><a href="https://github.com/capysc/capy-prf-test/issues/new" target="_blank" rel="noopener">Share a result on GitHub</a> or read the <a href="https://github.com/capysc/capy-prf-test#contributing" target="_blank" rel="noopener">contribution guide</a>. Keep observations and suspected causes distinct.</p>
    </section>

  </Page>;
}
