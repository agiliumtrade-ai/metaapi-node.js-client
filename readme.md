# metaapi.cloud SDK for node.js

MetaApi is a powerful, fast, cost-efficient, easy to use and standards-driven cloud forex trading API for MetaTrader 4 and MetaTrader 5 platform designed for traders, investors and forex application developers to boost forex application development process. MetaApi can be used with any broker and does not require you to be a brokerage.

CopyFactory is a simple yet powerful copy-trading API which is a part of MetaApi. See below for CopyFactory readme section.

MetaApi is a paid service, but API access to one MetaTrader account is free of charge.

The [MetaApi pricing](https://metaapi.cloud/#pricing) was developed with the intent to make your charges less or equal to what you would have to pay
for hosting your own infrastructure. This is possible because over time we managed to heavily optimize
our MetaTrader infrastructure. And with MetaApi you can save significantly on application development and
maintenance costs and time thanks to high-quality API, open-source SDKs and convenience of a cloud service.

Official REST and websocket API documentation: [https://metaapi.cloud/docs/client/](https://metaapi.cloud/docs/client/)

Please note that this SDK provides an abstraction over REST and websocket API to simplify your application logic.

For more information about SDK APIs please check esdoc documentation in source codes located inside lib folder of this npm package.

## Installation
```bash
npm install --save metaapi.cloud-sdk
```

## Installing SDK in browser SPA applications
```bash
npm install --save metaapi.cloud-sdk
```

## Installing SDK in browser HTML applications
```html
<script src="unpkg.com/metaapi.cloud-sdk/index.js"></script>
<script>
    const token = '...';
    const api = new MetaApi(token);
</script>
```

## Working code examples
Please check [this short video](https://youtu.be/dDOUWBjdfA4) to see how you can download samples via our web application.

You can also find code examples at [examples folder of our github repo](https://github.com/agiliumtrade-ai/metaapi-node.js-client/tree/master/examples) or in the examples folder of the npm package.

We have composed a [short guide explaining how to use the example code](https://metaapi.cloud/docs/client/usingCodeExamples)

## Connecting to MetaApi
Please use one of these ways: 
1. [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token) web UI to obtain your API token.
2. An account access token which grants access to a single account. See section below on instructions on how to retrieve account access token.

Supply token to the MetaApi class constructor.

```javacsript
import MetaApi from 'metaapi.cloud-sdk';

const token = '...';
const api = new MetaApi(token);
```

## Retrieving account access token
Account access token grants access to a single account. You can retrieve account access token via API:
```javascript
let accountId = '...';
let account = await api.metatraderAccountApi.getAccount(accountId);
let accountAccessToken = account.accessToken;
console.log(accountAccessToken);
```

Alternatively, you can retrieve account access token via web UI on https://app.metaapi.cloud/accounts page (see [this video](https://youtu.be/PKYiDns6_xI)).

## Managing MetaTrader accounts (API servers for MT accounts)
Before you can use the API you have to add an MT account to MetaApi and start an API server for it.

However, before you can create an account, you have to create a provisioning profile.

### Managing provisioning profiles via web UI
You can manage provisioning profiles here: [https://app.metaapi.cloud/provisioning-profiles](https://app.metaapi.cloud/provisioning-profiles)

### Creating a provisioning profile via API
```javascript
// if you do not have created a provisioning profile for your broker,
// you should do it before creating an account
const provisioningProfile = await api.provisioningProfileApi.createProvisioningProfile({
  name: 'My profile',
  version: 5,
  brokerTimezone: 'EET',
  brokerDSTSwitchTimezone: 'EET'
});
// servers.dat file is required for MT5 profile and can be found inside
// config directory of your MetaTrader terminal data folder. It contains
// information about available broker servers
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Retrieving existing provisioning profiles via API
```javascript
const provisioningProfiles = await api.provisioningProfileApi.getProvisioningProfiles();
const provisioningProfile = await api.provisioningProfileApi.getProvisioningProfile('profileId');
```

### Updating a provisioning profile via API
```javascript
await provisioningProfile.update({name: 'New name'});
// for MT5, you should upload a servers.dat file
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Removing a provisioning profile
```javascript
await provisioningProfile.remove();
```

### Managing MetaTrader accounts (API servers) via web UI
You can manage MetaTrader accounts here: [https://app.metaapi.cloud/accounts](https://app.metaapi.cloud/accounts)

### Create a MetaTrader account (API server) via API
```javascript
const account = await api.metatraderAccountApi.createAccount({
  name: 'Trading account #1',
  type: 'cloud',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  provisioningProfileId: provisioningProfile.id,
  application: 'MetaApi',
  magic: 123456,
  quoteStreamingIntervalInSeconds: 2.5 // set to 0 to receive quote per tick
});
```

### Retrieving existing accounts via API
```javascript
// filter and paginate accounts, see esdoc for full list of filter options available
const accounts = await api.metatraderAccountApi.getAccounts({
  limit: 10,
  offset: 0,
  query: 'ICMarketsSC-MT5',
  state: ['DEPLOYED']
});
// get accounts without filter (returns 1000 accounts max)
const accounts = await api.metatraderAccountApi.getAccounts();

const account = await api.metatraderAccountApi.getAccount('accountId');
```

### Updating an existing account via API
```javascript
await account.update({
  name: 'Trading account #1',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  quoteStreamingIntervalInSeconds: 2.5 // set to 0 to receive quote per tick
});
```

### Removing an account
```javascript
await account.remove();
```

### Deploying, undeploying and redeploying an account (API server) via API
```javascript
await account.deploy();
await account.undeploy();
await account.redeploy();
```

## Access MetaTrader account via RPC API
RPC API let you query the trading terminal state. You should use
RPC API if you develop trading monitoring apps like myfxbook or other
simple trading apps.

### Query account information, positions, orders and history via RPC API
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// retrieve balance and equity
console.log(await connection.getAccountInformation());
// retrieve open positions
console.log(await connection.getPositions());
// retrieve a position by id
console.log(await connection.getPosition('1234567'));
// retrieve pending orders
console.log(await connection.getOrders());
// retrieve a pending order by id
console.log(await connection.getOrder('1234567'));
// retrieve history orders by ticket
console.log(await connection.getHistoryOrdersByTicket('1234567'));
// retrieve history orders by position id
console.log(await connection.getHistoryOrdersByPosition('1234567'));
// retrieve history orders by time range
console.log(await connection.getHistoryOrdersByTimeRange(startTime, endTime));
// retrieve history deals by ticket
console.log(await connection.getDealsByTicket('1234567'));
// retrieve history deals by position id
console.log(await connection.getDealsByPosition('1234567'));
// retrieve history deals by time range
console.log(await connection.getDealsByTimeRange(startTime, endTime));
```

### Query contract specifications and quotes via RPC API
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// first, subscribe to market data
await connection.subscribeToMarketData('GBPUSD');

// read constract specification
console.log(await connection.getSymbolSpecification('GBPUSD'));
// read current price
console.log(await connection.getSymbolPrice('GBPUSD'));
```

### Use real-time streaming API
Real-time streaming API is good for developing trading applications like trade copiers or automated trading strategies.
The API synchronizes the terminal state locally so that you can query local copy of the terminal state really fast.

#### Synchronizing and reading teminal state
```javascript
const account = await api.metatraderAccountApi.getAccount('accountId');

// access local copy of terminal state
const terminalState = connection.terminalState;

// wait until synchronization completed
await connection.waitSynchronized();

console.log(terminalState.connected);
console.log(terminalState.connectedToBroker);
console.log(terminalState.accountInformation);
console.log(terminalState.positions);
console.log(terminalState.orders);
// symbol specifications
console.log(terminalState.specifications);
console.log(terminalState.specification('EURUSD'));
console.log(terminalState.price('EURUSD'));

// access history storage
historyStorage = connection.historyStorage;

// both orderSynchronizationFinished and dealSynchronizationFinished
// should be true once history synchronization have finished
console.log(historyStorage.orderSynchronizationFinished);
console.log(historyStorage.dealSynchronizationFinished);
```

#### Overriding local history storage
By default history is stored in memory only. You can override history storage to save trade history to a persistent storage like MongoDB database.
```javascript
import {HistoryStorage} from 'metaapi.cloud-sdk';

class MongodbHistoryStorage extends HistoryStorage {
  // implement the abstract methods, see MemoryHistoryStorage for sample
  // implementation
}

let historyStorage = new MongodbHistoryStorage();

// Note: if you will not specify history storage, then in-memory storage
// will be used (instance of MemoryHistoryStorage)
const connection = await account.connect(historyStorage);

// access history storage
historyStorage = connection.historyStorage;

// invoke other methods provided by your history storage implementation
console.log(await historyStorage.yourMethod());
```

#### Receiving synchronization events
You can override SynchronizationListener in order to receive synchronization event notifications, such as account/position/order/history updates or symbol quote updates.
```javascript
import {SynchronizationListener} from 'metaapi.cloud-sdk';

// receive synchronization event notifications
// first, implement your listener
class MySynchronizationListener extends SynchronizationListener {
  // override abstract methods you want to receive notifications for
}

// now add the listener
const listener = new MySynchronizationListener();
connection.addSynchronizationListener(listener);

// remove the listener when no longer needed
connection.removeSynchronizationListener(listener);
```

### Retrieve contract specifications and quotes via streaming API
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// first, subscribe to market data
await connection.subscribeToMarketData('GBPUSD');

// read constract specification
console.log(terminalState.specification('EURUSD'));
// read current price
console.log(terminalState.price('EURUSD'));
```

### Execute trades (both RPC and streaming APIs)
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// trade
console.log(await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createMarketSellOrder('GBPUSD', 0.07, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopLimitBuyOrder('GBPUSD', 0.07, 1.5, 1.4, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopLimitSellOrder('GBPUSD', 0.07, 1.0, 1.1, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.modifyPosition('46870472', 2.0, 0.9));
console.log(await connection.closePositionPartially('46870472', 0.9));
console.log(await connection.closePosition('46870472'));
console.log(await connection.closeBy('46870472', '46870482'));
console.log(await connection.closePositionsBySymbol('EURUSD'));
console.log(await connection.modifyOrder('46870472', 1.0, 2.0, 0.9));
console.log(await connection.cancelOrder('46870472'));

// if you need to, check the extra result information in stringCode and numericCode properties of the response
const result = await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
console.log('Trade successful, result code is ' + result.stringCode);
```

## Monitoring account connection health and uptime
You can monitor account connection health using MetaApiConnection.healthMonitor API.
```javascript
let monitor = connection.healthMonitor;
// retrieve detailed connection health status
console.log(monitor.healthStatus);
// retrieve account connection update measured over last 7 days
console.log(monitor.uptime);
```

## Managing MetaTrader demo accounts via API
Please note that not all MT4/MT5 servers allows you to create demo accounts using the method below.
### Create a MetaTrader 4 demo account
```javascript
const demoAccount = await api.metatraderDemoAccountApi.createMT4DemoAccount(provisioningProfile.id, {
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'Exness-Trial4'
  });
```

### Create a MetaTrader 5 demo account
```javascript
const demoAccount = await api.metatraderDemoAccountApi.createMT5DemoAccount(provisioningProfile.id, {
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'ICMarketsSC-Demo'
  });
```

## CopyFactory copy trading API (experimental)

CopyFactory is a powerful trade copying API which makes developing forex
trade copying applications as easy as writing few lines of code.

At this point this feature is experimental and we have not yet defined a final price for it.

### Why do we offer CopyFactory API

We found that developing reliable and flexible trade copier is a task
which requires lots of effort, because developers have to solve a series
of complex technical tasks to create a product.

We decided to share our product as it allows developers to start with a
powerful solution in almost no time, save on development and
infrastructure maintenance costs.

### CopyFactory features
Features supported:

- low latency trade copying
- connect arbitrary number of strategy providers and subscribers
- subscribe accounts to multiple strategies at once
- select arbitrary copy ratio for each subscription
- apply advanced risk filters on strategy provider side
- override risk filters on subscriber side
- provide multiple strategies from a single account based on magic or symbol filters
- reliable trade copying
- supports manual trading on subscriber accounts while copying trades
- synchronize subscriber account with strategy providers
- monitor trading history
- calculate trade copying commissions for account managers
- [coming soon] support portfolio strategies as trading signal source, i.e. the strategies which include signals of several other strategies (also known as combos on some platforms)

Please note that trade copying to MT5 netting accounts is not supported in the current API version

### Configuring trade copying

In order to configure trade copying you need to:

- add MetaApi MetaTrader accounts with CopyFactory as application field value (see above)
- create CopyFactory master and slave accounts and connect them to MetaApi accounts via connectionId field
- create a strategy being copied
- subscribe slave CopyFactory accounts to the strategy

```javascript
import MetaApi, {CopyFactory} from 'metaapi.cloud-sdk';

const token = '...';
const metaapi = new MetaApi(token);
const copyFactory = new CopyFactory(token);

// retrieve MetaApi MetaTrader accounts with CopyFactory as application field value
const masterMetaapiAccount = await metaapi.metatraderAccountApi.getAccount('masterMetaapiAccountId');
if (masterMetaapiAccount.application !== 'CopyFactory') {
  throw new Error('Please specify CopyFactory application field value in your MetaApi account in order to use it in CopyFactory API');
}
const slaveMetaapiAccount = await metaapi.metatraderAccountApi.getAccount('slaveMetaapiAccountId');
if (slaveMetaapiAccount.application !== 'CopyFactory') {
  throw new Error('Please specify CopyFactory application field value in your MetaApi account in order to use it in CopyFactory API');
}

// create CopyFactory master and slave accounts and connect them to MetaApi accounts via connectionId field
let configurationApi = copyFactory.configurationApi;
let masterAccountId = configurationApi.generateAccountId();
let slaveAccountId = configurationApi.generateAccountId();
await configurationApi.updateAccount(masterAccountId, {
  name: 'Demo master account',
  connectionId: masterMetaapiAccount.id,
  subscriptions: []
});
await configurationApi.updateAccount(slaveAccountId, {
  name: 'Demo slave account',
  connectionId: slaveMetaapiAccount.id,
  subscriptions: []
});


// create a strategy being copied
let strategyId = await configurationApi.generateStrategyId();
await configurationApi.updateStrategy(strategyId.id, {
  name: 'Test strategy',
  description: 'Some useful description about your strategy',
  positionLifecycle: 'hedging',
  connectionId: slaveMetaapiAccount.id,
  maxTradeRisk: 0.1,
  stopOutRisk: {
    value: 0.4,
    startTime: new Date('2020-08-24T00:00:00.000Z')
  },
  timeSettings: {
    lifetimeInHours: 192,
    openingIntervalInMinutes: 5
  }
});

// subscribe slave CopyFactory accounts to the strategy
await configurationApi.updateAccount(masterAccountId, {
  name: 'Demo account',
  connectionId: masterMetaapiAccount.id,
  subscriptions: [
    {
      strategyId,
      multiplier: 1
    }
  ]
});
```

See esdoc in-code documentation for full definition of possible configuration options.

### Retrieving trade copying history

CopyFactory allows you to monitor transactions conducted on trading accounts in real time.

#### Retrieving trading history on provider side
```javascript
let historyApi = copyFactory.historyApi;

// retrieve list of subscribers
console.log(await historyApi.getSubscribers());

// retrieve list of strategies provided
console.log(await historyApi.getProvidedStrategies());

// retrieve trading history, please note that this method support pagination and limits number of records
console.log(await historyApi.getProvidedStrategiesTransactions(new Date('2020-08-01'), new Date('2020-09-01'));
```

#### Retrieving trading history on subscriber side
```javascript
let historyApi = copyFactory.historyApi;

// retrieve list of providers
console.log(await historyApi.getProviders());

// retrieve list of strategies subscribed to
console.log(await historyApi.getStrategiesSubscribed());

// retrieve trading history, please note that this method support pagination and limits number of records
console.log(await historyApi.getStrategiesSubscribedTransactions(new Date('2020-08-01'), new Date('2020-09-01'));
```

#### Resynchronizing slave accounts to masters
There is a configurable time limit during which the trades can be opened. Sometimes trades can not open in time due to broker errors or trading session time discrepancy.
You can resynchronize a slave account to place such late trades. Please note that positions which were
closed manually on a slave account will also be reopened during resynchronization.

```javascript
let accountId = '...'; // CopyFactory account id

// resynchronize all strategies
await copyFactory.tradingApi.resynchronize(accountId);

// resynchronize specific strategy
await copyFactory.tradingApi.resynchronize(accountId, ['ABCD']);
```

#### Managing stopouts
A subscription to a strategy can be stopped if the strategy have exceeded allowed risk limit.
```javascript
let tradingApi = copyFactory.tradingApi;
let accountId = '...'; // CopyFactory account id

// retrieve list of strategy stopouts
console.log(await tradingApi.getStopouts(accountId));

// reset a stopout so that subscription can continue
await tradingApi.resetStopout(accountId, 'daily-equity');
```

Keywords: MetaTrader API, MetaTrader REST API, MetaTrader websocket API,
MetaTrader 5 API, MetaTrader 5 REST API, MetaTrader 5 websocket API,
MetaTrader 4 API, MetaTrader 4 REST API, MetaTrader 4 websocket API,
MT5 API, MT5 REST API, MT5 websocket API, MT4 API, MT4 REST API,
MT4 websocket API, MetaTrader SDK, MetaTrader SDK, MT4 SDK, MT5 SDK,
MetaTrader 5 SDK, MetaTrader 4 SDK, MetaTrader node.js SDK, MetaTrader 5
node.js SDK, MetaTrader 4 node.js SDK, MT5 node.js SDK, MT4 node.js SDK,
FX REST API, Forex REST API, Forex websocket API, FX websocket API, FX
SDK, Forex SDK, FX node.js SDK, Forex node.js SDK, Trading API, Forex
API, FX API, Trading SDK, Trading REST API, Trading websocket API,
Trading SDK, Trading node.js SDK
