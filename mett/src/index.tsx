import 'react-quill/dist/quill.snow.css';
import { createRoot } from 'react-dom/client';

import { Router } from './router/router';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<Router />);
}
