import React, { useState, useContext } from 'react';
import { Input, Form, Label, Button } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import moment from 'moment';
import BitSet from 'bitset';

import 'react-day-picker/lib/style.css';

import AppContext from '../appContext';
import {
    predictContractAddress,
    generateSignature,
    flagsTo24BytesHex,
    FLAG_POSITIONS,
} from '../utils/tesc';


const TeSCNew = () => {
    const { web3 } = useContext(AppContext);

    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState(null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [tesc, setTesc] = useState(null);

    const [domainHashed, setDomainHashed] = useState('');


    const [privateKeyFileName, setPrivateKeyFileName] = useState('');
    const [jsonFileName, setJsonFileName] = useState('');
    const [deployDone, setDeployDone] = useState(false);

    const fileInputRef = React.createRef();
    const jsonFileInputRef = React.createRef();

    const getCurrentDomain = () => {
        return !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)? domainHashed : domain;
    }

    const handleFlagsChange = (i) => {
        const newFlags = new BitSet(flags.flip(i).toString());
        setFlags(newFlags);
        console.log(newFlags.toString());
        if (i === FLAG_POSITIONS.DOMAIN_HASHED) {
            if (domain) {
                setDomainHashed(web3.utils.sha3(domain).substring(2));
            }
        }
    };

    /* https://stackoverflow.com/a/56377153 */
    const handleFilePicked = (event) => {
        event.preventDefault();
        setPrivateKeyFileName(fileInputRef.current.files[0].name);

        if (domain && expiry) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const address = await predictContractAddress(web3);
                setContractAddress(address);
                const flagsHex = flagsTo24BytesHex(flags);
                const payload = { address, domain: getCurrentDomain(), expiry, flagsHex };
                const privateKeyPem = e.target.result;
                const signature = await generateSignature(payload, privateKeyPem);
                setSignature(signature);
            };
            reader.readAsText(event.target.files[0]);
        }
    };

    const handleJsonFilePicked = (event) => {
        event.preventDefault();
        setJsonFileName(jsonFileInputRef.current.files[0].name);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const parsedJson = JSON.parse(e.target.result);
            setTesc(parsedJson);
        }
        reader.readAsText(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const flagsHex = flagsTo24BytesHex(flags);

        if (domain && expiry && signature && tesc) {

            try {
                const account = web3.currentProvider.selectedAddress;
                const contract = new web3.eth.Contract(tesc.abi);
                await contract.deploy({
                    data: tesc.bytecode,
                    arguments: [getCurrentDomain(), expiry, flagsHex, signature]
                }).send({ from: account, gas: '2000000' });
                setDeployDone(true);


                let tescs = JSON.parse(localStorage.getItem(account));
                if (!tescs) {
                    tescs = [];
                }
                tescs.push({ contractAddress, domain, expiry });
                localStorage.setItem(account, JSON.stringify(tescs));
            } catch (err) {
                console.log(err);
            }
        }

    };

    const handleExpiryChange = (date) => {
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        setExpiry(mDate.unix());
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) => (
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                label={flagName}
                onClick={() => handleFlagsChange(i)}
            />
        ));
    };

    return (
        <Form>
            <h2>Create & Deploy TeSC</h2>
            <Form.Group widths='equal'>
                <Form.Field>
                    <label>Domain</label>
                    <Input
                        value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                        disabled={!!domain && !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
                        placeholder='www.mysite.com'
                        onChange={e => setDomain(e.target.value)}
                    />
                </Form.Field>

                <Form.Field>
                    <label>Expiry</label>
                    <DayPickerInput
                        onDayChange={handleExpiryChange}
                        format="DD/MM/YYYY"
                        formatDate={formatDate}
                        parseDate={parseDate}
                        placeholder='dd/mm/yyyy'
                        dayPickerProps={{
                            disabledDays: {
                                before: new Date()
                            }
                        }}
                    />
                </Form.Field>

            </Form.Group>
            <Form.Group grouped>
                <label>Flags</label>
                {renderFlagCheckboxes()}
            </Form.Group>

            <Form.Group grouped>
                <label>Signature</label>
                <div style={{ paddingTop: '5px' }}>
                    <Button
                        content="Choose certificate private key"
                        labelPosition="left"
                        icon="file"
                        onClick={() => fileInputRef.current.click()}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFilePicked}
                        accept=".pem, .txt, .cer, .cert"
                        hidden
                    />
                    {!!privateKeyFileName && <Label basic pointing='left'>{privateKeyFileName}</Label>}
                </div>

                <div>
                    <em>Paste your signature into the box below or pick the certificate private key file to automatically compute the signature</em>
                </div>
                <Form.TextArea
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                />
            </Form.Group>

            <Form.Group grouped>
                <label>JSON File</label>
                <div style={{ paddingTop: '5px' }}>
                    <Button
                        content="Choose contract JSON file"
                        labelPosition="left"
                        icon="file"
                        onClick={() => jsonFileInputRef.current.click()}
                    />
                    <input
                        ref={jsonFileInputRef}
                        type="file"
                        onChange={handleJsonFilePicked}
                        accept=".json"
                        hidden
                    />
                    {!!jsonFileName && <Label basic pointing='left'>{jsonFileName}</Label>}
                </div>  
            </Form.Group>
        
            {deployDone &&
                (
                    <span>
                        <b>Contract address:</b>
                        <Label basic color='green' size='large' style={{ marginLeft: '5px' }}>
                            {contractAddress}
                        </Label>
                    </span>
                )
            }
            <Button onClick={handleSubmit} floated='right' positive>Deploy</Button>
        </Form>

    );
};

export default TeSCNew;