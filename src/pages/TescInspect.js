import React, { useState, useContext } from 'react';
import { Input, Table, Checkbox } from 'semantic-ui-react';

import BitSet from 'bitset';
import moment from 'moment';

import AppContext from '../appContext'
import { FLAG_POSITIONS } from '../utils/tesc';
import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';


const TeSCInspect = () => {
    const { web3 } = useContext(AppContext);
    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState('');
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0'));

    const handleAddressEntered = async (address) => {
        try {
            setContractAddress(address);
            if (address) {
                const contract = new web3.eth.Contract(TeSC.abi, address);
                setDomain(await contract.methods.getDomain().call());
                setExpiry(await contract.methods.getExpiry().call());
                setSignature(await contract.methods.getSignature().call());

                const flagHex = await contract.methods.getFlags().call();
                console.log("Flaghex", flagHex);
                setFlags(new BitSet(flagHex));
            }
        } catch (err) {
            console.log(err);
        }
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) => (
            <div key={i} style={{ paddingBottom: '5px' }}>
                <Checkbox
                    checked={!!flags.get(i)}
                    label={flagName}
                    disabled
                />
            </div>
        ));
    };

    return (
        <div>
            <h2>Lookup TeSC</h2>
            <h4>TeSC Address</h4>
            <div>
                <Input
                    value={contractAddress}
                    placeholder='0x254dffcd3277c0b1660f6d42efbb754edababc2b'
                    onChange={e => handleAddressEntered(e.target.value)}
                    size='large'
                    style={{ width: '60%' }}
                />

            </div>
            {
                domain && expiry && signature && flags && (
                    <Table basic='very' celled collapsing>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>
                                    <b>Domain</b>
                                </Table.Cell>
                                <Table.Cell>{domain}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>
                                    <b>Expiry</b>
                                </Table.Cell>
                                <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>
                                    <b>Flags</b>
                                </Table.Cell>
                                <Table.Cell>
                                    {renderFlagCheckboxes()}
                                </Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>
                                    <b>Signature</b>
                                </Table.Cell>
                                <Table.Cell style={{ wordBreak: 'break-all' }}>
                                    {signature}
                                </Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                )
            }
        </div >
    );
};

export default TeSCInspect;