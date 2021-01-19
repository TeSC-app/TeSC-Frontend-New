import React, { useContext, useEffect, useState, useCallback } from 'react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import '../styles/Dashboard.scss';
import PageHeader from '../components/PageHeader';
import TableOverview from '../components/TableOverview';

const Dashboard = (props) => {
    const { selectedAccount, hasAccountChanged, handleAccountChanged } = props
    const { web3 } = useContext(AppContext);
    const [contractRegistry, setContractRegistry] = useState(null);
    const [tescs, setTescs] = useState(selectedAccount ? JSON.parse(localStorage.getItem(selectedAccount.toLowerCase())) : []);
    const [displayedEntries, setDisplayedEntries] = useState([])
    const [filterOption, setFilterOption] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(tescs ? Math.ceil(tescs.length/7) : 0)

    const loadStorage = useCallback(() => {
        return JSON.parse(localStorage.getItem(selectedAccount.toLowerCase()));
    }, [selectedAccount]);

    const showAllTescs = () => {
        setCurrentPage(1)
        setFilterOption(0)
        setTotalPages(Math.ceil(tescs.length/7))
        localStorage.getItem(selectedAccount.toLowerCase()) ? setDisplayedEntries(loadStorage().slice(0, 7)) : setTescs([]);
    };

    const showFavouriteTescs = () => {
        setCurrentPage(1)
        setFilterOption(1)
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.isFavourite === true).length/7))
        localStorage.getItem(selectedAccount.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice(0, 7)) : setTescs([]);
    };

    const showOwnTescs = () => {
        setCurrentPage(1)
        setFilterOption(2)
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.own === true).length/7))
        localStorage.getItem(selectedAccount.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.own === true).slice(0, 7)) : setTescs([]);
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
                setDisplayedEntries(selectedAccount ? loadStorage().slice(0, 7) : [])
                setTotalPages(Math.ceil(loadStorage().length/7))
                window.ethereum.on('accountsChanged', (accounts) => {
                    setTescs(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                        JSON.parse(localStorage.getItem(accounts[0].toLowerCase())) :
                        []);
                    setDisplayedEntries(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                        JSON.parse(localStorage.getItem(accounts[0].toLowerCase())).slice(0, 7) :
                        [])
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

    const changePage = (event, { activePage }) => {
        //check if there are filters applied
        setCurrentPage(activePage)
        setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length/7))
        setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
            .slice((activePage - 1) * 7, activePage * 7))
    }

    const tableProps = {
        showFavouriteTescs,
        showAllTescs,
        showOwnTescs,
        isDashboard: true,
        changePage,
        resultSizeInitial: tescs ? tescs.length : 0,
        currentPage, 
        totalPages, 
        displayedEntries,
        selectedAccount,
        contractRegistry,
        onTescsChange: handleChangeTescs,
        web3,
        hasAccountChanged,
        handleAccountChanged
    }

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            <TableOverview {...tableProps} />
        </React.Fragment>
    );


};

export default Dashboard;