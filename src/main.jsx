import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from '../dashboard/interface/dashboard_app.jsx';


const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <DashboardApp />
    </React.StrictMode>
  );
}
