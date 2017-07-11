import PrebidContainer from './_prebid';
import PropTypes from 'prop-types';

const propTypes = {
  slot: PropTypes.string.isRequired,
  adNetwork: PropTypes.string.isRequired,
  targeting: PropTypes.object,
  afterAdLoaded: PropTypes.func,
  flexible: PropTypes.bool,
};

const defaultProps = {
  targeting: {},
  afterAdLoaded: () => {},
};


export default class DFPPrebidContainer extends PrebidContainer {
  static get propTypes() { return { ...PrebidContainer.propTypes, ...propTypes }; }
  static get defaultProps() { return { ...PrebidContainer.defaultProps, ...defaultProps }; }

  constructor(props) {
    super(props);
    this.slotRendered = ::this.slotRendered;
  }

  adServerInit(window) {
    if (!window.googletag) {
      console.log('mocking dfp', this.state);
      window.googletag = { __slots: [], cmd: [], };
      window.googletag.cmd.push(() => {
        console.log('disableInitialLoad')
        googletag.pubads().disableInitialLoad();
      });
    }
  }

  adServerType() {
    return 'dfp';
  }

  adServerURL() {
    return '//www.googletagservices.com/tag/js/gpt.js';
  }

  adServerRequest(window) {
    window.googletag.cmd.push(() => {
      console.log('set target');
      window.pbjs.setTargetingForGPTAsync();
      console.log('refresh pubads');
      window.googletag.pubads().refresh();
    });
  }

  adServerSlot(window, isTheLastSpot, lastSpotCallback) {
    const { pbjs, googletag } = window;
    const { adNetwork, slot, dimensions, targeting, domID } = this.props;
    const adunitPath = `/${adNetwork}/${slot}`;

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
      if (isTheLastSpot) {
        console.log('enableSingleRequest // enableServices');
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        console.log('pbjs.requestBids');
        lastSpotCallback();
      }
    });
  }

  slotRendered(event) {
    const { flexible, domID } = this.props;
    console.log(flexible, domID, event.slot.getSlotId().getDomId(), event.isEmpty);
    if (event.slot.getSlotId().getDomId() !== domID) return;

    this.props.afterAdLoaded(!event.isEmpty, event.size);
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
}
