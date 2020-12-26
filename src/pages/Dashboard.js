import React, { useContext, useEffect, useState } from 'react';
import { Table } from 'semantic-ui-react';
import AppContext from '../appContext';
import '../styles/Dashboard.scss';
import '../components/DashboardEntry'
import DashboardEntry from '../components/DashboardEntry';


const Dashboard = () => {
    const { web3 } = useContext(AppContext);
    const [currentAccount, setCurrentAccount] = useState(undefined)
    const [tescs, setTescs] = useState([])

    useEffect(() => {
        const init = async () => {
            const accounts = await web3.eth.getAccounts();
            setCurrentAccount(accounts[0])
            //to lower case as accounts[0] is mixed-case
            setTescs(JSON.parse(localStorage.getItem(accounts[0].toLowerCase())))
        }
        init()
    }, [setCurrentAccount, web3.eth])

    const renderRows = () => {
        console.log(tescs)
        if (!tescs)
            return []
        return tescs.map(({ contractAddress, domain, expiry, isFavourite }, index, tescs) => (
            <DashboardEntry key={contractAddress}
                contractAddress={contractAddress}
                domain={domain}
                expiry={expiry}
                isFavourite={isFavourite}
                currentAccount={currentAccount}
                index={index}
                tescs={tescs} />
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
                        <Table.HeaderCell textAlign="center">Favourites</Table.HeaderCell>
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