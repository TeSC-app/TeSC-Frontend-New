import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from "react-router-dom";
import { createBrowserHistory } from "history";

import App from './components/App';
import LandingPage from './landingPage/LandingPage';
import getWeb3 from './ethereum/web3-config';
import "./styles/styles.scss";
import * as serviceWorker from './serviceWorker';

import { BrowserRouter, Route, useLocation } from 'react-router-dom';


const history = createBrowserHistory();


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


