import esriConfig from '@arcgis/core/config';
import initializeTheme from '@ugrc/esri-theme-toggle';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MapProvider } from './context/MapProvider';

import { FirebaseAnalyticsProvider, FirebaseAppProvider } from '@ugrc/utah-design-system';
import './index.css';

esriConfig.assetsPath = './assets';
initializeTheme();

let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

if (import.meta.env.VITE_FIREBASE_CONFIG) {
  firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseAppProvider config={firebaseConfig}>
      <FirebaseAnalyticsProvider>
        <MapProvider>
          <App />
        </MapProvider>
      </FirebaseAnalyticsProvider>
    </FirebaseAppProvider>
  </StrictMode>,
);
