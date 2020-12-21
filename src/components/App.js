import React, { useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Container } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCDetail from '../pages/TescInspect'
import RegistryInspect from '../pages/RegistryInspect'

import '../styles/App.scss';
import RegistryAdd from '../pages/RegistryAdd';

const App = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);


    const handleCollapseSidebar = () => {
        setCollapsed(!collapsed);
        setToggled(!toggled);
    };

    return (
        <BrowserRouter>
            <Navbar handleCollapseSidebar={handleCollapseSidebar} />
            <div className='layout'>
                <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} />
                <Container className="content">
                    <Route path="/" component={Dashboard} exact />
                    <Route path="/tesc/new" component={TeSCNew} exact />
                    <Route path="/tesc/inspect" component={TeSCDetail} exact />
                    <Route path="/registry/inspect" component={RegistryInspect} exact />
                    <Route path="/registry/add" component={RegistryAdd} exact />
                </Container>
            </div>
        </BrowserRouter>
    );
};

export default App;
