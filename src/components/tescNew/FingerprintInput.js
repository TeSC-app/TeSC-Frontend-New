import React, { Fragment, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button, Segment } from 'semantic-ui-react';


import axios from 'axios';

import AppContext, { TescNewContext } from '../../appContext';
import FilePicker from '../FilePicker';
import { buildNegativeMsg, buildWarningMsg } from "../FeedbackMessage";

import { predictContractAddress } from '../../utils/tesc';

const ERRCODE_MESSAGE_MAPPING = {
    "ENOTFOUND": " Unable to connect to the given website address. Please check your Domain input or the availability of your website."
};

const getErrorMessage = (errorCode) => {
    const msg = ERRCODE_MESSAGE_MAPPING[errorCode];
    return !!msg ? msg : 'Unknown error occurred.';
};

const FingerprintInput = ({ domain, signature, claim, onGetFingerprint }) => {
    const { web3 } = useContext(AppContext);
    const { showMessage } = useContext(TescNewContext);

    const [sliderState, setSliderState] = useState(false);
    const [fingerprint, setFingerprint] = useState('');

    const [filePickerDisplayed, setFilePickerDisplayed] = useState(false);

    const handleChangeSliderState = async () => {
        setSliderState(!sliderState);
        if (!sliderState) {
            try {
                if (claim.substring(0, 2) !== '0x') {
                    const contractAddress = await predictContractAddress(web3);
                    claim = contractAddress + claim;
                }
                console.log('CLAIM ===>', claim);

                const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-retrieval`, {
                    params: {
                        domain,
                        signature,
                        claim
                    }
                });
                setFingerprint(res.data.fingerprint);

            } catch (error) {
                if (error.response) {
                    const err = error.response.data.err;
                    console.log("AUTO CERT", error.response.data);
                    const msg = err ? err : getErrorMessage(err);
                    showMessage(buildWarningMsg({
                        header: 'Unable to automatically retrieve domain certificate to compute the fingerprint',
                        msg: `${msg}${!!msg.match(/[.!]+$/i) ? '' : '.'} Please upload the domain certificate manually`
                    }));

                    setFilePickerDisplayed(true);
                } else {
                    console.log(error);
                }
            }

        } else {
            setFilePickerDisplayed(false);
            showMessage(null);
        }
    };

    const handlePickCert = async (cert) => {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_ADDRESS}/fingerprint/by-cert-uploading`, {
            params: {
                cert,
                signature,
                claim
            }
        });
        console.log("MANUAL CERT", res);

        if (res.status === '200') {
            setFingerprint(res.data.fingerprint);
            showMessage(null);
        } else {
            showMessage(buildNegativeMsg({
                header: 'Unable to automatically retrieve domain certificate to compute the fingerprint',
                msg: res.data.err + ' Please upload the domain certificate manually '
            }));
        }
    };

    useEffect(() => {
        onGetFingerprint(fingerprint);
    }, [fingerprint, onGetFingerprint]);




    return (
        <div>
            <Form.Checkbox
                toggle
                checked={sliderState}
                label='Use certificate fingerprint (optional)'
                onClick={handleChangeSliderState}
                disabled={!signature} handlePickCert
            />
            {filePickerDisplayed && (<FilePicker label='Choose certificate' onPickFile={handlePickCert} isDisabled={!sliderState} />)}
            {sliderState && fingerprint && (<p><b>Fingerprint: {fingerprint}</b></p>)
            }
        </div>
    );

};

export default FingerprintInput;