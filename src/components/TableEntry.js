import React, { useState, useEffect, useContext, useCallback } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button, Image } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import LinkTescInspect from './InternalLink';
import {
    estimateRegistryAddCost,
    estimateRegistryRemoveCost,
} from '../utils/tesc';
import TableCellVerification from './TableCellVerification';
import PieChart from '../components/analytics/PieChart';

function TableEntry(props) {
    const {
        tesc,
        onTescsChange,
        isDashboard,
        isExploringDomain,
        handleSearchInput,
        handleSearchSubmit
    } = props;
    const { web3, showMessage, account, handleBlockScreen, registryContract, hasAccountChanged, handleAccountChanged, loadStorage } = useContext(AppContext);
    const { contractAddress, domain, expiry, isFavourite, own, createdAt } = tesc;
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false);
    const [costEstimatedAdd, setCostEstimatedAdd] = useState(0);
    const [costEstimatedRemove, setCostEstimatedRemove] = useState(0);
    const [verified, setVerified] = useState(null);
    //registry buttons need this state to get rerendered
    const [isInRegistry, setIsInRegistry] = useState(false)
    const [loading, setLoading] = useState(true)

    const updateLocalStorageWithIsInRegistry = useCallback((isInRegistry) => {
        if (account)
            localStorage.setItem(account.toLowerCase(), JSON.stringify(loadStorage().map((tesc) => tesc.contractAddress === contractAddress ? ({ ...tesc, isInRegistry: isInRegistry }) : tesc)))
    }, [loadStorage, account, contractAddress])

    useEffect(() => {
        if (isExploringDomain) {
            const checkRegistry = async () => {
                try {
                    if (contractAddress) {
                        const isInRegistry = await registryContract.methods.isContractRegistered(contractAddress).call()
                        setIsInRegistry(isInRegistry)
                        updateLocalStorageWithIsInRegistry(isInRegistry)
                        setLoading(false)
                    }
                } catch (error) {
                    console.log(error)
                    setLoading(false)
                }
            }
            checkRegistry()
        }
    }, [contractAddress, registryContract, isExploringDomain, updateLocalStorageWithIsInRegistry])

    useEffect(() => {
        if (isDashboard) handleAccountChanged(false);
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, handleAccountChanged, isDashboard]);

    useEffect(() => {
        const runEffect = async () => {
            if (!isInRegistry && own && account && !hasAccountChanged && !loading) {
                const estCostAdd = registryContract ? await estimateRegistryAddCost(web3, account, registryContract, contractAddress) : 0;
                setCostEstimatedAdd(estCostAdd);
            } else if (isInRegistry && own && account && !hasAccountChanged && !loading) {
                const estCostRemove = registryContract ? await estimateRegistryRemoveCost(web3, account, registryContract, domain, contractAddress) : 0;
                setCostEstimatedRemove(estCostRemove);
            }
        };
        runEffect();
    }, [web3, contractAddress, account, registryContract, domain, isInRegistry, own, hasAccountChanged, loading]);

    const handleVerified = (verified) => {
        setVerified(verified);
    };

    const addToRegistry = async () => {
        handleBlockScreen(true);
        if (domain && contractAddress) {
            try {
                console.log(contractAddress)
                const isContractRegistered = await registryContract.methods.isContractRegistered(contractAddress).call();
                console.log(isContractRegistered)
                if (!isContractRegistered) {
                    await registryContract.methods.add(contractAddress).send({ from: account, gas: '3000000' })
                        .on('receipt', async (txReceipt) => {
                            showMessage(buildPositiveMsg({
                                header: 'Entry added to the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully added to the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            onTescsChange({ contractAddress, domain, expiry, isFavourite, own, createdAt });
                            setIsInRegistry(true);
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
                    msg: err.message
                }));
                console.log("Error", err);
            }
        } else {
            showMessage(buildNegativeMsg({
                header: 'Unable to add entry to the registry',
                msg: `${!domain ? 'Domain' : !contractAddress ? 'Contract address' : 'Some required input'} is empty`
            }));
        }
        handleBlockScreen(false);
    };

    const removeFromRegistry = async () => {
        handleBlockScreen(true);
        if (domain && contractAddress) {
            try {
                const isContractRegistered = await registryContract.methods.isContractRegistered(contractAddress).call();
                if (isContractRegistered) {
                    await registryContract.methods.remove(domain, contractAddress).send({ from: account, gas: '2000000' })
                        .on('receipt', async (txReceipt) => {
                            showMessage(buildPositiveMsg({
                                header: 'Entry removed from the registry',
                                msg: `TLS-endorsed Smart Contract with domain ${domain} and ${contractAddress} was successfully removed from the registry.
                                You paid ${(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether')).toFixed(5)} ether.`
                            }));
                            onTescsChange({ contractAddress, domain, expiry, isFavourite, own, createdAt });
                            setIsInRegistry(false);
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
        onTescsChange({ contractAddress, domain, expiry, isFavourite, own, createdAt, verified: tesc.verified })
    };

    const renderRegistryButtons = () => {
        if (own) {
            return (
                isInRegistry ?
                    <Popup inverted content={`Remove entry from the TeSC registry. This would cost around ${costEstimatedRemove.toFixed(5)} ETH.`}
                        trigger={<Button basic color='red' onClick={removeFromRegistry} content='Remove' icon='delete' className='button-remove' />} />
                    :
                    <Popup inverted content={`Add entry to the TeSC registry. This would cost around ${costEstimatedAdd.toFixed(5)} ETH.`}
                        trigger={<Button basic disabled={!verified && !(domain.length === 64 && domain.split('.').length === 1)} color='blue' onClick={addToRegistry} content='Add' icon='plus' className='button-add' />}
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
        if (domain.length === 66 && domain.split('.').length === 1) {
            return (<Popup inverted content={domain} trigger={<i>{'< hashed >'}</i>} />);
        } else if (domain.length > 32) {
            return (<Popup inverted on="click" content={domain} trigger={<i className='cursor-pointer'>{`${domain.substring(0, 6)}...${domain.substring(domain.length - 4, domain.length)}`}</i>} />);
        } else {
            return domain;
        }
    };

    const tableCellVerifProps = { domain, contractAddress, verified, handleVerified, isDashboard: true, account, loadStorage };

    const renderFavourites = () => {
        return (
            <Popup inverted content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                trigger={<Button icon={tescIsInFavourites ? 'heart' : 'heart outline'}
                    className={tescIsInFavourites ? "favourite-dashboard" : "not-favourite-dashboard"}
                    onClick={addRemoveFavourites} />} />
        );
    };

    const renderCreatedAt = () => {
        return typeof createdAt === 'undefined' ? moment.format('DD/MM/YYYY HH:mm') : moment.unix(parseInt(createdAt)).format('DD/MM/YYYY HH:mm')
    }

    const exploreDomain = () => {
        handleSearchInput(domain)
        handleSearchSubmit(domain)
    }

    const renderDomainForRegistryInspect = () => {
        return (domain.length === 66 && domain.split('.').length === 1) ?
            <Popup content={`0x${domain}`} trigger={
                !isExploringDomain ?
                    <Button basic size='medium' onClick={exploreDomain}>{`${domain.substring(0, 4)}...${domain.substring(domain.length - 2, domain.length)}`}</Button> :
                    <i>{`${domain.substring(0, 4)}...${domain.substring(domain.length - 2, domain.length)}`}</i>} />
            : !isExploringDomain ? <Button basic size='medium' onClick={exploreDomain}>{domain}</Button> : domain
    }

    const renderPieChartForVerified = () => {
        const data = [{ id: 'Valid', value: tesc.verifiedCount }, { id: 'Invalid', value: tesc.contractCount - tesc.verifiedCount }]
        return <PieChart loading={false} data={data} isRegistryInspect={true} />
    }

    const renderTescContractCount = () => {
        return (<div className='smart-contracts'>{tesc.contractAddresses.map((contractAddress) => (<Popup key={contractAddress} content={contractAddress} trigger={<Image src='../images/smart-contract-icon.png' className='smart-contracts__icon' alt='Smart Contract' size='mini' />} />))}</div>)
    }

    const renderOwnIcon = () => {
        return (own && isDashboard ? <Popup inverted content="You own this contract" trigger={<Icon className="user-icon" name="user" color="blue" circular />} /> : null)
    }

    const renderContractAddress = () => {
        return (<LinkTescInspect contractAddress={contractAddress} />)
    }

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                {isExploringDomain ?
                    <span className='contract-address-column'>
                        {renderOwnIcon()}
                        {renderContractAddress()}
                    </span> : renderDomainForRegistryInspect()
                }
            </Table.Cell>
            <Table.Cell textAlign='center'>{isDashboard ? renderDomain() : isExploringDomain ? renderDomainForRegistryInspect() : renderTescContractCount()}</Table.Cell>
            <Table.Cell textAlign='center'>{isExploringDomain ? moment.unix(parseInt(expiry)).format('DD/MM/YYYY') : renderPieChartForVerified()}</Table.Cell>
            {isDashboard && <TableCellVerification {...tableCellVerifProps} />}
            {isExploringDomain && !isDashboard && <Table.Cell textAlign="center">
                {tesc.verified ? <Icon name="check" color="green" circular /> : <Icon name="delete" color="red" circular />}
            </Table.Cell> }
            {isDashboard &&
                <Table.Cell textAlign="center">
                    {renderRegistryButtons()}
                </Table.Cell>
            }
            { isExploringDomain &&
                <Table.Cell textAlign="center">
                    {renderFavourites()}
                </Table.Cell>
            }
            {isDashboard &&
                <Table.Cell>{renderCreatedAt()}</Table.Cell>
            }

        </Table.Row>
    );
}

export default TableEntry;
