import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon } from 'semantic-ui-react';

import AppContext from '../appContext';
import TableEntry from './TableEntry';

const ENTRY_PER_PAGE = 7

function TableOverview(props) {
    const {
        isDashboard,
    } = props;

    const { web3, account, loadStorage } = useContext(AppContext);

    const [tescs, setTescs] = useState(account ? JSON.parse(localStorage.getItem(account.toLowerCase())) : []);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(tescs ? Math.ceil(tescs.length / ENTRY_PER_PAGE) : 0);
    const [filterOption, setFilterOption] = useState(0);
    const [displayedEntries, setDisplayedEntries] = useState([]);



    useEffect(() => {
        const init = async () => {
            try {
                setTescs(account ? loadStorage() : []);
                setDisplayedEntries(account && loadStorage() ? loadStorage().slice(0, ENTRY_PER_PAGE) : []);
                setTotalPages(Math.ceil(loadStorage() ? loadStorage().length / ENTRY_PER_PAGE : 0));
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
                const tescs = account ? loadStorage() : [];
                setTescs(tescs);
                console.log(error);
            }
        };
        init();
    }, [account, web3.eth, web3.eth.Contract, web3.eth.net, loadStorage]);


    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.localeCompare(tescB.createdAt)));
        localStorage.setItem(account.toLowerCase(), JSON.stringify(updatedTescs));
    };

    const showAllTescs = () => {
        setCurrentPage(1);
        setFilterOption(0);
        setTotalPages(Math.ceil(tescs.length / ENTRY_PER_PAGE));
        localStorage.getItem(account.toLowerCase()) ? setDisplayedEntries(loadStorage().slice(0, ENTRY_PER_PAGE)) : setTescs([]);
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
        setTotalPages(Math.ceil(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc).length / ENTRY_PER_PAGE));
        setDisplayedEntries(tescs.filter(tesc => filterOption === 1 ? tesc.isFavourite === true : filterOption === 2 ? tesc.own === true : tesc)
            .slice((activePage - 1) * ENTRY_PER_PAGE, activePage * ENTRY_PER_PAGE));
    };


    const renderRows = () => {
        if (displayedEntries) return displayedEntries.map((tesc) => (
            <TableEntry key={tesc.contractAddress}
                tesc={tesc}
                onTescsChange={handleChangeTescs}
                isDashboard={isDashboard}
            />
        ));
    };

    return (
        <>
            <Table color='purple'>
                <Table.Header active style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        <Table.HeaderCell>Address</Table.HeaderCell>
                        <Table.HeaderCell>Domain</Table.HeaderCell>
                        <Table.HeaderCell>Expiry</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
                        {isDashboard &&
                            <Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
                        }
                        <Table.HeaderCell textAlign="center">Favourites
                            <Dropdown
                                icon='filter'
                                floating
                                button
                                className='icon dropdown-favourites'>
                                <Dropdown.Menu>
                                    <Dropdown.Item icon='redo' text='All' onClick={showAllTescs} />
                                    <Dropdown.Item icon='heart' text='By favourite' onClick={showFavouriteTescs} />
                                    <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                </Dropdown.Menu>
                            </Dropdown>
                        </Table.HeaderCell>
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
