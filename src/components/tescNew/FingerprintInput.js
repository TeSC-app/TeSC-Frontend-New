import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button, Segment } from 'semantic-ui-react';

import axios from 'axios';

import AppContext, { TescNewContext } from '../../appContext';
import FilePicker from '../FilePicker';
import { buildNegativeMsg, buildWarningMsg } from "../FeedbackMessage";

import { predictContractAddress, formatClaim, flagsToBytes24Hex } from '../../utils/tesc';


const FingerprintInput = ({ inputs, onGetFingerprint }) => {
    const { web3 } = useContext(AppContext);
    const { showMessage } = useContext(TescNewContext);

    const [sysMsg, setSysMsg] = useState(null);

    const [sliderState, setSliderState] = useState(false);
    const [fingerprint, setFingerprint] = useState('');

    const [filePickerDisplayed, setFilePickerDisplayed] = useState(false);

    const domain = useRef(inputs.domain);
    const flags = useRef(inputs.flags);
    const expiry = useRef(inputs.expiry);
    const signature = useRef(inputs.signature);

    const contractAddress = useRef('');
    const claim = useRef('');

    // const cache = useRef({});

    const updateClaim = () => {
        if (contractAddress.current && domain.current && expiry.current) {
            console.log('cAdd in');
            claim.current = formatClaim({
                contractAddress: contractAddress.current,
                domain: domain.current,
                expiry: expiry.current,
                flags: flagsToBytes24Hex(flags.current)
            });
        }
    };

    const retrieveCertificate = useCallback(async () => {
        try {
            console.log('CLAIM', claim.current);
            updateClaim();
            const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-retrieval`, {
                params: {
                    domain: domain.current,
                    signature: signature.current,
                    claim: claim.current
                }
            });
            setFingerprint(res.data.fingerprint);

        } catch (error) {
            setFingerprint('');
            if (error.response) {
                console.log("AUTO CERT", error.response.data);
                const msg = getMsgFromErrorCode(error.response.data.err);
                setSysMsg(buildWarningMsg({
                    header: 'Unable to automatically retrieve domain certificate to compute the fingerprint',
                    msg: `${msg}${!!msg.match(/[.!]+$/i) ? '' : '.'} Please check your domain input and the availability of your website or upload your domain certificate manually.`
                }));

                setFilePickerDisplayed(true);
            } else {
                console.log(error);
            }
        }
    }, []);


    useEffect(() => {
        (async () => {
            console.log('INPUTS', inputs);
            if (!contractAddress.current) {
                contractAddress.current = await predictContractAddress(web3);
            }
            if (signature.current !== inputs.signature) {
                signature.current = inputs.signature;
                if (sliderState) {
                    retrieveCertificate();
                }
            }

            if (domain.current !== inputs.domain) {
                domain.current = inputs.domain;
            } else if (expiry.current !== inputs.expiry) {
                expiry.current = inputs.expiry;

            } else if (flags.current !== inputs.flags) {
                flags.current = inputs.flags;

            }
            

        })();
    }, [inputs, sliderState, retrieveCertificate, web3]);

    const getMsgFromErrorCode = (errMsg) => {
        if (errMsg.includes('getaddrinfo ENOTFOUND'))
            return ` Unable to connect to ${domain.current}.`;

        return errMsg;
    };

    const handleChangeSliderState = async () => {
        setSliderState(!sliderState);

        if (!sliderState) {
            retrieveCertificate();
        } else {
            setFilePickerDisplayed(false);
            setFingerprint('');
            setSysMsg(null);
        }
    };

    const handlePickCert = async (cert) => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-uploading`, {
                params: {
                    cert,
                    signature,
                    claim
                }
            });
            console.log("MANUAL CERT", res);
            setFingerprint(res.data.fingerprint);

        } catch (error) {
            setFingerprint('');
            const msg = getMsgFromErrorCode(error.response.data.err);
            setSysMsg(buildNegativeMsg({
                header: 'Unable to compute fingerprint',
                msg
            }));
        }
    };

    useEffect(() => {
        // if (fingerprint) {
        //     cache.current[domain.current] = fingerprint;
        // }
        onGetFingerprint(fingerprint);
        if (sysMsg && fingerprint) {
            setSysMsg(null);
            // showMessage(null);
        } else {
            showMessage(sysMsg);
        }
    }, [fingerprint, sysMsg, showMessage, onGetFingerprint]);


    return (
        <div>
            <Form.Checkbox
                toggle
                checked={sliderState}
                label='Use certificate fingerprint (optional)'
                onClick={handleChangeSliderState}
                disabled={!signature} handlePickCert
            />
            {filePickerDisplayed && !fingerprint && (<FilePicker label='Choose certificate' onPickFile={handlePickCert} isDisabled={!sliderState} />)}
            {sliderState && fingerprint && (<p><b>Fingerprint: {fingerprint}</b></p>)
            }
        </div>
    );

};

export default FingerprintInput;