import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import getWeb3 from './ethereum/web3-config';
import "./styles/styles.scss";
import * as serviceWorker from './serviceWorker';

import { BrowserRouter } from 'react-router-dom';




getWeb3().then(web3 => {
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <App web3={web3} />
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
  );
});

serviceWorker.unregister();


