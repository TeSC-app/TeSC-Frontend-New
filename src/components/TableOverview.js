import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Popup, Input, Form, Checkbox, Image, Label, Divider } from 'semantic-ui-react';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';

import AppContext from '../appContext';
import TableEntry from './TableEntry';
import moment from 'moment';
import SearchBox from './SearchBox';
import { convertToUnix, extractSubdomainFromDomain } from '../utils/tesc'
import { forEach } from 'lodash';

import { loadStorage } from '../utils/storage';

export const ENTRIES_PER_PAGE = 5;

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
        handleDomainFilter,
        cols
    } = props;

    const { web3, account } = useContext(AppContext);

    const [tescs, setTescs] = useState(rowData);
    const [tescsWithOccurancesNew, setTescsWithOccurancesNew] = useState(tescsWithOccurances)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(cols.has(COL.TSC) ? Math.ceil(tescsWithOccurancesNew.length / ENTRIES_PER_PAGE) : tescs ? Math.ceil(tescs.length / ENTRIES_PER_PAGE) : 0);
    const [displayedEntries, setDisplayedEntries] = useState([]);

    //for search input inside registry inspect
    const [domain, setDomain] = useState('');

    const [sortingTypes, setSortingTypes] = useState({
        isSortingByDomain: { isSortingByDomainAsc: true, isSorting: false },
        isSortingByAddress: { isSortingByAddressAsc: true, isSorting: false },
        isSortingByExpiry: { isSortingByExpiryAsc: true, isSorting: false },
        isSortingByVerified: { isSortingByVerifiedAsc: true, isSorting: false },
        isSortingByIsInRegistry: { isSortingByIsInRegistryAsc: true, isSorting: false },
        isSortingByFavourite: { isSortingByFavouriteAsc: true, isSorting: false },
        isSortingByCreatedAt: { isSortingByCreatedAtAsc: true, isSorting: false },
        isSortingByTotalSC: { isSortingByTotalSCAsc: true, isSorting: false }
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

    const [subdomainFilter, setSubdomainFilter] = useState([])

    useEffect(() => {
        const init = async () => {
            try {
                if (cols.has(COL.TSC)) setDisplayedEntries(account && tescsWithOccurances ? tescsWithOccurances.slice(0, ENTRIES_PER_PAGE) : [])
                else setDisplayedEntries(account && tescs ? tescs.slice(0, ENTRIES_PER_PAGE) : []);

                setTotalPages(cols.has(COL.TSC) ? Math.ceil(tescsWithOccurancesNew.length / ENTRIES_PER_PAGE) : Math.ceil(tescs ? tescs.length / ENTRIES_PER_PAGE : 0));
                window.ethereum.on('accountsChanged', (accounts) => {
                    console.log('accounts changed');
                    const tescs = loadStorage(accounts[0]);
                    setTescs(tescs);
                    setDisplayedEntries(tescs.slice(0, ENTRIES_PER_PAGE));
                });
            }
            catch (error) {
                console.log(error);
            }
        };
        init();
    }, [tescs, account, web3, cols, tescsWithOccurancesNew, tescsWithOccurances]);

    useEffect(() => {
        setTescs(rowData);
        const subdomainList = rowData.filter(entry => extractSubdomainFromDomain(entry.domain) !== '').map(entry => extractSubdomainFromDomain(entry.domain))
        const subdomainFilterState = []
        const map = new Map();
        for (const subdomain of subdomainList) {
            if (!map.has(subdomain)) {
                map.set(subdomain, true);    // set any value to Map
                subdomainFilterState.push({ subdomain, isChecked: false, isFiltered: false })
            }
        }
        setSubdomainFilter(subdomainFilterState)
    }, [rowData])

    const handleChangeTescs = (tesc) => {
        if (hasAllColumns(cols)) {
            setTescs(loadStorage(account))
        } else setTescs(rowData.filter(entry => entry.domain.includes(domain)));
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
            return displayedEntries.filter(tesc => hasAllColumns(cols) ? tesc.isFavourite || tesc.own : true).map((tesc) => (
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

    const handleSearchSubmit = (e) => {
        const domain = e.target ? e.target[0].value : e
        handleLoading(true);
        if (domain === '') {
            handleIsExploringDomain(false);
            setTescsWithOccurancesNew(tescsWithOccurances);
        } else {
            handleIsExploringDomain(true);
            //for showing domain-specific analytics
            handleDomainFilter(domain)
            const filteredRowData = rowData.filter(entry => entry.domain.includes(domain)).sort((tescA, tescB) => tescB.expiry - tescA.expiry)
            setTescs(filteredRowData);
        }
        handleLoading(false);
    };

    const renderSearchBox = () => {
        return cols.has(COL.TSC) ? (<SearchBox
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
        setSortingTypes({
            isSortingByDomain: { isSortingByDomainAsc: true, isSorting: false },
            isSortingByAddress: { isSortingByAddressAsc: true, isSorting: false },
            isSortingByExpiry: { isSortingByExpiryAsc: true, isSorting: false },
            isSortingByVerified: { isSortingByVerifiedAsc: true, isSorting: false },
            isSortingByIsInRegistry: { isSortingByIsInRegistryAsc: true, isSorting: false },
            isSortingByFavourite: { isSortingByFavouriteAsc: true, isSorting: false },
            isSortingByCreatedAt: { isSortingByCreatedAtAsc: true, isSorting: false },
            isSortingByTotalSC: { isSortingByTotalSCAsc: true, isSorting: false }
        })
    }

    const sortEntries = (sortType) => {
        switch (sortType) {
            case 'ADDRESS':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByAddress.isSortingByAddressAsc ? tescA.contractAddress - tescB.contractAddress : tescB.contractAddress - tescA.contractAddress).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByAddress: { isSortingByAddressAsc: sortingTypes.isSortingByAddress.isSortingByAddressAsc ? false : true, isSorting: true } }))
                break
            case 'DOMAIN':
                if (cols.has(COL.TSC)) setDisplayedEntries(tescsWithOccurancesNew.sort((tescA, tescB) => sortingTypes.isSortingByDomain.isSortingByDomainAsc ? tescA.domain.localeCompare(tescB.domain) : tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                else setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByDomain.isSortingByDomainAsc ? tescA.domain.localeCompare(tescB.domain) : tescB.domain.localeCompare(tescA.domain)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByDomain: { isSortingByDomainAsc: sortingTypes.isSortingByDomain.isSortingByDomainAsc ? false : true, isSorting: true } }))
                break
            case 'EXPIRY':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByExpiry.isSortingByExpiryAsc ? tescA.expiry.toString().localeCompare(tescB.expiry) : tescB.expiry.toString().localeCompare(tescA.expiry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByExpiry: { isSortingByExpiryAsc: sortingTypes.isSortingByExpiry.isSortingByExpiryAsc ? false : true, isSorting: true } }))
                break
            case 'TOTAL_SC':
                setDisplayedEntries(tescsWithOccurances.sort((tescA, tescB) => sortingTypes.isSortingByTotalSC.isSortingByTotalSCAsc ? tescA.contractCount.toString().localeCompare(tescB.contractCount) : tescB.contractCount.toString().localeCompare(tescA.contractCount)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByTotalSC: { isSortingByTotalSCAsc: sortingTypes.isSortingByTotalSC.isSortingByTotalSCAsc ? false : true, isSorting: true } }))
                break
            case 'VERIFIED':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByVerified.isSortingByVerifiedAsc ? tescA.verified.toString().localeCompare(tescB.verified) : tescB.verified.toString().localeCompare(tescA.verified)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByVerified: { isSortingByVerifiedAsc: sortingTypes.isSortingByVerified.isSortingByVerifiedAsc ? false : true, isSorting: true } }))
                break
            case 'REGISTRY':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByIsInRegistry.isSortingByIsInRegistryAsc ? tescA.isInRegistry.toString().localeCompare(tescB.isInRegistry) : tescB.isInRegistry.toString().localeCompare(tescA.isInRegistry)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByIsInRegistry: { isSortingByIsInRegistryAsc: sortingTypes.isSortingByIsInRegistry.isSortingByIsInRegistryAsc ? false : true, isSorting: true } }))
                break
            case 'FAVOURITE':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByFavourite.isSortingByFavouriteAsc ? tescA.isFavourite.toString().localeCompare(tescB.isFavourite) : tescB.isFavourite.toString().localeCompare(tescA.isFavourite)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByFavourite: { isSortingByFavouriteAsc: sortingTypes.isSortingByFavourite.isSortingByFavouriteAsc ? false : true, isSorting: true } }))
                break
            case 'CREATED_AT':
                setDisplayedEntries(tescs.sort((tescA, tescB) => sortingTypes.isSortingByCreatedAt.isSortingByCreatedAtAsc ? tescA.createdAt.toString().localeCompare(tescB.createdAt) : tescB.createdAt.toString().localeCompare(tescA.createdAt)).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                clearSorting()
                setSortingTypes(prevState => ({ ...prevState, isSortingByCreatedAt: { isSortingByCreatedAtAsc: sortingTypes.isSortingByCreatedAt.isSortingByCreatedAtAsc ? false : true, isSorting: true } }))
                break
            default:
                setDisplayedEntries(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
                setTescs(tescs.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
        }
    }

    const setVerificationInTescs = (tescsWithVerification) => {
        setTescs(tescsWithVerification)
    }

    const clearFilters = () => {
        console.log(filterTypes)
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

        setSubdomainFilter(subdomainFilter.map(subdomainFilter => ({ ...subdomainFilter, isFiltered: false })))

        if (cols.has(COL.VERIF) && cols.has(COL.FAV) && !cols.has(COL.TSC)) {
            setDisplayedEntries(loadStorage(account).slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(loadStorage(account))
            if (cols.has(COL.DOMAIN) && !hasAllColumns(cols)) {
                handleIsExploringDomain(false)
            }
        } else if (cols.has(COL.TSC)) {
            handleIsExploringDomain(false)
            setDisplayedEntries(tescsWithOccurances.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescsWithOccurancesNew(tescsWithOccurances)
        }
    }

    const handleFiltersText = (e, { name, value }) => {
        setFilterTypes(prevState => ({ ...prevState, [name]: { [name]: value, isFiltered: false } }))
    }

    const handleFiltersDate = (date, modifier, dayPickerInput) => {
        const name = dayPickerInput.props.inputProps.name
        setFilterTypes(prevState => ({ ...prevState, [name]: { [name]: convertToUnix(date), isFiltered: false } }))
    }

    const filterForCheckboxes = (tescProperty, filterTypeA, filterTypeB, value = true) => {
        return filterTypeA && !filterTypeB ? tescProperty === value :
            !filterTypeA && filterTypeB ? tescProperty !== value : !filterTypeA && !filterTypeB ? false : true
    }

    const changeCheckboxFilters = (name, checked, filterType, tescProperty) => {
        const counterPart = Object.entries(filterTypes).filter(([k, v]) => k.toLowerCase().includes(filterType.toLowerCase()) && !k.toLowerCase().includes(name.toLowerCase())).map(([k, v]) => k)[0]
        const optionA = !name.toLowerCase().includes('not') ? checked : filterTypes[counterPart][counterPart]
        const optionB = name.toLowerCase().includes('not') ? checked : filterTypes[counterPart][counterPart]
        setFilterTypes({ ...filterTypes, [name]: { [name]: checked, isFiltered: true } })
        setTescs(tescs.filter(tesc => filterForCheckboxes(tesc[tescProperty], optionA, optionB, filterType.includes('OWN') ? account : true)))
    }

    const filterForSubdomain = (e, subdomain, checked, index) => {
        let items = [...subdomainFilter]
        let item = { ...items[index] }
        item.subdomain = subdomain
        item.isChecked = !checked
        item.isFiltered = true
        items[index] = item
        setTescs(tescs.filter(tesc => item.isChecked && extractSubdomainFromDomain(tesc.domain) === subdomain))
        setSubdomainFilter(items)
    }

    const filterEntries = (filterType, name, checked) => {
        switch (filterType) {
            case 'OWN':
                changeCheckboxFilters(name, checked, filterType, 'owner')
                break
            case 'ADDRESS':
                if (filterTypes.contractAddressFilter.contractAddressFilter !== '') {
                    setTescs(tescs.filter(tesc => tesc.contractAddress === filterTypes.contractAddressFilter.contractAddressFilter))
                    setFilterTypes(prevState => ({
                        ...prevState,
                        'contractAddressFilter': { 'contractAddressFilter': filterTypes.contractAddressFilter.contractAddressFilter, isFiltered: true }
                    }))
                }
                break
            case 'DOMAIN':
                if (filterTypes.domainFilter.domainFilter !== '') {
                    if (cols.has(COL.TSC)) setTescsWithOccurancesNew(tescsWithOccurances.filter(tesc => tesc.domain.includes(filterTypes.domainFilter.domainFilter)))
                    else setTescs(tescs.filter(tesc => tesc.domain.includes(filterTypes.domainFilter.domainFilter)))
                    setFilterTypes(prevState => ({
                        ...prevState, 'domainFilter': { 'domainFilter': filterTypes.domainFilter.domainFilter, isFiltered: true }
                    }))
                    if (cols.has(COL.DOMAIN) && !hasAllColumns(cols) && typeof handleDomainFilter !== 'undefined') {
                        handleDomainFilter(filterTypes.domainFilter.domainFilter)
                    }
                }
                break
            case 'EXPIRY':
                setTescs(tescs.filter(tesc => tesc.expiry >= filterTypes.expiryFromFilter.expiryFromFilter && tesc.expiry <= filterTypes.expiryToFilter.expiryToFilter))
                setFilterTypes(prevState => ({
                    ...prevState, 'expiryFromFilter': { 'expiryFromFilter': filterTypes.expiryFromFilter.expiryFromFilter, isFiltered: true },
                    'expiryToFilter': { 'expiryToFilter': filterTypes.expiryToFilter.expiryToFilter, isFiltered: true }
                }))
                break
            case 'VERIFIED':
                changeCheckboxFilters(name, checked, filterType, 'verified')
                break
            case 'REGISTRY':
                changeCheckboxFilters(name, checked, filterType, 'isInRegistry')
                break
            case 'FAVOURITE':
                changeCheckboxFilters(name, checked, filterType, 'isFavourite')
                break
            case 'CREATED_AT':
                setTescs(tescs.filter(tesc => tesc.createdAt >= filterTypes.createdAtFromFilter.createdAtFromFilter && tesc.createdAt <= filterTypes.createdAtToFilter.createdAtToFilter))
                setFilterTypes(prevState => ({
                    ...prevState, 'createdAtFromFilter': { 'createdAtFromFilter': filterTypes.createdAtFromFilter.createdAtFromFilter, isFiltered: true },
                    'createdAtToFilter': { 'createdAtToFilter': filterTypes.createdAtToFilter.createdAtToFilter, isFiltered: true }
                }))
                break
            default:
                setTescs(rowData)
        }
    }

    const renderFilteringDropdownForCheckboxesSubdomain = (subDomainFilterType) => {
        const title = subDomainFilterType === 'SUBDOMAIN' ? 'Subdomain' : ''
        const classesDropdown = subdomainFilter.some(subdomain => subdomain.isFiltered === true) ? 'icon dropdown-filters-filtered' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon='angle down'
                simple
                className={classesDropdown}
                onBlur={() => filterEntries(subDomainFilterType)}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        {subdomainFilter.map((subdomainFilter, index) => (
                            <Form.Checkbox className='checkbox__label' name={subdomainFilter.subdomain}
                                label={subdomainFilter.subdomain}
                                checked={subdomainFilter.isChecked}
                                onChange={(e) => filterForSubdomain(e, subdomainFilter.subdomain, subdomainFilter.isChecked, index)} />
                        ))}
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFilteringDropdownForCheckboxes = (filterType) => {
        const title = filterType === 'VERIFIED' ? 'Verified' : filterType === 'REGISTRY' ? 'Registry' :
            filterType === 'FAVOURITE' ? 'Favourites' : 'Own'
        const checkboxLabelOne = filterType === 'VERIFIED' ? 'Verified' : filterType === 'REGISTRY' ? 'In Registry' :
            filterType === 'FAVOURITE' ? 'Favourite' : filterType === 'OWN' ? 'Own' : ''
        const checkboxLabelTwo = filterType === 'VERIFIED' ? 'Not Verified' : filterType === 'REGISTRY' ? 'Not In Registry' :
            filterType === 'FAVOURITE' ? 'Not Favourite' : filterType === 'OWN' ? 'Not Own' : ''
        const inputPropNameOne = filterType === 'VERIFIED' ? 'isVerifiedFilter' : filterType === 'REGISTRY' ? 'isInRegistryFilter' :
            filterType === 'FAVOURITE' ? 'isFavouriteFilter' : 'isOwnFilter'
        const inputPropNameTwo = filterType === 'VERIFIED' ? 'isNotVerifiedFilter' : filterType === 'REGISTRY' ? 'isNotInRegistryFilter' :
            filterType === 'FAVOURITE' ? 'isNotFavouriteFilter' : 'isNotOwnFilter'
        const classesDropdown = filterType === 'VERIFIED' && (filterTypes.isVerifiedFilter.isFiltered || filterTypes.isNotVerifiedFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
            filterType === 'VERIFIED' && (!filterTypes.isVerifiedFilter.isFiltered && !filterTypes.isNotVerifiedFilter.isFiltered) ? 'icon dropdown-filters' :
                filterType === 'REGISTRY' && (filterTypes.isInRegistryFilter.isFiltered || filterTypes.isNotInRegistryFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                    filterType === 'REGISTRY' && (!filterTypes.isInRegistryFilter.isFiltered && !filterTypes.isNotInRegistryFilter.isFiltered) ? 'icon dropdown-filters' :
                        filterType === 'FAVOURITE' && (filterTypes.isFavouriteFilter.isFiltered || filterTypes.isNotFavouriteFilter.isFiltered) ? 'icon dropdown-filters-filtered' :
                            filterType === 'FAVOURITE' && (!filterTypes.isFavouriteFilter.isFiltered && !filterTypes.isNotFavouriteFilter.isFiltered) ? 'icon dropdown-filters' :
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
                    <Form>
                        <Form.Checkbox className='checkbox__label' name={inputPropNameOne} label={checkboxLabelOne} checked={checkedOne} onChange={(e, { name, checked }) => filterEntries(filterType, name, checked)} />
                        <Form.Checkbox className='checkbox__label' name={inputPropNameTwo} label={checkboxLabelTwo} checked={checkedTwo} onChange={(e, { name, checked }) => filterEntries(filterType, name, checked)} />
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
                className={classesDropdown}
                onBlur={() => filterEntries(filterType)}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
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
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)

    }

    const renderFilteringDropdownTextfield = (filterType) => {
        const placeholder = filterType === 'DOMAIN' ? 'example.com' : 'ADDRESS' ? '0xdF0d...' : ''
        const title = filterType === 'DOMAIN' ? 'Domain' : 'ADDRESS' ? 'Address' : ''
        const value = filterType === 'DOMAIN' ? filterTypes.domainFilter.domainFilter : 'ADDRESS' ? filterTypes.contractAddressFilter.contractAddressFilter : ''
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
                className={classesDropdown}
                onBlur={() => filterEntries(filterType)}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form onSubmit={() => filterEntries(filterType)}>
                        <Form.Input placeholder={placeholder} name={inputPropName} value={value} onChange={handleFiltersText} />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFiltersGroup = () => {
        if (isShowingFilters) {
            return (<>
                {hasAllColumns(cols) ? renderFilteringDropdownForCheckboxes('OWN') : null}
                {cols.has(COL.ADDRESS) ? renderFilteringDropdownTextfield('ADDRESS') : null}
                {cols.has(COL.DOMAIN) ? renderFilteringDropdownTextfield('DOMAIN') : null}
                {cols.has(COL.DOMAIN) && !cols.has(COL.TSC) && subdomainFilter.length > 0 ? renderFilteringDropdownForCheckboxesSubdomain('SUBDOMAIN') : null}
                {cols.has(COL.EXPIRY) ? renderFilteringDropdownForDayPickers('EXPIRY', filterTypes.expiryFromFilter.expiryFromFilter, filterTypes.expiryToFilter.expiryToFilter) : null}
                {!cols.has(COL.TSC) ? renderFilteringDropdownForCheckboxes('VERIFIED') : null}
                {cols.has(COL.REG) ? renderFilteringDropdownForCheckboxes('REGISTRY') : null}
                {cols.has(COL.FAV) ? renderFilteringDropdownForCheckboxes('FAVOURITE') : null}
                {cols.has(COL.CA) ? renderFilteringDropdownForDayPickers('CREATED_AT', filterTypes.createdAtFromFilter.createdAtFromFilter, filterTypes.createdAtToFilter.createdAtToFilter) : null}
            </>)
        }
    }

    const renderClearFiltersButton = () => {
        const isAtLeastOneFilterUsed = Object.values(filterTypes).some(e => e.isFiltered === true) || subdomainFilter.some(subdomain => subdomain.isFiltered)
        if (isAtLeastOneFilterUsed) return (<Button
            content='Clear filters'
            icon='remove circle'
            basic
            className='dropdown-filters__menu__button'
            onClick={clearFilters}
        />)
    }

    const renderLegendForSCImages = () => {
        if (cols.has(COL.TSC)) return (
            <div style={{ display: 'flex', float: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}><Image src='../images/smart-contract-icon-invalid.png' className='smart-contracts-legend__icon' alt='Smart Contract' size='mini' /><Label basic size='mini' content='Invalid Smart Contract' /></div>
                <div style={{ display: 'flex', alignItems: 'center' }}><Image src='../images/smart-contract-icon-valid.png' className='smart-contracts-legend__icon' alt='Smart Contract' size='mini' /><Label basic size='mini' content='Valid Smart Contract' /></div>
                <div style={{ display: 'flex', alignItems: 'center' }}><Image src='../images/smart-contract-icon.png' className='smart-contracts-legend__icon' alt='Smart Contract' size='mini' /><Label size='mini' basic content='Hashed domain. Cleartext domain must be provided to verify' /></div>
            </div>
        )
    }

    return (
        <>
            {renderSearchBox()}
            <div style={{ textAlign: 'end' }}>
                {renderLegendForSCImages()}
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
                        {cols.has(COL.ADDRESS) && <Table.HeaderCell>{
                            <Button basic className='column-header' onClick={() => sortEntries('ADDRESS')}>
                                Address{sortingTypes.isSortingByAddress.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByAddress.isSortingByAddressAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        {cols.has(COL.DOMAIN) &&
                            <Table.HeaderCell>
                                <Button basic className='column-header' onClick={() => sortEntries('DOMAIN')}>
                                    Domain{sortingTypes.isSortingByDomain.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByDomain.isSortingByDomainAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            </Table.HeaderCell>
                        }
                        {cols.has(COL.EXPIRY) && <Table.HeaderCell>{
                            <Button basic className='column-header' onClick={() => sortEntries('EXPIRY')}>
                                Expiry{sortingTypes.isSortingByExpiry.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByExpiry.isSortingByExpiryAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        {cols.has(COL.TSC) && <Table.HeaderCell textAlign="center">{
                            <Button basic className='column-header' onClick={() => sortEntries('TOTAL_SC')}>
                                Total Smart Contracts{sortingTypes.isSortingByTotalSC.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByTotalSC.isSortingByTotalSCAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                        }</Table.HeaderCell>}
                        {cols.has(COL.VERIF) &&
                            <Table.HeaderCell textAlign="center">
                                <Button basic className='column-header' onClick={() => sortEntries('VERIFIED')}>
                                    Verified{sortingTypes.isSortingByVerified.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByVerified.isSortingByVerifiedAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            </Table.HeaderCell>
                        }
                        {cols.has(COL.REG) &&
                            <Table.HeaderCell textAlign="center">{
                                <Button basic className='column-header' onClick={() => sortEntries('REGISTRY')}>
                                    Registry{sortingTypes.isSortingByIsInRegistry.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByIsInRegistry.isSortingByIsInRegistryAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }</Table.HeaderCell>
                        }
                        {cols.has(COL.FAV) &&
                            <Table.HeaderCell textAlign="center">{
                                <Button basic className='column-header' onClick={() => sortEntries('FAVOURITE')}>
                                    Favourites{sortingTypes.isSortingByFavourite.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByFavourite.isSortingByFavouriteAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }
                            </Table.HeaderCell>
                        }
                        {cols.has(COL.CA) &&
                            <Table.HeaderCell>{
                                <Button basic className='column-header' onClick={() => sortEntries('CREATED_AT')}>
                                    Created At{sortingTypes.isSortingByCreatedAt.isSorting ? <Icon className='column-header__sort' name={sortingTypes.isSortingByCreatedAt.isSortingByCreatedAtAsc ? 'sort down' : 'sort up'} /> : null}</Button>
                            }</Table.HeaderCell>
                        }
                    </Table.Row>
                </Table.Header>
                {tescs && tescs.length > 0 && (
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
