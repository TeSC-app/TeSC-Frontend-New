import React from 'react';
import { Message, Icon } from 'semantic-ui-react';

export const buildNegativeMsg = ({ code, header, msg, closingCondition = null }) => {
    return {
        type: 'negative',
        header: `FAILED: ${header}`,
        msg: `${msg} ${!!code ? `[MetaMask code: ${code}]` : ''}`,
        closingCondition
    };
};

export const buildPositiveMsg = ({ header, msg, closingCondition = null }) => {
    return {
        type: 'positive',
        header: `SUCCESS: ${header}`,
        msg,
        closingCondition
    };
};

export const buildWarningMsg = ({ header, msg, closingCondition = null }) => {
    return {
        type: 'warning',
        header: `WARNING: ${header}`,
        msg,
        closingCondition
    };
};

export const negativeMsg = (args) => {
    return <FeedbackMessage message={buildNegativeMsg(args)} />;
};

export const positiveMsg = (args) => {
    return <FeedbackMessage message={buildPositiveMsg(args)} />;
};

export const warningMsg = (args) => {
    return <FeedbackMessage message={buildWarningMsg(args)} />;
};

const FeedbackMessage = ({ message, handleDismiss }) => {
    const { type, header, msg } = message;
    const icon = (type === 'positive') ? 'check' : (type === 'negative') ? 'x' : 'warning sign';
    return (
        // <div style={{ float: 'right' }}>
        <Message
            icon
            positive={type === 'positive'}
            negative={type === 'negative'}
            warning={type === 'warning'}
            onDismiss={handleDismiss}
            size='tiny'
            style={{
                width: '100%',
                wordBreak: 'break-word',
                boxShadow: '0 1px 10px 0 rgb(100 0 0 / 10%), 0 2px 15px 0 rgb(100 0 0 / 5%)',
                paddingRight: '25px'
            }}
        >
            <Icon name={icon} />
            <Message.Content>
                <Message.Header>{header}</Message.Header>
                {msg && <p>{msg}</p>}
            </Message.Content>
        </Message>
        // </div>

    );
};

export default FeedbackMessage;