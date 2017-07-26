import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { nautilus } from 'nautilusjs';

const PREBID_URL = '//az.jusbr.com/libs/prebid/prebid-0.26.1-aol-appnexus-criteo-rubicon.js';
const ADSERVER_TIMEOUT = 1000;

const propTypes = {
  domID: PropTypes.string.isRequired,
  bids: PropTypes.arrayOf(PropTypes.shape({
    bidder: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
  })),
  dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  className: PropTypes.string,
  skipIf: PropTypes.func,
};

const defaultProps = {
  skipIf: () => false,
  bids: [],
};


export default class PrebidContainer extends Component {
  static get propTypes() { return propTypes; }
  static get defaultProps() { return defaultProps; }

  constructor(props) {
    super(props);
    this.requestBids = ::this.requestBids;
    this.sendAdserverRequest = ::this.sendAdserverRequest;
  }

  componentDidMount() {
    const { skipIf } = this.props;
    if (skipIf()) return;

    this.adServerInit(window);

    if (!window.pbjs) {
      window.pbjs = { que: [] };
      window.pbjs__slots = [];
      window.pbjsAdServerTimeout = setTimeout(this.sendAdserverRequest, ADSERVER_TIMEOUT);
      nautilus([PREBID_URL], [this.adServerURL()]);
    }

    this.defineSlot(window);
  }

  adServerInit(window) {
    throw new Error('AdServer initiation is not implemented');
  }

  adServerType() {
    throw new Error('AdServer type is not implemented');
  }

  adServerURL() {
    throw new Error('AdServer URL is not implemented');
  }

  adServerRequest(window) {
    throw new Error('AdServer request is not implemented');
  }

  adServerSlot(window, isTheLastSpot) {
    throw new Error('AdServer slot is not implemented');
  }

  sendAdserverRequest() {
    if (window.pbjs.adserverRequestSent) return;
    clearTimeout(window.pbjsAdServerTimeout);
    window.pbjs.adserverRequestSent = true;
    this.adServerRequest(window);
  }

  afterAdServerRequest() {
    window.pbjs.setTargetingForGPTAsync();
  }

  requestBids() {
    window.pbjs.requestBids({ bidsBackHandler: this.sendAdserverRequest })
  }

  defineSlot(window) {
    const { pbjs, pbjs__slots } = window;
    const { dimensions, bids, domID } = this.props;
    if (pbjs__slots.indexOf(domID) > -1) return;

    // pbjs__slots is used to assert that slots are loaded one time only
    pbjs__slots.push(domID);
    const allSpotsOnPage = document.querySelectorAll(`[data-prebid-adspot=${this.adServerType()}]`);
    const isTheLastSpot = allSpotsOnPage.length == pbjs__slots.length;

    // prebid addUnit
    pbjs.que.push(() => {
      pbjs.addAdUnits([{ code: domID, sizes: dimensions, bids }])
    });

    this.adServerSlot(window, isTheLastSpot, this.requestBids);
  }

  render() {
    const { className, domID } = this.props;
    return (
      <div
        id={domID}
        className={`adspot ${className || ''}`.trim()}
        data-prebid-adspot={this.adServerType()}
      />
    );
  }

}
