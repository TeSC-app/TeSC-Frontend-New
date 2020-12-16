import React, { useState } from 'react';
import { Route } from 'react-router-dom';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

import { Container } from 'semantic-ui-react';

import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCVerify from '../pages/TescVerify';

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);


    const handleCollapseSidebar = () => {
        setCollapsed(!collapsed);
        setToggled(!toggled);
    };



    return (
        <React.Fragment>
            <Navbar handleCollapseSidebar={handleCollapseSidebar} />
            <div className='layout'>
                <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} />
                <Container className="content">
                    <Route path="/" component={Dashboard} exact />
                    <Route path="/tesc/new" component={TeSCNew} exact />
                    <Route path="/tesc/verify" component={TeSCVerify} exact />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Layout;

