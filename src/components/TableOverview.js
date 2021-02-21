import React, { useState, useContext, useEffect } from 'react';
import { Table, Dropdown, Pagination, Icon, Button, Input, Form, Image, Label } from 'semantic-ui-react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import AppContext from '../appContext';
import TableEntry from './TableEntry';
import SearchBox from './SearchBox';
import { convertToUnix } from '../utils/tesc'
import { loadStorage } from '../utils/storage';
import {
    applyFilteringConditions,
    editCheckboxFilterTypes,
    updateDateOrTextfieldFilterStatus
} from '../utils/filters'

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
        rowDataOriginal,
        handleLoading,
        handleIsExploringDomain,
        handleDomainFilter,
        cols,
        updateRowData
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
        byOwner: { is: false, isNot: false },
        byDomain: { input: '', isFiltered: false },
        bySubdomain: { www: false },
        byContractAddress: { input: '', isFiltered: false },
        byExpiry: { from: '', to: '', isFiltered: false },
        byVerified: { is: false, isNot: false },
        byIsInRegistry: { is: false, isNot: false },
        byFavourites: { is: false, isNot: false },
        byCreatedAt: { from: '', to: '', isFiltered: false },
    })

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

    const handleChangeTescs = (tesc) => {
        setTescs(loadStorage(account));
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
        let displayedEntriesNew = [...displayedEntries]
        if (hasAllColumns(cols)) displayedEntriesNew = displayedEntries.filter(tesc => tesc.isFavourite || tesc.own)
        if (displayedEntriesNew && !cols.has(COL.TSC)) {
            return displayedEntriesNew.map((tesc) => (
                <TableEntry key={tesc.contractAddress}
                    tesc={tesc}
                    onTescChange={handleChangeTescs}
                    cols={cols}
                    setVerificationInTescs={setVerificationInTescs}
                />
            ));
        } else if (tescsWithOccurancesNew && cols.has(COL.TSC)) {
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
            updateRowData(filteredRowData)
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
            case 'FAVOURITES':
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
        setFilterTypes({
            byOwner: { is: false, isNot: false },
            byDomain: { input: '', isFiltered: false },
            bySubdomain: { www: false },
            byContractAddress: { input: '', isFiltered: false },
            byExpiry: { from: '', to: '' },
            byVerified: { is: false, isNot: false },
            byIsInRegistry: { is: false, isNot: false },
            byFavourites: { is: false, isNot: false },
            byCreatedAt: { from: '', to: '' },
        })
        //dashboard table
        if (hasAllColumns(cols)) {
            const storage = loadStorage(account)
            setDisplayedEntries(storage.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(storage)
        }
        //subendorsements table
        else if (!hasAllColumns(cols) && !cols.has(COL.TSC) && cols.has(COL.FAV)) {
            console.log('ROW DATA,', rowData)
            setDisplayedEntries(rowData.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescs(rowData)
            //registry inspect initial table
        } else if (cols.has(COL.TSC)) {
            setDisplayedEntries(tescsWithOccurances.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE))
            setTescsWithOccurancesNew(tescsWithOccurances)
        }
        //when we clear filters in registry inspect we go back to the initial table with tescs with occurances
        if (typeof handleIsExploringDomain !== 'undefined') handleIsExploringDomain(false)
        if (typeof rowDataOriginal !== 'undefined') updateRowData(rowDataOriginal)
    }

    const changeTextFilters = (e, { name, value }) => {
        switch (name) {
            case 'domainFilter': setFilterTypes(({ ...filterTypes, byDomain: { input: value, isFiltered: false } }))
                break
            case 'contractAddressFilter': setFilterTypes(({ ...filterTypes, byContractAddress: { input: value, isFiltered: false } }))
                break
            default: setFilterTypes(filterTypes)
        }
    }

    const changeCheckboxFiltersAndFilter = (name, checked) => {
        const filterTypesNew = editCheckboxFilterTypes(name, checked, filterTypes)
        setFilterTypes(filterTypesNew)
        setTescs(rowData.filter(tesc => applyFilteringConditions(tesc, filterTypesNew, account)))
        if (!hasAllColumns(cols) && typeof updateRowData !== 'undefined') updateRowData(rowData.filter(tesc => applyFilteringConditions(tesc, filterTypesNew, account)))
    }

    const changeDateFilters = (date, modifier, dayPickerInput) => {
        const name = dayPickerInput.props.inputProps.name
        switch (name) {
            case 'expiryFromFilter': setFilterTypes(({ ...filterTypes, byExpiry: { from: convertToUnix(date), to: filterTypes.byExpiry.to, isFiltered: false } }))
                break
            case 'expiryToFilter': setFilterTypes(({ ...filterTypes, byExpiry: { from: filterTypes.byExpiry.from, to: convertToUnix(date), isFiltered: false } }))
                break
            case 'createdAtFromFilter': setFilterTypes(({ ...filterTypes, byCreatedAt: { from: convertToUnix(date), to: filterTypes.byCreatedAt.to, isFiltered: false } }))
                break
            case 'createdAtToFilter': setFilterTypes(({ ...filterTypes, byCreatedAt: { from: filterTypes.byCreatedAt.from, to: convertToUnix(date), isFiltered: false } }))
                break
            default: setFilterTypes(filterTypes)
        }
    }

    const filterEntries = (name, value) => {
        const filterTypesNew = updateDateOrTextfieldFilterStatus(name, value, filterTypes)
        setFilterTypes(filterTypesNew)
        //only filter on active filters
        if (cols.has(COL.TSC)) setTescsWithOccurancesNew(tescsWithOccurances.filter(tesc => applyFilteringConditions(tesc, filterTypesNew)))
        setTescs(rowData.filter(tesc => applyFilteringConditions(tesc, filterTypesNew, account)))
        if (!hasAllColumns(cols) && typeof updateRowData !== 'undefined') updateRowData(rowData.filter(tesc => applyFilteringConditions(tesc, filterTypesNew, account)))
    }

    const renderFilteringDropdownForCheckboxesSubdomain = (title) => {
        const classesDropdown = title === 'Subdomain' &&
            filterTypes.bySubdomain.www ? 'icon dropdown-filters-filtered' : 'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon='angle down'
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Checkbox className='checkbox__label' name='www' label='www' checked={filterTypes.www} onChange={(e, { name, checked }) => changeCheckboxFiltersAndFilter(name, checked)} />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFilteringDropdownForCheckboxes = (title, checkboxLabelOne, checkboxLabelTwo, inputPropNameOne, inputPropNameTwo) => {
        const classesDropdown = title === 'Verified' &&
            (filterTypes.byVerified.is || filterTypes.byVerified.isNot) ? 'icon dropdown-filters-filtered' :
            title === 'Registry' &&
                (filterTypes.byIsInRegistry.is || filterTypes.byIsInRegistry.isNot) ? 'icon dropdown-filters-filtered' :
                title === 'Favourites' &&
                    (filterTypes.byFavourites.is || filterTypes.byFavourites.isNot) ? 'icon dropdown-filters-filtered' :
                    title === 'Own' &&
                        (filterTypes.byOwner.is || filterTypes.byOwner.isNot) ? 'icon dropdown-filters-filtered' :
                        'icon dropdown-filters'
        const checkedOne = title === 'Own' ? filterTypes.byOwner.is :
            title === 'Verified' ? filterTypes.byVerified.is :
                title === 'Registry' ? filterTypes.byIsInRegistry.is :
                    filterTypes.byFavourites.is
        const checkedTwo = title === 'Own' ? filterTypes.byOwner.isNot :
            title === 'Verified' ? filterTypes.byVerified.isNot :
                title === 'Registry' ? filterTypes.byIsInRegistry.isNot :
                    filterTypes.byFavourites.isNot
        return (
            <Dropdown
                text={title}
                icon='angle down'
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Checkbox className='checkbox__label' name={inputPropNameOne} label={checkboxLabelOne} checked={checkedOne} onChange={(e, { name, checked }) => changeCheckboxFiltersAndFilter(name, checked)} />
                        <Form.Checkbox className='checkbox__label' name={inputPropNameTwo} label={checkboxLabelTwo} checked={checkedTwo} onChange={(e, { name, checked }) => changeCheckboxFiltersAndFilter(name, checked)} />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFilteringDropdownForDayPickers = (title, inputPropNameFrom, inputPropNameTo, dateFrom, dateTo) => {
        const classesDropdown = title === 'Expiry' && (filterTypes.byExpiry.from && filterTypes.byExpiry.to && filterTypes.byExpiry.isFiltered) ? 'icon dropdown-filters-filtered' :
            title === 'Created At' && (filterTypes.byCreatedAt.from && filterTypes.byCreatedAt.to && filterTypes.byCreatedAt.isFiltered) ? 'icon dropdown-filters-filtered' :
                'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}
                onBlur={() => filterEntries(inputPropNameTo, dateTo)}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form>
                        <Form.Field><DayPickerInput
                            value={dateFrom ? formatDate(new Date(dateFrom * 1000), 'DD/MM/YYYY') : null}
                            onDayChange={changeDateFilters}
                            format="DD/MM/YYYY"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder='dd/mm/yyyy'
                            inputProps={{ readOnly: true, name: inputPropNameFrom }}
                            component={props => <Input icon='calendar alternate outline' {...props} />}
                        /></Form.Field>
                        <Form.Field>
                            <DayPickerInput
                                onDayChange={changeDateFilters}
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

    const renderFilteringDropdownTextfield = (title, inputPropName, filterTypeInput, placeholder) => {
        const classesDropdown = title === 'Domain' && filterTypes.byDomain.input !== '' && filterTypes.byDomain.isFiltered ? 'icon dropdown-filters-filtered' :
            title === 'Address' && filterTypes.byContractAddress.input !== '' && filterTypes.byExpiry.isFiltered ? 'icon dropdown-filters-filtered' :
                'icon dropdown-filters'
        return (
            <Dropdown
                text={title}
                icon={'angle down'}
                simple
                className={classesDropdown}>
                <Dropdown.Menu className='dropdown__menu-filters'>
                    <Form onSubmit={() => filterEntries(inputPropName, filterTypeInput)}>
                        <Form.Input placeholder={placeholder} name={inputPropName} onChange={changeTextFilters} />
                    </Form>
                </Dropdown.Menu>
            </Dropdown>)
    }

    const renderFiltersGroup = () => {
        if (isShowingFilters) {
            return (<>
                {hasAllColumns(cols) ? renderFilteringDropdownForCheckboxes('Own', 'Own', 'Not own', 'isOwnFilter', 'isNotOwnFilter') : null}
                {cols.has(COL.ADDRESS) ? renderFilteringDropdownTextfield('Address', 'contractAddressFilter', filterTypes.byContractAddress.input, '0x8Def') : null}
                {cols.has(COL.DOMAIN) ? renderFilteringDropdownTextfield('Domain', 'domainFilter', filterTypes.byDomain.input, 'example.com') : null}
                {cols.has(COL.DOMAIN) && !cols.has(COL.TSC) ? renderFilteringDropdownForCheckboxesSubdomain('Subdomain') : null}
                {cols.has(COL.EXPIRY) ? renderFilteringDropdownForDayPickers('Expiry', 'expiryFromFilter', 'expiryToFilter', filterTypes.byExpiry.from, filterTypes.byExpiry.to) : null}
                {!cols.has(COL.TSC) ? renderFilteringDropdownForCheckboxes('Verified', 'Verified', 'Not verified', 'isVerifiedFilter', 'isNotVerifiedFilter') : null}
                {cols.has(COL.REG) ? renderFilteringDropdownForCheckboxes('Registry', 'In Registry', 'Not in registry', 'isInRegistryFilter', 'isNotInRegistryFilter') : null}
                {cols.has(COL.FAV) ? renderFilteringDropdownForCheckboxes('Favourites', 'Favourite', 'Not favourite', 'isFavouriteFilter', 'isNotFavouriteFilter') : null}
                {cols.has(COL.CA) ? renderFilteringDropdownForDayPickers('Created at', 'createdAtFromFilter', 'createdAtToFilter', filterTypes.byCreatedAt.from, filterTypes.byCreatedAt.to) : null}
            </>)
        }
    }

    const renderClearFiltersButton = () => {
        const isAtLeastOneFilterUsed = Object.entries(filterTypes).some(entry =>
            (entry[1].hasOwnProperty('isFiltered') && entry[1].isFiltered) ||
            (entry[1].hasOwnProperty('from') && entry[1].from !== '' && entry[1].to !== '' && entry[1].isFiltered) ||
            (entry[1].hasOwnProperty('is') && (entry[1].is || entry[1].isNot)) ||
            (entry[1].hasOwnProperty('www') && entry[1].www))

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
                                <Button basic className='column-header' onClick={() => sortEntries('FAVOURITES')}>
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
