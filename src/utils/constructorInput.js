import web3 from 'web3';
import { isValidContractAddress } from './tesc';

const arrayTooltip = "The array values separated by commas. Using spaces is only possible for string arrays. No entered value corresponds to an empty array []." 
const uintTooltip = "Enter a number >= 0. Do not enter values that exceed the maximum value of the type. This input is required."
const intTooltip = "Enter a number. Do not enter values that exceed the maximum value of the type. This input is required."
const byteTooltip = "Enter a hex number with the prefix '0x'. Do not enter values that exceed the maximum value of the type. This input is required."
const addressTooltip = "Enter a hex number of size 40 with the prefix '0x' representing an ethereum address. This input is required."
const boolTooltip = "Enter 'true' or 'false'. This input is required."
const stringTooltip = "A string value. No entered value corresponds to an empty string."
const defaultTooltip = "There is no validity check for this type. You are responsible for providing a valid input."

export const getTooltipForType = (type) => {
    if(type.endsWith("[]")){
        return arrayTooltip;
    }else if(type.startsWith("uint")){
        return uintTooltip;
    }else if(type.startsWith("int")){
        return intTooltip;
    }else if(type.startsWith("byte")){
        return byteTooltip;
    }else if(type === "address"){
        return addressTooltip;
    }else if(type === "bool"){
        return boolTooltip;
    }else if(type === "string"){
        return stringTooltip;
    }else{
        return defaultTooltip;
    }
}

export const isEmptyValidInputForType = (type) => {
    if(type.endsWith("[]")) return true;
    // these are the types are not supposed to be empty
    return !type.startsWith("uint") && !type.startsWith("int") && !type.startsWith("byte")
        && type !== "address" && type !== "bool";
}

export const validateConstructorParameterInput = (parameters) => {   
    return parameters.findIndex(entry => !validateSingleInput(entry.type, entry.value));
}

const validateSingleInput = (type, value) => {
    if(type.endsWith("[]")){
    }else if(type.startsWith("uint")){
        if(isNaN(value)) return false; 
        if(parseInt(value) < 0) return false;
    }else if(type.startsWith("int")){
        if(isNaN(value)) return false;
    }else if(type.startsWith("byte")){
        if(!web3.utils.isHexStrict(value)) return false;
    }else if(type === "address"){
        if(!isValidContractAddress(value)) return false;
    }else if(type === "bool"){
        if(value !== "true" && value !== "false") return false;
    }
    
    if(value === ""){
        return isEmptyValidInputForType(type);
    }else{
        return true;
    }
}