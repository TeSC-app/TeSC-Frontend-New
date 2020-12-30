import React from 'react';
import { Message } from 'semantic-ui-react';

export const buildNegativeMsg = ({ code, header, msg }) => {
    return {
        outcome: 'negative',
        header: `FAILED: ${header}`,
        msg: `${msg} ${!!code ? `[MetaMask code: ${code}]` : ''}`
    };
};

export const buildPositiveMsg = ({ header, msg }) => {
    return {
        outcome: 'positive',
        header: `SUCCESS: ${header}`,
        msg
    };
};

const FeedbackMessage = ({ message, handleDismiss, style }) => {
    console.log('MSG', message);
    const { outcome, header, msg } = message;
    return (
        <div style={{ float: 'right' }}>
            <Message
                positive={outcome === 'positive'}
                negative={outcome === 'negative'}
                onDismiss={handleDismiss}
                style={{ paddingRight: '50px' }}
            >
                <Message.Header>{header}</Message.Header>
                {msg && <p>{msg}</p>}
            </Message>
        </div>

    );
};

export default FeedbackMessage;