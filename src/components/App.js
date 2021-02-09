import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';
import { Container, Loader, Dimmer, Segment } from 'semantic-ui-react';
import web3 from 'web3';
import 'semantic-ui-css/semantic.min.css';

import AppContext from '../appContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LandingPage from '../landingPage/LandingPage';
import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCInspect from '../pages/TescInspect';
import RegistryInspect from '../pages/RegistryInspect';
import RegistryAdd from '../pages/RegistryAdd';
import RegistryAnalytics from '../pages/RegistryAnalytics';

import { getRegistryContractInstance } from '../utils/registry';


import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';


const App = ({ web3 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);
    const [sysMsg, setSysMsg] = useState(null);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [hasWalletAddress, setHasWalletAddress] = useState(false);
    const [account, setAccount] = useState('');
    const [hasAccountChanged, setHasAccountChanged] = useState(false);
    const [networkId, setNetworkId] = useState('');

    // const registryContract = useRef(getRegistryContractInstance(web3));
    const location = useLocation();

    const loadStorage = () => {
        const walletAddress = web3.currentProvider.selectedAddress;
        if (walletAddress === null) {
            return [];
        }
        console.log('loadStorage of ', walletAddress);
        return JSON.parse(localStorage.getItem(web3.utils.toChecksumAddress(walletAddress)));
    };

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const networkId = await web3.eth.net.getId();
                setNetworkId(networkId);
                const [selectedAccount] = await web3.eth.getAccounts();
                setAccount(web3.utils.toChecksumAddress(selectedAccount));
                window.ethereum.on('accountsChanged', function (accounts) {
                    setHasAccountChanged(true);
                    if (!accounts[0]) {
                        setHasWalletAddress(false);
                    } else {
                        setHasWalletAddress(true);
                        setAccount(accounts[0]);
                    }
                });
                window.ethereum.on('chainChanged', (_chainId) => window.location.reload());
            }
        };
        init();
    });

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const showMessage = (msg, closingCondition = null) => {
        if (msg === null && sysMsg !== null && sysMsg.closingCondition === closingCondition) {
            setSysMsg(null);
        } else if (msg !== null) {
            setSysMsg(msg);
        }
    };

    const handleBlockScreen = (blocked) => {
        setScreenBlocked(blocked);
    };

    const handleCollapseSidebar = () => {
        setCollapsed(!collapsed);
        // setToggled(!toggled);
    };

    const handleAccountChanged = (newHasAccountChanged) => {
        setHasAccountChanged(newHasAccountChanged);
    };


    return (
        <AppContext.Provider value={{
            web3,
            handleBlockScreen,
            sysMsg,
            showMessage,
            handleDismissMessage,
            account,
            hasWalletAddress,
            loadStorage,
            hasAccountChanged,
            handleAccountChanged,
            // registryContract: registryContract.current,
            networkId
        }}
        >
            {location.pathname === '/' ?
                <Route path='/' exact component={LandingPage} />
                :
                <div className='layout'>
                    <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} handleCollapseSidebar={handleCollapseSidebar} />
                    <div style={{ width: '100vw', height: '100vh' }}>
                        <Navbar hasWalletAddress={hasWalletAddress} selectedAccount={account} handleCollapseSidebar={handleCollapseSidebar} sidebarCollapsed={collapsed} />

                        <div className="page">
                            {/* <Segment className='main-segment' raised> */}

                            <Route
                                path="/dashboard"
                                exact
                                render={props => <Dashboard{...props} />}
                            />
                            <Route path="/tesc/new" component={TeSCNew} exact />
                            <Route path="/tesc/inspect" component={TeSCInspect} exact />
                            <Route path="/registry/inspect" exact render={props => {
                                return <RegistryInspect {...props} />;
                            }} />
                            <Route path="/registry/add" exact render={props => {
                                return (
                                    <RegistryAdd {...props}
                                        handleBlockScreen={handleBlockScreen}
                                        selectedAccount={account}
                                    />
                                );
                            }} />
                            <Route path="/registry/analytics" component={RegistryAnalytics} exact />
                            {/* </Segment> */}
                        </div>
                    </div>
                </div>
            }
            <Dimmer active={screenBlocked} style={{ zIndex: '9999' }}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </AppContext.Provider>
    );
};

export default App;
