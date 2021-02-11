import React, { useState, useContext, useEffect, useRef } from 'react';
import 'react-day-picker/lib/style.css';
import PageHeader from '../components/PageHeader';
import TableOverview, { COL } from '../components/TableOverview';
import AppContext from '../appContext';

import { loadStorage } from '../utils/storage';

const Dashboard = () => {
    const { web3 } = useContext(AppContext);
    const rowData = useRef(loadStorage(web3));

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            {rowData &&
                <TableOverview
                    cols={new Set([COL.ADDRESS, COL.DOMAIN, COL.EXPIRY, COL.VERIF, COL.REG, COL.FAV, COL.CA])}
                    rowData={rowData.current}
                />
            }
        </React.Fragment>
    );


};

export default Dashboard;