import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, useLocation } from 'react-router-dom';
import { Container, Loader, Dimmer, Segment } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

import AppContext from '../appContext';
import Sidebar from './Sidebar';
import LandingPage from '../landingPage/LandingPage';
import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCInspect from '../pages/TescInspect';
import RegistryInspect from '../pages/RegistryInspect';
import RegistryAdd from '../pages/RegistryAdd';
import RegistryAnalytics from '../pages/RegistryAnalytics';


import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
// import LandingPage from '../landingPage/LandingPage';

const App = ({ web3 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);
    const [sysMsg, setSysMsg] = useState(null);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [hasWalletAddress, setHasWalletAddress] = useState(false);
    const [account, setAccount] = useState('');
    const [hasAccountChanged, setHasAccountChanged] = useState(false);
    const [registryContract, setRegistryContract] = useState(undefined);

    const location = useLocation();

    const loadStorage = () => {
        const storage = JSON.parse(localStorage.getItem(web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress)));
        return storage ? storage : [];
    };

    useEffect(() => {
        console.log('location', location);
        const init = async () => {
            try {
                const registryContract = new web3.eth.Contract(
                    TeSCRegistry.abi,
                    process.env.REACT_APP_REGISTRY_ADDRESS,
                );
                setRegistryContract(registryContract);
            }
            catch (error) {
                console.error(error);
            }
        };
        init();
    }, [web3.eth.Contract, web3.eth.net]);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const [selectedAccount] = await web3.eth.getAccounts();
                // setAccount(selectedAccount ? selectedAccount.toLowerCase() : '');
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

    const renderLandingPage = () => {
        return (
            <Route path='/' exact component={LandingPage} />
        );
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
            registryContract
        }}
        >
            {/* <Navbar hasWalletAddress={hasWalletAddress} selectedAccount={account} handleCollapseSidebar={handleCollapseSidebar} /> */}
            {location.pathname === '/' ?
                <Route path='/' exact component={LandingPage} />
                :
                <div className='layout'>
                    <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} handleCollapseSidebar={handleCollapseSidebar} />
                    <Container className="page">
                        <Segment className='main-segment' raised>
                            <Route
                                path="/dashboard"
                                exact
                                render={props => <Dashboard{...props} />}
                            />
                            <Route path="/tesc/new" component={TeSCNew} exact />
                            <Route path="/tesc/inspect" component={TeSCInspect} exact />
                            <Route path="/registry/inspect" exact render={props => {
                                return <RegistryInspect {...props}
                                    contractRegistry={registryContract} />;
                            }} />
                            <Route path="/registry/add" exact render={props => {
                                return <RegistryAdd {...props}
                                    handleBlockScreen={handleBlockScreen}
                                    screenBlocked={screenBlocked}
                                    contractRegistry={registryContract} />;
                            }} />
                            <Route path="/registry/analytics" component={RegistryAnalytics} exact />
                        </Segment>
                    </Container>
                </div>
            }
            <Dimmer active={screenBlocked} style={{ zIndex: '9999' }}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </AppContext.Provider>
    );
};

export default App;
