import React, { useContext, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';

import { Table, Dropdown } from 'semantic-ui-react';

import AppContext from '../appContext';
import '../styles/Dashboard.scss';
import '../components/DashboardEntry'
import DashboardEntry from '../components/DashboardEntry';


const Dashboard = () => {
    const { web3 } = useContext(AppContext);
    const [tescs, setTescs] = useState([])

    useEffect(() => {



        //to lower case as accounts[0] is mixed-case
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)))

    }, [web3.currentProvider.selectedAddress])

    const renderRows = () => {
        if (!tescs)
            return []
        return tescs.map(({ contractAddress, domain, expiry, isFavourite }, index, tescs) => (
            <DashboardEntry key={contractAddress}
                contractAddress={contractAddress}
                domain={domain}
                expiry={expiry}
                isFavourite={isFavourite}
                currentAccount={web3.currentProvider.selectedAddress}
                index={index}
                tescs={tescs} />
        ));
    };

    const filterTescs = () => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)).filter(tesc => tesc.isFavourite === true))
    }

    const showAllTescs = () => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)))
    }

    return (
        <React.Fragment>
            <h2>Dashboard</h2>
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
        </React.Fragment>
    );
};

export default Dashboard;