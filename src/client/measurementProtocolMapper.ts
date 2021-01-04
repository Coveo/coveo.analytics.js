import {isServiceKey, serviceActionsKeysMapping} from './measurementProtocolMapping/serviceMeasurementProtocolMapper';
import {
    commerceActionKeysMapping,
    isCommerceKey,
    isCustomCommerceKey,
} from './measurementProtocolMapping/commerceMeasurementProtocolMapper';
import {keysOf} from './utils';
import {baseMeasurementProtocolKeysMapping} from './measurementProtocolMapping/baseMeasurementProtocolMapper';

const measurementProtocolKeysMapping: {[name: string]: string} = {
    ...baseMeasurementProtocolKeysMapping,
    ...commerceActionKeysMapping,
    ...serviceActionsKeysMapping,
};

export const convertKeysToMeasurementProtocol = (params: any) => {
    return keysOf(params).reduce((mappedKeys, key) => {
        const newKey = measurementProtocolKeysMapping[key] || key;
        return {
            ...mappedKeys,
            [newKey]: params[key],
        };
    }, {});
};

const measurementProtocolKeysMappingValues = keysOf(measurementProtocolKeysMapping).map(
    (key) => measurementProtocolKeysMapping[key]
);

const isKnownMeasurementProtocolKey = (key: string) => measurementProtocolKeysMappingValues.indexOf(key) !== -1;
const isCustomKey = (key: string) => key === 'custom';

export const isMeasurementProtocolKey = (key: string): boolean => {
    return [...isCommerceKey, ...isServiceKey, isKnownMeasurementProtocolKey, isCustomKey].some((test) => test(key));
};

export const convertCustomMeasurementProtocolKeys = (data: {[name: string]: string | {[name: string]: string}}) => {
    return keysOf(data).reduce((all, current) => {
        const match = getFirstCustomMeasurementProtocolKeyMatch(current);
        if (match) {
            return {
                ...all,
                ...convertCustomObject(match, data[current] as {[name: string]: string}),
            };
        } else {
            return {
                ...all,
                [current]: data[current],
            };
        }
    }, {});
};

const getFirstCustomMeasurementProtocolKeyMatch = (key: string): string | null => {
    let match = null;
    [...isCustomCommerceKey].every((regex) => {
        match = regex.exec(key);
        return !Boolean(match);
    });
    return match;
};

const convertCustomObject = (prefix: string, customData: {[name: string]: string}) => {
    return keysOf(customData).reduce(
        (allCustom, currentCustomKey) => ({
            ...allCustom,
            [`${prefix}${currentCustomKey}`]: customData[currentCustomKey],
        }),
        {}
    );
};
