import {AnalyticsClient, PreparedEvent} from './analytics';
import {
    AnyEventResponse,
    SearchEventResponse,
    ClickEventResponse,
    CustomEventResponse,
    VisitResponse,
    HealthResponse,
    ViewEventResponse,
    EventType,
    PreparedSearchEventRequest,
    SearchEventRequest,
    ClickEventRequest,
    CustomEventRequest,
    PreparedClickEventRequest,
    PreparedCustomEventRequest,
    PreparedViewEventRequest,
    ViewEventRequest,
} from '../events';
import {NoopRuntime} from './runtimeEnvironment';

export class NoopAnalytics implements AnalyticsClient {
    getPayload(): Promise<any> {
        return Promise.resolve();
    }
    getParameters(): Promise<any> {
        return Promise.resolve();
    }
    prepareEvent<TPreparedRequest, TCompleteRequest, TResponse extends AnyEventResponse>(
        eventType: EventType | string
    ): Promise<PreparedEvent<TPreparedRequest, TCompleteRequest, TResponse>> {
        return Promise.resolve({eventType: eventType as EventType, payload: null, log: () => Promise.resolve()});
    }
    sendEvent(): Promise<AnyEventResponse | void> {
        return Promise.resolve();
    }
    prepareSearchEvent() {
        return this.prepareEvent<PreparedSearchEventRequest, SearchEventRequest, SearchEventResponse>(EventType.search);
    }
    sendSearchEvent(): Promise<SearchEventResponse | void> {
        return Promise.resolve();
    }
    prepareClickEvent() {
        return this.prepareEvent<PreparedClickEventRequest, ClickEventRequest, ClickEventResponse>(EventType.click);
    }
    sendClickEvent(): Promise<ClickEventResponse | void> {
        return Promise.resolve();
    }
    prepareCustomEvent() {
        return this.prepareEvent<PreparedCustomEventRequest, CustomEventRequest, CustomEventResponse>(EventType.custom);
    }
    sendCustomEvent(): Promise<CustomEventResponse | void> {
        return Promise.resolve();
    }
    prepareViewEvent() {
        return this.prepareEvent<PreparedViewEventRequest, ViewEventRequest, ViewEventResponse>(EventType.view);
    }
    sendViewEvent(): Promise<ViewEventResponse | void> {
        return Promise.resolve();
    }
    getVisit(): Promise<VisitResponse> {
        return Promise.resolve({id: '', visitorId: ''});
    }
    getHealth(): Promise<HealthResponse> {
        return Promise.resolve({status: ''});
    }
    registerBeforeSendEventHook(): void {}
    registerAfterSendEventHook(): void {}
    addEventTypeMapping(): void {}
    runtime = new NoopRuntime();
    currentVisitorId = '';
}
