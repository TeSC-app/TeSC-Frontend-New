import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon } from 'semantic-ui-react';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment'
import SearchBox from './SearchBox';

const ENTRY_PER_PAGE = 5

function TableOverview(props) {
    const {
        rowData,
        entriesWithOccurances,
        isDashboard,
        isRegistryInspect,
        handleLoading,
        isExploringDomainDefault
    } = props;

    const { web3, account, loadStorage } = useContext(AppContext);

    const [tescs, setTescs] = useState(rowData);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(!isExploringDomainDefault ? Math.ceil(entriesWithOccurances.length / ENTRY_PER_PAGE) : tescs ? Math.ceil(tescs.length / ENTRY_PER_PAGE) : 0);
    const [filterOption, setFilterOption] = useState(0);
    const [displayedEntries, setDisplayedEntries] = useState([]);
    const [isExploringDomain, setIsExploringDomain] = useState(isExploringDomainDefault)

    //for search input
    const [domain, setDomain] = useState('')

    useEffect(() => {
        //console.log(tescs)
        //console.log(entriesWithOccurances)
        const init = async () => {
            try {
                // setTescs(account ? (isDashboard? loadStorage() : []) : []);
                setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRY_PER_PAGE) : []);
                setTotalPages(!isExploringDomain ? Math.ceil(entriesWithOccurances.length / ENTRY_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRY_PER_PAGE : 0));
                window.ethereum.on('accountsChanged', (accounts) => {
                    setTescs(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                        JSON.parse(localStorage.getItem(accounts[0].toLowerCase())) :
                        []);
                    setDisplayedEntries(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                        JSON.parse(localStorage.getItem(accounts[0].toLowerCase())).slice(0, ENTRY_PER_PAGE) :
                        []);
                });
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3.eth, web3.eth.Contract, web3.eth.net, entriesWithOccurances, isExploringDomain]);


    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        if (isRegistryInspect) {
            let tescsNew = loadStorage() ? loadStorage() : []
            let found = false
            for (const tescNew of tescsNew) {
                if (tescNew.contractAddress === tesc.contractAddress) {
                    found = true;
                    if (tescNew.isFavourite) {
                        tescNew.isFavourite = false;
                    } else {
                        tescNew.isFavourite = true;
                    }
                    localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
                    break;
                }
            }
            if (!found) {
                tescsNew.push({ contractAddress: tesc.contractAddress, domain: tesc.domain, expiry: tesc.expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm') });
                localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
            }
            setTescs(updatedTescs.sort((tescA, tescB) => tescB.expiry - tescA.expiry))
        } else {
            setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.localeCompare(tescB.createdAt)));
            localStorage.setItem(account.toLowerCase(), JSON.stringify(updatedTescs));
        }
    };

    const showAllTescs = (tescs) => {
        setCurrentPage(1);
        setFilterOption(0);
        setTotalPages(Math.ceil(tescs.length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const showFavouriteTescs = () => {
        setCurrentPage(1);
        setFilterOption(1);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.isFavourite === true).length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const showOwnTescs = () => {
        setCurrentPage(1);
        setFilterOption(2);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.own === true).length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(tescs.filter(tesc => tesc.own === true).slice(0, ENTRY_PER_PAGE)) : setTescs([]);
    };

    const changePage = (event, { activePage }) => {
        //check if there are filters applied
        setCurrentPage(activePage);
        if(isExploringDomain) {
        setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length / ENTRY_PER_PAGE));
        setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
            .slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE));
        } else {
            setDisplayedEntries(entriesWithOccurances.slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE))
        }
    };


    const renderRows = () => {
        if (displayedEntries && isExploringDomain) {
            return displayedEntries.map((tesc) => (
            <TableEntry key={tesc.contractAddress}
                tesc={tesc}
                onTescsChange={handleChangeTescs}
                isDashboard={isDashboard}
                isExploringDomain={isExploringDomain}
            />
        )) 
        } else if (displayedEntries && !isExploringDomain) {
            return entriesWithOccurances.map((entry) => (
                <TableEntry key={entry.domain}
                    tesc={entry}
                    isExploringDomain={isExploringDomain}
                    isDashboard={isDashboard}
                    handleSearchInput={handleSearchInput}
                    handleSearchSubmit={handleSearchSubmit}
                />))
        }
    };

    const handleSearchInput = domain => {
        setDomain(domain);
    }

    const handleSearchSubmit = (domain) => {
        handleLoading(true)
        if (domain === '') {
            setIsExploringDomain(false)
            setTescs(entriesWithOccurances)
        } else {
            setIsExploringDomain(true)
            setTescs(loadStorage().filter(entry => entry.domain === domain).sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        }
        handleLoading(false)
    }

    const renderSearchBox = () => {
        return isRegistryInspect ? (<SearchBox
            onChange={handleSearchInput}
            onSubmit={handleSearchSubmit}
            value={domain}
            placeholder='www.mysite.com'
            label='Domain'
            icon='search'
            validInput={true}
            isRegistryInspect={isRegistryInspect} />) : null
    }

    return (
        <>
            {renderSearchBox()}
            <Table color='purple'>
                <Table.Header active='true' style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>Address</Table.HeaderCell>}
                        <Table.HeaderCell>Domain</Table.HeaderCell>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>Expiry</Table.HeaderCell>}
                        {(isRegistryInspect && !isExploringDomain) && <Table.HeaderCell textAlign="center">Total Smart Contracts</Table.HeaderCell>}
                        <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
                        {isDashboard &&
                            <Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
                        }
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) &&
                        <Table.HeaderCell textAlign="center">Favourites
                            <Dropdown
                                icon='filter'
                                floating
                                button
                                className='icon dropdown-favourites'>
                                <Dropdown.Menu>
                                    <Dropdown.Item icon='redo' text={isRegistryInspect && domain.length > 0 ? 'All (by domain)' : 'All'} onClick={() => showAllTescs(tescs)} />
                                    {isRegistryInspect && <Dropdown.Item icon='redo' text='All (reset)' onClick={() => setIsExploringDomain(false)} />}
                                    <Dropdown.Item icon='heart' text='By favourite' onClick={showFavouriteTescs} />
                                    <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                </Dropdown.Menu>
                            </Dropdown>
                        </Table.HeaderCell>
                        }
                        {isDashboard &&
                            <Table.HeaderCell>Created At</Table.HeaderCell>
                        }
                    </Table.Row>
                </Table.Header>
                {(
                    <Table.Body>
                        {renderRows()}
                    </Table.Body>
                )}
            </Table>
            { totalPages > 0 ?
                <div className='pagination'>
                    <Pagination
                        totalPages={totalPages}
                        activePage={currentPage}
                        onPageChange={changePage}
                        ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                        firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                        lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                        prevItem={{ content: <Icon name='angle left' />, icon: true }}
                        nextItem={{ content: <Icon name='angle right' />, icon: true }} />
                </div> : null
            }
        </>
    );
}

export default TableOverview;
