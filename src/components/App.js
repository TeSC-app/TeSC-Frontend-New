import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Container, Loader, Dimmer } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Navbar from './Navbar';
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
    const [selectedAccount, setSelectedAccount] = useState(web3.currentProvider.selectedAddress)

    useEffect(() => {
        const init = async () => {
            const [selectedAccount,] = await web3.eth.getAccounts()
            setSelectedAccount(selectedAccount)
        }
        init()
    })

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
        setToggled(!toggled);
    };

    return (
        <BrowserRouter>
            <AppContext.Provider value={{
                web3,
                handleBlockScreen,
                sysMsg,
                showMessage,
                handleDismissMessage,
                selectedAccount
            }}
            >
                <Navbar handleCollapseSidebar={handleCollapseSidebar} />
                <div className='layout'>
                    <Sidebar collapsed={collapsed} toggled={toggled} handleToggleSidebar={setToggled} />
                    <Container className="page">
                        <Route path="/" component={Dashboard} exact />
                        <Route path="/tesc/new" component={TeSCNew} exact />
                        <Route path="/tesc/inspect" component={TeSCInspect} exact />
                        <Route path="/registry/inspect" component={RegistryInspect} exact />
                        <Route path="/registry/add" component={RegistryAdd} exact />
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
