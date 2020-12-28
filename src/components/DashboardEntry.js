import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Table, Icon, Popup, Button } from 'semantic-ui-react';
import 'react-day-picker/lib/style.css';

import LinkTescInspect from '../components/InternalLink';


function DashboardEntry({ contractAddress, domain, expiry, isFavourite, currentAccount, index, tescs }) {
    const [tescIsInFavourites, setTescIsInFavourites] = useState(false);

    useEffect(() => {
        isFavourite ? setTescIsInFavourites(true) : setTescIsInFavourites(false);
    }, [isFavourite, setTescIsInFavourites, currentAccount]);

    const addRemoveFavourites = () => {
        if (tescIsInFavourites) {
            tescs[index]['isFavourite'] = false;
            setTescIsInFavourites(false);
        } else {
            tescs[index]['isFavourite'] = true;
            setTescIsInFavourites(true);
        }
        localStorage.setItem(currentAccount.toLowerCase(), JSON.stringify(tescs));
    };

    return (
        <Table.Row key={contractAddress}>
            <Table.Cell>
                <LinkTescInspect contractAddress={contractAddress} />
            </Table.Cell>
            <Table.Cell>{domain}</Table.Cell>
            <Table.Cell>{moment.unix(parseInt(expiry)).format('DD/MM/YYYY')}</Table.Cell>
            <Table.Cell textAlign="center">
                <Icon name="delete" color="red" circular />
            </Table.Cell>
            <Table.Cell textAlign="center">
                <Icon name="delete" color="red" circular />
            </Table.Cell>
            {
                <Table.Cell textAlign="center">
                    <Popup content={tescIsInFavourites ? 'Remove from favourites' : 'Add to favourites'}
                        trigger={<Button icon="heart" className={tescIsInFavourites ? "favourite" : "notFavourite"}
                            onClick={addRemoveFavourites} />} />
                </Table.Cell>
            }

        </Table.Row>
    );
}

export default DashboardEntry;
