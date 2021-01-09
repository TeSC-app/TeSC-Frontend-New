import React from 'react';
import { Table, Checkbox } from 'semantic-ui-react';
import moment from 'moment';
import { FLAG_POSITIONS } from '../../utils/tesc';

const TescDataTable = ({ data }) => {

    const { domain, expiry, flags, signature, fingerprint } = data;

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAG_POSITIONS).filter(([flagName, i]) => i === 0).map(([flagName, i]) => (
            <div key={i} style={{ paddingBottom: '5px' }}>
                <Checkbox
                    checked={!!flags.get(i)}
                    label={flagName}
                    disabled
                    slider
                />
            </div>
        ));
    };

    return (
        <Table basic='very' celled collapsing style={{margin: '0 auto'}}>
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
                        {!fingerprint || parseInt(fingerprint, 16) === 0 ? 'N/A' : fingerprint.substring(2)}
                    </Table.Cell>
                </Table.Row>
            </Table.Body>

        </Table>

    );
};

export default TescDataTable;