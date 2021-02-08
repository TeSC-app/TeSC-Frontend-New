import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Popup, Input, Form, Checkbox } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment';
import SearchBox from './SearchBox';

const ENTRIES_PER_PAGE = 5;

export const COL = {
    DOMAIN: 'Domain',
    ADDRESS: 'Address',
    VERIF: 'Verification',
    REG: 'Registry',
    FAV: 'Favorites',
    CA: 'Created At',
    TSC: 'Total Smart Contracts',
    EXPIRY: 'Expiry'
};

export const hasAllColumns = (cols) => {
    return cols.has(COL.DOMAIN) && cols.has(COL.ADDRESS) && cols.has(COL.EXPIRY) && cols.has(COL.VERIF) &&
        cols.has(COL.REG) && cols.has(COL.FAV) && cols.has(COL.CA);
};

function TableOverview(props) {
    const {
        rowData,
        tescsWithOccurances,
        handleLoading,
        handleIsExploringDomain,
        cols
    } = props;

    const { web3, account, loadStorage } = useContext(AppContext);

    const [tescs, setTescs] = useState(rowData);
    const [tescsWithOccurancesNew, setTescsWithOccurancesNew] = useState(tescsWithOccurances)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(cols.has(COL.TSC) ? Math.ceil(tescsWithOccurancesNew.length / ENTRIES_PER_PAGE) : tescs ? Math.ceil(tescs.length / ENTRIES_PER_PAGE) : 0);
    const [displayedEntries, setDisplayedEntries] = useState([]);

    //for search input
    const [domain, setDomain] = useState('');


    //for sorting - asc state and status state
    const [isSortingByAddressAsc, setIsSortingByAddressAsc] = useState(true)
    const [isSortingByAddress, setIsSortingByAddress] = useState(false)
    const [isSortingByDomainAsc, setIsSortingByDomainAsc] = useState(true)
    const [isSortingByDomain, setIsSortingByDomain] = useState(false)
    const [isSortingByExpiryAsc, setIsSortingByExpiryAsc] = useState(true)
    const [isSortingByExpiry, setIsSortingByExpiry] = useState(false)
    const [isSortingByVerifiedAsc, setIsSortingByVerifiedAsc] = useState(true)
    const [isSortingByVerified, setIsSortingByVerified] = useState(false)
    const [isSortingByTotalSmartContractsAsc, setIsSortingByTotalSmartContractsAsc] = useState(true)
    const [isSortingByTotalSmartContracts, setIsSortingByTotalSmartContracts] = useState(false)
    const [isSortingByIsInRegistryAsc, setIsSortingByIsInRegistryAsc] = useState(true)
    const [isSortingByIsInRegistry, setIsSortingByIsInRegistry] = useState(false)
    const [isSortingByFavouriteAsc, setIsSortingByFavouriteAsc] = useState(true)
    const [isSortingByFavourite, setIsSortingByFavourite] = useState(false)
    const [isSortingByCreatedAtAsc, setIsSortingByCreatedAtAsc] = useState(true)
    const [isSortingByCreatedAt, setIsSortingByCreatedAt] = useState(false)

    //for filtering - for input and for status
    const [isShowingFilters, setIsShowingFilters] = useState(false)
    const [isOwnFilter, setIsOwnFilter] = useState(true)
    const [isNotOwnFilter, setIsNotOwnFilter] = useState(true)
    const [isOwnFiltered, setIsOwnFiltered] = useState(false)
    const [domainFilter, setDomainFilter] = useState('')
    const [domainFiltered, setDomainFiltered] = useState(false)
    const [contractAddressFilter, setContractAddressFilter] = useState('')
    const [contractAddressFiltered, setContractAddressFiltered] = useState(false)
    const [expiryFromFilter, setExpiryFromFilter] = useState('')
    const [expiryToFilter, setExpiryToFilter] = useState('')
    const [expiryFiltered, setExpiryFiltered] = useState(false)
    const [isVerifiedFilter, setIsVerifiedFilter] = useState(true)
    const [isNotVerifiedFilter, setIsNotVerifiedFilter] = useState(true)
    const [verifiedFiltered, setVerifiedFiltered] = useState(false)
    const [isInRegistryFilter, setIsInRegistryFilter] = useState(true)
    const [isNotInRegistryFilter, setIsNotInRegistryFilter] = useState(true)
    const [isInRegistryFiltered, setIsInRegistryFiltered] = useState(false)
    const [isFavouriteFilter, setIsFavouriteFilter] = useState(true)
    const [isNotFavouriteFilter, setIsNotFavouriteFilter] = useState(true)
    const [isFavouriteFiltered, setIsFavouriteFiltered] = useState(false)
    const [createdAtFromFilter, setCreatedAtFromFilter] = useState('')
    const [createdAtToFilter, setCreatedAtToFilter] = useState('')
    const [createdAtFiltered, setCreatedAtFiltered] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                // setTescs(account ? (isDashboard? loadStorage() : []) : []);
                setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRIES_PER_PAGE) : []);
                setTotalPages(cols.has(COL.TSC) ? Math.ceil(tescsWithOccurancesNew.length / ENTRIES_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRIES_PER_PAGE : 0));
                window.ethereum.on('accountsChanged', (accounts) => {
                    const account = web3.utils.toChecksumAddress(accounts[0]);
                    setTescs(accounts[0] && localStorage.getItem(account) ?
                        JSON.parse(localStorage.getItem(account)) : []);
                    setDisplayedEntries(account && localStorage.getItem(account) ?
                        JSON.parse(localStorage.getItem(account)).slice(0, ENTRIES_PER_PAGE) : []);
                });
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3, cols, tescsWithOccurancesNew,]);


    const handleChangeTescs = (tesc) => {
        const updatedTescs = [...(tescs.filter(tesc_ => tesc_.contractAddress !== tesc.contractAddress)), tesc];
        if (!cols.has(COL.REG)) {
            let tescsNew = loadStorage() ? loadStorage() : [];
            let found = false;
            for (const tescNew of tescsNew) {
                if (tescNew.contractAddress === tesc.contractAddress) {
                    found = true;
                    if (tescNew.isFavourite) {
                        tescNew.isFavourite = false;
                    } else {
                        tescNew.isFavourite = true;
                    }
                    localStorage.setItem(account, JSON.stringify(tescsNew));
                    break;
                }
            }
            if (!found) {
                tescsNew.push({ contractAddress: tesc.contractAddress, domain: tesc.domain, expiry: tesc.expiry, isFavourite: true, own: false, createdAt: moment().unix(), verified: tesc.verified });
                localStorage.setItem(account, JSON.stringify(tescsNew));
            }

            setTescs(updatedTescs.sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        } else {
            setTescs(updatedTescs.sort((tescA, tescB) => tescA.createdAt.toString().localeCompare(tescB.createdAt)));
            localStorage.setItem(account, JSON.stringify(updatedTescs));
        }
    };

    const changePage = (event, { activePage }) => {
        //check if there are filters applied
        setCurrentPage(activePage);
        if (!cols.has(COL.TSC)) {
            setTotalPages(Math.ceil(tescs.length / ENTRIES_PER_PAGE));
            setDisplayedEntries(tescs.slice((activePage - 1) * ENTRIES_PER_PAGE, activePage * ENTRIES_PER_PAGE));
        } else {
            setDisplayedEntries(tescsWithOccurancesNew.slice((activePage - 1) * ENTRIES_PER_PAGE, activePage * ENTRIES_PER_PAGE));
        }
    };

    const renderRows = () => {
        if (displayedEntries && !cols.has(COL.TSC)) {
            return displayedEntries.map((tesc) => (
                <TableEntry key={tesc.contractAddress}
                    tesc={tesc}
                    onTescsChange={handleChangeTescs}
                    cols={cols}
                    setVerificationInTescs={setVerificationInTescs}
                />
            ));
        } else if (displayedEntries && cols.has(COL.TSC)) {
            return tescsWithOccurancesNew.map((entry) => (
                <TableEntry key={entry.domain}
                    tesc={entry}
                    handleSearchInput={handleSearchInput}
                    handleSearchSubmit={handleSearchSubmit}
                    cols={cols}
                />));
        }
    };

    const handleSearchInput = domain => {
        setDomain(domain);
    };

    const handleSearchSubmit = (domain) => {
        handleLoading(true);
        if (domain === '') {
            handleIsExploringDomain(false);
            setTescs(tescsWithOccurancesNew);
        } else {
            handleIsExploringDomain(true);
            setTescs(rowData.filter(entry => entry.domain === domain).sort((tescA, tescB) => tescB.expiry - tescA.expiry));
        }
        handleLoading(false);
    };

    const renderSearchBox = () => {
        return !cols.has(COL.REG) ? (<SearchBox
            onChange={handleSearchInput}
            onSubmit={handleSearchSubmit}
            value={domain}
            placeholder='www.mysite.com'
            label='Domain'
            icon='search'
            validInput={true}
        />) : null;
    };

    const clearSorting = () => {
        setIsSortingByDomain(false)
        setIsSortingByAddress(false)
        setIsSortingByExpiry(false)
        setIsSortingByVerified(false)
        setIsSortingByTotalSmartContracts(false)
        setIsSortingByIsInRegistry(false)
        setIsSortingByFavourite(false)
        setIsSortingByCreatedAt(false)
    }

    const sortByContractAddress = () => {
        if (isSortingByAddressAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.contractAddress - tescB.contractAddress).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByAddressAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.contractAddress - tescA.contractAddress).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByAddressAsc(true)
        }
        clearSorting()
        setIsSortingByAddress(true)
    }

    const sortByDomain = (tescs) => {
        if (isSortingByDomainAsc) {
            if (!cols.has(COL.TSC)) setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.domain.localeCompare(tescB.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            else setTescsWithOccurancesNew(tescs.sort((tescA, tescB) => tescA.domain.localeCompare(tescB.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByDomainAsc(false)
        } else {
            if (!cols.has(COL.TSC)) setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            else setTescsWithOccurancesNew(tescs.sort((tescA, tescB) => tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByDomainAsc(true)
        }
        clearSorting()
        setIsSortingByDomain(true)
    }

    const sortByExpiry = () => {
        console.log(tescs)
        if (isSortingByExpiryAsc) {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.expiry.toString().localeCompare(tescB.expiry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByExpiryAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.expiry.toString().localeCompare(tescA.expiry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByExpiryAsc(true)
        }
        clearSorting()
        setIsSortingByExpiry(true)
    }

    const sortByVerified = () => {
        if (isSortingByVerifiedAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.verified.toString().localeCompare(tescB.verified)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByVerifiedAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.verified.toString().localeCompare(tescA.verified)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByVerifiedAsc(true)
        }
        clearSorting()
        setIsSortingByVerified(true)
    }

    const sortByTotalSmartContracts = () => {
        if (isSortingByTotalSmartContractsAsc) {
            setTescsWithOccurancesNew(tescsWithOccurancesNew.sort((tescA, tescB) => tescA.contractCount.toString().localeCompare(tescB.contractCount)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByTotalSmartContractsAsc(false)
        } else {
            setTescsWithOccurancesNew(tescsWithOccurancesNew.sort((tescA, tescB) => tescB.contractCount.toString().localeCompare(tescA.contractCount)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByTotalSmartContractsAsc(true)
        }
        clearSorting()
        setIsSortingByTotalSmartContracts(true)
    }

    const sortByIsInRegistry = () => {
        if (isSortingByIsInRegistryAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.isInRegistry.toString().localeCompare(tescB.isInRegistry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByIsInRegistryAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.isInRegistry.toString().localeCompare(tescA.isInRegistry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByIsInRegistryAsc(true)
        }
        clearSorting()
        setIsSortingByIsInRegistry(true)
    }

    const sortByFavourite = () => {
        if (isSortingByFavouriteAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.isFavourite.toString().localeCompare(tescB.isFavourite)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByFavouriteAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.isFavourite.toString().localeCompare(tescA.isFavourite)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByFavouriteAsc(true)
        }
        clearSorting()
        setIsSortingByFavourite(true)
    }

    const sortByCreatedAt = () => {
        if (isSortingByCreatedAtAsc) {
            console.log(tescs)
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescA.createdAt.toString().localeCompare(tescB.createdAt)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByCreatedAtAsc(false)
        } else {
            setDisplayedEntries(tescs.sort((tescA, tescB) => tescB.createdAt.toString().localeCompare(tescA.createdAt)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setIsSortingByCreatedAtAsc(true)
        }
        clearSorting()
        setIsSortingByCreatedAt(true)
    }

    const setVerificationInTescs = (tescsWithVerification) => {
        setTescs(tescsWithVerification)
    }

    const clearFilters = () => {
        setIsOwnFilter(true)
        setIsNotOwnFilter(true)
        setIsOwnFiltered(false)
        setDomainFiltered(false)
        setContractAddressFiltered(false)
        setExpiryFiltered(false)
        setExpiryFromFilter('')
        setExpiryToFilter('')
        setVerifiedFiltered(false)
        setIsVerifiedFilter(true)
        setIsNotVerifiedFilter(true)
        setIsInRegistryFiltered(false)
        setIsInRegistryFilter(true)
        setIsNotInRegistryFilter(true)
        setIsFavouriteFiltered(false)
        setIsFavouriteFilter(true)
        setIsNotFavouriteFilter(true)
        setCreatedAtFiltered(false)
        setCreatedAtFromFilter('')
        setCreatedAtToFilter('')
        setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        setTescs(rowData)
        setTescsWithOccurancesNew(tescsWithOccurances)
    }

    //filtering logic starts from here

    const filterByOwn = (isOwnFilter, isNotOwnFilter) => {
        if (isOwnFilter === true && isNotOwnFilter === true) {
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        } else if (isOwnFilter === true && isNotOwnFilter === false) {
            setDisplayedEntries(tescs.filter(tesc => tesc.own === true).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.own === true))
        } else if (isOwnFilter === false && isNotOwnFilter === true) {
            setDisplayedEntries(tescs.filter(tesc => tesc.own === false).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.own === false))
        } else {
            setDisplayedEntries([])
            setTescs([])
        }
        setIsOwnFiltered(true)
    }

    const handleIsOwnFilter = () => {
        if (isOwnFilter) setIsOwnFilter(false)
        else setIsOwnFilter(true)
    }

    const handleIsNotOwnFilter = () => {
        if (isNotOwnFilter) setIsNotOwnFilter(false)
        else setIsNotOwnFilter(true)
    }

    const filterByDomain = (domain, tescs) => {
        if (!cols.has(COL.TSC)) {
            if (domain !== '') {
                setDisplayedEntries(tescs.filter(tesc => tesc.domain === domain).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => tesc.domain === domain))
            } else {
                clearFilters()
            }
        } else {
            if (domain !== '')
                setTescsWithOccurancesNew(tescs.filter(tesc => tesc.domain === domain).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            else {
                clearFilters()
            }
        }
        setDomainFiltered(true)
    }

    const handleDomainFilter = (e) => {
        setDomainFilter(e.target.value)
    }

    const filterByContractAddress = (contractAddress) => {
        if (contractAddress !== '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.contractAddress === contractAddress).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.contractAddress === contractAddress))
        } else {
            clearFilters()
        }
        setContractAddressFiltered(true)
    }

    const handleContractAddressFilter = (e) => {
        setContractAddressFilter(e.target.value)
    }

    const filterByExpiry = (expiryFromFilter, expiryToFilter) => {
        if (expiryFromFilter !== '' && expiryToFilter !== '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.expiry >= expiryFromFilter && tesc.expiry <= expiryToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.expiry >= expiryFromFilter && tesc.expiry <= expiryToFilter))
        } else if (expiryFromFilter === '' && expiryToFilter !== '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.expiry <= expiryToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.expiry <= expiryToFilter))
        } else if (expiryFromFilter !== '' && expiryToFilter === '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.expiry >= expiryFromFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.expiry >= expiryFromFilter))
        } else {
            setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(rowData)
        }
        setExpiryFiltered(true)
    }

    const handleExpiryFromFilter = (date) => {
        setExpiryFromFilter(convertToUnix(date))
    }

    const handleExpiryToFilter = (date) => {
        setExpiryToFilter(convertToUnix(date))
    }

    const filterByVerified = (isVerifiedFilter, isNotVerifiedFilter) => {
        if (isVerifiedFilter === true && isNotVerifiedFilter === true) {
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        } else if (isVerifiedFilter === true && isNotVerifiedFilter === false) {
            setDisplayedEntries(tescs.filter(tesc => tesc.verified === true).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.verified === true))
        } else if (isVerifiedFilter === false && isNotVerifiedFilter === true) {
            setDisplayedEntries(tescs.filter(tesc => tesc.verified === false).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.verified === false))
        } else {
            setDisplayedEntries([])
            setTescs([])
        }
        setVerifiedFiltered(true)
    }

    const handleIsVerifiedFilter = () => {
        if (isVerifiedFilter) setIsVerifiedFilter(false)
        else setIsVerifiedFilter(true)
    }

    const handleIsNotVerifiedFilter = () => {
        if (isNotVerifiedFilter) setIsNotVerifiedFilter(false)
        else setIsNotVerifiedFilter(true)
    }

    const filterByIsInRegistry = (isInRegistryFilter, isNotInRegistryFilter) => {
        if (isInRegistryFilter === true && isNotInRegistryFilter === true) {
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        } else if (isInRegistryFilter === true && isNotInRegistryFilter === false) {
            setDisplayedEntries(tescs.filter(tesc => tesc.isInRegistry === true).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.isInRegistry === true))
        } else if (isInRegistryFilter === false && isNotInRegistryFilter === true) {
            setDisplayedEntries(tescs.filter(tesc => tesc.isInRegistry === false).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.isInRegistry === false))
        } else {
            setDisplayedEntries([])
            setTescs([])
        }
        setIsInRegistryFiltered(true)
    }

    const handleIsInRegistryFilter = () => {
        if (isInRegistryFilter) setIsInRegistryFilter(false)
        else setIsInRegistryFilter(true)
    }

    const handleIsNotInRegistryFilter = () => {
        if (isNotInRegistryFilter) setIsNotInRegistryFilter(false)
        else setIsNotInRegistryFilter(true)
    }

    const filterByIsFavourite = (isFavouriteFilter, isNotFavouriteFilter) => {
        if (isFavouriteFilter === true && isNotFavouriteFilter === true) {
            setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        } else if (isFavouriteFilter === true && isNotFavouriteFilter === false) {
            setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === true).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.isFavourite === true))
        } else if (isFavouriteFilter === false && isNotFavouriteFilter === true) {
            setDisplayedEntries(tescs.filter(tesc => tesc.isFavourite === false).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.isFavourite === false))
        } else {
            setDisplayedEntries([])
            setTescs([])
        }
        setIsFavouriteFiltered(true)
    }

    const handleIsFavouriteFilter = () => {
        if (isFavouriteFilter) setIsFavouriteFilter(false)
        else setIsFavouriteFilter(true)
    }

    const handleIsNotFavouriteFilter = () => {
        if (isNotFavouriteFilter) setIsNotFavouriteFilter(false)
        else setIsNotFavouriteFilter(true)
    }

    const filterByCreatedAt = (createdAtFromFilter, createdAtToFilter) => {
        if (createdAtFromFilter !== '' && createdAtToFilter !== '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter && tesc.createdAt <= createdAtToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter && tesc.createdAt <= createdAtToFilter))
        } else if (createdAtFromFilter === '' && createdAtToFilter !== '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.createdAt <= createdAtToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.createdAt <= createdAtToFilter))
        } else if (createdAtFromFilter !== '' && createdAtToFilter === '') {
            setDisplayedEntries(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(tescs.filter(tesc => tesc.createdAt >= createdAtFromFilter))
        } else {
            setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(rowData)
        }
        setCreatedAtFiltered(true)
    }

    const handleCreatedAtFromFilter = date => {
        setCreatedAtFromFilter(convertToUnix(date))
    }

    const handleCreatedAtToFilter = date => {
        setCreatedAtToFilter(convertToUnix(date))
    }

    const convertToUnix = date => {
        const mDate = moment.utc(date);
        mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        return mDate.unix()
    }

    //end of filtering logic

    const renderFilteringDropdownForCheckboxes = (title, isTypeFilter, handleIsTypeFilter, isNotTypeFilter, handleIsNotTypeFilter, filterByType) => {
        const checkboxLabelOne = title === 'Verified' ? 'Verified' : title === 'Registry' ? 'In Registry' : title === 'Favourites' ? 'Favourite' : title === 'Own' ? 'Own' : ''
        const checkboxLabelTwo = title === 'Verified' ? 'Not Verified' : title === 'Registry' ? 'Not In Registry' : title === 'Favourites' ? 'Not Favourite' : title === 'Own' ? 'Not Own' : ''
        const classesDropdown = title === 'Verified' && verifiedFiltered ? 'icon dropdown-filters-filtered' :
            title === 'Verified' && !verifiedFiltered ? 'icon dropdown-filters' :
                title === 'Registry' && isInRegistryFiltered ? 'icon dropdown-filters-filtered' :
                    title === 'Registry' && !isInRegistryFiltered ? 'icon dropdown-filters' :
                        title === 'Favourites' && isFavouriteFiltered ? 'icon dropdown-filters-filtered' :
                            title === 'Favourites' && !isFavouriteFiltered ? 'icon dropdown-filters' :
                                title === 'Own' && isOwnFiltered ? 'icon dropdown-filters-filtered' :
                                    title === 'Own' && !isOwnFiltered ? 'icon dropdown-filters' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon='angle down'
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Field><Checkbox className='checkbox__label' label={checkboxLabelOne} checked={isTypeFilter} onChange={handleIsTypeFilter} /></Form.Field>
                        <Form.Field><Checkbox className='checkbox__label' label={checkboxLabelTwo} checked={isNotTypeFilter} onChange={handleIsNotTypeFilter} /></Form.Field>
                        <Button basic className='dropdown-filters__menu__button' size='tiny' onClick={() => filterByType(isTypeFilter, isNotTypeFilter)}>Filter</Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFilteringDropdownForDayPickers = (title, dateFrom, handleDateFrom, dateTo, handleDateTo, filterByType) => {
        const classesDropdown = title === 'Expiry' && expiryFiltered ? 'icon dropdown-filters-filtered' :
            title === 'Expiry' && !expiryFiltered ? 'icon dropdown-filters' :
                title === 'Created At' && createdAtFiltered ? 'icon dropdown-filters-filtered' :
                    title === 'Created At' && !createdAtFiltered ? 'icon dropdown-filters' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Field><DayPickerInput
                            value={dateFrom ? formatDate(new Date(dateFrom * 1000), 'DD/MM/YYYY') : null}
                            onDayChange={handleDateFrom}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            inputProps={{ readOnly: true }}
                            component={props => <Input icon='calendar alternate outline' {...props} />}
                        /></Form.Field>
                        <Form.Field>
                            <DayPickerInput
                                value={dateTo ? formatDate(new Date(dateTo * 1000), 'DD/MM/YYYY') : null}
                                onDayChange={handleDateTo}
                                format="DD/MM/YYYY"
                                formatDate={formatDate}
                                parseDate={parseDate}
                                placeholder='dd/mm/yyyy'
                                inputProps={{ readOnly: true }}
                                component={props => <Input icon='calendar alternate outline' {...props} />}
                            /></Form.Field>
                        <Button basic className='dropdown-filters__menu__button' size='tiny' onClick={() => filterByType(dateFrom, dateTo)}>Filter</Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)

    }

    const renderFilteringDropdownGeneral = (title, filterByType, filterStateOne, handleChangeOne) => {
        const placeholder = title === 'Domain' ? 'gaulug.de' : 'Address' ? '0xdF0d...' : ''
        const classesDropdown = title === 'Domain' && domainFiltered ? 'icon dropdown-filters-filtered' :
            title === 'Domain' && !domainFiltered ? 'icon dropdown-filters' :
                title === 'Address' && contractAddressFiltered ? 'icon dropdown-filters-filtered' :
                    title === 'Address' && !contractAddressFiltered ? 'icon dropdown-filters' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Input placeholder={placeholder} onChange={handleChangeOne} />
                        <Button basic className='dropdown-filters__menu__button' size='tiny' onClick={!cols.has(COL.TSC) ? () => filterByType(filterStateOne, tescs) : () => filterByType(filterStateOne, tescsWithOccurancesNew)}>Filter</Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFiltersGroup = () => {
        if (isShowingFilters) {
            return (<>
                {hasAllColumns(cols) ? renderFilteringDropdownForCheckboxes("Own", isOwnFilter, handleIsOwnFilter, isNotOwnFilter, handleIsNotOwnFilter, filterByOwn) : null}
                {cols.has(COL.ADDRESS) ? renderFilteringDropdownGeneral("Address", filterByContractAddress, contractAddressFilter, handleContractAddressFilter) : null}
                {renderFilteringDropdownGeneral("Domain", filterByDomain, domainFilter, handleDomainFilter)}
                {cols.has(COL.EXPIRY) ? renderFilteringDropdownForDayPickers("Expiry", expiryFromFilter, handleExpiryFromFilter, expiryToFilter, handleExpiryToFilter, filterByExpiry) : null}
                {cols.has(COL.TSC) ? renderFilteringDropdownGeneral("Total Smart Contracts") : null}
                {!cols.has(COL.TSC) ? renderFilteringDropdownForCheckboxes("Verified", isVerifiedFilter, handleIsVerifiedFilter, isNotVerifiedFilter, handleIsNotVerifiedFilter, filterByVerified) : null}
                {cols.has(COL.REG) ? renderFilteringDropdownForCheckboxes("Registry", isInRegistryFilter, handleIsInRegistryFilter, isNotInRegistryFilter, handleIsNotInRegistryFilter, filterByIsInRegistry) : null}
                {cols.has(COL.FAV) ? renderFilteringDropdownForCheckboxes("Favourites", isFavouriteFilter, handleIsFavouriteFilter, isNotFavouriteFilter, handleIsNotFavouriteFilter, filterByIsFavourite) : null}
                {cols.has(COL.CA) ? renderFilteringDropdownForDayPickers("Created At", createdAtFromFilter, handleCreatedAtFromFilter, createdAtToFilter, handleCreatedAtToFilter, filterByCreatedAt) : null}
            </>)
        }
    }

    const renderClearFiltersButton = () => {
        if (domainFiltered || contractAddressFiltered || expiryFiltered || isInRegistryFiltered || verifiedFiltered || isFavouriteFiltered || createdAtFiltered || isOwnFiltered) return (<Button
            content='Clear filters'
            icon='remove circle'
            basic
            className='dropdown-filters__menu__button'
            onClick={clearFilters}
        />)
    }

    return (
        <>
            {renderSearchBox()}
            <div style={{ textAlign: 'end' }}>
                {renderFiltersGroup()}
                {renderClearFiltersButton()}
                <Button
                    content='Filters'
                    icon='filter'
                    basic
                    className='dropdown-filters__menu__button'
                    onClick={() => { isShowingFilters ? setIsShowingFilters(false) : setIsShowingFilters(true) }}
                />
            </div>
            <Table color='purple'>
                <Table.Header active='true' style={{ backgroundColor: 'purple' }}>
                    <Table.Row>
                        {!cols.has(COL.TSC) && <Table.HeaderCell>{
                            <Button basic className='column-header' onClick={sortByContractAddress}>
                                Address{isSortingByAddress ? <Icon className='column-header__sort' name={isSortingByAddressAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        <Table.HeaderCell>{
                            <Button basic className='column-header' onClick={cols.has(COL.TSC) ? () => sortByDomain(tescsWithOccurances) : () => sortByDomain(tescs)}>
                                Domain{isSortingByDomain ? <Icon className='column-header__sort' name={isSortingByDomainAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>
                        {!cols.has(COL.TSC) && <Table.HeaderCell>{
                            <Button basic className='column-header' onClick={sortByExpiry}>
                                Expiry{isSortingByExpiry ? <Icon className='column-header__sort' name={isSortingByExpiryAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        {cols.has(COL.TSC) && <Table.HeaderCell textAlign="center">{
                            <Button basic className='column-header' onClick={sortByTotalSmartContracts}>
                                Total Smart Contracts{isSortingByTotalSmartContracts ? <Icon className='column-header__sort' name={isSortingByTotalSmartContractsAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        <Table.HeaderCell textAlign="center">{
                            <Button basic className='column-header' onClick={sortByVerified}>
                                Verified{isSortingByVerified ? <Icon className='column-header__sort' name={isSortingByVerifiedAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>
                        {cols.has(COL.REG) &&
                            <Table.HeaderCell textAlign="center">{
                                <Button basic className='column-header' onClick={sortByIsInRegistry}>
                                    Registry{isSortingByIsInRegistry ? <Icon className='column-header__sort' name={isSortingByIsInRegistryAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }</Table.HeaderCell>
                        }
                        {!cols.has(COL.TSC) &&
                            <Table.HeaderCell textAlign="center">{
                                <Button basic className='column-header' onClick={sortByFavourite}>
                                    Favourites{isSortingByFavourite ? <Icon className='column-header__sort' name={isSortingByFavouriteAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }
                                {/*<Dropdown
                                    icon='filter'
                                    floating
                                    button
                                    className='icon dropdown-favourites'>
                                    <Dropdown.Menu>
                                        <Dropdown.Item icon='redo' text={!cols.has(COL.REG) && domain.length > 0 ? 'All (by domain)' : 'All'} onClick={() => showAllTescs(tescs)} />
                                        {!cols.has(COL.REG) && <Dropdown.Item icon='redo' text='All (reset)' onClick={() => handleIsExploringDomain(false)} />}
                                        <Dropdown.Item icon='heart' text='By favourite' onClick={showFavouriteTescs} />
                                        <Dropdown.Item icon='user' text='Own' onClick={showOwnTescs} />
                                    </Dropdown.Menu>
                            </Dropdown>*/}
                            </Table.HeaderCell>
                        }
                        {cols.has(COL.CA) &&
                            <Table.HeaderCell>{
                                <Button basic className='column-header' onClick={sortByCreatedAt}>
                                    Created At{isSortingByCreatedAt ? <Icon className='column-header__sort' name={isSortingByCreatedAtAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }</Table.HeaderCell>
                        }
                    </Table.Row>
                </Table.Header>
                {(
                    <Table.Body>
                        {renderRows()}
                    </Table.Body>
                )}
            </Table>
            { totalPages > 0 ?
                <div className='pagination'>
                    <Pagination
                        totalPages={totalPages}
                        activePage={currentPage}
                        onPageChange={changePage}
                        ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                        firstItem={totalPages > 8 ? { content: <Icon name='angle double left' />, icon: true } : null}
                        lastItem={totalPages > 8 ? { content: <Icon name='angle double right' />, icon: true } : null}
                        prevItem={{ content: <Icon name='angle left' />, icon: true }}
                        nextItem={{ content: <Icon name='angle right' />, icon: true }} />
                </div> : null
            }
        </>
    );
}

export default TableOverview;
