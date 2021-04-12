import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { nautilus } from 'nautilusjs';
import isUndefined from 'lodash.isundefined';
import omitBy from 'lodash.omitby';

const DEFAULT_PREBID_URL = 'https://acdn.adnxs.com/prebid/not-for-prod/1/prebid.js';
const DEFAULT_ADSERVER_TIMEOUT = 1000;

const propTypes = {
  'data-testid': PropTypes.string,
  domID: PropTypes.string.isRequired,
  bids: PropTypes.arrayOf(PropTypes.shape({
    bidder: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
  })),
  dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  className: PropTypes.string,
  skipIf: PropTypes.func,
  prebidLibURL: PropTypes.string,
  bidderAliases: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),

  // pbjs setConfig props
  bidderTimeout: PropTypes.number,
  currency: PropTypes.shape({
    adServerCurrency: PropTypes.string,
    granularityMultiplier: PropTypes.number,
    conversionRateFile: PropTypes.string,
    rates: PropTypes.object,
    bidderCurrencyDefault: PropTypes.object,
  }),
  debug: PropTypes.bool,
  priceGranularity: PropTypes.oneOfType([
    PropTypes.oneOf(['low', 'medium', 'high', 'auto', 'dense']),
    PropTypes.shape({
      buckets: PropTypes.arrayOf(PropTypes.shape({
        min: PropTypes.number,
        max: PropTypes.number,
        increment: PropTypes.number,
        precision: PropTypes.number,
      })),
    }),
  ]),
};

const defaultProps = {
  skipIf: () => false,
  bids: [],
  prebidLibURL: DEFAULT_PREBID_URL,
  bidderAliases: [],

  // pbjs setConfig props
  bidderTimeout: DEFAULT_ADSERVER_TIMEOUT,
  debug: process.env.NODE_ENV === 'development',
};


export default class PrebidContainer extends Component {
  static get propTypes() { return propTypes; }
  static get defaultProps() { return defaultProps; }

  constructor(props) {
    super(props);
    this.configure = ::this.configure;
    this.requestBids = ::this.requestBids;
    this.sendAdserverRequest = ::this.sendAdserverRequest;
  }

  configure() {
    const { bidderAliases, bidderTimeout, currency, debug, priceGranularity } = this.props;
    bidderAliases.forEach(([adapterName, aliasedName]) => {
      pbjs.aliasBidder(adapterName, aliasedName);
    });
    const pbjsConfig = omitBy({
      bidderTimeout,
      currency,
      debug,
      priceGranularity,
    }, isUndefined);
    pbjs.setConfig(pbjsConfig);
  }

  componentDidMount() {
    const { skipIf, prebidLibURL } = this.props;
    if (skipIf()) return;

    this.adServerInit();

    if (!window.pbjs) {
      window.pbjs = { que: [this.configure] };
      window.pbjs__slots = [];
      nautilus([prebidLibURL, this.adServerURL()]);
    }

    this.defineSlot();
  }

  adServerInit() {
    throw new Error('AdServer initiation is not implemented');
  }

  adServerType() {
    throw new Error('AdServer type is not implemented');
  }

  adServerURL() {
    throw new Error('AdServer URL is not implemented');
  }

  adServerRequest() {
    throw new Error('AdServer request is not implemented');
  }

  adServerSlot() {
    throw new Error('AdServer slot is not implemented');
  }

  sendAdserverRequest() {
    const { pbjs } = window;
    if (pbjs.adserverRequestSent) return;
    pbjs.adserverRequestSent = true;
    this.adServerRequest();
  }

  afterAdServerRequest() {
    const { pbjs } = window;
    return new Promise((resolve) => {
      pbjs.que.push(() => {
        pbjs.setTargetingForGPTAsync();
        resolve();
      });
    });
  }

  requestBids() {
    const { pbjs } = window;
    pbjs.que.push(() => {
      pbjs.requestBids({ bidsBackHandler: this.sendAdserverRequest });
    });
  }

  defineSlot() {
    const { pbjs, pbjs__slots } = window;
    const { dimensions, bids, domID } = this.props;

    // prebid addUnit
    pbjs.que.push(() => {
      if (pbjs__slots.indexOf(domID) > -1) return;

      // pbjs__slots is used to assert that slots are loaded one time only
      pbjs__slots.push(domID);
      const allSpotsOnPage = document.querySelectorAll(`[data-prebid-adspot=${this.adServerType()}]`);
      const isTheLastSpot = allSpotsOnPage.length === pbjs__slots.length;

      pbjs.addAdUnits([{
        code: domID,
        mediaTypes: { banner: { sizes: dimensions } },
        bids,
      }])

      this.adServerSlot(isTheLastSpot, this.requestBids);
    });
  }

  render() {
    const { className, domID, 'data-testid': dataTestId } = this.props;
    return (
      <div
        id={domID}
        className={`adspot ${className || ''}`.trim()}
        data-prebid-adspot={this.adServerType()}
        data-testid={dataTestId}
      />
    );
  }

}
