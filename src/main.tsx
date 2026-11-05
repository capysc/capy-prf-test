import { createRoot } from 'react-dom/client';
import { PrfSmokeTest } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('APP_ROOT_MISSING');

createRoot(root).render(<>
  <PrfSmokeTest rpId={window.location.hostname} />
  <footer>
    <p>Test domain: <code>{window.location.hostname}</code>. Use this same address on both devices.</p>
    <p>Only use disposable passkeys. The copied report includes their test encryption outputs. No account, storage, analytics, or application API is used.</p>
  </footer>
</>);
