import React, { useState, useEffect, useContext } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';

import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import LinkTescInspect from '../components/InternalLink';
import {
    estimateRegistryAddCost,
    estimateRegistryRemoveCost,
} from '../utils/tesc';
import TableCellVerification from './TableCellVerification';

function DashboardEntry(props) {
    const { selectedAccount, tesc, contractRegistry, onTescsChange, hasAccountChanged, handleAccountChanged } = props
    const { web3, showMessage, handleBlockScreen } = useContext(AppContext);
    const { contractAddress, domain, expiry, isFavourite, own, isInRegistry, createdAt } = tesc
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false);
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0);
    const [costEstimatedRemove, setCostEstimatedRemove] = useState(0);
    const [verified, setVerified] = useState(null)
    //registry buttons need this state to get rerendered
    const [isInRegistryUpdated, setIsInRegistryUpdated] = useState(isInRegistry)

    useEffect(() => {
        handleAccountChanged(false)
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, handleAccountChanged]);

    useEffect(() => {
        const runEffect = async () => {
            if (!isInRegistryUpdated && own && selectedAccount && !hasAccountChanged) {
                const estCostAdd = contractRegistry ? await estimateRegistryAddCost(web3, selectedAccount, contractRegistry, domain, contractAddress) : 0;
                setCostEstimatedAdd(estCostAdd);
            } else if (isInRegistryUpdated && own && selectedAccount && !hasAccountChanged) {
                const estCostRemove = contractRegistry ? await estimateRegistryRemoveCost(web3, selectedAccount, contractRegistry, domain, contractAddress) : 0;
                setCostEstimatedRemove(estCostRemove);
            }
        };
        runEffect();
    }, [web3, contractAddress, selectedAccount, contractRegistry, domain, isInRegistryUpdated, own, hasAccountChanged]);

    const handleVerified = (verified) => {
        setVerified(verified)
    }

    const addToRegistry = async () => {
        handleBlockScreen(true);
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call();
                if (!isContractRegistered) {
                    await contractRegistry.methods.add(domain, contractAddress).send({ from: selectedAccount, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            showMessage(buildPositiveMsg({
                                header: 'Entry added to the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            onTescsChange({ contractAddress, domain, expiry, isFavourite, own, isInRegistry: true, createdAt });
                            setIsInRegistryUpdated(true)
                        });
                } else {
                    showMessage(buildNegativeMsg({
                        header: 'Unable to add entry to the registry',
                        msg: `The address ${contractAddress} has already been added to the registry`
                    }));
                }
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to add entry to the registry',
                    msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'Some required input'} is empty`
                }));
                console.log(err);
            }
        }
        handleBlockScreen(false);
    };

    const removeFromRegistry = async () => {
        handleBlockScreen(true);
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await contractRegistry.methods.isContractRegistered(contractAddress).call();
                if (isContractRegistered) {
                    await contractRegistry.methods.remove(domain, contractAddress).send({ from: selectedAccount, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            showMessage(buildPositiveMsg({
                                header: 'Entry removed from the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully removed from the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            onTescsChange({ contractAddress, domain, expiry, isFavourite, own, isInRegistry: false, createdAt });
                            setIsInRegistryUpdated(false)
                        });
                } else {
                    showMessage(buildNegativeMsg({
                        header: 'Unable to remove entry from the registry',
                        msg: `TLS-endorsed Smart Contract at address ${contractAddress} was not found in the registry`
                    }));
                }
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to remove entry from the registry',
                    msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'Some required input'} is invalid or empty`
                }));
            }
        };
        handleBlockScreen(false);
    };

    const addRemoveFavourites = () => {
        let isFavourite;
        if (tescIsInFavourites) {
            isFavourite = false;
            setTescIsInFavourites(false);
        } else {
            isFavourite = true;
            setTescIsInFavourites(true);
        }
        onTescsChange({ contractAddress, domain, expiry, isFavourite: isFavourite, own, isInRegistry, createdAt });
    };

    const renderRegistryButtons = () => {
        if (own) {
            return (
                isInRegistryUpdated ?
                    <Popup inverted content={`Remove entry from the TeSC registry. This would cost around ${costEstimatedRemove.toFixed(5)} ETH.`}
                        trigger={<Button basic color='red' onClick={removeFromRegistry} content='Remove' icon='delete' className='button-remove' />} />
                    :
                    <Popup inverted content={`Add entry to the TeSC registry. This would cost around ${costEstimatedAdd.toFixed(5)} ETH.`}
                        trigger={<Button basic disabled={!verified} color='blue' onClick={addToRegistry} content='Add' icon='plus' className='button-add' />}
                    />
            );
        } else {
            return (
                isInRegistry ? <Popup inverted content='In the registry'
                    trigger={<Icon name='checkmark' color='green' circular />} /> :
                    <Popup inverted content='Not in the registry'
                        trigger={<Icon name='delete' color='red' circular />} />
            );
        }
    };

    const renderDomain = () => {
        if (domain.length === 64 && domain.split('.').length === 1) {
            return (<Popup inverted content={domain} trigger={<i>{'< hashed >'}</i>} />);
        } else if (domain.length > 32) {
            return (<Popup inverted on="click" content={domain} trigger={<i className='cursor-pointer'>{`${domain.substring(0, 6)}...${domain.substring(domain.length - 4, domain.length)}`}</i>} />);
        } else {
            return domain;
        }
    };

    const tableCellVerifProps = { domain, contractAddress, verified, handleVerified, isDashboard: true }

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                <span className='contract-address-column'>
                    {
                        own ? <Popup inverted content="You own this contract" trigger={<Icon className="user-icon" name="user" color="blue" circular />} /> : null
                    }
                    <LinkTescInspect contractAddress={contractAddress} />
                </span>
            </Table.Cell>
            <Table.Cell>{renderDomain()}</Table.Cell>
            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
            <TableCellVerification {...tableCellVerifProps} />
            <Table.Cell textAlign="center">
                {renderRegistryButtons()}
            </Table.Cell>
            {
                <Table.Cell textAlign="center">
                    <Popup inverted content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                        trigger={<Button icon={tescIsInFavourites ? 'heart' : 'heart outline'}
                            className={tescIsInFavourites ? "favourite-dashboard" : "not-favourite-dashboard"}
                            onClick={addRemoveFavourites} />} />
                </Table.Cell>
            }
            <Table.Cell>{createdAt}</Table.Cell>
        </Table.Row>
    );
}

export default DashboardEntry;
