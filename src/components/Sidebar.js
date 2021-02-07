import React, { Fragment, useContext } from 'react';
import { useHistory, useLocation, NavLink } from 'react-router-dom';
import { ProSidebar, Menu, MenuItem, SubMenu, SidebarHeader, SidebarContent, SidebarFooter } from 'react-pro-sidebar';
import { Icon, Label, Image, Button, Grid, Popup } from 'semantic-ui-react';


import 'react-pro-sidebar/dist/css/styles.css';

import { FaScroll, FaChartBar, FaAddressBook, FaWallet } from 'react-icons/fa';
import AppContext from '../appContext';
import sidebarBg from '../static/images/bg1.jpg';



const Sidebar = ({ image, collapsed, toggled, handleToggleSidebar, handleCollapseSidebar }) => {
    const { hasWalletAddress, account } = useContext(AppContext);

    let history = useHistory();
    let location = useLocation();

    const handlePageNavigation = (e, dest) => {
        if (location.pathname !== dest) {
            history.push(dest);
        }
    };

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
    const renderMetaMaskLabel = () => {
        if (window.ethereum) {
            return !hasWalletAddress && !account ?
                <Button className='connect-metamask' onClick={handleConnect}>No wallet address detected</Button>
                : account;
        } else {
            return <Button className='connect-metamask' onClick={handleInstall}>Install MetaMask</Button>;
        }
    };

    return (
        <ProSidebar
            image={sidebarBg}
            collapsed={collapsed}
            toggled={toggled}
            breakPoint="md"
            onToggle={handleToggleSidebar}
            className='sidebar'
        >
            <SidebarHeader>
                {/* <div onClick={handleCollapseSidebar} style={{ width: "60px" }}>
                    <Icon name='bars' size='large' />
                </div> */}
                <NavLink to='/'>
                    <Image src={collapsed ? '../images/tesc-logo-notext.png' : '../images/tesc-logo.png'} size='small' style={{ margin: '20px auto', padding: `${collapsed ? '0 5px' : '0'}` }} />
                    {/* {collapsed ?
                        <Image src='../images/tesc-logo-notext.png' size='small' style={{ margin: '20px auto', padding: '0 5px' }} />
                        : <Image src='../images/tesc-logo.png' size='small' style={{ margin: '20px auto' }} />
                    } */}
                </NavLink>
            </SidebarHeader>
            <SidebarContent>
                <Menu iconShape="circle">
                    <MenuItem onClick={(e) => handlePageNavigation(e, "/dashboard")} icon={<FaChartBar size='1.5em' />} >
                        Dashboard
                    </MenuItem>
                    <SubMenu title="TLS-endorsed Contract" icon={<FaScroll size='1.5em' />} defaultOpen >
                        <MenuItem onClick={(e) => handlePageNavigation(e, "/tesc/new")} >
                            Create & Deploy
                        </MenuItem>

                        <MenuItem onClick={(e) => handlePageNavigation(e, '/tesc/inspect')} >
                            Inspect
                        </MenuItem>
                    </SubMenu>
                    <SubMenu title="TeSC Registry" icon={<FaAddressBook size='1.5em' />} defaultOpen >
                        <MenuItem onClick={(e) => handlePageNavigation(e, "/registry/inspect")} >
                            Explore
                        </MenuItem>
                        <MenuItem onClick={(e) => handlePageNavigation(e, '/registry/add')} >
                            Add entry
                        </MenuItem>
                        <MenuItem onClick={(e) => handlePageNavigation(e, '/registry/analytics')} >
                            Analytics
                        </MenuItem>
                    </SubMenu>
                </Menu>
            </SidebarContent>
            <SidebarFooter style={{ textAlign: 'center' }} >
                <div className="sidebar-btn-wrapper" style={{ padding: '20px 24px' }}>
                    <Popup content={collapsed ? renderMetaMaskLabel() : 'Wallet address'} trigger={
                        <div className="sidebar-btn" rel="noopener noreferrer" style={{ padding: `${collapsed ? '0' : '20px'}`, minWidth: '2.8em', minHeight: '2.8em' }}>
                            <Image src='../images/ether-wallet.png' size='mini'
                                style={{ marginRight: `${collapsed ? '0' : '5px'}`, display: `${collapsed ? 'inline-block' : 'block'}` }}
                            />
                            {/* <FaWallet /> */}
                            {!collapsed && (
                                <span style={{ wordBreak: 'break-all', color: '#dadada !important', fontSize: '0.8em', lineHeight: '1.5em', }}>
                                    <b>{renderMetaMaskLabel()}</b>
                                </span>

                            )}
                        </div>
                    } />
                </div>
            </SidebarFooter>
        </ProSidebar>
    );
};

export default Sidebar;