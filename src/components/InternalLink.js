import React from 'react';

import { Link } from 'react-router-dom';


const LinkTescInspect = ({ contractAddress, content }) => (
    <Link
        style={{ opacity: 'unset' }}
        to={{
            pathname: "/tesc/inspect",
            state: {
                contractAddress
            }
        }}
    >
        <span style={{fontSize: '1.15em', fontFamily: 'monospace'}}>{content ? content : contractAddress}</span>
    </Link>
);

export default LinkTescInspect;