import React from 'react';

import { Link } from 'react-router-dom';


const LinkTescInspect = ({ contractAddress }) => (
    <Link
        style={{ opacity: 'unset' }}
        to={{
            pathname: "/tesc/inspect",
            state: {
                contractAddress
            }
        }}
    >
        {contractAddress}
    </Link>
);

export default LinkTescInspect;