import React from 'react';
import { Menu, Icon, Label, Image, Button } from 'semantic-ui-react';

const Navbar = ({ handleCollapseSidebar, sidebarCollapsed, hasWalletAddress, selectedAccount }) => {

    //if metamask is installed but not connected
    const handleConnect = () => {
        window.ethereum.enable();
    };

    //if metamask is not installed at all
    const handleInstall = () => {
        window.open(
            'https://metamask.io/download.html',
            '_blank'
        );
    };

    return (
        <div className='navbar' >
            <Menu className='navbar--menu' size='huge' style={{ borderRadius: '0px', alignItems: 'center' }}>
                <div style={{width: 'max-content', height: 'max-content', marginLeft: '10px'}} onClick={handleCollapseSidebar}>
                    <Icon name={sidebarCollapsed ? 'chevron right' :'chevron left'} size='large' link color='purple'/>
                </div>


                {/* <Menu.Item onClick={handleCollapseSidebar} style={{ width: "60px" }}>
                    <Icon name='bars' />
                </Menu.Item>
                <Menu.Item
                    name='home'
                /> */}
            </Menu>
        </div>
    );
};

export default Navbar;