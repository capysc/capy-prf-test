import { createRoot } from 'react-dom/client';
import { PrfSmokeTest } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('APP_ROOT_MISSING');

createRoot(root).render(<PrfSmokeTest rpId={window.location.hostname} />);
