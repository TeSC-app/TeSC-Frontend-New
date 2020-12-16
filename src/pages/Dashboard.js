import React from 'react';
import 'react-day-picker/lib/style.css';

import { Button, Table, Icon } from 'semantic-ui-react';
import moment from 'moment';


const Dashboard = () => {

    const renderRows = () => {
        const tescs = JSON.parse(localStorage.getItem('tescs')).tescs;
        console.log("LS GET", tescs);
        if (tescs) {
            const rows = [];
            for (const { contractAddress, domain, expiry } of tescs) {
                rows.push((
                    <Table.Row>
                        <Table.Cell>{contractAddress}</Table.Cell>
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
            }
            return rows;
        }
        return [];
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
                        <Table.HeaderCell textAlign="center">Verify</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Register</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {renderRows()}
                </Table.Body>
            </Table>
        </React.Fragment>
    );
};

export default Dashboard;