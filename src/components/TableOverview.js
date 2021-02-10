import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Popup, Input, Form, Checkbox } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment';
import SearchBox from './SearchBox';
import { convertToUnix } from '../utils/tesc'

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

    const [sortingTypes, setSortingTypes] = useState({
        isSortingByDomain: {isSortingByDomainAsc: true, isSorting: false},
        isSortingByAddress: { isSortingByAddressAsc: true, isSorting: false },
        isSortingByExpiry: { isSortingByExpiryAsc: true, isSorting: false },
        isSortingByVerified: { isSortingByVerifiedAsc: true, isSorting: false },
        isSortingByIsInRegistry: { isSortingByIsInRegistryAsc: true, isSorting: false },
        isSortingByFavourite: { isSortingByFavouriteAsc: true, isSorting: false },
        isSortingByCreatedAt: { isSortingByCreatedAtAsc: true, isSorting: false },
    })

    const [isShowingFilters, setIsShowingFilters] = useState(false)
    const [filterTypes, setFilterTypes] = useState({
        isOwnFilter: { isOwnFilter: true, isFiltered: false },
        isNotOwnFilter: { isNotOwnFilter: true, isFiltered: false },
        domainFilter: { domainFilter: '', isFiltered: false },
        contractAddressFilter: { contractAddressFilter: '', isFiltered: false },
        expiryFromFilter: { expiryFromFilter: '', isFiltered: false },
        expiryToFilter: { expiryToFilter: '', isFiltered: false },
        isVerifiedFilter: { isVerifiedFilter: true, isFiltered: false },
        isNotVerifiedFilter: { isNotVerifiedFilter: true, isFiltered: false },
        isInRegistryFilter: { isInRegistryFilter: true, isFiltered: false },
        isNotInRegistryFilter: { isNotInRegistryFilter: true, isFiltered: false },
        isFavouriteFilter: { isFavouriteFilter: true, isFiltered: false },
        isNotFavouriteFilter: { isNotFavouriteFilter: true, isFiltered: false },
        createdAtFromFilter: { createdAtFromFilter: '', isFiltered: false },
        createdAtToFilter: { createdAtToFilter: '', isFiltered: false }
    })

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
        setFilterTypes({
            isOwnFilter: { isOwnFilter: true, isFiltered: false },
            isNotOwnFilter: { isNotOwnFilter: true, isFiltered: false },
            domainFilter: { domainFilter: '', isFiltered: false },
            contractAddressFilter: { contractAddressFilter: '', isFiltered: false },
            expiryFromFilter: { expiryFromFilter: '', isFiltered: false },
            expiryToFilter: { expiryToFilter: '', isFiltered: false },
            isVerifiedFilter: { isVerifiedFilter: true, isFiltered: false },
            isNotVerifiedFilter: { isNotVerifiedFilter: true, isFiltered: false },
            isInRegistryFilter: { isInRegistryFilter: true, isFiltered: false },
            isNotInRegistryFilter: { isNotInRegistryFilter: true, isFiltered: false },
            isFavouriteFilter: { isFavouriteFilter: true, isFiltered: false },
            isNotFavouriteFilter: { isNotFavouriteFilter: true, isFiltered: false },
            createdAtFromFilter: { createdAtFromFilter: '', isFiltered: false },
            createdAtToFilter: { createdAtToFilter: '', isFiltered: false }
        })
        setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        setTescs(rowData)
        setTescsWithOccurancesNew(tescsWithOccurances)
    }

    const handleFiltersText = (e, { name, value }) => {
        setFilterTypes(prevState => ({ ...prevState, [name]: { [name]: value, filtered: false } }))
    }

    const handleFiltersCheckbox = (e, { name, checked }) => {
        setFilterTypes(prevState => ({ ...prevState, [name]: { [name]: checked, filtered: false } }))
    }

    const handleFiltersDate = (date, modifier, dayPickerInput) => {
        const name = dayPickerInput.props.inputProps.name
        setFilterTypes(prevState => ({ ...prevState, [name]: { [name]: convertToUnix(date), filtered: false } }))
        console.log('NEW: ', filterTypes)
    }

    const filterEntries = (filterType) => {
        switch (filterType) {
            case 'OWN':
                setDisplayedEntries(tescs.filter(tesc => filterTypes.isOwnFilter.isOwnFilter ? tesc.own === true :
                    filterTypes.isNotOwnFilter.isNotOwnFilter ? tesc.own === false : tesc)
                    .slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => filterTypes.isOwnFilter.isOwnFilter ? tesc.own === true :
                    filterTypes.isNotOwnFilter.isNotOwnFilter ? tesc.own === false : tesc)
                    .slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setFilterTypes(prevState => ({
                    ...prevState, 'isOwnFilter': { 'isOwnFilter': filterTypes.isOwnFilter.isOwnFilter, isFiltered: true },
                    'isNotOwnFilter': { 'isNotOwnFilter': filterTypes.isNotOwnFilter.isNotOwnFilter, isFiltered: true }
                }))
                break
            case 'ADDRESS':
                setDisplayedEntries(tescs.filter(tesc => tesc.contractAddress === filterTypes.contractAddressFilter.contractAddressFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => tesc.contractAddress === filterTypes.contractAddressFilter.contractAddressFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setFilterTypes(prevState => ({
                    ...prevState,
                    'contractAddressFilter': { 'contractAddressFilter': filterTypes.contractAddressFilter.contractAddressFilter, isFiltered: true }
                }))
                break
            case 'DOMAIN':
                setDisplayedEntries(tescs.filter(tesc => tesc.domain === filterTypes.domainFilter.domainFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => tesc.domain === filterTypes.domainFilter.domainFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setFilterTypes(prevState => ({
                    ...prevState, 'domainFilter': { 'domainFilter': filterTypes.domainFilter.domainFilter, isFiltered: true }
                }))
                break
            case 'EXPIRY':
                setDisplayedEntries(tescs.filter(tesc => tesc.expiry >= filterTypes.expiryFromFilter.expiryFromFilter && tesc.expiry <= filterTypes.expiryToFilter.expiryToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => tesc.expiry >= filterTypes.expiryFromFilter.expiryFromFilter && tesc.expiry <= filterTypes.expiryToFilter.expiryToFilter))
                setFilterTypes(prevState => ({
                    ...prevState, 'expiryFromFilter': { 'expiryFromFilter': filterTypes.expiryFromFilter.expiryFromFilter, isFiltered: true },
                    'expiryToFilter': { 'expiryToFilter': filterTypes.expiryToFilter.expiryToFilter, isFiltered: true }
                }))
                break
            case 'VERIFIED':
                setDisplayedEntries(tescs.filter(tesc => filterTypes.isVerifiedFilter.isVerifiedFilter ? tesc.isVerified === true : filterTypes.isNotVerifiedFilter.isNotVerifiedFilter ? tesc.verified === false : tesc).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => filterTypes.isVerifiedFilter.isVerifiedFilter ? tesc.isVerified === true : filterTypes.isNotVerifiedFilter.isNotVerifiedFilter ? tesc.verified === false : tesc))
                setFilterTypes(prevState => ({
                    ...prevState, 'isVerifiedFilter': { 'isVerifiedFilter': filterTypes.isVerifiedFilter.isVerifiedFilter, isFiltered: true },
                    'isNotVerifiedFilter': { 'isNotVerifiedFilter': filterTypes.isNotVerifiedFilter.isNotVerifiedFilter, isFiltered: true }
                }))
                break
            case 'REGISTRY':
                setDisplayedEntries(tescs.filter(tesc => filterTypes.isInRegistryFilter.isInRegistryFilter ? tesc.isInRegistry === true : filterTypes.isNotInRegistryFilter.isNotInRegistryFilter ? tesc.isInRegistry === false : tesc).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => filterTypes.isInRegistryFilter.isInRegistryFilter ? tesc.isInRegistry === true : filterTypes.isNotInRegistryFilter.isNotInRegistryFilter ? tesc.isInRegistry === false : tesc))
                setFilterTypes(prevState => ({
                    ...prevState, 'isInRegistryFilter': { 'isInRegistryFilter': filterTypes.isInRegistryFilter.isInRegistryFilter, isFiltered: true },
                    'isNotInRegistryFilter': { 'isNotInRegistryFilter': filterTypes.isNotInRegistryFilter.isNotInRegistryFilter, isFiltered: true }
                }))
                break
            case 'FAVOURITES':
                setDisplayedEntries(tescs.filter(tesc => filterTypes.isFavouriteFilter.isFavouriteFilter ? tesc.isFavourite === true : filterTypes.isNotFavouriteFilter.isNotFavouriteFilter ? tesc.isFavourite === false : tesc).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => filterTypes.isFavouriteFilter.isFavouriteFilter ? tesc.isFavourite === true : filterTypes.isNotFavouriteFilter.isNotFavouriteFilter ? tesc.isFavourite === false : tesc))
                setFilterTypes(prevState => ({
                    ...prevState, 'isFavouriteFilter': { 'isFavouriteFilter': filterTypes.isFavouriteFilter.isFavouriteFilter, isFiltered: true },
                    'isNotFavouriteFilter': { 'isNotFavouriteFilter': filterTypes.isNotFavouriteFilter.isNotFavouriteFilter, isFiltered: true }
                }))
                break
            case 'CREATED_AT':
                setDisplayedEntries(tescs.filter(tesc => tesc.createdAt >= filterTypes.createdAtFromFilter.createdAtFromFilter && tesc.createdAt <= filterTypes.createdAtToFilter.createdAtToFilter).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.filter(tesc => tesc.createdAt >= filterTypes.createdAtFromFilter.createdAtFromFilter && tesc.createdAt <= filterTypes.createdAtToFilter.createdAtToFilter))
                setFilterTypes(prevState => ({
                    ...prevState, 'createdAtFromFilter': { 'createdAtFromFilter': filterTypes.createdAtFromFilter.createdAtFromFilter, isFiltered: true },
                    'createdAtToFilter': { 'createdAtToFilter': filterTypes.createdAtToFilter.createdAtToFilter, isFiltered: true }
                }))
                break
            default:
                setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(rowData)
        }
    }

    //end of filtering logic
    const renderFilteringDropdownForCheckboxes = (filterType) => {
        const title = filterType === 'VERIFIED' ? 'Verified' : filterType === 'REGISTRY' ? 'Registry' :
            filterType === 'FAVOURITES' ? 'Favourites' : 'Own'
        const checkboxLabelOne = filterType === 'VERIFIED' ? 'Verified' : filterType === 'REGISTRY' ? 'In Registry' :
            filterType === 'FAVOURITES' ? 'Favourite' : filterType === 'OWN' ? 'Own' : ''
        const checkboxLabelTwo = filterType === 'VERIFIED' ? 'Not Verified' : filterType === 'REGISTRY' ? 'Not In Registry' :
            filterType === 'FAVOURITES' ? 'Not Favourite' : filterType === 'OWN' ? 'Not Own' : ''
        const inputPropNameOne = filterType === 'VERIFIED' ? 'isVerifiedFilter' : filterType === 'REGISTRY' ? 'isInRegistryFilter' :
            filterType === 'FAVOURITES' ? 'isFavouriteFilter' : 'isOwnFilter'
        const inputPropNameTwo = filterType === 'VERIFIED' ? 'isNotVerifiedFilter' : filterType === 'REGISTRY' ? 'isNotInRegistryFilter' :
            filterType === 'FAVOURITES' ? 'isNotFavouriteFilter' : 'isNotOwnFilter'
        const classesDropdown = filterType === 'VERIFIED' && (filterTypes.isVerifiedFilter.isFiltered || filterTypes.isNotVerifiedFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
            filterType === 'VERIFIED' && (!filterTypes.isVerifiedFilter.isFiltered && !filterTypes.isNotVerifiedFilter.isFiltered) ? 'icon dropdown-filters' :
                filterType === 'REGISTRY' && (filterTypes.isInRegistryFilter.isFiltered || filterTypes.isNotInRegistryFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                    filterType === 'REGISTRY' && (!filterTypes.isInRegistryFilter.isFiltered && !filterTypes.isNotInRegistryFilter.isFiltered) ? 'icon dropdown-filters' :
                        filterType === 'FAVOURITES' && (filterTypes.isFavouriteFilter.isFiltered || filterTypes.isNotFavouriteFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                            filterType === 'FAVOURITES' && (!filterTypes.isFavouriteFilter.isFiltered && !filterTypes.isNotFavouriteFilter.isFiltered) ? 'icon dropdown-filters' :
                                filterType === 'OWN' && (filterTypes.isOwnFilter.isFiltered || filterTypes.isNotOwnFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                                    filterType === 'OWN' && (!filterTypes.isOwnFilter.isFiltered && !filterTypes.isNotOwnFilter.isFiltered) ? 'icon dropdown-filters' : 'icon dropdown-filters'
        const checkedOne = filterType === 'OWN' ? filterTypes.isOwnFilter.isOwnFilter : filterType === 'VERIFIED' ?
            filterTypes.isVerifiedFilter.isVerifiedFilter : filterType === 'REGISTRY' ?
                filterTypes.isInRegistryFilter.isInRegistryFilter : filterTypes.isFavouriteFilter.isFavouriteFilter
        const checkedTwo = filterType === 'OWN' ? filterTypes.isNotOwnFilter.isNotOwnFilter : filterType === 'VERIFIED' ?
            filterTypes.isNotVerifiedFilter.isNotVerifiedFilter : filterType === 'REGISTRY' ?
                filterTypes.isNotInRegistryFilter.isNotInRegistryFilter : filterTypes.isNotFavouriteFilter.isNotFavouriteFilter
        return (
            <Dropdown
                text={title}
                icon='angle down'
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form onSubmit={() => filterEntries(filterType)}>
                        <Form.Checkbox className='checkbox__label' name={inputPropNameOne} label={checkboxLabelOne} checked={checkedOne} onChange={handleFiltersCheckbox} />
                        <Form.Checkbox className='checkbox__label' name={inputPropNameTwo} label={checkboxLabelTwo} checked={checkedTwo} onChange={handleFiltersCheckbox} />
                        <Form.Button content='Filter' basic className='dropdown-filters__menu__button' size='tiny' />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFilteringDropdownForDayPickers = (filterType, dateFrom, dateTo) => {
        const classesDropdown = filterType === 'EXPIRY' && (filterTypes.expiryFromFilter.isFiltered || filterTypes.expiryToFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
            filterType === 'EXPIRY' && !filterTypes.expiryFromFilter.isFiltered && !filterTypes.expiryToFilter.isFiltered ? 'icon dropdown-filters' :
                filterType === 'CREATED_AT' && (filterTypes.createdAtFromFilter.isFiltered || filterTypes.createdAtToFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                    filterType === 'CREATED_AT' && !filterTypes.createdAtFromFilter.isFiltered && !filterTypes.createdAtToFilter.isFiltered ? 'icon dropdown-filters' : 'icon dropdown-filters'
        const inputPropNameFrom = filterType === 'EXPIRY' ? 'expiryFromFilter' : 'createdAtFromFilter'
        const inputPropNameTo = filterType === 'EXPIRY' ? 'expiryToFilter' : 'createdAtToFilter'
        const title = filterType === 'EXPIRY' ? 'Expiry' : 'Created At'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form onSubmit={() => filterEntries(filterType)}>
                        <Form.Field><DayPickerInput
                            value={dateFrom ? formatDate(new Date(dateFrom * 1000), 'DD/MM/YYYY') : null}
                            onDayChange={handleFiltersDate}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            inputProps={{ readOnly: true, name: inputPropNameFrom }}
                            component={props => <Input icon='calendar alternate outline' {...props} />}
                        /></Form.Field>
                        <Form.Field>
                            <DayPickerInput
                                onDayChange={handleFiltersDate}
                                value={dateTo ? formatDate(new Date(dateTo * 1000), 'DD/MM/YYYY') : null}
                                format="DD/MM/YYYY"
                                formatDate={formatDate}
                                parseDate={parseDate}
                                placeholder='dd/mm/yyyy'
                                inputProps={{ readOnly: true, name: inputPropNameTo }}
                                component={props => <Input icon='calendar alternate outline' {...props} />}
                            /></Form.Field>
                        <Button basic content='Filter' className='dropdown-filters__menu__button' size='tiny' />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)

    }

    const renderFilteringDropdownTextfield = (filterType) => {
        const placeholder = filterType === 'DOMAIN' ? 'gaulug.de' : 'ADDRESS' ? '0xdF0d...' : ''
        const title = filterType === 'DOMAIN' ? 'Domain' : 'ADDRESS' ? 'Address' : ''
        const inputPropName = filterType === 'DOMAIN' ? 'domainFilter' : 'ADDRESS' ? 'contractAddressFilter' : ''
        const classesDropdown = filterType === 'DOMAIN' && filterTypes.domainFilter.isFiltered ? 'icon dropdown-filters-filtered' :
            filterType === 'DOMAIN' && !filterTypes.domainFilter.isFiltered ? 'icon dropdown-filters' :
                filterType === 'ADDRESS' && filterTypes.contractAddressFilter.isFiltered ? 'icon dropdown-filters-filtered' :
                    filterType === 'ADDRESS' && !filterTypes.contractAddressFilter.isFiltered ? 'icon dropdown-filters' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form onSubmit={() => filterEntries(filterType)}>
                        <Form.Input placeholder={placeholder} name={inputPropName} onChange={handleFiltersText} />
                        <Form.Button basic content='Filter' className='dropdown-filters__menu__button' size='tiny' />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFiltersGroup = () => {
        if (isShowingFilters) {
            return (<>
                {hasAllColumns(cols) ? renderFilteringDropdownForCheckboxes('OWN') : null}
                {cols.has(COL.ADDRESS) ? renderFilteringDropdownTextfield('ADDRESS') : null}
                {renderFilteringDropdownTextfield('DOMAIN')}
                {cols.has(COL.EXPIRY) ? renderFilteringDropdownForDayPickers('EXPIRY', filterTypes.expiryFromFilter.expiryFromFilter, filterTypes.expiryToFilter.expiryToFilter) : null}
                {cols.has(COL.TSC) ? renderFilteringDropdownTextfield("Total Smart Contracts") : null}
                {!cols.has(COL.TSC) ? renderFilteringDropdownForCheckboxes('VERIFIED') : null}
                {cols.has(COL.REG) ? renderFilteringDropdownForCheckboxes('REGISTRY') : null}
                {cols.has(COL.FAV) ? renderFilteringDropdownForCheckboxes('FAVOURITES') : null}
                {cols.has(COL.CA) ? renderFilteringDropdownForDayPickers('CREATED_AT', filterTypes.createdAtFromFilter.createdAtFromFilter, filterTypes.createdAtToFilter.createdAtToFilter) : null}
            </>)
        }
    }

    const renderClearFiltersButton = () => {
        return (<Button
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
