import React, { useState, useEffect, useRef, useCallback, useContext } from 'react'
import axios from 'axios'

import AppContext from '../appContext';
import {
    isSha3
} from '../utils/tesc';
import { loadStorage } from '../utils/storage';

import { Table, Popup, Loader, Icon } from 'semantic-ui-react';
import LinkTescInspect from './InternalLink';


function TableCellVerification({ domain, contractAddress, verified, handleChangeVerified }) {
    const { web3, account } = useContext(AppContext);
    const [isVerified, setIsVerified] = useState(verified);
    const contractAddress_ = useRef(contractAddress);

    const updateLocalStorageWithVerified = useCallback((verified) => {
        if (account)
            localStorage.setItem(account, JSON.stringify(loadStorage(account).map((tesc) => tesc.contractAddress === contractAddress ? ({ ...tesc, verified: verified }) : tesc)))
    }, [account, contractAddress])

    const renderVerifResult = () => {
        if (domain && isSha3(domain)) {
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
                    console.log("verified", verified);
                    const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/verify/${web3.utils.toChecksumAddress(contractAddress_.current)}`);
                    setIsVerified(response.data.verified)
                    updateLocalStorageWithVerified(response.data.verified)
                }
            } catch (error) {
                console.log(error);
            }
        })();
    }, [verified, web3.utils, updateLocalStorageWithVerified]);


    useEffect(() => {
        (async () => {
            if(typeof isVerified === 'boolean')
                handleChangeVerified(isVerified)   
            updateLocalStorageWithVerified(isVerified)
        })();
    }, [isVerified, handleChangeVerified, updateLocalStorageWithVerified]);

    return (
        <Table.Cell textAlign="center">
            {renderVerifResult()}
        </Table.Cell>
    )
}

export default TableCellVerification
