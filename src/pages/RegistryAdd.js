import React, { useState, useContext, useEffect } from 'react'
import { Form, Button, Grid, Dimmer, Loader, Label, Table } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import ERCXXXImplementation from '../ethereum/build/contracts/ERCXXXImplementation.json';
import FeedbackMessage, { buildNegativeMsg, buildPositiveMsg } from "../components/FeedbackMessage";
import {
    estimateRegistryAddCost
} from '../utils/tesc';
import moment from 'moment';
import SearchBox from '../components/SearchBox';

function RegistryAdd({ selectedAccount }) {
    const { web3 } = useContext(AppContext)
    const [contractAddress, setContractAddress] = useState('')
    const [sysMsg, setSysMsg] = useState(null)
    const [blocking, setBlocking] = useState(false)
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0)
    const [contractRegistry, setContractRegistry] = useState(undefined)
    const [tescContractOwner, setTescContractOwner] = useState(undefined)
    const [isContractRegistered, setIsContractRegistered] = useState(true)
    const [tescDomain, setTescDomain] = useState('')
    const [expiry, setExpiry] = useState('')
    const [validInput, setValidInput] = useState(false)
    const [inconsistentAddress, setInconsistentAddress] = useState(false)

    //To predetermine the cost - only for valid input that would be able to be added to the registry
    useEffect(() => {
        const runEffect = async () => {
            const contractRegistry = new web3.eth.Contract(
                TeSCRegistry.abi,
                process.env.REACT_APP_REGISTRY_ADDRESS,
            );
            setContractRegistry(contractRegistry)
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', async (accounts) => {
                    try {
                        const tescContract = new web3.eth.Contract(ERCXXXImplementation.abi, contractAddress)
                        const tescContractOwner = await tescContract.methods.owner.call().call()
                        setTescContractOwner(tescContractOwner)
                        const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                        setIsContractRegistered(isContractRegistered)
                        const tescDomain = await tescContract.methods.getDomain().call()
                        setTescDomain(tescDomain)
                        const tescExpiry = await tescContract.methods.getExpiry().call()
                        setExpiry(tescExpiry)
                        setInconsistentAddress(tescContractOwner !== accounts[0])
                        if (tescDomain && tescContractOwner && tescContractOwner === accounts[0] && !isContractRegistered) {
                            setValidInput(true)
                            const estCostAdd = await estimateRegistryAddCost(web3, accounts[0], contractRegistry, tescDomain, contractAddress);
                            setCostEstimatedAdd(estCostAdd);
                        }
                    } catch (error) {
                        //console.log(error)
                        setValidInput(false)
                    }
                })
            }
            try {
                const tescContract = new web3.eth.Contract(ERCXXXImplementation.abi, contractAddress)
                const tescContractOwner = await tescContract.methods.owner.call().call()
                setTescContractOwner(tescContractOwner)
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                const tescDomain = await tescContract.methods.getDomain().call()
                setTescDomain(tescDomain)
                const tescExpiry = await tescContract.methods.getExpiry().call()
                setExpiry(tescExpiry)
                setInconsistentAddress(tescContractOwner !== selectedAccount)
                if (tescDomain && tescContractOwner && tescContractOwner === selectedAccount && !isContractRegistered) {
                    setValidInput(true)
                    const estCostAdd = await estimateRegistryAddCost(web3, selectedAccount, contractRegistry, tescDomain, contractAddress);
                    setCostEstimatedAdd(estCostAdd);
                }
            } catch (error) {
                //console.log(error)
                setValidInput(false)
            }
        }
        runEffect()
    }, [web3, selectedAccount, contractAddress])

    const handleDismissMessage = () => {
        setSysMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (tescDomain.length > 0 && contractAddress) {
            setBlocking(true)
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                if (!isContractRegistered) {
                    if (tescContractOwner && tescContractOwner === selectedAccount) {
                        await contractRegistry.methods.add(tescDomain, contractAddress).send({ from: selectedAccount, gas: '2000000' })
                            .on('receipt', async (txReceipt) => {
                                setSysMsg(buildPositiveMsg({
                                    header: 'Entry added to the registry',
                                    msg: `TLS-endorsed Smart Contract with domain ${tescDomain} and ${contractAddress} was successfully added to the registry.
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
                    msg: `${!tescDomain ? 'Domain' : !contractAddress ? 'Contract address' : 'The input'} is empty or invalid`
                }))
            }
        }
        setBlocking(false)
    };

    const handleChange = (contractAddress) => {
        setContractAddress(contractAddress)
    }

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
                <SearchBox
                    onChange={handleChange}
                    value={contractAddress}
                    placeholder='0x123456...'
                    label='Contract Address'
                    validInput={validInput} />
                {validInput ?
                    <Grid>
                        <Grid.Row>
                            <Grid.Column>
                                <Table basic='very' celled collapsing>
                                    <Table.Body>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Domain</b>
                                            </Table.Cell>
                                            <Table.Cell>{tescDomain}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Expiry</b>
                                            </Table.Cell>
                                            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                </Table>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid> : null
                }
                <Button disabled={!validInput} onClick={handleSubmit} floated='right' positive>Add entry</Button>
                {tescContractOwner &&
                    tescContractOwner === selectedAccount &&
                    !isContractRegistered && validInput && (
                        <div className='costEstimationRegistry'>
                            <span>Cost estimation:  </span>
                            <Label as="span" tag className='costEstimateLabel'>
                                {costEstimatedAdd.toFixed(5)} <span className='costEstimateCurrencyETH'>ETH</span>
                            </Label>
                        </div>)
                }
                {
                    !tescDomain && contractAddress.length === 42 ? <div className='costEstimationRegistry'><Label className='errorRegistryAdd'>Domain for this contract not found</Label></div> :
                        tescDomain && inconsistentAddress && contractAddress.length === 42 ? <div className='costEstimationRegistry'><Label className='errorRegistryAdd'>You are not the owner of the contract</Label></div> :
                            isContractRegistered && contractAddress.length === 42 ? <div className='costEstimationRegistry'><Label className='errorRegistryAdd'>Contract has already been registered</Label></div> :
                                validInput ? null :
                                    contractAddress.length > 42 ? <div className='costEstimationRegistry'><Label className='errorRegistryAdd'>Contract address must be 42 characters long (prefix 0x and 40 hexadecimal digits)</Label></div> : <div className='costEstimationRegistry'><Label>Input should be 42 characters long. {contractAddress.length <= 42 ? 42 - contractAddress.length : 0} left.</Label></div>
                }
            </Form>
            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </div>
    )
}

export default RegistryAdd
