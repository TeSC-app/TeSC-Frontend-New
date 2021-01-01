import React from 'react';
import { Message, Icon } from 'semantic-ui-react';

export const buildNegativeMsg = ({ code, header, msg }) => {
    return {
        type: 'negative',
        header: `FAILED: ${header}`,
        msg: `${msg} ${!!code ? `[MetaMask code: ${code}]` : ''}`
    };
};

export const buildPositiveMsg = ({ header, msg }) => {
    return {
        type: 'positive',
        header: `SUCCESS: ${header}`,
        msg
    };
};

export const buildWarningMsg = ({ header, msg }) => {
    return {
        type: 'warning',
        header: `WARNING: ${header}`,
        msg
    };
};

const FeedbackMessage = ({ message, handleDismiss, style }) => {
    const { type, header, msg } = message;
    const icon = (type === 'positive') ? 'check' : (type === 'negative') ? 'x' : 'warning sign';
    return (
        <div style={{ float: 'right' }}>
            <Message
                icon
                positive={type === 'positive'}
                negative={type === 'negative'}
                warning={type === 'warning'}
                onDismiss={handleDismiss}
                style={{ paddingRight: '3em' }}
            >
                <Icon name={icon} />
                <Message.Content>
                    <Message.Header>{header}</Message.Header>
                    {msg && <p>{msg}</p>}
                </Message.Content>
            </Message>
        </div>

    );
};

export default FeedbackMessage;