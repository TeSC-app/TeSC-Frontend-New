import React, { useState, useContext, useEffect, useRef } from 'react';
import 'react-day-picker/lib/style.css';
import PageHeader from '../components/PageHeader';
import TableOverview, { COL } from '../components/TableOverview';
import AppContext from '../appContext';

import { loadStorage } from '../utils/storage';

const Dashboard = () => {
    const { account } = useContext(AppContext);
    const [rowData, setRowData] = useState(loadStorage(account));

    useEffect(() => {
        setRowData(loadStorage(account));
    }, [account]);

    return (
        <React.Fragment>
            <PageHeader title='Dashboard' />
            {rowData &&
                <TableOverview
                    cols={new Set([COL.ADDRESS, COL.DOMAIN, COL.EXPIRY, COL.VERIF, COL.REG, COL.FAV, COL.CA])}
                    rowData={rowData}
                />
            }
        </React.Fragment>
    );


};

export default Dashboard;