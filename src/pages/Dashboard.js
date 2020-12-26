import React, { useContext, useEffect, useState } from 'react';
import 'react-day-picker/lib/style.css';
import { Table, Icon, Button, Popup } from 'semantic-ui-react';
import moment from 'moment';
import AppContext from '../appContext';
import TeSCRegistryImplementation from '../ethereum/build/contracts/TeSCRegistryImplementation.json';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Dashboard.scss'

const Dashboard = () => {
    const { web3 } = useContext(AppContext);
    const [tescsIsInRegistry, setTescsIsInRegistry] = useState([])
    const [contractRegistry, setContractRegistry] = useState()

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

    const addToRegistry = async (domain, contractAddress) => {
        if (domain && contractAddress) {
            try {
                const account = web3.currentProvider.selectedAddress;
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (!isContractRegistered) {
                    await contractRegistry.methods.add(web3.utils.keccak256(domain), contractAddress).send({ from: account, gas: '2000000' });
                    toast.success('Entry added', {
                        position: "bottom-center",
                        autoClose: 3000,
                        hideProgressBar: false
                    });
                } else {
                    toast.error('Contract address already exists in the registry', {
                        position: "bottom-center",
                        autoClose: 3000,
                        hideProgressBar: false
                    });
                }
            } catch (err) {
                toast.error('Could not add entry', {
                    position: "bottom-center",
                    autoClose: 3000,
                    hideProgressBar: false
                });
                console.log(err);
            }
        }
    }

    const removeFromRegistry = async (domain, contractAddress) => {
        if (domain && contractAddress) {
            try {
                const account = web3.currentProvider.selectedAddress;
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (isContractRegistered) {
                    await contractRegistry.methods.remove(web3.utils.keccak256(domain), contractAddress).send({ from: account, gas: '2000000' });
                    toast.success('Entry removed successfully', {
                        position: "bottom-center",
                        autoClose: 3000,
                        hideProgressBar: false
                    });
                } else {
                    toast.error('Contract address not found in the registry', {
                        position: "bottom-center",
                        autoClose: 3000,
                        hideProgressBar: false
                    });
                }
            } catch (err) {
                toast.error('Could not remove entry', {
                    position: "bottom-center",
                    autoClose: 3000,
                    hideProgressBar: false
                });
                console.log(err);
            }
        }
    }


    const renderRows = () => {
        console.log(tescsIsInRegistry)
        if (!tescsIsInRegistry)
            return []

        return tescsIsInRegistry.map(({ contractAddress, domain, expiry, isInRegistry }) => (
            <Table.Row key={contractAddress}>
                <Table.Cell>{contractAddress}</Table.Cell>
                <Table.Cell>{domain}</Table.Cell>
                <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                <Table.Cell textAlign="center">
                    <Icon name="delete" color="red" circular />
                </Table.Cell>
                <Table.Cell textAlign="center">
                    {
                        isInRegistry ?
                            <Popup content='Remove entry from the TeSC registry'
                                trigger={<Button as="div" className="buttonAddRemove" color='red'
                                    onClick={() => removeFromRegistry(domain, contractAddress)}><Icon name='minus' />Remove</Button>} /> :
                            <Popup content='Add entry to the TeSC registry'
                                trigger={<Button as="div" className="buttonAddRemove" color='green'
                                    onClick={() => addToRegistry(domain, contractAddress)}><Icon name='plus' />Add</Button>} />
                    }
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
            <ToastContainer />
        </React.Fragment>
    );
};

export default Dashboard;