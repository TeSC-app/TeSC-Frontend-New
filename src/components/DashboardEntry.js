import React, { useState, useEffect } from 'react'
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Table, Icon, Popup, Button } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";

function DashboardEntry({ contractAddress, domain, expiry, isFavourite, index, tescsIsInRegistry, contractRegistry, currentAccount, isInRegistry, assignSysMsg }) {

    const [isInRegistryNew, setIsInRegistryNew] = useState(isInRegistry)
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false)

    useEffect(() => {
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false)
    }, [isFavourite, setTescIsInFavourites, currentAccount])

    const addToRegistry = async () => {
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
    }

    const removeFromRegistry = async () => {
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
    }

    const addRemoveFavourites = () => {
        if(tescIsInFavourites) {
            tescs[index]['isFavourite'] = false
            setTescIsInFavourites(false)
        } else {
            tescs[index]['isFavourite'] = true
            setTescIsInFavourites(true)
        }
        localStorage.setItem(currentAccount.toLowerCase(), JSON.stringify(tescs));
    }

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                <li>
                    <Link to={{
                        pathname: "/tesc/inspect",
                        state: {
                            contractAddressFromDashboard: contractAddress
                        }
                    }}>{contractAddress}</Link>
                </li>
            </Table.Cell>
            <Table.Cell>{domain}</Table.Cell>
            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
            <Table.Cell textAlign="center">
                <Icon name="delete" color="red" circular />
            </Table.Cell>
            <Table.Cell textAlign="center">
                {
                    isInRegistryNew ?
                        <Popup content='Remove entry from the TeSC registry'
                            trigger={<Button as="div" className="buttonAddRemove" color='red'
                                onClick={removeFromRegistry}><Icon name='minus' />Remove</Button>} /> :
                        <Popup content='Add entry to the TeSC registry'
                            trigger={<Button as="div" className="buttonAddRemove" color='green'
                                onClick={addToRegistry}><Icon name='plus' />Add</Button>} />
                }
            </Table.Cell>
            </Table.Cell>
            {
                <Table.Cell textAlign="center">
                    <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                        trigger={<Button icon="heart" className={tescIsInFavourites ? "favourite" : "notFavourite"}
                            onClick={addRemoveFavourites} />} />
                </Table.Cell>
            }
        </Table.Row>
    )
}

export default DashboardEntry
