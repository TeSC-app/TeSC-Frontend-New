import { isSha3 } from './tesc'
import { FLAGS } from '../utils/tesc'
import BitSet from 'bitset';

export const computeValidContracts = (entries, verified) => {
    return entries.reduce((count, entry) => count + (entry.verified === verified), 0)
}

export const countFlags = (entries) => {
    let counterDomainHashed = 0;
    let counterAllowSubdomain = 0;
    let counterAllowSubendorsement = 0;
    let counterExclusive = 0;
    let counterPayable = 0;
    let counterAllowAlternativeDomain = 0;
    const allFlags = entries.map(entry => ({ flag: new BitSet(entry.flags).data[0] }))
    for (const flag of allFlags) {
        switch (flag.flag) {
            case 3: counterDomainHashed++
                break
            case 5: counterAllowSubendorsement++
                break
            default: break
        }
    }
    const result = [{ id: Object.keys(FLAGS)[0], value: counterDomainHashed }, { id: Object.keys(FLAGS)[1], value: counterAllowSubendorsement },
    { id: Object.keys(FLAGS)[2], value: counterExclusive }, { id: Object.keys(FLAGS)[3], value: counterPayable },
    { id: Object.keys(FLAGS)[4], value: counterAllowAlternativeDomain }, { id: Object.keys(FLAGS)[5], value: counterAllowSubdomain }]
    return result
}

export const computeTopDomains = (entries) => {
    const colorsBar = ['#E8C1A0', '#F47560', '#F1E15B', '#E8A838', '#61CDBB']
    const tescsWithOccurances = entries.map(entry => ({
        domain: isSha3(entry.domain)
            ? `${entry.domain.substring(0, 4)}...${entry.domain.substring(entry.domain.length - 2, entry.domain.length)}` : entry.domain, count: entries.reduce((counter, entry_) =>
                entry_.domain === entry.domain ? counter += 1 : counter, 0)
    }))
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