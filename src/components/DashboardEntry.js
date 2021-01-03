import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import LinkTescInspect from '../components/InternalLink';
import {
    estimateRegistryAddCost,
    estimateRegistryRemoveCost
} from '../utils/tesc';

function DashboardEntry({ web3, contractAddress, domain, expiry, isFavourite, own, index, tescsIsInRegistry, contractRegistry, currentAccount, isInRegistry, assignSysMsg, handleBlocking }) {

    const [isInRegistryNew, setIsInRegistryNew] = useState(isInRegistry)
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false)
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0)
    const [costEstimatedRemove, setCostEstimatedRemove] = useState(0)

    useEffect(() => {
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, currentAccount]);

    useEffect(() => {
        const runEffect = async () => {
            if (!isInRegistryNew && own) {
                const estCostAdd = await estimateRegistryAddCost(web3, contractRegistry, domain, contractAddress);
                setCostEstimatedAdd(estCostAdd);
            } else if (isInRegistryNew && own) {
                const estCostRemove = await estimateRegistryRemoveCost(web3, contractRegistry, domain, contractAddress);
                setCostEstimatedRemove(estCostRemove);
            }
        }
        runEffect()
    }, [web3, contractAddress, contractRegistry, domain, isInRegistryNew, own])

    const addToRegistry = async () => {
        handleBlocking(true)
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (!isContractRegistered) {
                    await contractRegistry.methods.add(domain, contractAddress).send({ from: currentAccount, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            assignSysMsg(buildPositiveMsg({
                                header: 'Entry added to the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            setIsInRegistryNew(true)
                        });
                } else {
                    assignSysMsg(buildNegativeMsg({
                        header: 'Unable to add entry to the registry',
                        msg: `The address ${contractAddress} has already been added to the registry`
                    }))
                }
            } catch (err) {
                assignSysMsg(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to add entry to the registry',
                    msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'Some required input'} is empty`
                }))
            }
        }
        handleBlocking(false)
    }

    const removeFromRegistry = async () => {
        handleBlocking(true)
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (isContractRegistered) {
                    await contractRegistry.methods.remove(domain, contractAddress).send({ from: currentAccount, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            assignSysMsg(buildPositiveMsg({
                                header: 'Entry removed from the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully removed from the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            setIsInRegistryNew(false)
                        });
                } else {
                    assignSysMsg(buildPositiveMsg({
                        header: 'Unable to remove entry from the registry',
                        msg: `TLS-endorsed Smart Contract at address ${contractAddress} was not found in the registry`
                    }));
                }
            } catch (err) {
                assignSysMsg(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to remove entry from the registry',
                    msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'Some required input'} is invalid or empty`
                }))
            }
        }
        handleBlocking(false)
    }

    const addRemoveFavourites = () => {
        if (tescIsInFavourites) {
            tescsIsInRegistry[index]['isFavourite'] = false
            setTescIsInFavourites(false)
        } else {
            tescsIsInRegistry[index]['isFavourite'] = true
            setTescIsInFavourites(true)
        }
        localStorage.setItem(currentAccount, JSON.stringify(tescsIsInRegistry));
    }

    const renderRegistryButtons = () => {
        if (own) {
            return (
                isInRegistryNew ?
                    <Popup content={`Remove entry from the TeSC registry. This would cost around ${costEstimatedRemove.toFixed(5)} ETH.`}
                        trigger={<Button as="button" className="buttonAddRemove" color='red'
                            onClick={removeFromRegistry}><Icon name='minus' size='small' />Remove</Button>} />
                    :
                    <Popup content={`Add entry to the TeSC registry. This would cost around ${costEstimatedAdd.toFixed(5)} ETH.`}
                        trigger={<Button as="button" className="buttonAddRemove" color='green'
                            onClick={addToRegistry}><Icon name='plus' size='small' />Add</Button>} />
            )
        } else {
            return (
                isInRegistryNew ? <Popup content='In the registry'
                    trigger={<Icon name='checkmark' color='green' circular />} /> :
                    <Popup content='Not in the registry'
                        trigger={<Icon name='delete' color='red' circular />} />
            )
        }
    }

    const renderDomain = () => {
        if (domain.length === 64 && domain.split('.').length === 1) {
            return (<Popup content={domain} trigger={<i>hashed domain</i>} />)
        } else if (domain.length > 32) {
            return (<Popup on="click" content={domain} trigger={<i>{`${domain.substring(0, 6)}...${domain.substring(domain.length - 4, domain.length)}`}</i>} />)
        } else {
            return domain
        }
    }

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                <span className='contractAddressColumn'>
                    <LinkTescInspect contractAddress={contractAddress} />
                    {
                        own ? <Popup content="Your contract" trigger={<Icon className="userIcon" name="user" color="blue" circular />} /> : null
                    }
                </span>
            </Table.Cell>
            <Table.Cell>{renderDomain()}</Table.Cell>
            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
            <Table.Cell textAlign="center">
                <Icon name="delete" color="red" circular />
            </Table.Cell>
            <Table.Cell textAlign="center">
                {renderRegistryButtons()}
            </Table.Cell>
            {
                <Table.Cell textAlign="center">
                    <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                        trigger={<Button icon="heart" className={tescIsInFavourites ? "favourite" : "notFavourite"}
                            onClick={addRemoveFavourites} />} />
                </Table.Cell>
            }
        </Table.Row>
    );
}

export default DashboardEntry;
