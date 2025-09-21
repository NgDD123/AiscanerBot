import React from 'react';
import ReactDOM from 'react-dom/client';
import "@mantine/core/styles.css";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './redux/store';
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
      <Provider store={store}>
        <App />
      </Provider>
    </PersistGate>

  </React.StrictMode>
);

reportWebVitals();
