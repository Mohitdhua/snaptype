import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const ROOT_INERT_FIX_ATTR = 'data-snaptype-inert-fix';

const syncAriaHiddenFocusSafety = (element: HTMLElement) => {
  const isAriaHidden = element.getAttribute('aria-hidden') === 'true';

  if (isAriaHidden) {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && element.contains(activeElement)) {
      activeElement.blur();
    }

    if (!element.hasAttribute('inert')) {
      element.setAttribute('inert', '');
      element.setAttribute(ROOT_INERT_FIX_ATTR, 'true');
    }
    return;
  }

  if (element.getAttribute(ROOT_INERT_FIX_ATTR) === 'true') {
    element.removeAttribute('inert');
    element.removeAttribute(ROOT_INERT_FIX_ATTR);
  }
};

const rootAriaObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.attributeName === 'aria-hidden') {
      syncAriaHiddenFocusSafety(rootElement);
      break;
    }
  }
});

rootAriaObserver.observe(rootElement, { attributes: true, attributeFilter: ['aria-hidden'] });
syncAriaHiddenFocusSafety(rootElement);

window.addEventListener('beforeunload', () => {
  rootAriaObserver.disconnect();
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
