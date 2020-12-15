import React, { useState } from 'react';
import { Dropdown, Menu, Icon } from 'semantic-ui-react';

const Navbar = ({ handleCollapseSidebar }) => {


    return (
        <div className="navbar" >

            <Menu  inverted size='huge' style={{borderRadius: '0px'}}>
                <Menu.Item onClick={handleCollapseSidebar} style={{width: "80px"}}>
                    <Icon name='bars'  />
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

                    <Dropdown item text='Contract'>
                        <Dropdown.Menu>
                            <Dropdown.Item>Deploy</Dropdown.Item>
                            <Dropdown.Item>Inspect</Dropdown.Item>
                            <Dropdown.Item>Verify</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            </Menu>
        </div>
    );
};

export default Navbar;