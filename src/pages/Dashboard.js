import React, { useContext, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';
import { Table, Grid } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistryImplementation from '../ethereum/build/contracts/TeSCRegistryImplementation.json';
import '../styles/Dashboard.scss'
import DashboardEntry from '../components/DashboardEntry';
import FeedbackMessage from '../components/FeedbackMessage'

const Dashboard = () => {
    const { web3 } = useContext(AppContext);
    const [tescsIsInRegistry, setTescsIsInRegistry] = useState([])
    const [contractRegistry, setContractRegistry] = useState()
    const [sysMsg, setSysMsg] = useState(null)

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const assignSysMsgFromEntry = (sysMsg) => {
        setSysMsg(sysMsg)
    }

    useEffect(() => {
        const init = async () => {
            try {
                const networkId = await web3.eth.net.getId();
                const deployedNetworkRegistry = TeSCRegistryImplementation.networks[networkId];
                const contractRegistry = new web3.eth.Contract(
                    TeSCRegistryImplementation.abi,
                    deployedNetworkRegistry && deployedNetworkRegistry.address,
                );
                setContractRegistry(contractRegistry)
                const tescs = JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress));
                if (tescs) {
                    const result = await Promise.all(tescs.map(async ({ contractAddress, domain, expiry }) => ({ contractAddress: contractAddress, domain: domain, expiry: expiry, isInRegistry: await contractRegistry.methods.isContractRegistered(contractAddress).call() })))
                    setTescsIsInRegistry(result)
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        init()
    }, [web3.currentProvider.selectedAddress, web3.eth.Contract, web3.eth.net])


    const renderRows = () => {
        if (!tescsIsInRegistry)
            return []

        return tescsIsInRegistry.map(({ contractAddress, domain, expiry, isInRegistry }) => (
            <DashboardEntry key={contractAddress}
                contractAddress={contractAddress}
                domain={domain}
                expiry={expiry}
                isInRegistry={isInRegistry}
                currentAccount={web3.currentProvider.selectedAddress}
                contractRegistry={contractRegistry}
                assignSysMsg={assignSysMsgFromEntry} />
        ));
    };

    return (
        <React.Fragment>
            <Grid>
                <Grid.Row style={{ height: '100%' }}>
                    <Grid.Column width={6}>
                        <h2>Dashboard</h2>
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <div style={{ float: 'right' }}>
                            {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}
                        </div>
                    </Grid.Column>
                </Grid.Row>

            </Grid>
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