import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Popup } from 'semantic-ui-react';

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

    //for sorting
    const [isSortingByAddressAsc, setIsSortingByAddressAsc] = useState(true)
    const [isSortingByDomainAsc, setIsSortingByDomainAsc] = useState(true)
    const [isSortingByExpiryAsc, setIsSortingByExpiryAsc] = useState(true)
    const [isSortingByVerifiedAsc, setIsSortingByVerifiedAsc] = useState(true)
    const [isSortingByTotalSmartContracts, setIsSortingByTotalSmartContracts] = useState(true)
    const [isSortingByFavouriteAsc, setIsSortingByFavouriteAsc] = useState(true)
    const [isSortingByCreatedAtAsc, setIsSortingByCreatedAtAsc] = useState(true)

    useEffect(() => {
        const init = async () => {
            try {
                // setTescs(account ? (isDashboard? loadStorage() : []) : []);
                setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRY_PER_PAGE) : []);
                setTotalPages(!isExploringDomain ? Math.ceil(entriesWithOccurances.length / ENTRY_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRY_PER_PAGE : 0));
                if (isDashboard) {
                    window.ethereum.on('accountsChanged', (accounts) => {
                        setTescs(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                            JSON.parse(localStorage.getItem(accounts[0].toLowerCase())) :
                            []);
                        setDisplayedEntries(accounts[0] && localStorage.getItem(accounts[0].toLowerCase()) ?
                            JSON.parse(localStorage.getItem(accounts[0].toLowerCase())).slice(0, ENTRY_PER_PAGE) :
                            []);
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3.eth, web3.eth.Contract, web3.eth.net, entriesWithOccurances, isExploringDomain, isDashboard]);


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
                tescsNew.push({ contractAddress: tesc.contractAddress, domain: tesc.domain, expiry: tesc.expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm'), verified: tesc.verified });
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
        if (isExploringDomain) {
            setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length / ENTRY_PER_PAGE));
            setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
                .slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE));
        } else {
            setDisplayedEntries(entriesWithOccurances.slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE))
        }
    };


    const renderRows = () => {
        if (displayedEntries && isExploringDomain) {
            return displayedEntries.map((tesc, index) => (
                <TableEntry key={tesc.contractAddress}
                    tesc={tesc}
                    onTescsChange={handleChangeTescs}
                    isDashboard={isDashboard}
                    isExploringDomain={isExploringDomain}
                    setVerificationInTescs={setVerificationInTescs}
                    index={index}
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
            setTescs(rowData.filter(entry => entry.domain === domain).sort((tescA, tescB) => tescB.expiry - tescA.expiry));
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

    const sortByContractAddress = () => {
        if (isSortingByAddressAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.contractAddress - tescB.contractAddress).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByAddressAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.contractAddress - tescA.contractAddress).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByAddressAsc(true)
        }
    }

    const sortByDomain = () => {
        if (isSortingByDomainAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.domain.localeCompare(tescB.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByDomainAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByDomainAsc(true)
        }
    }

    const sortByExpiry = () => {
        console.log(tescs)
        if (isSortingByExpiryAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.expiry.toString().localeCompare(tescB.expiry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByExpiryAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.expiry.toString().localeCompare(tescA.expiry)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByExpiryAsc(true)
        }
    }

    const sortByVerified = () => {
        if (isSortingByVerifiedAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.verified.toString().localeCompare(tescB.verified)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByVerifiedAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.verified.toString().localeCompare(tescA.verified)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByVerifiedAsc(true)
        }
    }

    const sortByTotalSmartContracts = () => {
        if (isSortingByTotalSmartContracts) {
            console.log(tescs)
            setDisplayedEntries(entriesWithOccurances.sort((tescA, tescB) => tescA.contractCount.toString().localeCompare(tescB.contractCount)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByTotalSmartContracts(false)
        } else {
            setDisplayedEntries(entriesWithOccurances.sort((tescA, tescB) => tescB.contractCount.toString().localeCompare(tescA.contractCount)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByTotalSmartContracts(true)
        }
    }

    const sortByFavourite = () => {
        if (isSortingByFavouriteAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.isFavourite.toString().localeCompare(tescB.isFavourite)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByFavouriteAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.isFavourite.toString().localeCompare(tescA.isFavourite)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByFavouriteAsc(true)
        }
    }

    const sortByCreatedAt = () => {
        if (isSortingByCreatedAtAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.createdAt.toString().localeCompare(tescB.createdAt)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByCreatedAtAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.createdAt.toString().localeCompare(tescA.createdAt)).slice((currentPage - 1) * ENTRY_PER_PAGE, currentPage * ENTRY_PER_PAGE))
            setIsSortingByCreatedAtAsc(true)
        }
    }

    const setVerificationInTescs = (tescsWithVerification) => {
        setTescs(tescsWithVerification)
    }

    const renderSortingIcon = (isSortingAsc, sortByType) => {
        return (<Popup content={isSortingAsc ? 'Sort asc' : 'Sort desc'} trigger={<Button icon={isSortingAsc ? 'sort descending' : 'sort ascending'}
            className="sorting-icon"
            onClick={sortByType} />} />)
    }

    return (
        <>
            {renderSearchBox()}
            <Table color='purple'>
                <Table.Header active='true' style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>Address{renderSortingIcon(isSortingByAddressAsc, sortByContractAddress)}</Table.HeaderCell>}
                        <Table.HeaderCell>Domain{renderSortingIcon(isSortingByDomainAsc, sortByDomain)}</Table.HeaderCell>
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) && <Table.HeaderCell>Expiry{renderSortingIcon(isSortingByExpiryAsc, sortByExpiry)}</Table.HeaderCell>}
                        {(isRegistryInspect && !isExploringDomain) && <Table.HeaderCell textAlign="center">Total Smart Contracts{renderSortingIcon(isSortingByTotalSmartContracts, sortByTotalSmartContracts)}</Table.HeaderCell>}
                        <Table.HeaderCell textAlign="center">Verified{renderSortingIcon(isSortingByVerifiedAsc, sortByVerified)}</Table.HeaderCell>
                        {isDashboard &&
                            <Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
                        }
                        {(isDashboard || (isRegistryInspect && isExploringDomain)) &&
                            <Table.HeaderCell textAlign="center">Favourites{renderSortingIcon(isSortingByFavouriteAsc, sortByFavourite)}
                            {/*<Dropdown
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
                            </Dropdown>*/}
                            </Table.HeaderCell>
                        }
                        {isDashboard &&
                            <Table.HeaderCell>Created At{renderSortingIcon(isSortingByCreatedAtAsc, sortByCreatedAt)}</Table.HeaderCell>
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
                        firstItem={totalPages > 8 ? { content: <Icon name='angle double left' />, icon: true } : null}
                        lastItem={totalPages > 8 ? { content: <Icon name='angle double right' />, icon: true } : null}
                        prevItem={{ content: <Icon name='angle left' />, icon: true }}
                        nextItem={{ content: <Icon name='angle right' />, icon: true }} />
                </div> : null
            }
        </>
    );
}

export default TableOverview;
