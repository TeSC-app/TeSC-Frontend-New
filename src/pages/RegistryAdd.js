import React, { useState, useContext, useEffect, useCallback } from 'react'
import { Form, Button, Grid, Label, Table } from 'semantic-ui-react';
import AppContext from '../appContext';
import TeSCRegistry from '../ethereum/build/contracts/TeSCRegistry.json';
import ERCXXXImplementation from '../ethereum/build/contracts/ERCXXXImplementation.json';
import { buildNegativeMsg, buildPositiveMsg } from "../components/FeedbackMessage";
import {
    estimateRegistryAddCost
} from '../utils/tesc';
import moment from 'moment';
import SearchBox from '../components/SearchBox';
import '../styles/Registry.scss';
import PageHeader from '../components/PageHeader';

function RegistryAdd(props) {
    const { selectedAccount, handleBlockScreen } = props
    const { web3, showMessage } = useContext(AppContext)
    const [contractAddress, setContractAddress] = useState('')
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0)
    const [contractRegistry, setContractRegistry] = useState(undefined)
    const [tescContractOwner, setTescContractOwner] = useState(undefined)
    const [isContractRegistered, setIsContractRegistered] = useState(true)
    const [tescDomain, setTescDomain] = useState('')
    const [expiry, setExpiry] = useState('')
    const [validInput, setValidInput] = useState(false)
    const [inconsistentAddress, setInconsistentAddress] = useState(false)

    const checkInput = useCallback(async (account) => {
        const contractRegistry = new web3.eth.Contract(
            TeSCRegistry.abi,
            process.env.REACT_APP_REGISTRY_ADDRESS,
        );
        setContractRegistry(contractRegistry)
        try {
            const tescContract = new web3.eth.Contract(ERCXXXImplementation.abi, contractAddress)
            if (tescContract && contractAddress.length === 42 && tescContract._address) {
                const tescContractOwner = await tescContract.methods.owner.call().call()
                setTescContractOwner(tescContractOwner)
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                const tescDomain = await tescContract.methods.getDomain().call()
                setTescDomain(tescDomain)
                const tescExpiry = await tescContract.methods.getExpiry().call()
                setExpiry(tescExpiry)
                setInconsistentAddress(tescContractOwner !== account)
                if (tescDomain && tescContractOwner && tescContractOwner === account && !isContractRegistered) {
                    setValidInput(true)
                    const estCostAdd = await estimateRegistryAddCost(web3, account, contractRegistry, tescDomain, contractAddress);
                    setCostEstimatedAdd(estCostAdd);
                }
            } else {
                setValidInput(false)
                setTescDomain('')
                setExpiry('')
            }
        } catch (error) {
            setValidInput(false)
            setTescDomain('')
            setExpiry('')
        }
    }, [contractAddress, web3])

    //To predetermine the cost - only for valid input that would be able to be added to the registry
    useEffect(() => {
        const runEffect = async () => {
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', async (accounts) => {
                    try {
                        checkInput(accounts[0])
                    } catch (error) {
                        //console.log(error)
                        setValidInput(false)
                    }
                })
            }
            try {
                checkInput(selectedAccount)
            } catch (error) {
                //console.log(error)
                setValidInput(false)
            }
        }
        runEffect()
    }, [web3, selectedAccount, checkInput])

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (tescDomain.length > 0 && contractAddress) {
            handleBlockScreen(true)
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                if (!isContractRegistered) {
                    if (tescContractOwner && tescContractOwner === selectedAccount) {
                        await contractRegistry.methods.add(tescDomain, contractAddress).send({ from: selectedAccount, gas: '2000000' })
                            .on('receipt', async (txReceipt) => {
                                showMessage(buildPositiveMsg({
                                    header: 'Entry added to the registry',
                                    msg: `TLS-endorsed Smart Contract with domain ${tescDomain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                                }))
                            })
                    } else {
                        showMessage(buildNegativeMsg({
                            header: 'Unable to add entry to the registry',
                            msg: `The contract at address ${contractAddress} does not belong to your selected wallet address`
                        }))
                    }
                } else {
                    showMessage(buildNegativeMsg({
                        header: 'Unable to add entry to the registry',
                        msg: `The address ${contractAddress} has already been added to the registry`
                    }))
                }
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to add entry to the registry',
                    msg: `${!tescDomain ? 'Domain' : !contractAddress ? 'Contract address' : 'The input'} is empty or invalid`
                }))
            }
        }
        handleBlockScreen(false)
    };

    const handleChange = (contractAddress) => {
        setContractAddress(contractAddress)
    }

    const renderLabel = (errorCase, contractAddr = contractAddress) => {
        let reason;
        switch (errorCase) {
            case 'notFound': reason = 'Domain for this input not found'
                break
            case 'notOwner': reason = 'You are not the owner of the contract'
                break
            case 'alreadyRegistered': reason = 'Contract has already been registered'
                break
            case 'tooLong': reason = 'Contract address must be 42 characters long (prefix 0x and 40 hexadecimal digits)'
                break
            case 'notDone': reason = `Input should be 42 characters long. ${contractAddr.length <= 42 ? 42 - contractAddr.length : 0} left.`
                break
            default: reason = 'Wrong input'
        }
        return (<div className='cost-estimation-registry'><i className={errorCase !== 'notDone' ? 'error-registry-add' : ''}>{reason}</i></div>)
    }

    const renderStatus = () => {
        return validInput ? <Button disabled={!validInput} onClick={handleSubmit} floated='right' positive>Add entry</Button> :
            !tescDomain && contractAddress.length === 42 ? renderLabel('notFound') :
                tescDomain && inconsistentAddress && contractAddress.length === 42 ? renderLabel('notOwner') :
                    isContractRegistered && contractAddress.length === 42 ? renderLabel('alreadyRegistered') :
                        contractAddress.length > 42 ? renderLabel('tooLong') :
                            renderLabel('notDone', contractAddress)
    }

    return (
        <div>
            <Form>
                <PageHeader title='Add TeSC contract to registry' />
                <SearchBox
                    onChange={handleChange}
                    value={contractAddress}
                    placeholder='0x123456...'
                    label='Contract Address'
                    validInput={validInput} />
                <Grid className='table-status-add'>
                    <Grid.Row>
                        <Grid.Column>
                            <Table celled collapsing>
                                <Table.Body>
                                    {validInput ?
                                    <>
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
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Cost estimation</b>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Label as="span" tag className='cost-estimate-label'>
                                                    {costEstimatedAdd.toFixed(5)} <span className='cost-estimate-currency'>ETH</span>
                                                </Label></Table.Cell>
                                        </Table.Row></> : null
                                    }
                                    <Table.Row>
                                        <Table.Cell>
                                            <b>Status</b>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {renderStatus()}
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        </div>
    )
}

export default RegistryAdd
