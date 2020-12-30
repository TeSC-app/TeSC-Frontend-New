import React, { useState, useContext, useEffect } from 'react'
import { Form, Input, Button, Grid, Dimmer, Loader, Label } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistryImplementation from '../ethereum/build/contracts/TeSCRegistryImplementation.json';
import ERCXXXImplementation from '../ethereum/build/contracts/ERCXXXImplementation.json';
import FeedbackMessage, { buildNegativeMsg, buildPositiveMsg } from "../components/FeedbackMessage";
import {
    estimateRegistryAddCost
} from '../utils/tesc';

function RegistryAdd() {
    const { web3 } = useContext(AppContext)
    const [domain, setDomain] = useState('')
    const [contractAddress, setContractAddress] = useState('')
    const [sysMsg, setSysMsg] = useState(null)
    const [blocking, setBlocking] = useState(false)
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0)
    const [contractRegistry, setContractRegistry] = useState(undefined)
    const [tescContractOwner, setTescContractOwner] = useState(undefined)
    const [isContractRegistered, setIsContractRegistered] = useState(true)
    const [tescDomain, setTescDomain] = useState('bla')
    const [validInput, setValidInput] = useState(false)

    //To predetermine the cost - only for valid input that would be able to be added to the registry
    useEffect(() => {
        const runEffect = async () => {
            const networkId = await web3.eth.net.getId();
            const deployedNetworkRegistry = TeSCRegistryImplementation.networks[networkId];
            const contractRegistry = new web3.eth.Contract(
                TeSCRegistryImplementation.abi,
                deployedNetworkRegistry && deployedNetworkRegistry.address,
            );
            setContractRegistry(contractRegistry)
            try {
                const tescContract = new web3.eth.Contract(ERCXXXImplementation.abi, contractAddress)
                const tescContractOwner = await tescContract.methods.owner.call().call()
                setTescContractOwner(tescContractOwner)
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                const tescDomain = await tescContract.methods.getDomain().call()
                setTescDomain(tescDomain)
                //tescContracOwner is mixed-case and selected wallet address is lower case
                if (domain === tescDomain && tescContractOwner && tescContractOwner.toLowerCase() === web3.currentProvider.selectedAddress && !isContractRegistered) {
                    setValidInput(true)
                    const estCostAdd = await estimateRegistryAddCost(web3, contractRegistry, domain, contractAddress);
                    setCostEstimatedAdd(estCostAdd);
                }
            } catch (error) {
                //console.log(error)
                setValidInput(false)
            }
        }
        runEffect()
    }, [web3, contractAddress, domain])

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (domain && contractAddress) {
            setBlocking(true)
            try {
                const account = web3.currentProvider.selectedAddress;
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                if (!isContractRegistered) {
                    if (tescContractOwner && tescContractOwner.toLowerCase() === web3.currentProvider.selectedAddress) {
                        await contractRegistry.methods.add(domain, contractAddress).send({ from: account, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            setSysMsg(buildPositiveMsg({
                                header: 'Entry added to the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }))
                        })
                    } else {
                        setSysMsg(buildNegativeMsg({
                            header: 'Unable to add entry to the registry',
                            msg: `The contract at address ${contractAddress} does not belong to your selected wallet address`
                        }))
                    }
                } else {
                    setSysMsg(buildNegativeMsg({
                        header: 'Unable to add entry to the registry',
                        msg: `The address ${contractAddress} has already been added to the registry`
                    }))
                }
            } catch (err) {
                setSysMsg(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to add entry to the registry',
                    msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'The input'} is empty or invalid`
                }))
            }
        }
        setBlocking(false)
    };

    return (
        <div>
            <Form>
                <Grid>
                    <Grid.Row style={{ height: '100%' }}>
                        <Grid.Column width={6}>
                            <h2>Add TeSC contract to registry</h2>
                        </Grid.Column>
                        <Grid.Column width={10}>
                            <div style={{ float: 'right' }}>
                                {sysMsg && <FeedbackMessage message={sysMsg} handleDismiss={handleDismissMessage} />}
                            </div>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
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
                <Button disabled={!validInput} onClick={handleSubmit} floated='right' positive>Add entry</Button>
                { domain === tescDomain && tescContractOwner &&
                 tescContractOwner.toLowerCase() === web3.currentProvider.selectedAddress && 
                 !isContractRegistered && validInput && (
                    <Label as="span" tag className='costEstimateLabel'>
                        {costEstimatedAdd.toFixed(5)} <span className='costEstimateCurrencyETH'>ETH</span>
                    </Label>)
                }
            </Form>
            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </div>
    )
}

export default RegistryAdd
