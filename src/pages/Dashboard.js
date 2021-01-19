import React, { useContext, useEffect, useState, useCallback } from 'react';
import 'react-day-picker/lib/style.css';
import { Table, Grid, Dropdown, Dimmer, Loader } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import DashboardEntry from '../components/DashboardEntry';
import PageHeader from '../components/PageHeader';

const Dashboard = (props) => {
    const { selectedAccount, hasAccountChanged, handleAccountChanged } = props
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(null);
    const [tescs, setTescs] = useState(selectedAccount ? JSON.parse(localStorage.getItem(selectedAccount.toLowerCase())) : []);


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
                setTescs(selectedAccount ? loadStorage() : []);
                window.ethereum.on('accountsChanged', (accounts) => {
                    setTescs(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                        JSON.parse(localStorage.getItem(accounts[0].toLowerCase())) :
                        []);
                });
            }
            catch (error) {
                const tescs = selectedAccount ? loadStorage() : [];
                setTescs(tescs);
                console.log(error);
            }
        };
        init();
    }, [selectedAccount, web3.eth, web3.eth.Contract, web3.eth.net, loadStorage]);

    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.localeCompare(tescB.createdAt)));
        localStorage.setItem(selectedAccount.toLowerCase(), JSON.stringify(updatedTescs));
    };

    const renderRows = () => {
        if (tescs) return tescs.map((tesc) => (
            <DashboardEntry key={tesc.contractAddress}
                tesc={tesc}
                selectedAccount={selectedAccount}
                contractRegistry={contractRegistry}
                onTescsChange={handleChangeTescs}
                web3={web3}
                hasAccountChanged={hasAccountChanged}
                handleAccountChanged={handleAccountChanged}
            />
        ));
    };

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            <Table color='purple'>
                <Table.Header active style={{backgroundColor: 'purple'}}>
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
                            </Dropdown>
                        </Table.HeaderCell>
                        <Table.HeaderCell>Created At</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                {(
                    <Table.Body>
                        {renderRows()}
                    </Table.Body>
                )}
            </Table>
        </React.Fragment>
    );
};

export default Dashboard;