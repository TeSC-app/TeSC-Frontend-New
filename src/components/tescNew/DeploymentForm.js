import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button, Segment } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import moment from 'moment';
import BitSet from 'bitset';

import AppContext, { TescNewContext } from '../../appContext';
import { buildNegativeMsg, buildPositiveMsg } from "../FeedbackMessage";
import FilePicker from '../FilePicker';
import FingerprintInput from './FingerprintInput';
import DeploymentOutput from './DeploymentOutput';

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import {
    predictContractAddress,
    generateSignature,
    flagsToBytes24Hex,
    padToBytesX,
    storeTesc,
    estimateDeploymentCost,
    formatClaim,
    FLAG_POSITIONS,
} from '../../utils/tesc';


const DeploymentForm = ({ blockScreen }) => {
    const { web3 } = useContext(AppContext);
    const { showMessage } = useContext(TescNewContext);

    const [contractAddress, setContractAddress] = useState('');

    const [domain, setDomain] = useState('');
    const [expiry, setExpiry] = useState(null);
    const [signature, setSignature] = useState('');
    const [flags, setFlags] = useState(new BitSet('0x00'));
    const [domainHashed, setDomainHashed] = useState('');

    const privateKeyPEM = useRef('');

    const [costEstimated, setCostEstimated] = useState(0);
    const [costPaid, setCostPaid] = useState(0);

    const prevExpiry = useRef(expiry);
    const prevFlags = useRef(flags.toString());
    const prevSignature = useRef(signature);
    const fingerprint = useRef('');

    const getCurrentDomain = useCallback(() => !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain,
        [domainHashed, domain, flags]);

    const getClaim = useCallback(() => formatClaim({
        contractAddress,
        domain: getCurrentDomain(),
        expiry,
        flags: flagsToBytes24Hex(flags)
    }), [contractAddress, getCurrentDomain, expiry, flags]);

    const computeSignature = useCallback(async () => {
        const domain = getCurrentDomain();
        if (!!privateKeyPEM.current && !!domain && !!expiry) {
            try {
                const address = await predictContractAddress(web3);
                const flagsHex = flagsToBytes24Hex(flags);
                const payload = { address, domain, expiry, flagsHex };
                setSignature(await generateSignature(payload, privateKeyPEM.current));
            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to compute signature',
                    msg: err.message
                }));
            }
        } else if (!domain || !expiry) {
            setSignature('');
        }
    }, [expiry, flags, getCurrentDomain, showMessage, web3]);

    const makeDeploymentTx = useCallback(async () => {
        const flagsHex = flagsToBytes24Hex(flags);
        const fingerprintHex = padToBytesX(fingerprint.current, 32);
        return await new web3.eth.Contract(TeSC.abi).deploy({
            data: TeSC.bytecode,
            arguments: [domain, expiry, flagsHex, fingerprintHex, signature]
        });
    }, [domain, expiry, flags, signature, web3.eth.Contract]);


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

    const handlePickPrivateKey = (content) => {
        privateKeyPEM.current = content;
        computeSignature();
    };

    const handleGetFingerprint = (fp) => {
        fingerprint.current = fp;
    };

    const handleExpiryChange = (date) => {
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        setExpiry(mDate.unix());
    };

    useEffect(() => {
        const runEffect = async () => {
            if (expiry !== prevExpiry.current) {
                computeSignature();
                prevExpiry.current = expiry;

            } else if (flags.toString() !== prevFlags.current) {
                computeSignature();
                prevFlags.current = flags.toString();

            }
            else if (signature !== prevSignature.current) {
                const tx = await makeDeploymentTx();
                const estCost = await estimateDeploymentCost(web3, tx);
                setCostEstimated(estCost);
                prevSignature.current = signature;
            }
        };
        runEffect();
    }, [expiry, flags, signature, domain, computeSignature, getCurrentDomain, makeDeploymentTx, web3]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        blockScreen(true);

        showMessage(null);
        setContractAddress('');

        const account = web3.currentProvider.selectedAddress;
        const curDomain = getCurrentDomain();

        if (curDomain && expiry && signature) {
            try {
                const tx = await makeDeploymentTx({ web3, contractJson: TeSC, domain: curDomain, expiry, flags, signature, fingerprint: fingerprint.current });
                await tx.send({ from: account, gas: '2000000' })
                    .on('receipt', async (txReceipt) => {
                        setCostPaid(txReceipt.gasUsed * web3.utils.fromWei((await web3.eth.getGasPrice()), 'ether'));
                        setContractAddress(txReceipt.contractAddress);

                        showMessage(buildPositiveMsg({
                            header: 'Smart Contract successfully deployed',
                            msg: `TLS-endorsed Smart Contract deployed successully at address ${txReceipt.contractAddress}`
                        }));

                        storeTesc({
                            account,
                            claim: { contractAddress: txReceipt.contractAddress, domain: curDomain, expiry }
                        });
                    });

            } catch (err) {
                showMessage(buildNegativeMsg({
                    code: err.code,
                    header: 'Unable to deploy Smart Contract',
                    msg: err.message
                }));
                console.log(err);
            }
        } else {
            showMessage(buildNegativeMsg({
                header: 'Unable to deploy Smart Contract',
                msg: `${!curDomain ? 'Domain' : !expiry ? 'Expiry' : !signature ? 'Signature' : 'Some required input'} is empty`
            }));
        }
        blockScreen(false);
    };

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).map(([flagName, i]) => (
            <Form.Checkbox
                key={i}
                checked={!!flags.get(i)}
                label={flagName}
                onClick={() => handleFlagsChange(i)}
                disabled={!domain || !expiry}
            />
        ));
    };

    return (
        <React.Fragment>
            <Form style={{ width: '80%', margin: '40px auto' }}>
                <Form.Group widths='equal'>
                    <Form.Field>
                        <label>Domain  <span style={{ color: 'red' }}>*</span></label>
                        <Input
                            value={!!flags.get(FLAG_POSITIONS.DOMAIN_HASHED) ? domainHashed : domain}
                            disabled={!!domain && !!flags.get(FLAG_POSITIONS.DOMAIN_HASHED)}
                            placeholder='www.mysite.com'
                            onChange={e => setDomain(e.target.value)}
                            onBlur={() => computeSignature()}
                        />
                    </Form.Field>

                    <Form.Field>
                        <label>Expiry <span style={{ color: 'red' }}>*</span></label>
                        <DayPickerInput
                            onBlur={() => computeSignature()}
                            onDayChange={handleExpiryChange}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            dayPickerProps={{
                                disabledDays: {
                                    before: new Date()
                                },
                                readOnly: true
                            }}
                            inputProps={{ readOnly: true }}
                        />
                    </Form.Field>

                </Form.Group>
                <Form.Group grouped>
                    <label>Flags</label>
                    {renderFlagCheckboxes()}
                </Form.Group>

                <Form.Group grouped>
                    <label>Signature <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ paddingTop: '5px' }}>
                        <FilePicker
                            label='Choose certificate private key'
                            onPickFile={handlePickPrivateKey}
                            isDisabled={!getCurrentDomain() || !expiry}
                        />
                    </div>
                    <div><em>Pick the certificate private key file to automatically compute the signature</em></div>

                    <Segment style={{ wordBreak: 'break-all', minHeight: '7em' }} placeholder>
                        {signature}
                    </Segment>
                </Form.Group>

                <Form.Group grouped>
                    <FingerprintInput
                        domain={getCurrentDomain()}
                        claim={getClaim()}
                        signature={signature}
                        onGetFingerprint={handleGetFingerprint}
                    />
                </Form.Group>

                {contractAddress && (<DeploymentOutput contractAddress={contractAddress} costPaid={costPaid} />)}

                {!!costEstimated && !!signature && (
                    <div style={{ float: 'right', marginTop: '3px' }}>
                        <Label tag style={{ color: 'royalblue', }}>
                            {costEstimated.toFixed(5)} <span style={{ fontSize: '0.75em' }}>ETH</span>
                        </Label>
                    </div>
                )}
                <br />
                <br />
                <Button
                    onClick={handleSubmit}
                    disabled={!signature}
                    floated='right'
                    positive
                    style={{ width: '20%', marginTop: '0px' }}
                >
                    Deploy
                </Button>

            </Form>
        </React.Fragment>
    );
};

export default DeploymentForm;