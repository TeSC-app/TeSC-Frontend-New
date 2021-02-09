import React, { useState, useContext, useEffect, useRef, useCallback } from 'react'
import { Button, Grid, Icon, Label, Table } from 'semantic-ui-react';
import AppContext from '../appContext';
import ERCXXXImplementation from '../ethereum/build/contracts/ERCXXXImplementation.json';
import { buildNegativeMsg, buildPositiveMsg } from "../components/FeedbackMessage";
import {
    estimateRegistryActionCost
} from '../utils/registry';
import { getRegistryContractInstance } from '../utils/registry';

import moment from 'moment';
import SearchBox from '../components/SearchBox';
import PageHeader from '../components/PageHeader';

function RegistryAdd() {
    const { web3, showMessage, handleBlockScreen, account } = useContext(AppContext)
    const [contractAddress, setContractAddress] = useState('')
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0)
    const [tescContractOwner, setTescContractOwner] = useState(undefined)
    const [isContractRegistered, setIsContractRegistered] = useState(true)
    const [tescDomain, setTescDomain] = useState('')
    const [expiry, setExpiry] = useState('')
    const [validInput, setValidInput] = useState(false)
    const [inconsistentAddress, setInconsistentAddress] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [added, setAdded] = useState(false)

    const registryContract = useRef(getRegistryContractInstance(web3))

    const clearValues = () => {
        setValidInput(false)
        setTescDomain('')
        setExpiry('')
        setCostEstimatedAdd(0)
    }

    const checkInput = useCallback(async (account) => {
        try {
            const tescContract = new web3.eth.Contract(ERCXXXImplementation.abi, contractAddress)
            if (tescContract && contractAddress.length === 42 && tescContract._address) {
                const tescContractOwner = await tescContract.methods.owner.call().call()
                setTescContractOwner(tescContractOwner)
                const isContractRegistered = await registryContract.current.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                const tescDomain = await tescContract.methods.getDomain().call()
                setTescDomain(tescDomain)
                const tescExpiry = await tescContract.methods.getExpiry().call()
                setExpiry(tescExpiry)
                setInconsistentAddress(tescContractOwner.toLowerCase() !== account)
                if (tescDomain && tescContractOwner && tescContractOwner.toLowerCase() === account && !isContractRegistered) {
                    setValidInput(true)
                    const estCostAdd = await estimateRegistryActionCost(isContractRegistered, {web3, contractAddress});
                    setCostEstimatedAdd(estCostAdd);
                }
            } else {
                clearValues()
            }
        } catch (error) {
            clearValues()
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
                checkInput(account)
            } catch (error) {
                //console.log(error)
                setValidInput(false)
            }
        }
        runEffect()
    }, [web3, account, checkInput])

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (tescDomain.length > 0 && contractAddress) {
            handleBlockScreen(true)
            try {
                const isContractRegistered = await registryContract.current.methods.isContractRegistered(contractAddress).call()
                setIsContractRegistered(isContractRegistered)
                if (!isContractRegistered) {
                    if (tescContractOwner && tescContractOwner.toLowerCase() === account) {
                        await registryContract.current.methods.add(tescDomain, contractAddress).send({ from: account, gas: '2000000' })
                            .on('receipt', async (txReceipt) => {
                                showMessage(buildPositiveMsg({
                                    header: 'Entry added to the registry',
                                    msg: `TLS-endorsed Smart Contract with domain ${tescDomain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                                }))
                            })
                        setAdded(true)
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
        setSubmitted(false)
    }

    const renderLabel = (inputCase, contractAddr = contractAddress) => {
        let reason;
        switch (inputCase) {
            case 'correct': reason = 'Your input is correct.'
                break
            case 'notFound': reason = 'Domain for this input not found.'
                break
            case 'notOwner': reason = 'You are not the owner of the contract.'
                break
            case 'alreadyRegistered': reason = 'Contract has already been registered.'
                break
            case 'tooLong': reason = 'Contract address must be 42 characters long (prefix 0x and 40 hexadecimal digits).'
                break
            case 'notDone': reason = `Input should be 42 characters long. ${contractAddr.length <= 42 ? 42 - contractAddr.length : 0} left.`
                break
            default: reason = 'Wrong input'
        }
        return (
            <div className='cost-estimation-registry'>
                <Icon name={inputCase === 'correct' ? 'thumbs up outline' : 'thumbs down outline'}
                    color={inputCase === 'correct' ? 'green' : 'red'} />
                <Label basic className={inputCase !== 'correct' ? 'error-registry-add' : ''}>
                    {reason}
                </Label>
            </div>)
    }

    const renderStatus = () => {
        return !tescDomain && contractAddress.length === 42 ? renderLabel('notFound') :
            tescDomain && inconsistentAddress && contractAddress.length === 42 ? renderLabel('notOwner') :
                isContractRegistered && contractAddress.length === 42 ? renderLabel('alreadyRegistered') :
                    contractAddress.length > 42 ? renderLabel('tooLong') :
                        validInput ? renderLabel('correct') : renderLabel('notDone')
    }

    const handleInputSubmit = (e) => {
        e.preventDefault()
        setContractAddress(contractAddress)
        setSubmitted(true)
    }

    const renderExpiry = () => {
        return expiry !== '' ? moment.unix(parseInt(expiry)).format('DD/MM/YYYY') : <Label as='span' basic className='error-registry-add'>Empty expiry</Label>
    }

    const renderDomain = () => {
        return tescDomain !== '' ? tescDomain : <Label as='span' basic className='error-registry-add'>Empty domain</Label>
    }

    const renderButton = () => {
        return !added ? <Button disabled={!validInput} onClick={handleSubmit} floated='left' positive>Add entry</Button> : 'Entry added'
    }

    const renderCostEstimation = () => {
        return (<Label as="span" tag className='cost-estimate-label-registry'>
            {costEstimatedAdd.toFixed(5)} <span className='cost-estimate-currency'>ETH</span>
        </Label>)
    }

    return (
        <div>
            <PageHeader title='Add TeSC contract to registry' />
            <SearchBox
                onChange={handleChange}
                value={contractAddress}
                placeholder='0x123456...'
                label='Contract Address'
                validInput={validInput}
                onSubmit={handleInputSubmit}
            />
            <Grid className='table-status-add'>
                <Grid.Row>
                    <Grid.Column>
                        <Table celled collapsing>
                            <Table.Body>
                                {validInput || submitted ?
                                    <>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Domain</b>
                                            </Table.Cell>
                                            <Table.Cell>{renderDomain()}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Expiry</b>
                                            </Table.Cell>
                                            <Table.Cell>{renderExpiry()}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Cost estimation</b>
                                            </Table.Cell>
                                            <Table.Cell>{renderCostEstimation()}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Status</b>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {renderStatus()}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>
                                                <b>Add TeSC</b>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {renderButton()}
                                            </Table.Cell>
                                        </Table.Row>
                                    </> : null
                                }
                            </Table.Body>
                        </Table>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default RegistryAdd
