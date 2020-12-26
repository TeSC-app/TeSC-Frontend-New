import React, { useContext, } from 'react';
import 'react-day-picker/lib/style.css';

import { Table, Icon } from 'semantic-ui-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

import AppContext from '../appContext';


const Dashboard = () => {
    const { web3 } = useContext(AppContext);

    const renderRows = () => {
        const tescs = JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress));
        if(!tescs)
            return []

        return tescs.map(({ contractAddress, domain, expiry }) => (
            <Table.Row key={contractAddress}>
                <Table.Cell>
                    <li>
                        <Link to={{
                            pathname: "/tesc/inspect",
                            state: {
                                contractAddressFromDashboard: contractAddress
                            }
                        }}>{contractAddress}</Link>
                    </li>
                </Table.Cell>
                <Table.Cell>{domain}</Table.Cell>
                <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                <Table.Cell textAlign="center">
                    <Icon name="delete" color="red" circular />
                </Table.Cell>
                <Table.Cell textAlign="center">
                    <Icon name="delete" color="red" circular />
                </Table.Cell>
            </Table.Row>
        ));
    };

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