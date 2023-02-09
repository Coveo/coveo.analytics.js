# ![coveo.analytics](./assets/coveo.analytics.js.png)

[![Build Status](https://travis-ci.org/coveo/coveo.analytics.js.svg?branch=master)](https://travis-ci.org/coveo/coveo.analytics.js)
[![Coverage Status](https://coveralls.io/repos/github/coveo/coveo.analytics.js/badge.svg?branch=master)](https://coveralls.io/github/coveo/coveo.analytics.js?branch=master)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.png?v=100)](https://github.com/ellerbrock/typescript-badges/)

# Coveo Analytics JavaScript client

The Coveo analytics javascript client, also called coveo.analytics.js or coveoua for short, is responsible for logging analytics events with the Coveo backend. Analytics events may include basic Coveo web events such as pageviews, clicks or searches. For specific usecases, such as commerce and service, dedicated events may be defined and logged.

The analytics library is bundled with all Coveo provided UI components. Integrations which exclusively rely on these components, generally don't have to interact with coveoua directly. For Coveo integrations which integrate with an already existing UI and do not use headless, coveoua will be required to ensure events are logged correctly.

## Loading and initializing the library in the browser

In order to ensure the tracking code is available on your webpage, the following code snippet needs to be added to the top of each page on which analytics are required. This will load the latest major version of coveo.analytics.js from a Coveo CDN. As of writing, the current major version is 2.

```html
<script>
    (function (c, o, v, e, O, u, a) {
        a = 'coveoua';
        c[a] =
            c[a] ||
            function () {
                (c[a].q = c[a].q || []).push(arguments);
            };
        c[a].t = Date.now();
        u = o.createElement(v);
        u.async = 1;
        u.src = e;
        O = o.getElementsByTagName(v)[0];
        O.parentNode.insertBefore(u, O);
    })(window, document, 'script', 'https://static.cloud.coveo.com/coveo.analytics.js/2/coveoua.js');
</script>

coveoua('init', <COVEO_API_KEY>); // Replace <COVEO_API_KEY> with your api key</COVEO_API_KEY></COVEO_API_KEY>
```

Since calls to the coveo analytics service need to be authenticated, the library needs to be initialized with a Coveo api key which has push access to the [Usage Analytics domain](https://docs.coveo.com/en/1707/cloud-v2-administrators/privilege-reference#analytics-data-domain). You can create an API key from the [administration console](https://platform.cloud.coveo.com/admin/#/organization/api-access/) selecting the **Push** option box for the **Analytics Data** domain (see [Adding and Managing API Keys](https://docs.coveo.com/en/1718/cloud-v2-administrators/adding-and-managing-api-keys)).

## Available actions

After the library has loaded sucessfully, you can interact with coveoua through the global `coveoua` function. Any interaction with the library happens through this function by supplying both a action name, followed by an optional series of action arguments. The following actions are available:

### Initialization

-   `coveoua('version')`: Returns the current version of the tracking library.
-   `coveoua('init', <COVEO_API_KEY>, <ENDPOINT>)`: Initializes the library with the given api key and endpoint. The following parameters are accepted
    -   COVEO_API_KEY (mandatory): A valid api key.
    -   ENDPOINT (optional): A string specifying the desired analytics endpoint. The default value is https://analytics.cloud.coveo.com/rest/ua. In case your organization is HIPAA enabled, you should override with https://analyticshipaa.cloud.coveo.com/rest/ua.
-   `coveoua('init', <COVEO_API_KEY>, {endpoint: <ENDPOINT>, plugins: <PLUGINS>})`: Initializes the library with the given api key, endpoint and plugins. The following parameters are accepted
    -   COVEO_API_KEY (mandatory): A valid api key.
    -   ENDPOINT (optional): An object string specifying the desired analytics endpoint. The default value is https://analytics.cloud.coveo.com/rest/ua. In case your organization is HIPAA enabled, you should override with https://analyticshipaa.cloud.coveo.com/rest/ua.
    -   PLUGINS (optional): An array of known plugin names. See [plugins](#plugins) for more information.
-   `coveoua('set', <NAME>, <VALUE>)`: Attempts to inject an attribute with given name and value on every logged event. Some payloads may reject attributes they do not support.
-   `coveoua('set', <OBJECT>)`: Attempts to inject all attributes and values of the given object on every logged event. Some payloads may reject attributes they do not support.
-   `coveoua('onLoad', <CALLBACK>)`: Calls the specified function immediately, library initialization is not required.
-   `coveoua('reset')`: Resets the state of the logger to the state before initialization.

### Sending events

-   `coveoua('send', <EVENT_NAME>, <EVENT_PAYLOAD>)`: Sends an event with a given name and payload to the analytics endpoint.

### Plugin control

-   `coveoua('provide', <PLUGIN_NAME>, <PLUGINCLASS>)`: Registers a given pluginClass with the analytics library under the provided name.
-   `coveoua('require', <PLUGIN_NAME>)`: Explicitly loads the plugin with the given name.
-   `coveoua('callPlugin', <PLUGIN_NAME>, <FUNCTION>, <PARAMS>)`: Executes the specified function with given arguments on the given plugin name. Can be shorthanded using a plugin action prefix `coveoua(<PLUGINNAME>:<FUNCTION>, <PARAMS>)`.

## Plugins

Coveoua is set up in a modular way with different plugins providing functionality that may be specific to a given usecase. This allows you to customize some of its behavior dynamically. By default, the following plugins are loaded at library initialization:

-   `ec`: eCommerce plugin which takes care of sending eCommerce specific events.
-   `svc`: Service plugin which takes care of sending customer service specific events.

Plugin actions extend the set of available actions. They can be executed either via the `callPlugin` action above, or via the shorthand. For example, to call the function `addImpression` on the `ec` plugin, you'd specify `coveoua(ec:addImpression, ...)`.

It is possible to disable loading of any plugins by explicitly initializing the library with an empty list of plugins using `coveoua('init', <API_KEY>, {plugins:[]})`.

## Sending basic usage analytics events

In most common integration usecases, you will be using Coveo pre-wired components (e.g. jsui, headless or atomic) to handle communication with the Coveo backend. These components have their own specific apis to handle event logging.

When you are not using any specific Coveo web component, you need to send these events payloads explicitly, use the `send` action to transmit an assembled payload to the usage analytics backend. See the [Usage Analytics Events](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events) documentation for description of the payload contents. The following event types are supported in coveoua

-   `search`: sends a [client side search](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events#search-performsearch) event.
-   `click`: sends a [click event](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events#click-documentview).
-   `view`: sends a [pageview event](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events#view).
-   `custom`: sends a [custom event](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events#custom-customevent).
-   `collect`: sends a [collect event](https://docs.coveo.com/en/2949/analyze-usage-data/usage-analytics-events#collect) payload. We strongly recommend you use the simplified api in the ecommerce plugin [to send these events instead](#sending-commerce-specific-events).

For example, in order to send a click event after a user has interacted with a Coveo provided result, first initialize the library with an api key and then send a click event with the appropriate payload. Refer to the [click event documentation](https://docs.coveo.com/en/1373/build-a-search-ui/log-usage-analytics-events) for up to date information on event payloads.

```js
coveoua('send', 'click', {...});
```

You should be able to observe the click event being transmitted to the Coveo backend at `https://analytics.cloud.coveo.com/rest/ua/click` in the Developer tool's **Network** tab of your browser of choice.

## Sending commerce specific events

Commerce specific events such as product selections, shopping cart modifications and transactions are sent to Coveo in the compact [collect protocol](https://docs.coveo.com/en/l41i0031/build-a-search-ui/log-collect-events). Rather than explicitly assembling these payloads by hand, the eCommerce plugin provides compact apis to assemble and transmit the payloads. There are two event names that are specific to the eCommerce plugin:

-   `event`: A generic event, which has been assembled through different plugin actions.
-   `pageview`: An ecommerce specific pageview event which is automatically populated.

See the [Send an Event](https://docs.coveo.com/en/l3am0254/coveo-for-commerce/send-an-event) page for more information on the expected payloads for both of these.

The full list of supported eCommerce plugin actions are listed in the [**Possible Actions** section of the Tracking Commerce Events page](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#possible-actions). This page also provides information on how to log

-   A [product detail view](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-a-product-details-view)
-   An [addition to the cart](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-an-addition-to-the-cart)
-   A [removal from the cart](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-a-removal-from-the-cart)
-   A [cart purchase](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-purchases)
-   An [event on a search-driven listing-page](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-events-on-a-search-driven-listing-page)

As a sample, here is how an [addition to the cart interaction](https://docs.coveo.com/en/3188/coveo-solutions/tracking-commerce-events#measuring-an-addition-to-the-cart) is measured:

1. First use the `ec:addProduct` action to include the relevant product data in the event you’re about to send
    ```js
    coveoua('ec:addProduct', <PRODUCT_DATA>);
    ```
2. Then use the `ec:setAction` action to specify that the action done on this data is an addition to the cart:
    ```js
    coveoua('ec:setAction', 'add');
    ```
3. Finally, use the `send` action to send the generic event to Coveo Usage Analytics. The payload is implicit in this case, and has been generated by the plugin.
    ```js
    coveoua('send', 'event');
    ```

# Developer information

Information for constributors or Coveo developers integrating coveoua into their codebases.

## Setup

```bash
git clone
npm install
npm run build
```

## Running and observing the code

There are two ways to run your code locally:

1. Run `npm run start` and open your browser on http://localhost:9001

2. Debugging through VSCode debugger with the `Debug: Start Debugging` command, using the `Launch Chrome` configuration.

To test out your changes, add `coveoua` function calls in the `public/index.html` file and check the payload in the `Developer Console` section of your browser.

## Running tests

1. From the command line through `npm run test`.
2. Debugging through VSCode debugger with the `Debug: Start Debugging` command, using the `Jest All` configuration.

## Storage and persistence

Coveo.analytics.js tracks interactions from the same browserclient, through a clientside provided uuid called a `clientId`. This clientId is initialized on first use and there are multiple options for persisting it's value:

-   Cookie storage, which supports top level domain storage. This means that the clientId for a.foo.com will be identical to the one on b.foo.com.
-   Local storage, which allows to store much more information client side, but has the drawback of not being able to access data across multiple top level domains.
-   Session storage, which has roughly the same limitation and capability as Local storage, except that it is cleared when the web browser tab is closed.

By default, coveoua will use both local storage and cookie storage to persist it's clientId. If your environment does not support local persistence, it's possible to write your own storage abstraction.

## Using coveo.analytics.js with React Native

Since React Native does not run inside a browser, it cannot use cookies or the local/session storage that modern browsers provide. You must provide your own Storage implementation. Thankfully, there exist multiple packages to store data:

-   [React native community AsyncStorage](https://github.com/react-native-async-storage/async-storage) (recommended)
-   [React native AsyncStorage](https://reactnative.dev/docs/asyncstorage) (deprecated)
-   [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)

A sample React native storage class implementation could look as follows

```js
import {CoveoAnalyticsClient, ReactNativeRuntime} from 'coveo.analytics/react-native';
// Use any React native storage library or implement your own.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample storage class
class ReactNativeStorage implements WebStorage {
    async getItem(key: string) {
        return AsyncStorage.getItem(key);
    }
    async setItem(key: string, data: string) {
        return AsyncStorage.setItem(key, data);
    }
    async removeItem(key: string) {
        AsyncStorage.removeItem(key);
    }
}

// Create an API client with a specific runtime
const client = new CoveoAnalyticsClient({
    token: 'YOUR_API_KEY',
    runtimeEnvironment: new ReactNativeRuntime({
        token: 'YOUR_API_KEY',
        storage: new ReactNativeStorage(),
    }),
});

// Send your event
client.sendCustomEvent({
    eventType: 'dog',
    eventValue: 'Hello! Yes! This is Dog!',
    language: 'en',
});
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT license (see [LICENSE](LICENSE)).

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)
[![coveo](./assets/by-coveo.png)](https://www.coveo.com)
