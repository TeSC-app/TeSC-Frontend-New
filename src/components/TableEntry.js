import React, { useState, useEffect, useContext, useRef } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button, Image } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "./FeedbackMessage";
import LinkTescInspect from './InternalLink';
import {
    isSha3,
} from '../utils/tesc';
import { estimateRegistryActionCost } from '../utils/registry';
import { getRegistryContractInstance } from '../utils/registry';
import { addRemoveEntry } from '../utils/registry';
import TableCellVerification from './TableCellVerification';
import PieChart from '../components/analytics/PieChart';
import { COL, hasAllColumns } from './TableOverview';

function TableEntry(props) {
    const {
        tesc,
        preverified,
        onTescsChange,
        handleSearchInput,
        handleSearchSubmit,
        cols
    } = props;
    const { web3, showMessage, account, handleBlockScreen, hasAccountChanged, handleAccountChanged } = useContext(AppContext);
    const { contractAddress, domain, expiry, isFavourite, own, createdAt } = tesc;
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false);
    const [costEstimatedRegistryAction, setCostEstimatedRegistryAction] = useState(0);
    const [verified, setVerified] = useState(typeof preverified === 'boolean' ? preverified : null);
    //registry buttons need this state to get rerendered
    const [isInRegistry, setIsInRegistry] = useState(false);
    const [loading, setLoading] = useState(true);
    const registryContract = useRef(getRegistryContractInstance(web3));


    useEffect(() => {
        if (!cols.has(COL.TSC)) {
            const checkRegistry = async () => {
                try {
                    const isInRegistry = await registryContract.current.methods.isContractRegistered(contractAddress).call();
                    setIsInRegistry(isInRegistry);
                    setLoading(false);
                } catch (error) {
                    console.log(error);
                    setLoading(false);
                }
            };
            checkRegistry();
        }
    }, [contractAddress, cols]);

    useEffect(() => {
        if (hasAllColumns(cols)) handleAccountChanged(false); //???
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, handleAccountChanged, cols]);

    useEffect(() => {
        const runEffect = async () => {
            if (own && account && !hasAccountChanged && !loading) {
                const cost = await estimateRegistryActionCost(isInRegistry, { web3, contractAddress, domain });
                console.log('$$$$$$', cost);
                setCostEstimatedRegistryAction(cost);
            }
        };
        runEffect();
    }, [web3, contractAddress, account, domain, isInRegistry, own, hasAccountChanged, loading]);

    const handleChangeVerified = (verified) => {
        setVerified(verified);
    };


    const handleRegistryAction = async (isAdding) => {
        handleBlockScreen(true);
        try {
            const cb = (message) => {
                showMessage(buildPositiveMsg(message));
                onTescsChange({ contractAddress, domain, expiry, isFavourite, own, createdAt });
                setIsInRegistry(!isInRegistry);
            };

            await addRemoveEntry(isAdding, { web3, domain, contractAddress, cb });

        } catch (error) {
            showMessage(buildNegativeMsg({
                header: 'Unable to add entry to the registry',
                msg: error.message
            }));
        }
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
        onTescsChange({ contractAddress, domain, expiry, isFavourite, own, createdAt });
    };

    const renderRegistryButtons = () => {
        if (own) {
            return (
                <Popup inverted
                    content={`${isInRegistry ? 'Remove entry from' : 'Add entry to'} the TeSC registry. This would cost around ${costEstimatedRegistryAction.toFixed(5)} ETH.`}
                    trigger={
                        <Button
                            basic
                            color={isInRegistry ? 'red' : 'blue'}
                            onClick={() => handleRegistryAction(!isInRegistry)}
                            disabled={!isInRegistry && !verified && !(domain.length === 64 && domain.split('.').length === 1)}
                            content={isInRegistry ? 'Remove' : 'Add'}
                            icon={isInRegistry ? 'delete' : 'plus'}
                            className='button-remove'
                        />
                    }
                />
            );
        } else {
            return (
                <Popup inverted content={isInRegistry ? 'In the registry' : 'Not in the registry'}
                    trigger={<Icon name={isInRegistry ? 'checkmark' : 'delete'} color={isInRegistry ? 'green' : 'red'} circular />} />
            );
        }
    };

    const renderDomain = () => {
        if (isSha3(domain)) {
            return (<Popup inverted content={domain} trigger={<i>{'< hashed >'}</i>} />);
        } else if (domain.length > 32) {
            return (<Popup inverted on="click" content={domain} trigger={<i className='cursor-pointer'>{`${domain.substring(0, 6)}...${domain.substring(domain.length - 4, domain.length)}`}</i>} />);
        } else {
            return domain;
        }
    };

    const tableCellVerifProps = { domain, contractAddress, verified, handleChangeVerified };

    const renderFavourites = () => {
        return (
            <Popup inverted content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                trigger={<Button icon={tescIsInFavourites ? 'heart' : 'heart outline'}
                    className={tescIsInFavourites ? "favourite-dashboard" : "not-favourite-dashboard"}
                    onClick={addRemoveFavourites} />} />
        );
    };

    const renderCreatedAt = () => {
        return typeof createdAt === 'undefined' ? moment().format('DD/MM/YYYY HH:mm') : createdAt;
    };

    const exploreDomain = () => {
        handleSearchInput(domain);
        handleSearchSubmit(domain);
    };

    const renderDomainForRegistryInspect = () => {
        return (domain.length === 64 && domain.split('.').length === 1) ?
            <Popup content={`0x${domain}`} trigger={
                cols.has(COL.TSC) ?
                    <Button basic size='medium' onClick={exploreDomain}>{`0x${domain.substring(0, 2)}...${domain.substring(domain.length - 2, domain.length)}`}</Button> :
                    <i>{`0x${domain.substring(0, 2)}...${domain.substring(domain.length - 2, domain.length)}`}</i>} />
            : cols.has(COL.TSC) ? <Button basic size='medium' onClick={exploreDomain}>{domain}</Button> : domain;
    };

    const renderPieChartForVerified = () => {
        const data = [{ id: 'Valid', value: tesc.verifiedCount }, { id: 'Invalid', value: tesc.contractCount - tesc.verifiedCount }];
        return <PieChart loading={false} data={data} isRegistryInspect={true} />;
    };

    const renderTescContractCount = () => {
        return (<div className='smart-contracts'>{tesc.contractAddresses.map((contractAddress) => (<Popup key={contractAddress} content={contractAddress} trigger={<Image src='../images/smart-contract-icon.png' className='smart-contracts__icon' alt='Smart Contract' size='mini' />} />))}</div>);
    };

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                {!cols.has(COL.TSC) ?
                    <span className='contract-address-column'>
                        {
                            own && hasAllColumns(cols) ? <Popup inverted content="You own this contract" trigger={<Icon className="user-icon" name="user" color="blue" circular />} /> : null
                        }
                        <LinkTescInspect contractAddress={contractAddress} />
                    </span> : renderDomainForRegistryInspect()
                }
            </Table.Cell>
            <Table.Cell textAlign='center'>{hasAllColumns(cols) ? renderDomain() : !cols.has(COL.TSC) && !hasAllColumns(cols) ? renderDomainForRegistryInspect() : renderTescContractCount()}</Table.Cell>
            <Table.Cell textAlign='center'>{!cols.has(COL.TSC) ? moment.unix(parseInt(expiry)).format('DD/MM/YYYY') : renderPieChartForVerified()}</Table.Cell>
            {!cols.has(COL.TSC) && <TableCellVerification {...tableCellVerifProps} />}
            {cols.has(COL.REG) &&
                <Table.Cell textAlign="center">
                    {renderRegistryButtons()}
                </Table.Cell>
            }
            {!cols.has(COL.TSC) &&
                <Table.Cell textAlign="center">
                    {renderFavourites()}
                </Table.Cell>
            }
            {cols.has(COL.CA) &&
                <Table.Cell>{renderCreatedAt()}</Table.Cell>
            }

        </Table.Row>
    );
}

export default TableEntry;
