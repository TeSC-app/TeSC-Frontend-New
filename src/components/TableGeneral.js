import React from 'react'
import { Table, Dropdown } from 'semantic-ui-react';
import { makeStyles } from '@material-ui/core/styles';
import Pagination from '@material-ui/lab/Pagination';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            marginTop: theme.spacing(2),
        },
        display: 'flex',
        justifyContent: 'center'
    },
}));

function TableGeneral(props) {
    const classesPagination = useStyles();
    const {
        renderRows,
        showAllTescs,
        showFavouriteTescs,
        showOwnTescs,
        isDashboard,
        changePage,
        currentPage,
        totalPages
    } = props

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
                                    className='icon dropdownFavourites'>
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
            <div className={classesPagination.root}>
                <Pagination count={totalPages} page={currentPage} shape="rounded" onChange={changePage} />
            </div>
        </>
    )
}

export default TableGeneral
