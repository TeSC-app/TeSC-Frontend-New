import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import AppContext from './appContext';
import getWeb3 from './ethereum/web3-config';

getWeb3().then(web3 => {
  ReactDOM.render(
    <React.StrictMode>
      <AppContext.Provider value={{ web3 }}>
        <App />
      </AppContext.Provider>
    </React.StrictMode>,
    document.getElementById('root')
  );
});

