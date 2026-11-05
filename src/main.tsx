import { createRoot } from 'react-dom/client';
import { PrfSmokeTest } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('APP_ROOT_MISSING');

createRoot(root).render(<>
  <PrfSmokeTest rpId={window.location.hostname} />
  <footer>
    <p>Test domain: <code>{window.location.hostname}</code>. Use this same address on both devices.</p>
    <p>Only use disposable passkeys. The copied report includes their test encryption outputs. No account, storage, analytics, or application API is used.</p>
    <details><summary>What is being compared?</summary>
      <p>One assertion evaluates two inputs: the fixed bytes 0–31, and SHA-256 of “WebAuthn PRF”, a zero byte, and those bytes. Each output encrypts its own copy of the test message. The other device obtains fresh outputs and attempts all four authenticated decryptions.</p>
      <p>“Extra-hashed” describes the input supplied by this page, not a claim about the number of hashes inside the browser or password manager.</p>
    </details>
  </footer>
</>);
