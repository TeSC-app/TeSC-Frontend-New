import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import getWeb3 from './ethereum/web3-config';
import "./styles/styles.scss";


getWeb3().then(web3 => {
  ReactDOM.render(
    <React.StrictMode>
      <App web3={web3} />
    </React.StrictMode>,
    document.getElementById('root')
  );
});

