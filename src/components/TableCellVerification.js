import React, { useState, useEffect, useRef, useContext } from 'react'
import axios from 'axios'

import AppContext from '../appContext';
import {
    isSha3Hash
} from '../utils/tesc';
import { Table, Popup, Loader, Icon } from 'semantic-ui-react';
import LinkTescInspect from './InternalLink';


function TableCellVerification(props) {
    const { web3 } = useContext(AppContext);
    const { domain, contractAddress, verified, handleVerified } = props
    const [isVerified, setIsVerified] = useState(verified);
    const contractAddress_ = useRef(contractAddress);


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
        return isVerified ? <Icon name="check" color="green" circular /> : <Icon name="delete" color="red" circular />;
        
    };

    useEffect(() => {
        (async () => {
            try {
                if(typeof verified !== 'boolean') {
                    console.log("verified", verified);
                    const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/verify/${web3.utils.toChecksumAddress(contractAddress_.current)}`);
                    setIsVerified(response.data.verified)
                }
            } catch (error) {
                console.log(error);
            }
        })();
    }, [verified, web3.utils]);


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
