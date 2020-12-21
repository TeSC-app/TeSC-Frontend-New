import React, { useState, useContext } from 'react'
import { Form, Input, Label, Button, Message } from 'semantic-ui-react';
import AppContext from '../appContext';
import keccak256 from 'keccak256';
import TeSCRegistryImplementation from '../ethereum/build/contracts/TeSCRegistryImplementation.json';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RegistryAdd() {
    const { web3 } = useContext(AppContext);
    const [domain, setDomain] = useState('')
    const [contractAddress, setContractAddress] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (domain && contractAddress) {
            try {
                const account = web3.currentProvider.selectedAddress;
                const networkId = await web3.eth.net.getId();
                const deployedNetworkRegistry = TeSCRegistryImplementation.networks[networkId];
                const registry = new web3.eth.Contract(
                    TeSCRegistryImplementation.abi,
                    deployedNetworkRegistry && deployedNetworkRegistry.address,
                );
                const isContractRegistered = await registry.methods.isContractRegistered(contractAddress).call()
                if (!isContractRegistered) {
                    await registry.methods.add(`0x${keccak256(domain).toString('hex')}`, contractAddress).send({ from: account, gas: '2000000' });
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

    };

    return (
        <div>
            <Form>
                <h2>Add TeSC contract to registry</h2>
                <Form.Group widths='equal'>
                    <Form.Field>
                        <label>Domain</label>
                        <Input
                            value={domain}
                            placeholder='www.mysite.com'
                            onChange={e => setDomain(e.target.value)}
                        />
                    </Form.Field>

                    <Form.Field>
                        <label>Contract address</label>
                        <Input
                            value={contractAddress}
                            placeholder='0x123456...'
                            onChange={e => setContractAddress(e.target.value)}
                        />
                    </Form.Field>

                </Form.Group>
                <Button disabled={!domain || !contractAddress} onClick={handleSubmit} floated='right' positive>Add entry</Button>
            </Form>
            <ToastContainer />
        </div>
    )
}

export default RegistryAdd
