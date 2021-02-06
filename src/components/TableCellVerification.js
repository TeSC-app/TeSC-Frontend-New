import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
    isSha3Hash
} from '../utils/tesc';
import { Table, Popup, Loader, Icon } from 'semantic-ui-react';
import LinkTescInspect from './InternalLink';

function TableCellVerification(props) {
    const { domain, contractAddress, verified, handleVerified, account, loadStorage } = props
    const [isVerified, setIsVerified] = useState(verified);
    const contractAddress_ = useRef(contractAddress);

    const updateLocalStorageWithVerified = useCallback((verified) => {
        if (account && loadStorage())
            localStorage.setItem(account.toLowerCase(), JSON.stringify(loadStorage().map((tesc) => tesc.contractAddress === contractAddress ? ({ ...tesc, verified: verified }) : tesc)))
    }, [loadStorage, account, contractAddress])

    const renderVerifResult = () => {
        if (domain && isSha3Hash(domain)) {
            return (<Popup
                inverted
                content='Domain is hashed, please inspect the contract to run the verification'
                trigger={<LinkTescInspect contractAddress={contractAddress} content='Domain required' />}
            />);
        }
        if (isVerified === null || isVerified === undefined) {
            return <Loader active inline />;
        }
        //update local storage with verification status only for dashboard elements
        updateLocalStorageWithVerified(isVerified)
        return isVerified ? <Icon name="check" color="green" circular /> : <Icon name="delete" color="red" circular />;

    };

    useEffect(() => {
        (async () => {
            try {
                if(typeof verified !== 'boolean') {
                    const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/isVerified/${contractAddress_.current.toLowerCase()}`);
                    setIsVerified(response.data.verified)
                    updateLocalStorageWithVerified(response.data.verified)
                }
            } catch (error) {
                console.log(error);
            }
        })();
    }, [verified, updateLocalStorageWithVerified]);


    useEffect(() => {
        (async () => {
            if (typeof isVerified === 'boolean')
                handleVerified(isVerified)
            updateLocalStorageWithVerified(isVerified)
        })();
    }, [isVerified, handleVerified, updateLocalStorageWithVerified]);

    return (
        <Table.Cell textAlign="center">
            {renderVerifResult()}
        </Table.Cell>
    )
}

export default TableCellVerification
