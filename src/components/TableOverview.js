import React from 'react'
import { Table, Dropdown, Pagination, Icon } from 'semantic-ui-react';
import TableEntry from './TableEntry';

function TableOverview(props) {
    const {
        showAllTescs,
        showFavouriteTescs,
        showOwnTescs,
        isDashboard,
        changePage,
        currentPage,
        totalPages,
        displayedEntries,
        selectedAccount,
        contractRegistry,
        onTescsChange,
        web3,
        hasAccountChanged,
        handleAccountChanged
    } = props


    const tableEntryProps = {
        selectedAccount,
        contractRegistry,
        onTescsChange,
        web3,
        hasAccountChanged,
        handleAccountChanged,
        isDashboard
    }

    const renderRows = () => {
        if (displayedEntries) return displayedEntries.map((tesc) => (
            <TableEntry key={tesc.contractAddress}
                tesc={tesc}
                {...tableEntryProps}
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
                        {isDashboard ? <><Table.HeaderCell textAlign="center">Registry</Table.HeaderCell>
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
                            <Table.HeaderCell>Created At</Table.HeaderCell></> : null}
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
    )
}

export default TableOverview
