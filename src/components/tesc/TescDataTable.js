import React from 'react';
import { Table, Checkbox, Label } from 'semantic-ui-react';
import moment from 'moment';
import { FLAGS } from '../../utils/tesc';

const TescDataTable = ({ data }) => {

    const { domain, expiry, flags, signature, fingerprint } = data;

    const renderFlagCheckboxes = () => {
        return Object.entries(FLAGS).filter(([flagName, i]) => [FLAGS.DOMAIN_HASHED, FLAGS.ALLOW_SUBENDORSEMENT].includes(i)).map(([flagName, i]) => (
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
        <Table definition basic='very' collapsing style={{ margin: '0 auto', width: '100%' }}>
            <Table.Body>
                <Table.Row>
                    <Table.Cell className='header-cell' >
                        <b>Domain</b>
                    </Table.Cell>
                    <Table.Cell style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#a333c8', wordBreak: 'break-word', fontFamily: 'monospace' }}>{domain}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell className='header-cell'>
                        <b>Expiry</b>
                    </Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-all' }}>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell className='header-cell' >
                        <b>Flags</b>
                    </Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {renderFlagCheckboxes()}
                    </Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell className='header-cell'>
                        <b>Signature</b>
                    </Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-all' }}>
                        <Label style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>{signature}</Label>
                    </Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell className='header-cell'>
                        <b>Fingerprint</b>
                    </Table.Cell>
                    <Table.Cell style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {!fingerprint || parseInt(fingerprint, 16) === 0 ? 'N/A' : <Label style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>fingerprint</Label>}
                    </Table.Cell>
                </Table.Row>
            </Table.Body>

        </Table>

    );
};

export default TescDataTable;