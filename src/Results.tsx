import { Page } from './ui';

export const LATEST_RESULTS_DATE = '2026-11-04';

type Comparison = Readonly<{
  number: number;
  testId: string | null;
  creator: readonly [string, string];
  consumer: readonly [string, string];
  verification: readonly [string, string];
  creatorKey: string;
  consumerKey: string;
  passes: boolean;
  implication: string;
}>;

const comparisons: readonly Comparison[] = [
  { number: 1, testId: null, creator: ['iPhone Safari', '1Password'], consumer: ['Chrome · QR', 'iPhone · 1Password'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(D(x))', passes: false,
    implication: 'Phone’s extra-hashed-input key matches QR’s original-input key. Additional wrapping protection is proposed.' },
  { number: 2, testId: 'PRF-4F1C26AF', creator: ['Chrome · QR', 'iPhone · 1Password'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(D(x))', consumerKey: 'P(x)', passes: false,
    implication: 'Phone’s extra-hashed-input key decrypts the QR-created message. The original-input key does not.' },
  { number: 3, testId: 'PRF-1877CC72', creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Chrome · QR', 'iPhone · Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'Matching inputs produce matching keys. No hash compensation needed.' },
  { number: 4, testId: 'PRF-08C420EE', creator: ['Chrome · QR', 'iPhone · Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'The reverse QR direction also works without hash compensation.' },
  { number: 5, testId: 'PRF-980F6785', creator: ['iPhone Safari', 'Apple Passwords'], consumer: ['Desktop Chrome · direct', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'Direct access works with matching original-input keys.' },
  { number: 6, testId: 'PRF-47A435BA', creator: ['Desktop Chrome · direct', 'Apple Passwords'], consumer: ['iPhone Safari', 'Apple Passwords'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'Reverse direct access works with matching original-input keys.' },
  { number: 7, testId: 'PRF-654DD521', creator: ['iPhone Chrome', 'Chrome Password Manager'], consumer: ['Desktop Chrome · direct', 'Chrome Password Manager'],
    verification: ['Preferred', 'Required'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'An earlier desktop preferred attempt lacked UV. The explicit required check passed on the new Lab origin.' },
  { number: 8, testId: 'PRF-D0FB1AFF', creator: ['Desktop Chrome · direct', 'Chrome Password Manager'], consumer: ['iPhone Chrome', 'Chrome Password Manager'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'Creator’s preferred attempt lacked UV. The explicit required retry passed.' },
  { number: 9, testId: 'PRF-41E6EA9A', creator: ['iPhone Safari', '1Password'], consumer: ['Desktop Chrome · direct', '1Password extension'],
    verification: ['Preferred', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'The direct extension path works without hash compensation.' },
  { number: 10, testId: 'PRF-195F35EA', creator: ['Desktop Chrome · direct', '1Password extension'], consumer: ['iPhone Safari', '1Password'],
    verification: ['Required', 'Preferred'], creatorKey: 'P(x)', consumerKey: 'P(x)', passes: true,
    implication: 'Reverse extension access works. Required was used; this report does not establish that preferred failed.' },
];

function Verdict({ passes, expected = false }: Readonly<{ passes: boolean; expected?: boolean }>) {
  return <span className={`verdict ${passes ? 'verdict-pass' : expected ? 'verdict-expected' : 'verdict-fail'}`}>
    <span aria-hidden="true">{passes ? '✓' : '−'}</span> {passes ? 'Pass' : 'Fail'}
  </span>;
}

function Path({ value }: Readonly<{ value: readonly [string, string] }>) {
  return <><span className="cell-primary">{value[0]}</span><span className="cell-secondary">{value[1]}</span></>;
}

const matrices = [
  { label: '1', values: [false, false, true, false], aligned: false },
  { label: '2', values: [false, true, false, false], aligned: false },
  { label: '3–10', values: [true, false, false, true], aligned: true },
] as const;

export function ResultsPage() {
  return <Page title="Passkey Lab" results>
    <section className="results-section" aria-labelledby="comparison-heading">
      <div className="section-heading"><h2 id="comparison-heading">The full comparison</h2><span>10 completed tests</span></div>
      <p className="section-description">Direct selection and QR are different paths. “Pass” means the consumer’s original-input key opens the creator’s original-input ciphertext.</p>
      <div className="table-scroll" role="region" aria-labelledby="comparison-heading" tabIndex={0}>
        <table className="comparison-table">
          <caption>Latest results: <time dateTime={LATEST_RESULTS_DATE}>November 4, 2026</time> (Pacific).</caption>
          <thead><tr><th scope="col">Test</th><th scope="col">Creator</th><th scope="col">Consumer</th><th scope="col">Requested verification<br /><span className="column-detail">Creator → Consumer</span></th><th scope="col">Creator key</th><th scope="col">Consumer key</th><th scope="col">Original decryption</th><th scope="col">What it means / proposed fix</th></tr></thead>
          <tbody>{comparisons.map((test) => <tr key={test.number}>
            <th scope="row"><a href={`#test-${test.number}`} id={`test-${test.number}`} className="test-number">{String(test.number).padStart(2, '0')}</a>{test.testId ? <span className="test-reference">{test.testId}</span> : <span className="test-reference">No submitted ID</span>}</th>
            <td><Path value={test.creator} /></td><td><Path value={test.consumer} /></td>
            <td className="verification-cell"><span>{test.verification[0]}</span><span className="cell-secondary">→ {test.verification[1]}</span></td>
            <td className="key-cell"><code>{test.creatorKey}</code></td><td className="key-cell"><code>{test.consumerKey}</code></td>
            <td><Verdict passes={test.passes} /></td><td className="implication-cell">{test.implication}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="results-note"><p><strong>Reading the keys.</strong> <code>P(x)</code> is the phone-local PRF output for that test’s credential. <code>D(x)</code> is the WebAuthn input hash. This is an observed relative relationship, not a claim about internal hash counts. Keys from different tests are not compared.</p><p>All completed comparisons had actual user verification on both devices. Tests 1–6’s requested policies come from the diagnostic implementation; Tests 7–10 include them in their reports. A UV-blocked attempt has no accepted crypto result.</p></div>
    </section>

    <section className="results-section" aria-labelledby="matrix-heading">
      <div className="section-heading"><h2 id="matrix-heading">All four decryption cases</h2><span>Fresh consumer keys</span></div>
      <p className="section-description">Each creator encrypts independently with its original-input and extra-hashed-input keys. The consumer tries both fresh keys against both ciphertexts.</p>
      <div className="table-scroll" role="region" aria-labelledby="matrix-heading" tabIndex={0}>
        <table className="matrix-table">
          <caption>Columns show creator encryption input → consumer decryption input.</caption>
          <thead><tr><th scope="col">Tests</th><th scope="col">Original → Original</th><th scope="col">Original → Extra-hashed</th><th scope="col">Extra-hashed → Original</th><th scope="col">Extra-hashed → Extra-hashed</th></tr></thead>
          <tbody>{matrices.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((passes, index) => <td key={index}><Verdict passes={passes} expected={row.aligned && !passes} /></td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="results-note">The cross-input failures in Tests 3–10 are expected: different inputs produce different keys. Tests 1–2 instead have opposite off-diagonal successes, supporting a relative input-hashing shift.</p>
    </section>

    <section className="results-section" aria-labelledby="context-heading">
      <div className="section-heading"><h2 id="context-heading">Keep these findings separate</h2></div>
      <div className="results-context">
        <section><h3>Route and origin matter</h3><p>1Password worked directly in both directions; earlier QR runs produced different keys. Tests 1–6 used <code>staging-keep.capy.sc</code>. Tests 7–10 used <code>passkey-lab.capy.sc</code> with fresh credentials. This is not a same-credential direct-versus-QR control. Provider and route labels are human-reported, not attested by the JSON.</p></section>
        <section><h3>Two additional observations</h3><p>An earlier unnumbered Chrome Password Manager QR test showed the same relative hashing shift. Separately, Safari’s initial “Use Passkey” route showed “Unable to use passkey,” while “Try other option → 1Password” succeeded under the same preferred request. That native chooser issue has no completed PRF matrix; its cause remains unresolved.</p></section>
        <section><h3>What the proposed fix addresses</h3><p>Candidate-key opening and additional wrapping of the same custody material are proposed for the measured QR mismatch. No hash compensation is needed for the successful direct paths. These experiments do not justify a blanket extra hash, a global verification-policy change or accepting an assertion without actual UV. Product validation remains separate.</p></section>
      </div>
    </section>
  </Page>;
}
