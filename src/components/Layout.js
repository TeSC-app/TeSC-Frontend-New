import React, { useState } from 'react';
import { Route } from 'react-router-dom';

import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';

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
                <Route path="/" component={Dashboard} exact />
            </div>
        </React.Fragment>
    );
};

export default Layout;

