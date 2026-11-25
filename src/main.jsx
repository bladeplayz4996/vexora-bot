import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from '';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <DashboardApp />
    </React.StrictMode>
  );
}
