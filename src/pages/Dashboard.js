import React, { useContext, useEffect, useState, useCallback } from 'react';
import 'react-day-picker/lib/style.css';

import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import '../styles/Dashboard.scss';
import DashboardEntry from '../components/DashboardEntry';
import PageHeader from '../components/PageHeader';
import TableGeneral from '../components/TableGeneral';

const Dashboard = (props) => {
    const { selectedAccount, hasAccountChanged, handleAccountChanged } = props
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(null);
    const [tescs, setTescs] = useState(selectedAccount ? JSON.parse(localStorage.getItem(selectedAccount.toLowerCase())) : []);


    const loadStorage = useCallback(() => {
        return JSON.parse(localStorage.getItem(selectedAccount.toLowerCase()));
    }, [selectedAccount]);

    const showFavouriteTescs = () => {
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

    const renderDashboardRows = () => {
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

    const tableProps = { renderDashboardRows, showFavouriteTescs, showAllTescs, showOwnTescs, isDashboard: true }

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            <TableGeneral {...tableProps} />
        </React.Fragment>
    );


};

export default Dashboard;