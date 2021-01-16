import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    isSha3Hash
} from '../utils/tesc';
import { Table, Popup, Loader, Icon } from 'semantic-ui-react';
import LinkTescInspect from './InternalLink';

function TableCellVerification(props) {
    const { domain, contractAddress } = props
    const [verified, setVerified] = useState(null);

    const renderVerifResult = () => {
        if (domain && isSha3Hash(domain)) {
            return (<Popup
                inverted
                content='Domain is hashed, please inspect the contract to run the verification'
                trigger={<LinkTescInspect contractAddress={contractAddress} content='Domain required' />}
            />);
        }
        if (verified === null || verified === undefined) {
            return <Loader active inline />;
        }
        return verified ? <Icon name="check" color="green" circular /> : <Icon name="delete" color="red" circular />;
    };

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/isVerified/${contractAddress.toLowerCase()}`);
                console.log(response);
                setVerified(response.data.verified);
            } catch (error) {
                console.log(error);
                setVerified(false);
            }
        })();
    }, [contractAddress]);

    return (
        <Table.Cell textAlign="center">
            {renderVerifResult()}
        </Table.Cell>
    )
}

export default TableCellVerification
