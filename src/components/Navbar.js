import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Dropdown, Menu, Icon } from 'semantic-ui-react';


const Navbar = ({ handleCollapseSidebar }) => {
    let history = useHistory();
    let location = useLocation();

    const handlePageNavigation = (e, dest) => {
        if (location.pathname !== dest) {
            history.push(dest);
        }
    };

    return (
        <div className="navbar" >

            <Menu inverted size='huge' style={{ borderRadius: '0px' }}>
                <Menu.Item onClick={handleCollapseSidebar} style={{ width: "60px" }}>
                    <Icon name='bars' />
                </Menu.Item>
                <Menu.Item
                    name='home'
                />

                <Menu.Menu position='right'>
                    <Dropdown item text='Registry'>
                        <Dropdown.Menu>
                            <Dropdown.Item>Add entry</Dropdown.Item>
                            <Dropdown.Item>Inspect</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown item text='TeSC'>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={(e) => handlePageNavigation(e, '/tesc/new')}>
                                Create & Deploy
                            </Dropdown.Item>

                            <Dropdown.Item onClick={(e) => handlePageNavigation(e, '/tesc/verify')}>
                                Inspect
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            </Menu>
        </div>
    );
};

export default Navbar;