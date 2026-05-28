import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// One-time cleanup of any previously registered service worker + Cache API
// storage. The CRM does not (and never intentionally did) register a SW, but
// CRA's boilerplate has historically tempted contributors to flip
// `serviceWorker.register()` on; once that lands in even one deploy the
// registration sticks around on users' devices and keeps serving stale
// assets after the registration is removed from the source — surviving
// hard-refresh and incognito on returning visits. Gated on a localStorage
// flag so this runs exactly once per browser, then never again.
(function ensureNoServiceWorker() {
  try {
    if (typeof window === 'undefined') return;
    if (window.localStorage && window.localStorage.getItem('crm_sw_cleanup_v1') === 'done') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(function (regs) { regs.forEach(function (r) { r.unregister(); }); })
        .catch(function () {});
    }
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys()
        .then(function (keys) { keys.forEach(function (k) { caches.delete(k); }); })
        .catch(function () {});
    }
    if (window.localStorage) window.localStorage.setItem('crm_sw_cleanup_v1', 'done');
  } catch (e) { /* best-effort — never block boot */ }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
