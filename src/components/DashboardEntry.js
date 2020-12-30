import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button, Dimmer, Loader } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import LinkTescInspect from '../components/InternalLink';

function DashboardEntry({ contractAddress, domain, expiry, isFavourite, own, index, tescsIsInRegistry, contractRegistry, currentAccount, isInRegistry, assignSysMsg }) {

    const [isInRegistryNew, setIsInRegistryNew] = useState(isInRegistry)
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false)
    const [blocking, setBlocking] = useState(false);

    useEffect(() => {
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, currentAccount]);

    const addToRegistry = async () => {
        setBlocking(true)
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (!isContractRegistered) {
                    await contractRegistry.methods.add(domain, contractAddress).send({ from: currentAccount, gas: '2000000' });
                    assignSysMsg(buildPositiveMsg({
                        header: 'Entry added to the registry',
                        msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully added to the registry`
                    }));
                    setIsInRegistryNew(true)
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
        setBlocking(false)
    }

    const removeFromRegistry = async () => {
        setBlocking(true)
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call()
                if (isContractRegistered) {
                    await contractRegistry.methods.remove(domain, contractAddress).send({ from: currentAccount, gas: '2000000' });
                    assignSysMsg(buildPositiveMsg({
                        header: 'Entry removed from the registry',
                        msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully removed from the registry`
                    }));
                    setIsInRegistryNew(false)
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
        setBlocking(false)
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
                    <Popup content='Remove entry from the TeSC registry'
                        trigger={<Button as="div" className="buttonAddRemove" color='red'
                            onClick={removeFromRegistry}><Icon name='minus' />Remove</Button>} /> :
                    <Popup content='Add entry to the TeSC registry'
                        trigger={<Button as="div" className="buttonAddRemove" color='green'
                            onClick={addToRegistry}><Icon name='plus' />Add</Button>} />
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

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                <LinkTescInspect contractAddress={contractAddress} />
                {
                    own ? <Popup content="Own contract" trigger={<Icon className="userIcon" name="user" color="blue" circular />} /> : null
                }
            </Table.Cell>
            <Table.Cell>{domain}</Table.Cell>
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
            <Dimmer active={blocking}>
                <Loader indeterminate content='Waiting for transaction to finish...' />
            </Dimmer>
        </Table.Row>
    );
}

export default DashboardEntry;
