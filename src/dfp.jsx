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

  adServerInit() {
    if (!window.googletag) {
      window.googletag = { cmd: [() => window.googletag.pubads().disableInitialLoad()] };
    }
  }

  adServerType() {
    return 'dfp';
  }

  adServerURL() {
    return 'https://www.googletagservices.com/tag/js/gpt.js';
  }

  adServerRequest() {
    const { googletag } = window;
    googletag.cmd.push(() => {
      this.afterAdServerRequest().then(() => {
        googletag.pubads().refresh();
      });
    });
  }

  adServerSlot(isTheLastSpot, lastSpotCallback) {
    const { googletag } = window;
    const { adNetwork, slot, dimensions, targeting, domID } = this.props;
    const adunitPath = `/${adNetwork}/${slot}`;

    // googletag.cmd is an array of commands that will be execute in inserted order after DFP loads
    googletag.cmd.push(() => {
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
        pubadsService.enableSingleRequest();
        googletag.enableServices();
        lastSpotCallback();
      }
    });
  }

  slotRendered(event) {
    const { flexible, domID } = this.props;
    const adFrame = document.getElementById(domID).querySelector('iframe');
    let size = event.size || [];
    if (event.slot.getSlotId().getDomId() !== domID) return;

    if (size.join('x') === '1x1') {
      // size 1x1 means creatives with capability to ensure multiple sizes
      size = [adFrame.width, adFrame.height];
    }

    this.props.afterAdLoaded(!event.isEmpty, size);
    if (flexible && !event.isEmpty) {
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
