import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon } from 'semantic-ui-react';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment';
import SearchBox from './SearchBox';

import { loadStorage } from '../utils/storage';

const ENTRIES_PER_PAGE = 5;

export const COL = {
    DOMAIN: 'Domain',
    ADDRESS: 'Address',
    VERIF: 'Verification',
    REG: 'Registry',
    FAV: 'Favorites',
    CA: 'Created At',
    TSC: 'Total Smart Contracts',
    EXPIRY: 'Expiry'
};

export const hasAllColumns = (cols) => {
    return cols.has(COL.DOMAIN) && cols.has(COL.ADDRESS) && cols.has(COL.EXPIRY) && cols.has(COL.VERIF) &&
        cols.has(COL.REG) && cols.has(COL.FAV) && cols.has(COL.CA);
};

function TableOverview(props) {
    const {
        rowData,
        entriesWithOccurances,
        handleLoading,
        handleIsExploringDomain,
        cols
    } = props;

    const { web3, account } = useContext(AppContext);

    const [tescs, setTescs] = useState(rowData);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(cols.has(COL.TSC) ? Math.ceil(entriesWithOccurances.length / ENTRIES_PER_PAGE) : tescs ? Math.ceil(tescs.length / ENTRIES_PER_PAGE) : 0);
    const [filterOption, setFilterOption] = useState(0);
    const [displayedEntries, setDisplayedEntries] = useState([]);

    //for search input
    const [domain, setDomain] = useState('');


    useEffect(() => {
        console.log(tescs);
        console.log(entriesWithOccurances);
        const init = async () => {
            try {
                setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRIES_PER_PAGE) : []);
                setTotalPages(cols.has(COL.TSC) ? Math.ceil(entriesWithOccurances.length / ENTRIES_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRIES_PER_PAGE : 0));
                window.ethereum.on('accountsChanged', (accounts) => {
                    const account = web3.utils.toChecksumAddress(accounts[0]);
                    setTescs(accounts[0] && localStorage.getItem(account) ?
                        JSON.parse(localStorage.getItem(account)) : []);
                    setDisplayedEntries(account && localStorage.getItem(account) ?
                        JSON.parse(localStorage.getItem(account)).slice(0, ENTRIES_PER_PAGE) : []);
                });
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3, entriesWithOccurances, cols]);


    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        if (!cols.has(COL.REG)) {
            let tescsNew = loadStorage(web3);
            let found = false;
            for (const tescNew of tescsNew) {
                if (tescNew.contractAddress === tesc.contractAddress) {
                    found = true;
                    if (tescNew.isFavourite) {
                        tescNew.isFavourite = false;
                    } else {
                        tescNew.isFavourite = true;
                    }
                    localStorage.setItem(account, JSON.stringify(tescsNew));
                    break;
                }
            }
            if (!found) {
                tescsNew.push({ contractAddress: tesc.contractAddress, domain: tesc.domain, expiry: tesc.expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm') });
                localStorage.setItem(account, JSON.stringify(tescsNew));
            }

            setTescs(updatedTescs.sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        } else {
            setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.localeCompare(tescB.createdAt)));
            localStorage.setItem(account, JSON.stringify(updatedTescs));
        }
    };

    const showAllTescs = (tescs) => {
        setCurrentPage(1);
        setFilterOption(0);
        setTotalPages(Math.ceil(tescs.length / ENTRIES_PER_PAGE));
        localStorage.getItem(account) ? setDisplayedEntries(tescs.slice(0, ENTRIES_PER_PAGE)) : setTescs([]);
    };

    const showFavouriteTescs = () => {
        setCurrentPage(1);
        setFilterOption(1);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.isFavourite === true).length / ENTRIES_PER_PAGE));
        localStorage.getItem(account) ? setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice(0, ENTRIES_PER_PAGE)) : setTescs([]);
    };

    const showOwnTescs = () => {
        setCurrentPage(1);
        setFilterOption(2);
        setTotalPages(Math.ceil(tescs.filter(tesc => tesc.own === true).length / ENTRIES_PER_PAGE));
        localStorage.getItem(account) ? setDisplayedEntries(tescs.filter(tesc => tesc.own === true).slice(0, ENTRIES_PER_PAGE)) : setTescs([]);
    };

    const changePage = (event, { activePage }) => {
        //check if there are filters applied
        setCurrentPage(activePage);
        if (!cols.has(COL.TSC)) {
            setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length / ENTRIES_PER_PAGE));
            setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
                .slice((activePage - 1) * ENTRIES_PER_PAGE, activePage * ENTRIES_PER_PAGE));
        } else {
            setDisplayedEntries(entriesWithOccurances.slice((activePage - 1) * ENTRIES_PER_PAGE, activePage * ENTRIES_PER_PAGE));
        }
    };


    const renderRows = () => {
        if (displayedEntries && !cols.has(COL.TSC)) {
            return displayedEntries.map((tesc) => (
                <TableEntry key={tesc.contractAddress}
                    tesc={tesc}
                    onTescsChange={handleChangeTescs}
                    cols={cols}
                />
            ));
        } else if (displayedEntries && cols.has(COL.TSC)) {
            return entriesWithOccurances.map((entry) => (
                <TableEntry key={entry.domain}
                    tesc={entry}
                    handleSearchInput={handleSearchInput}
                    handleSearchSubmit={handleSearchSubmit}
                    cols={cols}
                />));
        }
    };

    const handleSearchInput = domain => {
        setDomain(domain);
    };

    const handleSearchSubmit = (domain) => {
        handleLoading(true);
        if (domain === '') {
            handleIsExploringDomain(false);
            setTescs(entriesWithOccurances);
        } else {
            handleIsExploringDomain(true);
            setTescs(loadStorage(web3).filter(entry => entry.domain === domain).sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        }
        handleLoading(false);
    };

    const renderSearchBox = () => {
        return !cols.has(COL.REG) ? (<SearchBox
            onChange={handleSearchInput}
            onSubmit={handleSearchSubmit}
            value={domain}
            placeholder='www.mysite.com'
            label='Domain'
            icon='search'
            validInput={true}
        />) : null;
    };

    return (
        <>
            {renderSearchBox()}
            <Table color='purple'>
                <Table.Header active='true' style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        {!cols.has(COL.TSC) && <Table.HeaderCell>Address</Table.HeaderCell>}
                        <Table.HeaderCell>Domain</Table.HeaderCell>
                        {!cols.has(COL.TSC) && <Table.HeaderCell>Expiry</Table.HeaderCell>}
                        {cols.has(COL.TSC) && <Table.HeaderCell textAlign="center">Total Smart Contracts</Table.HeaderCell>}
                        <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
                        {cols.has(COL.REG) &&
                            <Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
                        }
                        {!cols.has(COL.TSC) &&
                            <Table.HeaderCell textAlign="center">Favourites
                            <Dropdown
                                    icon='filter'
                                    floating
                                    button
                                    className='icon dropdown-favourites'>
                                    <Dropdown.Menu>
                                        <Dropdown.Item icon='redo' text={!cols.has(COL.REG) && domain.length > 0 ? 'All (by domain)' : 'All'} onClick={() => showAllTescs(tescs)} />
                                        {!cols.has(COL.REG) && <Dropdown.Item icon='redo' text='All (reset)' onClick={() => handleIsExploringDomain(false)} />}
                                        <Dropdown.Item icon='heart' text='By favourite' onClick={showFavouriteTescs} />
                                        <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Table.HeaderCell>
                        }
                        {cols.has(COL.CA) &&
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
