import { Component } from 'react';
import PropTypes from 'prop-types';
import { nautilus } from 'nautilusjs';

const DFP_URL = '//www.googletagservices.com/tag/js/gpt.js';
const PREBID_URL = '//acdn.adnxs.com/prebid/not-for-prod/prebid.js';
const ADSERVER_TIMEOUT = 2000;

const propTypes = {
  id: PropTypes.string.isRequired,
  slot: PropTypes.string.isRequired,
  adNetwork: PropTypes.string.isRequired,
  bids: PropTypes.arrayOf(PropTypes.shape({
    bidder: PropTypes.string.isRequired,
    params: PropTypes.shape({
      placementId: PropTypes.string.isRequired,
    }),
  })),
  dimensions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  className: PropTypes.string,
  targeting: PropTypes.object,
  afterAdLoaded: PropTypes.func,
  flexible: PropTypes.bool,
  skipIf: PropTypes.func,
};

const defaultProps = {
  targeting: {},
  skipIf: () => false,
  afterAdLoaded: () => {},
};


export default class DFPAdContainer extends Component {
  static get propTypes() { return propTypes; }
  static get defaultProps() { return defaultProps; }

  constructor(props) {
    super(props);
    this.state = { hide: true, domID: (props.id || props.slot) };
    this.defineSlot = ::this.defineSlot;
    this.slotRendered = ::this.slotRendered;
    this.sendAdserverRequest = ::this.sendAdserverRequest;
  }

  componentDidMount() {
    const { skipIf } = this.props;
    if (skipIf()) return;
    console.log(this.props, this.state);

    if (!window.googletag) {
      console.log('mocking dfp', this.state);
      window.googletag = { __slots: [], cmd: [], };
      window.googletag.cmd.push(() => {
        console.log('disableInitialLoad')
        googletag.pubads().disableInitialLoad();
      });
    }

    if (!window.pbjs) {
      window.pbjs = { que: [] };
      window.pbjsAdServerTimeout = setTimeout(this.sendAdserverRequest, ADSERVER_TIMEOUT);
      nautilus([PREBID_URL], [DFP_URL]);
    }

    this.defineSlot(window);
  }

  sendAdserverRequest() {
    console.log('sendAdserverRequest', this.state);
    if (window.pbjs.adserverRequestSent) return;
    clearTimeout(window.pbjsAdServerTimeout);
    window.pbjs.adserverRequestSent = true;
    window.googletag.cmd.push(() => {
      console.log('set target');
      window.pbjs.setTargetingForGPTAsync();
      console.log('refresh pubads');
      window.googletag.pubads().refresh();
    });
  }

  defineSlot({ pbjs, googletag }) {
    const { adNetwork, slot, dimensions, bids, targeting } = this.props;
    const adunitPath = `/${adNetwork}/${slot}`;
    const domID = this.state.domID;
    if (googletag.__slots.indexOf(domID) > -1) return;

    // googletag.__slots is used to assert that slots are loaded one time only
    googletag.__slots.push(domID);
    const allSpotsOnPage = document.querySelectorAll('[data-prebid-adspot');
    const isTheLastSpot = allSpotsOnPage.length == googletag.__slots.length;

    // prebid addUnit
    pbjs.que.push(() => {
      console.log('pbjs.addAdUnits', { code: domID, sizes: dimensions, bids });
      pbjs.addAdUnits([{ code: domID, sizes: dimensions, bids }])
    });

    // googletag.cmd is an array of commands that will be execute in inserted order after DFP loads
    googletag.cmd.push(() => {
      console.log('googletag.defineSlot', adunitPath, dimensions, domID);
      /*
       * Here the ad slot will be requested and then the response will be
       * analysed by `this.slotRendered`.
       *
       * Full GPT (google publisher tag) doc:
       *   https://developers.google.com/doubleclick-gpt/reference
       */

      const pubadsService = googletag.pubads(); // googletag.pubads
      const adslot = googletag.defineSlot(adunitPath, dimensions, domID); // #googletag.defineSlot

      // #googletag.Slot_setTargeting
      Object.keys(targeting).forEach((key) => adslot.setTargeting(key, targeting[key]));
      adslot.addService(pubadsService); // #googletag.Slot_addService

      // googletag.display(domID); // #googletag.display
      // #googletag.Service_addEventListener
      pubadsService.addEventListener('slotRenderEnded', this.slotRendered);
      if (isTheLastSpot){
        console.log('enableSingleRequest // enableServices');
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        console.log('pbjs.requestBids');
        pbjs.requestBids({
          bidsBackHandler: this.sendAdserverRequest
        });
      }
    });
  }

  slotRendered(event) {
    const { props: { flexible }, state: { domID } } = this;
    console.log(flexible, domID, event.slot.getSlotId().getDomId(), event.isEmpty);
    if (event.slot.getSlotId().getDomId() !== domID) return;

    const adspot = document.getElementById(domID);
    // event.isEmpty returns true if there's no ads to show in this slot
    this.setState({ hide: event.isEmpty });
    this.props.afterAdLoaded(!event.isEmpty, event.size, adspot);
    if (flexible && !event.isEmpty) {
      const adFrame = adspot.querySelector('iframe');
      const { parentNode: container, contentDocument: adDocument } = adFrame;
      container.style.width = '100%';
      container.style.height = 'auto';
      adFrame.width = '100%';

      const updateHeight = () => { adFrame.height = adDocument.body.offsetHeight; };
      const adImages = [].slice.call(adDocument.querySelectorAll('img'), 0);
      adImages.forEach(img => img.addEventListener('load', updateHeight));
      updateHeight();
    }
  }

  render() {
    const { props: { className }, state: {domID} } = this;
    return <div id={domID} className={`adspot ${className}`} data-prebid-adspot />;
  }

}
