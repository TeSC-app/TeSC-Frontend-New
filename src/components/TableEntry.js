import React, { useState, useEffect, useContext, useRef } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button, Image } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';
import AppContext from '../appContext';
import LinkTescInspect from './InternalLink';
import ButtonRegistryAddRemove from './ButtonRegistryAddRemove';
import {
    isSha3,
} from '../utils/tesc';
import { toggleFavourite } from '../utils/storage';

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
    const { account, handleAccountChanged } = useContext(AppContext);
    const { contractAddress, domain, expiry, own, createdAt } = tesc;
    const [isFavourite, setIsFavourite] = useState(tesc.isFavourite);
    const [verified, setVerified] = useState(typeof preverified === 'boolean' ? preverified : null);



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
