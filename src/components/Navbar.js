import React from 'react';
import { Menu, Icon, Label, Image, Button } from 'semantic-ui-react';

const Navbar = ({ handleCollapseSidebar, hasWalletAddress, selectedAccount }) => {

    //if metamask is installed but not connected
    const handleConnect = () => {
        window.ethereum.enable()
    }

    //if metamask is not installed at all
    const handleInstall = () => {
        window.open(
            'https://metamask.io/download.html',
            '_blank'
        )
    }
    const renderMetaMaskLabel = () => {
        if (window.ethereum) {
            return !hasWalletAddress && !selectedAccount ? <Button className='connect-metamask' onClick={handleConnect}>No wallet address detected</Button> : selectedAccount
        } else {
            return <Button className='connect-metamask' onClick={handleInstall}>Install MetaMask</Button>
        }
    }

    return (
        <div className="navbar" >
            <Menu inverted size='huge' style={{ borderRadius: '0px' }}>
                {/* <Menu.Item onClick={handleCollapseSidebar} style={{ width: "60px" }}>
                    <Icon name='bars' />
                </Menu.Item>
                <Menu.Item
                    name='home'
                /> */}
                <Menu.Menu position='right'>
                    <Label className='metamask-label'>
                        <Image src='../images/metamask.png' size='tiny' /> {renderMetaMaskLabel()}
                    </Label>
                </Menu.Menu>
            </Menu>
        </div>
    );
};

export default Navbar;