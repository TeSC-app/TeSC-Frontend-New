import React, { useContext, useEffect, useState, useCallback } from 'react';
import 'react-day-picker/lib/style.css';
import { Table, Grid, Dropdown, Dimmer, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import '../styles/Dashboard.scss';
import DashboardEntry from '../components/DashboardEntry';
import FeedbackMessage from '../components/FeedbackMessage';

const Dashboard = ({ selectedAccount, noWalletAddress }) => {
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(null);
    // const contractRegistry = useRef(new web3.eth.Contract(TeSCRegistry.abi, process.env.REACT_APP_REGISTRY_ADDRESS))
    const [sysMsg, setSysMsg] = useState(null);
    const [blocking, setBlocking] = useState(false);

    const [tescs, setTescs] = useState(selectedAccount ? JSON.parse(localStorage.getItem(selectedAccount.toLowerCase())) : []);

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const assignSysMsgFromEntry = (sysMsg) => {
        setSysMsg(sysMsg);
    };

    const handleBlocking = (blockingState) => {
        setBlocking(blockingState);
    };

    const loadStorage = useCallback(() => {
        return JSON.parse(localStorage.getItem(selectedAccount.toLowerCase()));
    }, [selectedAccount]);

    const filterTescs = () => {
        localStorage.getItem(selectedAccount.toLowerCase()) ? setTescs(tescs.filter(tesc => tesc.isFavourite === true)) : setTescs([]);
    };

    const showAllTescs = () => {
        localStorage.getItem(selectedAccount.toLowerCase()) ? setTescs(loadStorage()) : setTescs([]);
    };

    const showOwnTescs = () => {
        localStorage.getItem(selectedAccount.toLowerCase()) ? setTescs(loadStorage().filter(tesc => tesc.own === true)) : setTescs([]);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const contractRegistry = new web3.eth.Contract(
                    TeSCRegistry.abi,
                    process.env.REACT_APP_REGISTRY_ADDRESS,
                );
                setContractRegistry(contractRegistry);
                window.ethereum.on('accountsChange', (accounts) => {
                    setTescs(JSON.parse(localStorage.getItem(accounts[0].toLowerCase())));
                });
            }
            catch (error) {
                const tescs = selectedAccount ? loadStorage() : [];
                setTescs(tescs);
                console.log(error)
            }
        };
        init();
    }, [selectedAccount, web3.eth, web3.eth.Contract, web3.eth.net, loadStorage]);

    const handleChangeTescs = (tesc) => {
        setTescs([...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc])
    }

    const renderRows = () => {
        if (tescs) return tescs.map(({ contractAddress, domain, expiry, isFavourite, own, isInRegistry }, index) => (
            <DashboardEntry key={contractAddress}
                contractAddress={contractAddress}
                domain={domain}
                expiry={expiry}
                isInRegistry={isInRegistry}
                selectedAccount={selectedAccount}
                contractRegistry={contractRegistry}
                assignSysMsg={assignSysMsgFromEntry}
                isFavourite={isFavourite}
                index={index}
                tescsIsInRegistry={tescs}
                onTescsChange={handleChangeTescs}
                own={own}
                web3={web3}
                handleBlocking={handleBlocking}
            />
        ));
    };



    return (
        <React.Fragment>
            <Grid>
                <Grid.Row style={{ height: '100%' }}>
                    <Grid.Column width={6}>
                        <h2>Dashboard</h2>
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <div style={{ float: 'right' }}>
                            {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}
                        </div>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Table>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Address</Table.HeaderCell>
                        <Table.HeaderCell>Domain</Table.HeaderCell>
                        <Table.HeaderCell>Expiry</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Favourites
                        <Dropdown
                                icon='filter'
                                floating
                                button
                                className='icon dropdownFavourites'>
                                <Dropdown.Menu>
                                    <Dropdown.Item icon='redo' text='All' onClick={showAllTescs} />
                                    <Dropdown.Item icon='heart' text='By favourite' onClick={filterTescs} />
                                    <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                </Dropdown.Menu>
                            </Dropdown></Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                {(
                    <Table.Body>
                        {noWalletAddress && !selectedAccount ? null : renderRows()}
                    </Table.Body>
                )}
            </Table>
            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </React.Fragment>
    );
};

export default Dashboard;