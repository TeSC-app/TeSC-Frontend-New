import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Container, Loader, Dimmer, Segment } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import TeSCNew from '../pages/TescNew';
import TeSCInspect from '../pages/TescInspect';
import RegistryInspect from '../pages/RegistryInspect';
import '../styles/App.scss';
import RegistryAdd from '../pages/RegistryAdd';
import AppContext from '../appContext';


const App = ({ web3 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);

    const [sysMsg, setSysMsg] = useState(null);
    const [screenBlocked, setScreenBlocked] = useState(false);
    const [hasWalletAddress, setHasWalletAddress] = useState(false);
    const [account, setAccount] = useState(null);
    const [hasAccountChanged, setHasAccountChanged] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const [selectedAccount,] = await web3.eth.getAccounts();
                setAccount(selectedAccount && selectedAccount);
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
                hasWalletAddress
            }}
            >
                {/* <Navbar hasWalletAddress={hasWalletAddress} selectedAccount={account} handleCollapseSidebar={handleCollapseSidebar} /> */}
                <div className='layout'>
                    <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} handleCollapseSidebar={handleCollapseSidebar} />
                    <Container className="page">
                        <Segment className='main-segment-bg' padded='very'
                            style={{ height: '110vh', minHeight: 'max-content', background: 'rgba(255, 255, 255, 0.97)', borderRadius: '25px' }}
                        >
                            <Route path="/" exact render={props => {
                                return <Dashboard {...props}
                                    selectedAccount={account && account.toLowerCase()}
                                    hasAccountChanged={hasAccountChanged}
                                    handleAccountChanged={handleAccountChanged} />;
                            }} />
                            <Route path="/tesc/new" component={TeSCNew} exact />
                            <Route path="/tesc/inspect" component={TeSCInspect} exact />
                            <Route path="/registry/inspect" component={RegistryInspect} exact />
                            <Route path="/registry/add" exact render={props => {
                                return <RegistryAdd {...props}
                                    selectedAccount={account}
                                    handleBlockScreen={handleBlockScreen}
                                    screenBlocked={screenBlocked} />
                            }} />

                        </Segment>
                    </Container>
                </div>
                <Dimmer active={screenBlocked}>
                    <Loader indeterminate content='Waiting for transaction to finish...' />
                </Dimmer>
            </AppContext.Provider>
        </BrowserRouter>
    );
};

export default App;
