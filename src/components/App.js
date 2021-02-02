import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Container, Loader, Dimmer, Segment } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCInspect from '../pages/TescInspect';
import RegistryInspect from '../pages/RegistryInspect';
import RegistryAdd from '../pages/RegistryAdd';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';

const App = ({ web3 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);
    const [sysMsg, setSysMsg] = useState(null);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [hasWalletAddress, setHasWalletAddress] = useState(false);
    const [account, setAccount] = useState('');
    const [hasAccountChanged, setHasAccountChanged] = useState(false);
    const [registryContract, setRegistryContract] = useState(undefined);
    const [networkId, setNetworkId] = useState('')

    const loadStorage = () => {
        return JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress));
    };

    useEffect(() => {
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
                const networkId = await web3.eth.net.getId()
                setNetworkId(networkId)
                const [selectedAccount] = await web3.eth.getAccounts();
                setAccount(selectedAccount ? selectedAccount.toLowerCase() : '');
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
        <BrowserRouter>
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
                registryContract,
                networkId
            }}
            >
                {/* <Navbar hasWalletAddress={hasWalletAddress} selectedAccount={account} handleCollapseSidebar={handleCollapseSidebar} /> */}
                <div className='layout'>
                    <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} handleCollapseSidebar={handleCollapseSidebar} />
                    <Container className="page">
                        <Segment className='main-segment' raised>
                            <Route path="/" exact render={props => {
                                return <Dashboard
                                    {...props}
                                />;
                            }} />
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
                        </Segment>
                    </Container>
                </div>
                <Dimmer active={screenBlocked} style={{ zIndex: '9999' }}>
                    <Loader indeterminate content='Waiting for transaction to finish...' />
                </Dimmer>
            </AppContext.Provider>
        </BrowserRouter>
    );
};

export default App;
