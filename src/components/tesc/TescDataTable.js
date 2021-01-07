import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Input, Table, Checkbox, Loader, Icon, Label, Grid, Card, Form, Dimmer, Popup, Button, Modal } from 'semantic-ui-react';


import moment from 'moment';

import AppContext from '../../appContext';

import { FLAG_POSITIONS, hexStringToBitSet, isValidContractAddress } from '../../utils/tesc';



const TescDataTable = ({ data }) => {
    const { web3, showMessage } = useContext(AppContext);
    
    const { contractAddress, domain, expiry, flags, signature, fingerprint } = data;

    const [tescIsInFavourites, setTescsIsInFavourites] = useState(false);
    const [tescs, setTescs] = useState(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));

    useEffect(() => {
        setTescs(JSON.parse(localStorage.getItem(web3.currentProvider.selectedAddress)));
        //favourites
        console.log(tescs);
        for (const tesc of tescs) {
            if (tesc.contractAddress === contractAddress) {
                setTescsIsInFavourites(tesc.isFavourite);
                break;
            }
        }
    }, [contractAddress, tescs, web3.currentProvider.selectedAddress]);

    const addRemoveFavourites = (address) => {
        let tescsNew;
        tescs ? tescsNew = tescs : tescsNew = [];
        let found = false;
        for (const tesc of tescsNew) {
            if (tesc.contractAddress === address) {
                found = true;
                if (tesc.isFavourite) {
                    tesc.isFavourite = false;
                    setTescsIsInFavourites(false);
                } else {
                    tesc.isFavourite = true;
                    setTescsIsInFavourites(true);
                }
                localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
                break;
            }
        }
        if (!found) {
            tescsNew.push({ contractAddress: address, domain, expiry, isFavourite: true, own: false });
            localStorage.setItem(web3.currentProvider.selectedAddress, JSON.stringify(tescsNew));
            setTescsIsInFavourites(true);
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
                <Table.Row>
                    <Table.Cell>
                        <b>Fingerprint</b>
                    </Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-all' }}>
                        {parseInt(fingerprint, 16) === 0 ? 'Not available' : fingerprint.substring(2)}
                    </Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell>
                        <b>Favourite</b>
                    </Table.Cell>
                    <Table.Cell>
                        <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                            trigger={<Button icon="heart" className={tescIsInFavourites ? "favourite" : "notFavourite"}
                                onClick={() => addRemoveFavourites(contractAddress)} />} />
                    </Table.Cell>
                </Table.Row>
            </Table.Body>

        </Table>

    );
};

export default TescDataTable;