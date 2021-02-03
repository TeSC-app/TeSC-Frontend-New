import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
    isSha3Hash
} from '../utils/tesc';
import { Table, Popup, Loader, Icon } from 'semantic-ui-react';
import LinkTescInspect from './InternalLink';

function TableCellVerification(props) {
    const { domain, contractAddress, verified, handleVerified, account, rowData, index } = props
    const [isVerified, setIsVerified] = useState(verified);
    const contractAddress_ = useRef(contractAddress);

    const updateLocalStorageWithVerified = useCallback((verified) => {
        localStorage.setItem(account.toLowerCase(), JSON.stringify(rowData.map((tesc, i) => i === index ? ({ ...tesc, verified: verified }) : tesc)))
    }, [account, index, rowData])

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
        //update local storage with verification status
        updateLocalStorageWithVerified(isVerified)
        return isVerified ? <Icon name="check" color="green" circular /> : <Icon name="delete" color="red" circular />;
        
    };

    useEffect(() => {
        (async () => {
            try {
                if(typeof verified !== 'boolean') {
                    console.log("verified", verified);
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
            if(typeof isVerified === 'boolean')
                handleVerified(isVerified)    
        })();
    }, [isVerified, handleVerified]);

    return (
        <Table.Cell textAlign="center">
            {renderVerifResult()}
        </Table.Cell>
    )
}

export default TableCellVerification
