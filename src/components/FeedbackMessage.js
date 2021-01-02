import React from 'react';
import { Message, Icon } from 'semantic-ui-react';

export const buildNegativeMsg = ({ code, header, msg, closingCondition=null }) => {
    return {
        type: 'negative',
        header: `FAILED: ${header}`,
        msg: `${msg} ${!!code ? `[MetaMask code: ${code}]` : ''}`,
        closingCondition
    };
};

export const buildPositiveMsg = ({ header, msg, closingCondition=null  }) => {
    return {
        type: 'positive',
        header: `SUCCESS: ${header}`,
        msg,
        closingCondition
    };
};

export const buildWarningMsg = ({ header, msg, closingCondition=null  }) => {
    return {
        type: 'warning',
        header: `WARNING: ${header}`,
        msg,
        closingCondition
    };
};

const FeedbackMessage = ({ message, handleDismiss }) => {
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