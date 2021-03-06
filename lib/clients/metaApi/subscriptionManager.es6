/**
 * Subscription manager to handle account subscription logic
 */
export default class SubscriptionManager {

  /**
   * Constructs the subscription manager
   * @param {MetaApiWebsocketClient} websocketClient websocket client to use for sending requests
   */
  constructor(websocketClient) {
    this._websocketClient = websocketClient;
    this._subscriptions = {};
    this._awaitingResubscribe = {};
  }

  /**
   * Returns whether an account is currently subscribing
   * @param {String} accountId account id
   * @param {Number} instanceNumber instance index number
   * @returns {Boolean} whether an account is currently subscribing
   */
  isAccountSubscribing(accountId, instanceNumber) {
    if(instanceNumber !== undefined) {
      return Object.keys(this._subscriptions).includes(accountId + ':' + instanceNumber);
    } else {
      for (let key of Object.keys(this._subscriptions)) {
        if (key.startsWith(accountId)) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Returns whether an instance is in disconnected retry mode
   * @param {String} accountId account id
   * @param {Number} instanceNumber instance index number
   * @returns {Boolean} whether an account is currently subscribing
   */
  isDisconnectedRetryMode(accountId, instanceNumber) {
    let instanceId = accountId + ':' + (instanceNumber || 0);
    return this._subscriptions[instanceId] ? this._subscriptions[instanceId].isDisconnectedRetryMode : false;
  }

  /**
   * Schedules to send subscribe requests to an account until cancelled
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   * @param {Boolean} isDisconnectedRetryMode whether to start subscription in disconnected retry
   * mode. Subscription task in disconnected mode will be immediately replaced when the status packet is received
   */
  async subscribe(accountId, instanceNumber, isDisconnectedRetryMode = false) {
    const client = this._websocketClient;
    let instanceId = accountId + ':' + (instanceNumber || 0);
    if(!this._subscriptions[instanceId]) {
      this._subscriptions[instanceId] = {
        shouldRetry: true,
        task: null,
        waitTask: null,
        future: null,
        isDisconnectedRetryMode
      };
      let subscribeRetryIntervalInSeconds = 3;
      while(this._subscriptions[instanceId].shouldRetry) {
        let resolveSubscribe;
        this._subscriptions[instanceId].task = {promise: new Promise((res) => {
          resolveSubscribe = res;
        })};
        this._subscriptions[instanceId].task.resolve = resolveSubscribe;
        // eslint-disable-next-line no-inner-declarations
        async function subscribeTask() {
          try {
            await client.subscribe(accountId, instanceNumber);
          } catch (err) {
            if(err.name === 'TooManyRequestsError') {
              const socketInstanceIndex = client.socketInstancesByAccounts[accountId];
              if (err.metadata.type === 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER') {
                console.log(err);
              }
              if (['LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER', 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_SERVER', 
                'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER_PER_SERVER'].includes(err.metadata.type)) {
                delete client.socketInstancesByAccounts[accountId];
                client.lockSocketInstance(socketInstanceIndex, err.metadata);
              } else {
                const retryTime = new Date(err.metadata.recommendedRetryTime).getTime();
                if (Date.now() + subscribeRetryIntervalInSeconds * 1000 < retryTime) {
                  await new Promise(res => setTimeout(res, retryTime - Date.now() -
                    subscribeRetryIntervalInSeconds * 1000));
                }
              }
            }
          }
          resolveSubscribe();
        }
        subscribeTask();
        await this._subscriptions[instanceId].task.promise;
        if(!this._subscriptions[instanceId].shouldRetry) {
          break;
        }
        const retryInterval = subscribeRetryIntervalInSeconds;
        subscribeRetryIntervalInSeconds = Math.min(subscribeRetryIntervalInSeconds * 2, 300);
        let resolve;
        let subscribePromise = new Promise((res) => {
          resolve = res;
        });
        this._subscriptions[instanceId].waitTask = setTimeout(() => {
          resolve(true);
        }, retryInterval * 1000);
        this._subscriptions[instanceId].future = {resolve, promise: subscribePromise};
        const result = await this._subscriptions[instanceId].future.promise;
        this._subscriptions[instanceId].future = null;
        if (!result) {
          break;
        }
      }
      delete this._subscriptions[instanceId];
    }
  }

  /**
   * Cancels active subscription tasks for an instance id
   * @param {String} instanceId instance id to cancel subscription task for
   */
  cancelSubscribe(instanceId) {
    if(this._subscriptions[instanceId]) {
      const subscription = this._subscriptions[instanceId];
      if(subscription.future) {
        subscription.future.resolve(false);
        clearTimeout(subscription.waitTask);
      }
      if(subscription.task) {
        subscription.task.resolve(false);
      }
      subscription.shouldRetry = false;
    }
  }

  /**
   * Cancels active subscription tasks for an account
   * @param {String} accountId account id to cancel subscription tasks for
   */
  cancelAccount(accountId) {
    for(let instanceId of Object.keys(this._subscriptions).filter(key => key.startsWith(accountId))) {
      this.cancelSubscribe(instanceId);
    }
  }

  /**
   * Invoked on account timeout.
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   */
  onTimeout(accountId, instanceNumber) {
    if(this._websocketClient.socketInstancesByAccounts[accountId] !== undefined && 
      this._websocketClient.connected(this._websocketClient.socketInstancesByAccounts[accountId])) {
      this.subscribe(accountId, instanceNumber, true);
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   */
  async onDisconnected(accountId, instanceNumber) {
    await new Promise(res => setTimeout(res, Math.max(Math.random() * 5, 1) * 1000));
    if(this._websocketClient.socketInstancesByAccounts[accountId] !== undefined) {
      this.subscribe(accountId, instanceNumber, true);
    }
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect.
   * @param {Number} socketInstanceIndex socket instance index
   * @param {String[]} reconnectAccountIds account ids to reconnect
   */
  onReconnected(socketInstanceIndex, reconnectAccountIds) {
    try {
      const socketInstancesByAccounts = this._websocketClient.socketInstancesByAccounts;
      for(let instanceId of Object.keys(this._subscriptions)){
        const accountId = instanceId.split(':')[0];
        if (socketInstancesByAccounts[accountId] === socketInstanceIndex) {
          this.cancelSubscribe(instanceId);
        }
      }
      reconnectAccountIds.forEach(async accountId => {
        try {
          if(!this._awaitingResubscribe[accountId]) {
            this._awaitingResubscribe[accountId] = true;
            while(this.isAccountSubscribing(accountId)) {
              await new Promise(res => setTimeout(res, 1000));
            }
            delete this._awaitingResubscribe[accountId];
            await new Promise(res => setTimeout(res, Math.random() * 5000));
            this.subscribe(accountId);
          }
        } catch (err) {
          console.error('[' + (new Date()).toISOString() + '] Account ' + accountId + 
          ' resubscribe task failed', err);
        }
      });
    } catch (err) {
      console.error('[' + (new Date()).toISOString() + '] Failed to process subscribe manager reconnected event', err);
    }
  }
}