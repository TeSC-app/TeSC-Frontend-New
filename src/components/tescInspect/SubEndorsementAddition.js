import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Input, Form, Label, Button as BtnSuir, Segment, Popup, Radio, Header, TextArea, Divider, Icon, Grid } from 'semantic-ui-react';

import TeSC from '../../ethereum/build/contracts/ERCXXXImplementation.json';
import AppContext from '../../appContext';
import { buildNegativeMsg } from "../FeedbackMessage";

import { isValidContractAddress } from '../../utils/tesc';



const SubEndorsementAddition = ({ contractAddress }) => {
    const { web3, showMessage } = useContext(AppContext);
    const [subendorsements, setSubendorsements] = useState(['']);
    const [invalidInputIndices, setInvalidInputIndices] = useState(new Set());
    const [invalidInputReasons, setInvalidInputReasons] = useState(null);

    useEffect(() => {
        (async () => {
            const contract = new web3.eth.Contract(TeSC.abi, contractAddress);
            const fetchedSubendorsements = await contract.methods.getSubendorsements().call();
            console.log('fetchedSubendorsements', fetchedSubendorsements);
            setSubendorsements([...fetchedSubendorsements, '']);
        })();
    }, [contractAddress, web3.eth]);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    const handleChangeSubendorsementInputs = (newAddress, index) => {
        try {
            const updatedSubendorsements = subendorsements.map((curAddress, i) => {
                if (index === i) return newAddress;
                return curAddress;
            });

            if (newAddress === '' && index !== updatedSubendorsements.length - 1) {
                setSubendorsements(updatedSubendorsements.slice(0, updatedSubendorsements.length - 1));
            } else if (newAddress) {
                setSubendorsements(index === updatedSubendorsements.length - 1 ? [...updatedSubendorsements, ''] : updatedSubendorsements);
            }

            if ((newAddress === '' && index === updatedSubendorsements.length - 1) || isValidContractAddress(newAddress, true)) {
                setInvalidInputIndices(new Set([...invalidInputIndices].filter(i => i !== index)));
                setInvalidInputReasons(({ index, ...rest }) => rest);
            }

        } catch (error) {
            setInvalidInputIndices(new Set([...invalidInputIndices, index]));
            setInvalidInputReasons({ ...invalidInputReasons, [index]: error.message });
        }


    };


    const renderInputs = () => {
        return subendorsements.map((address, i) =>
            <Form.Field

            >
                <label>Subendorsement <b>{i + 1}</b></label>
                <Form.Input
                    value={subendorsements[i]}
                    placeholder='Contract address e.g. 0x123456789abcdf...'
                    onChange={e => handleChangeSubendorsementInputs(e.target.value, i)}
                    // onBlur={() => handleLoseDomainInputFocus()}
                    icon='address'
                    error={invalidInputIndices.has(i) ? invalidInputReasons[i] : false}
                />
            </Form.Field>
        );
    };

    return (
        <Segment>
            <Header as='h3' content='Add Subendorsements' />
            <p>{contractAddress}</p>
            <Form onSubmit={handleSubmit}>
                {renderInputs()}
            </Form>
        </Segment>
    );
};

export default SubEndorsementAddition;