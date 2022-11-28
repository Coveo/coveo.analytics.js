import {EventType} from '../events';
import {uuidv4} from '../client/crypto';
import {
    convertProductToMeasurementProtocol,
    convertImpressionListToMeasurementProtocol,
} from '../client/measurementProtocolMapping/commerceMeasurementProtocolMapper';
import {BasePlugin, BasePluginEventTypes, PluginClass, PluginOptions} from './BasePlugin';

export const ECPluginEventTypes = {
    ...BasePluginEventTypes,
};

const allECEventTypes = Object.keys(ECPluginEventTypes).map(
    (key) => ECPluginEventTypes[key as keyof typeof ECPluginEventTypes]
);

// From https://stackoverflow.com/a/49725198/497731
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];

export type CustomValues = {
    [key: string]: string | number | boolean;
};

export interface CoveoExtensionProperties {
    group?: string;
}

export interface ProductProperties extends CoveoExtensionProperties {
    id?: string;
    name?: string;
    brand?: string;
    category?: string;
    variant?: string;
    price?: number | string;
    quantity?: number;
    coupon?: string;
    position?: number;
    custom?: CustomValues;
}

export type Product = RequireAtLeastOne<ProductProperties, 'id' | 'name'>;

export interface ImpressionProperties extends CoveoExtensionProperties {
    id?: string;
    name?: string;
    list?: string;
    brand?: string;
    category?: string;
    variant?: string;
    position?: number;
    price?: number | string;
    custom?: CustomValues;
}

export type Impression = RequireAtLeastOne<ImpressionProperties, 'id' | 'name'>;
export type BaseImpression = Omit<Impression, 'list'>;
export interface ImpressionList {
    listName?: string;
    impressions: BaseImpression[];
}

export class ECPlugin extends BasePlugin {
    public static readonly Id = 'ec';
    private products: Product[] = [];
    private impressions: Impression[] = [];

    constructor({client, uuidGenerator = uuidv4}: PluginOptions) {
        super({client, uuidGenerator});
    }

    protected addHooks(): void {
        this.addHooksForPageView();
        this.addHooksForEvent();
        this.addHooksForECEvents();
    }

    addProduct(product: Product) {
        this.products.push(product);
    }

    addImpression(impression: Impression) {
        this.impressions.push(impression);
    }

    protected clearPluginData() {
        this.products = [];
        this.impressions = [];
    }

    private addHooksForECEvents() {
        this.client.registerBeforeSendEventHook((eventType, ...[payload]) => {
            return allECEventTypes.indexOf(eventType) !== -1 ? this.addECDataToPayload(eventType, payload) : payload;
        });
        this.client.registerAfterSendEventHook((eventType, ...[payload]) => {
            if (allECEventTypes.indexOf(eventType) !== -1) {
                this.updateLocationInformation(eventType, payload);
            }
            return payload;
        });
    }

    private addHooksForPageView() {
        this.client.addEventTypeMapping(ECPluginEventTypes.pageview, {
            newEventType: EventType.collect,
            variableLengthArgumentsNames: ['page'],
            addVisitorIdParameter: true,
            usesMeasurementProtocol: true,
        });
    }

    private addHooksForEvent() {
        this.client.addEventTypeMapping(ECPluginEventTypes.event, {
            newEventType: EventType.collect,
            variableLengthArgumentsNames: ['eventCategory', 'eventAction', 'eventLabel', 'eventValue'],
            addVisitorIdParameter: true,
            usesMeasurementProtocol: true,
        });
    }

    private addECDataToPayload(eventType: string, payload: any) {
        const ecPayload = {
            ...this.getLocationInformation(eventType, payload),
            ...this.getDefaultContextInformation(eventType),
            ...(this.action ? {action: this.action} : {}),
            ...(this.actionData || {}),
        };

        const productPayload = this.getProductPayload();
        const impressionPayload = this.getImpressionPayload();

        this.clearData();

        return {
            ...impressionPayload,
            ...productPayload,
            ...ecPayload,
            ...payload,
        };
    }

    private getProductPayload() {
        return this.products
            .map((product) => this.assureProductValidity(product))
            .map((product) => this.convertProductPriceToNumber(product))
            .reduce((newPayload, product, index) => {
                return {
                    ...newPayload,
                    ...convertProductToMeasurementProtocol(product, index),
                };
            }, {});
    }

    private getImpressionPayload() {
        const impressionsByList = this.getImpressionsByList();
        return impressionsByList
            .map(
                ({impressions, ...rest}) =>
                    ({
                        ...rest,
                        impressions: impressions
                            .map((baseImpression) => this.assureBaseImpressionValidity(baseImpression))
                            .map((impression) => this.convertImpressionPriceToNumber(impression)),
                    } as ImpressionList)
            )
            .reduce((newPayload, impressionList, index) => {
                return {
                    ...newPayload,
                    ...convertImpressionListToMeasurementProtocol(impressionList, index, 'pi'),
                };
            }, {});
    }

    private convertProductPriceToNumber(product: Product) {
        if (product.price) {
            product.price = this.tryConvertStringPriceToNumber(product.price);
        }

        return product;
    }

    private convertImpressionPriceToNumber(impression: BaseImpression) {
        if (impression.price) {
            impression.price = this.tryConvertStringPriceToNumber(impression.price);
        }

        return impression;
    }

    private tryConvertStringPriceToNumber(price: number | string): number | string {
        if (typeof price === 'number') {
            return price;
        }

        let parsedPrice = parseFloat(price.replace(/[^0-9\.-]/g, ''));

        return isNaN(parsedPrice) ? price : parsedPrice;
    }

    private assureProductValidity(product: Product) {
        const {position, ...productRest} = product;
        if (position !== undefined && position < 1) {
            console.warn(
                `The position for product '${product.name || product.id}' must be greater ` + `than 0 when provided.`
            );

            return productRest;
        }

        return product;
    }

    private assureBaseImpressionValidity(baseImpression: BaseImpression) {
        const {position, ...baseImpressionRest} = baseImpression;
        if (position !== undefined && position < 1) {
            console.warn(
                `The position for impression '${baseImpression.name || baseImpression.id}'` +
                    ` must be greater than 0 when provided.`
            );

            return baseImpressionRest;
        }

        return baseImpression;
    }

    private getImpressionsByList() {
        return this.impressions.reduce((lists, impression) => {
            const {list: listName, ...baseImpression} = impression;
            const list = lists.find((list) => list.listName === listName);
            if (list) {
                list.impressions.push(baseImpression);
            } else {
                lists.push({listName: listName, impressions: [baseImpression]});
            }
            return lists;
        }, [] as ImpressionList[]);
    }
}

export const EC: PluginClass = ECPlugin;
