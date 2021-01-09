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
        {content ? content : contractAddress}
    </Link>
);

export default LinkTescInspect;