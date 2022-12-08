import CoveoAnalyticsClient, {AnalyticsClient, ClientOptions} from '../client/analytics';
import {NoopAnalytics} from '../client/noopAnalytics';
import doNotTrack from '../donottrack';
import {ClickEventRequest, CustomEventRequest, SearchEventRequest} from '../events';
import {
    CustomEventsTypes,
    DocumentIdentifier,
    FacetStateMetadata,
    PartialDocumentInformation,
    SearchPageEvents,
} from '../searchPage/searchPageEvents';
import {
    ExpandToFullUIMetadata,
    InsightEvents,
    InsightFacetMetadata,
    InsightInterfaceChangeMetadata,
    InsightStaticFilterToggleValueMetadata,
    InsightFacetRangeMetadata,
    InsightCategoryFacetMetadata,
    CaseMetadata,
    InsightFacetSortMeta,
    InsightFacetBaseMeta,
    InsightQueryErrorMeta,
    InsightPagerMetadata,
    InsightResultsSortMetadata,
} from './insightEvents';

export interface InsightClientProvider {
    getSearchEventRequestPayload: () => Omit<SearchEventRequest, 'actionCause' | 'searchQueryUid'>;
    getSearchUID: () => string;
    getBaseMetadata: () => Record<string, any>;
    getPipeline: () => string;
    getOriginContext?: () => string;
    getOriginLevel1: () => string;
    getOriginLevel2: () => string;
    getOriginLevel3: () => string;
    getLanguage: () => string;
    getIsAnonymous: () => boolean;
    getFacetState?: () => FacetStateMetadata[];
}

export interface InsightClientOptions extends ClientOptions {
    enableAnalytics: boolean;
}

const extractContextFromMetadata = (meta: {caseContext?: Record<string, string>}) => {
    const context: Record<string, string> = {};
    if (meta.caseContext) {
        Object.keys(meta.caseContext).forEach((contextKey) => {
            const value = meta.caseContext?.[contextKey];
            if (value) {
                const keyToBeSent = `context_${contextKey}`;
                context[keyToBeSent] = value;
            }
        });
    }
    return context;
};

const generateMetadataToSend = (metadata: CaseMetadata, includeContext = true) => {
    const {caseContext, caseId, caseNumber, ...metadataWithoutContext} = metadata;
    const context = extractContextFromMetadata(metadata);

    return {
        CaseId: caseId,
        CaseNumber: caseNumber,
        ...metadataWithoutContext,
        ...(!!context.context_Case_Subject && {CaseSubject: context.context_Case_Subject}),
        ...(includeContext && context),
    };
};

export class CoveoInsightClient {
    public coveoAnalyticsClient: AnalyticsClient;

    constructor(private opts: Partial<InsightClientOptions>, private provider: InsightClientProvider) {
        const shouldDisableAnalytics = opts.enableAnalytics === false || doNotTrack();
        this.coveoAnalyticsClient = shouldDisableAnalytics ? new NoopAnalytics() : new CoveoAnalyticsClient(opts);
    }

    public disable() {
        if (this.coveoAnalyticsClient instanceof CoveoAnalyticsClient) {
            this.coveoAnalyticsClient.clear();
        }
        this.coveoAnalyticsClient = new NoopAnalytics();
    }

    public enable() {
        this.coveoAnalyticsClient = new CoveoAnalyticsClient(this.opts);
    }

    public logInterfaceLoad(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logSearchEvent(SearchPageEvents.interfaceLoad, metadataToSend);
        }
        return this.logSearchEvent(SearchPageEvents.interfaceLoad);
    }

    public logInterfaceChange(metadata: InsightInterfaceChangeMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.interfaceChange, metadataToSend);
    }

    public logStaticFilterDeselect(metadata: InsightStaticFilterToggleValueMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.staticFilterDeselect, metadataToSend);
    }

    public logFetchMoreResults(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logCustomEvent(SearchPageEvents.pagerScrolling, {...metadataToSend, type: 'getMoreResults'});
        }
        return this.logCustomEvent(SearchPageEvents.pagerScrolling, {type: 'getMoreResults'});
    }

    public logBreadcrumbFacet(
        metadata: InsightFacetMetadata | InsightFacetRangeMetadata | InsightCategoryFacetMetadata
    ) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.breadcrumbFacet, metadataToSend);
    }

    public logBreadcrumbResetAll(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logSearchEvent(SearchPageEvents.breadcrumbResetAll, metadataToSend);
        }
        return this.logSearchEvent(SearchPageEvents.breadcrumbResetAll);
    }

    public logFacetSelect(metadata: InsightFacetMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.facetSelect, metadataToSend);
    }

    public logFacetDeselect(metadata: InsightFacetMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.facetDeselect, metadataToSend);
    }

    public logFacetUpdateSort(metadata: InsightFacetSortMeta) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.facetUpdateSort, metadataToSend);
    }

    public logFacetClearAll(metadata: InsightFacetBaseMeta) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.facetClearAll, metadataToSend);
    }

    public logFacetShowMore(metadata: InsightFacetBaseMeta) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.facetShowMore, metadataToSend);
    }

    public logFacetShowLess(metadata: InsightFacetBaseMeta) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.facetShowLess, metadataToSend);
    }

    public logQueryError(metadata: InsightQueryErrorMeta) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.queryError, metadataToSend);
    }

    public logPagerNumber(metadata: InsightPagerMetadata) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.pagerNumber, metadataToSend);
    }

    public logPagerNext(metadata: InsightPagerMetadata) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.pagerNext, metadataToSend);
    }

    public logPagerPrevious(metadata: InsightPagerMetadata) {
        const metadataToSend = generateMetadataToSend(metadata, false);
        return this.logCustomEvent(SearchPageEvents.pagerPrevious, metadataToSend);
    }

    public logDidYouMeanAutomatic(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logSearchEvent(SearchPageEvents.didyoumeanAutomatic, metadataToSend);
        }
        return this.logSearchEvent(SearchPageEvents.didyoumeanAutomatic);
    }

    public logDidYouMeanClick(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logSearchEvent(SearchPageEvents.didyoumeanClick, metadataToSend);
        }
        return this.logSearchEvent(SearchPageEvents.didyoumeanClick);
    }

    public logResultsSort(metadata: InsightResultsSortMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(SearchPageEvents.resultsSort, metadataToSend);
    }

    public logSearchboxSubmit(metadata?: CaseMetadata) {
        if (metadata) {
            const metadataToSend = generateMetadataToSend(metadata);
            return this.logSearchEvent(SearchPageEvents.searchboxSubmit, metadataToSend);
        }
        return this.logSearchEvent(SearchPageEvents.searchboxSubmit);
    }

    public logContextChanged(metadata: CaseMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logSearchEvent(InsightEvents.contextChanged, metadataToSend);
    }

    public logExpandToFullUI(metadata: ExpandToFullUIMetadata) {
        const metadataToSend = generateMetadataToSend(metadata);
        return this.logCustomEvent(InsightEvents.expandToFullUI, metadataToSend);
    }

    public logDocumentOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier, metadata?: CaseMetadata) {
        return this.logClickEvent(
            SearchPageEvents.documentOpen,
            info,
            identifier,
            metadata ? generateMetadataToSend(metadata, false) : undefined
        );
    }

    public logCopyToClipboard(
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        metadata?: CaseMetadata
    ) {
        return this.logClickEvent(
            SearchPageEvents.copyToClipboard,
            info,
            identifier,
            metadata ? generateMetadataToSend(metadata, false) : undefined
        );
    }

    public logDocumentQuickview(
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        caseMetadata?: CaseMetadata
    ) {
        const metadata = {
            documentTitle: info.documentTitle,
            documentURL: info.documentUrl,
        };
        return this.logClickEvent(
            SearchPageEvents.documentQuickview,
            info,
            identifier,
            caseMetadata ? {...generateMetadataToSend(caseMetadata, false), ...metadata} : metadata
        );
    }

    public logCaseAttach(
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        caseMetadata?: CaseMetadata
    ) {
        const metadata = {
            documentTitle: info.documentTitle,
            documentURL: info.documentUrl,
            resultUriHash: info.documentUriHash,
        };

        return this.logClickEvent(
            SearchPageEvents.caseAttach,
            info,
            identifier,
            caseMetadata ? {...generateMetadataToSend(caseMetadata, false), ...metadata} : metadata
        );
    }

    public logCaseDetach(resultUriHash: string, metadata?: CaseMetadata) {
        return this.logCustomEvent(
            SearchPageEvents.caseDetach,
            metadata ? {...generateMetadataToSend(metadata, false), resultUriHash} : {resultUriHash}
        );
    }

    public async logCustomEvent(event: SearchPageEvents | InsightEvents, metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};

        const payload: CustomEventRequest = {
            ...(await this.getBaseCustomEventRequest(customData)),
            eventType: CustomEventsTypes[event]!,
            eventValue: event,
        };

        return this.coveoAnalyticsClient.sendCustomEvent(payload);
    }

    public async logSearchEvent(event: SearchPageEvents | InsightEvents, metadata?: Record<string, any>) {
        return this.coveoAnalyticsClient.sendSearchEvent(await this.getBaseSearchEventRequest(event, metadata));
    }

    public async logClickEvent(
        event: SearchPageEvents,
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        metadata?: Record<string, any>
    ) {
        const payload: ClickEventRequest = {
            ...info,
            ...(await this.getBaseEventRequest({...identifier, ...metadata})),
            searchQueryUid: this.provider.getSearchUID(),
            queryPipeline: this.provider.getPipeline(),
            actionCause: event,
        };

        return this.coveoAnalyticsClient.sendClickEvent(payload);
    }

    private async getBaseCustomEventRequest(metadata?: Record<string, any>) {
        return {
            ...(await this.getBaseEventRequest(metadata)),
            lastSearchQueryUid: this.provider.getSearchUID(),
        };
    }

    private async getBaseSearchEventRequest(
        event: SearchPageEvents | InsightEvents,
        metadata?: Record<string, any>
    ): Promise<SearchEventRequest> {
        return {
            ...(await this.getBaseEventRequest(metadata)),
            ...this.provider.getSearchEventRequestPayload(),
            searchQueryUid: this.provider.getSearchUID(),
            queryPipeline: this.provider.getPipeline(),
            actionCause: event,
        };
    }

    private async getBaseEventRequest(metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};
        return {
            ...this.getOrigins(),
            customData,
            language: this.provider.getLanguage(),
            facetState: this.provider.getFacetState ? this.provider.getFacetState() : [],
            anonymous: this.provider.getIsAnonymous(),
            clientId: await this.getClientId(),
        };
    }

    private getOrigins() {
        return {
            originContext: this.provider.getOriginContext?.(),
            originLevel1: this.provider.getOriginLevel1(),
            originLevel2: this.provider.getOriginLevel2(),
            originLevel3: this.provider.getOriginLevel3(),
        };
    }

    private getClientId() {
        return this.coveoAnalyticsClient instanceof CoveoAnalyticsClient
            ? this.coveoAnalyticsClient.getCurrentVisitorId()
            : undefined;
    }
}
