import React from 'react';
import {
  BrowserRouter as Router
} from "react-router-dom";
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './store';
import { ThemeProvider } from 'evergreen-ui';
import theme from './theme';

const renderApp = () => ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider value={theme}>
        <Router>
          <App/>
        </Router>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

if (process.env.NODE_ENV !== 'production' && (module as any).hot) {
  (module as any).hot.accept('./App', renderApp);
}

renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
