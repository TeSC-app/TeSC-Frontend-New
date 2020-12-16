import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

// import 'materialize-css/dist/css/materialize.min.css';
import 'semantic-ui-css/semantic.min.css';


import Layout from './Layout';
import '../styles/App.scss';

const App = () => {
  return (
    <BrowserRouter>
      <div>
        <Layout />
      </div>
    </BrowserRouter>
  );
};

export default App;
