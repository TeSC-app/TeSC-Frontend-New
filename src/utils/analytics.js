import { isSha3 } from './tesc'
import { FLAGS } from '../utils/tesc'
import BitSet from 'bitset'
import moment from 'moment'

export const computeValidContracts = (entries, verified) => {
    return entries.reduce((count, entry) => count + (entry.verified === verified), 0)
}

export const countFlags = (entries) => {
    let counterSanityFlag = 0;
    let counterDomainHashed = 0;
    let counterAllowSubdomain = 0;
    let counterAllowSubendorsement = 0;
    let counterExclusive = 0;
    let counterPayable = 0;
    let counterAllowAlternativeDomain = 0;
    const allFlags = entries.map(entry => ({ flag: new BitSet(entry.flags).data[0] }))
    for (const flag of allFlags) {
        switch (flag.flag) {
            case 1: counterSanityFlag++
                break
            case 3: counterDomainHashed++
                counterSanityFlag++
                break
            case 5: counterAllowSubendorsement++
                counterSanityFlag++;
                break
            case 7: counterDomainHashed++
                counterAllowSubendorsement++
                counterSanityFlag++;
                break
            default: break
        }
    }
    const result = [{ id: Object.keys(FLAGS)[0], value: counterDomainHashed }, { id: Object.keys(FLAGS)[1], value: counterAllowSubendorsement },
    { id: Object.keys(FLAGS)[2], value: counterExclusive }, { id: Object.keys(FLAGS)[3], value: counterPayable },
    { id: Object.keys(FLAGS)[4], value: counterAllowAlternativeDomain }, { id: Object.keys(FLAGS)[5], value: counterAllowSubdomain },
    { id: 'SANITY', value: counterSanityFlag }]
    return result
}

export const computeTopDomains = (entries) => {
    const colorsBar = ['#E8C1A0', '#F47560', '#F1E15B', '#E8A838', '#61CDBB']
    const tescsWithOccurances = entries.map(entry => ({
        domain: isSha3(entry.domain) || entry.domain.length > 25
            ? `${entry.domain.substring(0, 4)}...${entry.domain.substring(entry.domain.length - 2, entry.domain.length)}` : entry.domain, count: entries.reduce((counter, entry_) =>
                entry_.domain === entry.domain ? counter += 1 : counter, 0)
    })).sort((entryA, entryB) => entryB.count.toString().localeCompare(entryA.count))
    
    const distinctTescsWithOccurances = [];
    const map = new Map();
    let index = 0;
    for (const entry of tescsWithOccurances) {
        if (!map.has(entry.domain)) {
            map.set(entry.domain, true);    // set any value to Map
            distinctTescsWithOccurances.push({
                domain: entry.domain,
                count: entry.count,
                color: colorsBar[index++]
            });
        }
    }
    return distinctTescsWithOccurances.slice(0, 5)
}

export const checkExpirationDates = (entries) => {
    const colorsBar = ['#E8C1A0', '#F47560', '#F1E15B', '#E8A838', '#61CDBB']
    const data = [{
        expired: 'Expired', count: entries.reduce((counter, entry_) =>
            entry_.expiry < moment().unix() ? counter += 1 : counter, 0), color: colorsBar[0]
    },
    {
        expired: '1 month', count: entries.reduce((counter, entry_) =>
            entry_.expiry <= moment().add(1, 'months').unix() && entry_.expiry > moment().unix() ? counter += 1 : counter, 0), color: colorsBar[1]
    },
    {
        expired: '6 months', count: entries.reduce((counter, entry_) =>
            entry_.expiry <= moment().add(6, 'months').unix() && entry_.expiry > moment().add(1, 'months').unix() ? counter += 1 : counter, 0), color: colorsBar[2]
    },
    {
        expired: '1 year', count: entries.reduce((counter, entry_) =>
            entry_.expiry <= moment().add(12, 'months').unix() && entry_.expiry > moment().add(6, 'months').unix() ? counter += 1 : counter, 0), color: colorsBar[3]
    },
    {
        expired: '>1 year', count: entries.reduce((counter, entry_) =>
            entry_.expiry > moment().add(12, 'months').unix() ? counter += 1 : counter, 0), color: colorsBar[4]
    }]
    return data
} 