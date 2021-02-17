import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button, Image } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import LinkTescInspect from './InternalLink';
import ButtonRegistryAddRemove from './ButtonRegistryAddRemove';
import {
    isSha3,
} from '../utils/tesc';
import { toggleFavourite, loadStorage } from '../utils/storage';
import { getRegistryContractInstance } from '../utils/registry';

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
    const { account, handleAccountChanged, web3 } = useContext(AppContext);
    const { contractAddress, domain, expiry, own, createdAt } = tesc;
    const [isFavourite, setIsFavourite] = useState(tesc.isFavourite);
    const [verified, setVerified] = useState(typeof preverified === 'boolean' ? preverified : null);

    const updateLocalStorageWithIsInRegistry = useCallback((isInRegistry) => {
        if (account)
            localStorage.setItem(account, JSON.stringify(loadStorage(account).map((tesc) => tesc.contractAddress === contractAddress ? ({ ...tesc, isInRegistry: isInRegistry }) : tesc)))
    }, [account, contractAddress])

    useEffect(() => {
        if (!cols.has(COL.TSC)) {
            const checkRegistry = async () => {
                try {
                    if (contractAddress) {
                        const isInRegistry = await getRegistryContractInstance(web3).methods.isContractRegistered(contractAddress).call()
                        updateLocalStorageWithIsInRegistry(isInRegistry)
                    }
                } catch (error) {
                    console.log(error)
                }
            }
            checkRegistry()
        }
    }, [contractAddress, cols, updateLocalStorageWithIsInRegistry, web3])

    useEffect(() => {
        if (hasAllColumns(cols)) handleAccountChanged(false); //???
        setIsFavourite(tesc.isFavourite);
    }, [tesc.isFavourite, handleAccountChanged, cols]);


    const handleChangeVerified = (verified) => {
        setVerified(verified);
    };

    const handleToggleFavourites = () => {
        toggleFavourite({ account, contractAddress, domain, expiry });
        onTescsChange();
        setIsFavourite(!isFavourite);
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
            <Popup inverted content={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                trigger={<Button icon={isFavourite ? 'heart' : 'heart outline'}
                    className={isFavourite ? "favourite-dashboard" : "not-favourite-dashboard"}
                    onClick={handleToggleFavourites} />} />
        );
    };

    const renderCreatedAt = () => {
        return typeof createdAt === 'undefined' ? moment.format('DD/MM/YYYY HH:mm') : moment.unix(parseInt(createdAt)).format('DD/MM/YYYY HH:mm')
    }

    const exploreDomain = () => {
        handleSearchInput(domain);
        handleSearchSubmit(domain);
    };

    const renderDomainForRegistryInspect = () => {
        return (isSha3(domain)) ?
            <Popup content={`${domain}`} trigger={
                cols.has(COL.TSC) ?
                    <Button basic size='medium' onClick={exploreDomain}>{`0x${domain.substring(0, 2)}...${domain.substring(domain.length - 2, domain.length)}`}</Button> :
                    <i>{`0x${domain.substring(0, 2)}...${domain.substring(domain.length - 2, domain.length)}`}</i>} />
            : cols.has(COL.TSC) ? <Button basic size='medium' onClick={exploreDomain}>{domain}</Button> : domain;
    };

    const renderPieChartForVerified = () => {
        if (!isSha3(domain)) {
            const data = [{ id: 'Valid', value: tesc.verifiedCount }, { id: 'Invalid', value: tesc.contractCount - tesc.verifiedCount }]
            return <PieChart loading={false} data={data} isRegistryInspect={true} />
        }
    }

    const renderTescContractCount = () => {
        return (<div className='smart-contracts'>{tesc.contractAddresses.map((entry, index, contractAddresses) =>
        (index <= 10 ? <Popup key={entry.contractAddress} content={entry.contractAddress} trigger={
            <Image src={!entry.verified && !isSha3(domain) ? '../images/smart-contract-icon-invalid.png' : entry.verified ?
                '../images/smart-contract-icon-valid.png' : '../images/smart-contract-icon.png'} className='smart-contracts__icon' alt='Smart Contract' size='mini' />} /> : index === 11 ? `...and ${contractAddresses.length - index} more` : null))}</div>)
    }


    return (
        <Table.Row key={contractAddress} >
            <Table.Cell >
                {!cols.has(COL.TSC) ?
                    <span>
                        {own && hasAllColumns(cols) ?
                            <Popup inverted content="You own this contract" trigger={<Icon className="user-icon" name="user" color="purple" />} /> :
                            <Popup inverted content="You favorited this contract" trigger={<Icon className="user-icon" name="star" color="yellow" />} />
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
                    <ButtonRegistryAddRemove contractAddress={contractAddress} domain={domain} isOwner={own} />
                </Table.Cell>
            }
            {cols.has(COL.FAV) &&
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
