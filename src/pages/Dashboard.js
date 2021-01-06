import React, { useContext, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';
import { Table, Grid, Dropdown, Dimmer, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import '../styles/Dashboard.scss'
import DashboardEntry from '../components/DashboardEntry';
import FeedbackMessage from '../components/FeedbackMessage'

const Dashboard = () => {
    const { web3, selectedAccount } = useContext(AppContext);
    const [tescsIsInRegistry, setTescsIsInRegistry] = useState([])
    const [contractRegistry, setContractRegistry] = useState()
    const [sysMsg, setSysMsg] = useState(null)
    const [blocking, setBlocking] = useState(false)
    const [currentAccount, setCurrentAccount] = useState(selectedAccount)

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const assignSysMsgFromEntry = (sysMsg) => {
        setSysMsg(sysMsg)
    }

    const handleBlocking = (blockingState) => {
        setBlocking(blockingState)
    }

    useEffect(() => {
        const init = async () => {
            const [currentAccount, ] = await web3.eth.getAccounts()
            try {
                const contractRegistry = new web3.eth.Contract(
                    TeSCRegistry.abi,
                    process.env.REACT_APP_REGISTRY_ADDRESS,
                );
                setContractRegistry(contractRegistry)
                setCurrentAccount(currentAccount.toLowerCase())
                const tescs = JSON.parse(localStorage.getItem(currentAccount.toLowerCase()))
                if (tescs) {
                    const result = contractRegistry ? await Promise.all(tescs.map(async ({ contractAddress, domain, expiry, isFavourite, own }) => ({ contractAddress: contractAddress, domain: domain, expiry: expiry, isFavourite: isFavourite, own: own, isInRegistry: await contractRegistry.methods.isContractRegistered(contractAddress).call() }))) : tescs
                    setTescsIsInRegistry(result)
                }
            }
            catch (error) {
                const tescs = JSON.parse(localStorage.getItem(currentAccount.toLowerCase()));
                setTescsIsInRegistry(tescs)
            }
        }
        init()
    }, [currentAccount, selectedAccount, web3.eth, web3.eth.Contract, web3.eth.net])


    const renderRows = () => {
        return tescsIsInRegistry.map(({ contractAddress, domain, expiry, isInRegistry, isFavourite, own }, index) => (
            <DashboardEntry key={contractAddress}
                contractAddress={contractAddress}
                domain={domain}
                expiry={expiry}
                isInRegistry={isInRegistry}
                selectedAccount={currentAccount}
                contractRegistry={contractRegistry}
                assignSysMsg={assignSysMsgFromEntry}
                isFavourite={isFavourite}
                index={index}
                tescsIsInRegistry={tescsIsInRegistry}
                own={own}
                web3={web3}
                handleBlocking={handleBlocking} />
        ));
    };

    const filterTescs = () => {
        setTescsIsInRegistry(JSON.parse(localStorage.getItem(currentAccount)).filter(tesc => tesc.isFavourite === true))
    }

    const showAllTescs = () => {
        setTescsIsInRegistry(JSON.parse(localStorage.getItem(currentAccount)))
    }

    const showOwnTescs = () => {
        setTescsIsInRegistry(JSON.parse(localStorage.getItem(currentAccount)).filter(tesc => tesc.own === true))
    }

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
                        <Table.HeaderCell textAlign="center">Verification</Table.HeaderCell>
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
                        {renderRows()}
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