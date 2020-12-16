import React, { useState } from 'react';
import { Input, Form, Label, Button } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import moment from 'moment';

import 'react-day-picker/lib/style.css';

import TeSC from '../ethereum/build/contracts/ERCXXXImplementation.json';
import { predictContractAddress, generateSignature, flags2Hex, FLAG_POSITIONS } from '../utils/tesc';
import getWeb3 from '../ethereum/web3-config';

let web3;
getWeb3().then(web3_ => web3 = web3_);


const TeSCNew = () => {
    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState(null);
    const [signature, setSignature] = useState('');

    const [flagDomainHashed, setFlagDomainHashed] = useState(false);
    const [flagAllowSubendorsement, setFlagAllowSubendorsement] = useState(false);
    const [flagExclusive, setFlagExclusive] = useState(false);
    const [flagPayable, setFlagPayable] = useState(false);
    const [flagAllowSubdomain, setFlagAllowSubdomain] = useState(false);
    const [flagAllowAlternativeDomain, setFlagAllowAlternativeDomain] = useState(false);
    const [flagTrustAfterExpiry, setFlagTrustAfterExpiry] = useState(false);

    const [privateKeyFileName, setPrivateKeyFileName] = useState('');
    const [deployDone, setDeployDone] = useState(false);

    const fileInputRef = React.createRef();

    const flags = [flagDomainHashed, flagAllowSubendorsement, flagExclusive, flagPayable,
        flagAllowSubdomain, flagAllowAlternativeDomain, flagTrustAfterExpiry];

    let flagHex = flags2Hex(flags);

    const handleFlagsChange = (i) => {
        flags[i] = !flags[i];
        flagHex = flags2Hex(flags);
    };

    /* https://stackoverflow.com/a/56377153 */
    const handleFilePicked = (event) => {
        event.preventDefault();
        console.log("EVENT", event);
        setPrivateKeyFileName(fileInputRef.current.files[0].name);

        if (domain && expiry) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                console.log("E", e);
                setContractAddress(await predictContractAddress(web3));
                const payload = { domain, expiry, flagHex };
                const privateKeyPem = e.target.result;
                const signature = await generateSignature(web3, payload, privateKeyPem);
                setSignature(signature);
            };
            reader.readAsText(event.target.files[0]);
        }
        // event.target.value = null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("DOMAIN", domain);
        console.log("EXPIRY", expiry);
        console.log("SIGNATURE", signature);
        console.log("FLAGHEX", flagHex);
        if (domain && expiry && signature) {
            console.log("deploying");

            try {
                const accounts = await web3.eth.getAccounts();
                const contract = new web3.eth.Contract(TeSC.abi);
                console.log("CONTRACT ", contract);

                await contract.deploy({
                    data: TeSC.bytecode,
                    arguments: [domain, expiry, flagHex, signature]
                }).send({ from: accounts[0], gas: '2000000' });
                setDeployDone(true);
                console.log("DEPLOY DONE");


                let tescs = JSON.parse(localStorage.getItem('tescs')).tescs;
                console.log("LS GET NEW 1", tescs);
                if (!tescs) {
                    tescs = [];
                }
                console.log("LS GET NEW 2", tescs);
                // tescs = [];

                tescs.push({ contractAddress, domain, expiry });
                localStorage.setItem('tescs', JSON.stringify({ tescs }));

                console.log("LS GET NEW 3", tescs);
                console.log("LS GET NEW 4", JSON.parse(localStorage.getItem('tescs')));
            } catch (err) {
                console.log(err);
            }
        }

    };

    const handleExpiryChange = (date) => {
        const mDate = moment.utc(date);
        // mDate.set({ hour: 23, minute: 59, second: 59, millisecond: 0 });
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        setExpiry(mDate.unix());
    };

    return (
        <Form>
            <h2>Create & Deploy TeSC</h2>
            <Form.Group widths='equal'>
                <Form.Field>
                    <label>Domain</label>
                    <Input
                        value={domain}
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
                <Form.Checkbox
                    checked={flagDomainHashed}
                    label='DOMAIN_HASHED'
                    onClick={(e, { checked }) => { setFlagDomainHashed(checked); handleFlagsChange(FLAG_POSITIONS.DOMAIN_HASHED); }}
                />
                <Form.Checkbox
                    checked={flagAllowSubendorsement}
                    label='ALLOW_SUBENDORSEMENT'
                    onClick={(e, { checked }) => { setFlagAllowSubendorsement(checked); handleFlagsChange(FLAG_POSITIONS.ALLOW_SUBENDORSEMENT); }}
                />
                <Form.Checkbox
                    checked={flagExclusive}
                    label='EXCLUSIVE'
                    onClick={(e, { checked }) => { setFlagExclusive(checked); handleFlagsChange(FLAG_POSITIONS.EXCLUSIVE); }}
                />
                <Form.Checkbox
                    checked={flagPayable}
                    label='PAYABLE'
                    onClick={(e, { checked }) => { setFlagPayable(checked); handleFlagsChange(FLAG_POSITIONS.PAYABLE); }}
                />
                <Form.Checkbox
                    checked={flagAllowSubdomain}
                    label='ALLOW_SUBDOMAIN'
                    onClick={(e, { checked }) => { setFlagAllowSubdomain(checked); handleFlagsChange(FLAG_POSITIONS.ALLOW_SUBDOMAIN); }}
                />
                <Form.Checkbox
                    checked={flagAllowAlternativeDomain}
                    label='ALLOW_ALTERNATIVEDOMAIN'
                    onClick={(e, { checked }) => { setFlagAllowAlternativeDomain(checked); handleFlagsChange(FLAG_POSITIONS.ALLOW_ALTERNATIVEDOMAIN); }}
                />
                <Form.Checkbox
                    checked={flagTrustAfterExpiry}
                    label='TRUST_AFTER_EXPIRY'
                    onClick={(e, { checked }) => { setFlagTrustAfterExpiry(checked); handleFlagsChange(FLAG_POSITIONS.TRUST_AFTER_EXPIRY); }}
                />

            </Form.Group>

            <Form.Group grouped>
                <label>Signature</label>
                <div style={{ paddingTop: '5px' }}>
                    <Button
                        content="Choose certificate private key"
                        labelPosition="left"
                        icon="file"
                        onClick={() => fileInputRef.current.click()}
                    // style={{ marginTop: '10px' }}
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
            {deployDone && (<span><b>Contract address:</b>  <Label basic color='green' style={{ marginLeft: '5px' }}> {contractAddress}</Label></span>)}
            <Button onClick={handleSubmit} floated='right' positive>Deploy</Button>
        </Form>

    );
};

export default TeSCNew;