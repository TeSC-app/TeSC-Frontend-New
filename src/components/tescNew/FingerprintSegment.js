import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Form, Dimmer, Loader, Segment, Label, Popup, Icon } from 'semantic-ui-react';
import { toast } from 'react-toastify';

import axios from 'axios';
import { Certificate } from '@fidm/x509';

import AppContext from '../../appContext';
import FilePicker from '../FilePicker';
import { negativeMsg, warningMsg } from "../FeedbackMessage";

import { predictContractAddress, formatClaim, flagsToBytes24Hex, FLAGS } from '../../utils/tesc';
import { extractAxiosErrorMessage } from '../../utils/formatError';


const FingerprintSegment = ({ inputs, onGetFingerprint }) => {
    const { web3, account } = useContext(AppContext);

    const [isWaiting, setIsWaiting] = useState(false);

    const [sliderState, setSliderState] = useState(!inputs.fingerprint || parseInt(inputs.fingerprint, 16) === 0 ? false : true);
    const [fingerprint, setFingerprint] = useState(!inputs.fingerprint || parseInt(inputs.fingerprint, 16) === 0 ? '' : inputs.fingerprint);

    const [certPEM, setCertPEM] = useState('');
    const [certFileName, setCertFileName] = useState('');
    const [filePickerDisplayed, setFilePickerDisplayed] = useState(false);

    const domain = useRef(inputs.domain);
    const flags = useRef(inputs.flags);
    const expiry = useRef(inputs.expiry);
    const signature = useRef(inputs.signature);

    const contractAddress = useRef(inputs.contractAddress);
    const claim = useRef('');

    const cache = useRef({});
    const prevFingerprint = useRef(fingerprint);


    const resetStates = useCallback(() => {
        setFilePickerDisplayed(false);
        setFingerprint('');
        setCertPEM('');
        onGetFingerprint('');
        prevFingerprint.current = '';
    }, [onGetFingerprint]);

    const handleChangeSliderState = async () => {
        setSliderState(!sliderState);

        if (!sliderState) {
            retrieveCertificate();
        } else {
            resetStates();
        }
    };

    const handlePickCert = useCallback(async (fileName, certPEM) => {
        setCertFileName(fileName);
        setCertPEM(certPEM);
        try {
            if (!cache.current[domain.current]) {
                const cert = Certificate.fromPEM(certPEM);
                if (!cert.dnsNames.includes(domain.current) && !cert.ipAddresses.includes(domain.current)) {
                    throw new Error(`The selected certificate is not issued to domain ${domain.current}`);
                }

                setIsWaiting(true);
                const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-uploading`, {
                    params: {
                        certPEM,
                        signature: signature.current,
                        claim: claim.current
                    }
                });
                console.log('res', res);
                setFingerprint(res.data.fingerprint);
                cache.current[domain.current] = res.data.fingerprint;

            } else {
                setFingerprint(cache.current[domain.current]);
                setCertPEM('');
            }

        } catch (error) {
            const msg = extractAxiosErrorMessage({ error, subject: domain.current });
            toast(negativeMsg({
                header: 'Unable to compute fingerprint',
                msg,
                closingCondition: 'fp'
            }));
            setFingerprint('');
        }
    }, []);

    const updateClaim = useCallback(() => {
        const curDomain = !!flags.current.get(FLAGS.DOMAIN_HASHED) ? web3.utils.sha3(domain.current) : domain.current;
        if (contractAddress.current && domain.current && expiry.current) {
            claim.current = formatClaim({
                contractAddress: contractAddress.current,
                domain: curDomain,
                expiry: expiry.current,
                flags: flagsToBytes24Hex(flags.current)
            });
        }
    }, [web3.utils]);

    const retrieveCertificate = useCallback(async () => {
        try {
            if (!cache.current[domain.current]) {
                setIsWaiting(true);
                updateClaim();
                const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-retrieval`, {
                    params: {
                        domain: domain.current,
                        signature: signature.current,
                        claim: claim.current
                    }
                });
                setFingerprint(res.data.fingerprint);
                cache.current[domain.current] = res.data.fingerprint;

            } else {
                setFingerprint(cache.current[domain.current]);
            }

        } catch (error) {
            const msg = extractAxiosErrorMessage({ error, subject: domain.current });
            toast(warningMsg({
                header: 'Unable to automatically retrieve domain certificate to compute the fingerprint.',
                msg: `${msg}${!!msg.match(/[.!]+$/i) ? '' : '.'} You can also upload your domain certificate manually.`,
                closingCondition: 'fp'
            }));
            setFilePickerDisplayed(true);
            setFingerprint('');
        }
    }, [updateClaim]);


    useEffect(() => {
        (async () => {
            if (!contractAddress.current && account) {
                contractAddress.current = await predictContractAddress(web3);
            }
            if (signature.current !== inputs.signature) {
                signature.current = inputs.signature;
                if (sliderState && signature.current && !inputs.fingerprint) {
                    (!certPEM) ? retrieveCertificate() : handlePickCert(certPEM);

                } else if (!signature.current) {
                    resetStates();
                    setSliderState(false);
                }
            }
            if (signature.current) {
                if (domain.current !== inputs.domain) {
                    domain.current = inputs.domain;
                } else if (expiry.current !== inputs.expiry) {
                    expiry.current = inputs.expiry;
                } else if (flags.current !== inputs.flags) {
                    flags.current = inputs.flags;
                }
            }
        })();
    }, [inputs, sliderState, retrieveCertificate, certPEM, handlePickCert, resetStates, web3, account]);



    useEffect(() => {
        if (sliderState && fingerprint !== prevFingerprint.current) {
            onGetFingerprint(fingerprint);
            prevFingerprint.current = fingerprint;
        }
        setIsWaiting(false);
    }, [fingerprint, sliderState, onGetFingerprint]);


    return (
        <div>
            <p>
                <b>Fingerprint </b>
                <Popup
                    inverted
                    content='In case the certificate cannot be retrieved from your website e.g. the website is under maintenance, the verifier is still able to use the fingerprint of the TLS/SSL domain certificate to retrieve it from Certificate Transparancy. Therefore, this serves as a backup option for certificate retreival during the off-chain verification process. (optional)'
                    trigger={<Icon name='question circle' />}
                />
                (optional)
            </p>

            <Form.Checkbox
                toggle
                checked={sliderState}
                label='Use certificate fingerprint'
                onClick={handleChangeSliderState}
                disabled={!signature.current}
            />

            {sliderState && (fingerprint || filePickerDisplayed) &&
                <Segment style={{ maxWidth: '100%', width: 'max-content' }}>
                    {filePickerDisplayed && !fingerprint && (
                        <FilePicker
                            label='Choose certificate'
                            onPickFile={handlePickCert}
                            isDisabled={!sliderState}
                            input={{ fileName: certFileName, content: certPEM, acceptedFiles: ".txt, .cer, .cert, .crt" }}
                        />
                    )}
                    {sliderState && fingerprint && (<span style={{ wordBreak: 'break-all' }}><b>Fingerprint: <Label>{fingerprint}</Label></b></span>)
                    }
                    <Dimmer active={isWaiting} inverted>
                        <Loader indeterminate content='Retrieving certificate and computing fingerprint...' />
                    </Dimmer>
                </Segment>
            }
        </div>
    );

};

export default FingerprintSegment;