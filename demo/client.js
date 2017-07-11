import { DFPPrebidContainer } from '../src';

ReactDOM.render(
  React.createElement('div', {
    children: [
      React.createElement(DFPAdContainer, {
        id: 'div-gpt-ad-1460505748561-0',
        slot: 'header-bid-tag-0',
        dimensions: [[300, 250], [300,600]],
        adNetwork: '19968336',
        bids: [{
          bidder: 'appnexus',
          params: {
             placementId: '10433394'
          }
        }]
      }),
      React.createElement(DFPAdContainer, {
        id: 'div-gpt-ad-1460505661639-0',
        slot: 'header-bid-tag1',
        dimensions: [[728, 90], [970, 90]],
        adNetwork: '19968336',
        bids: [{
          bidder: 'appnexus',
          params: {
             placementId: '10433394'
          }
        }]
      })
    ]
  }),
  document.getElementById('AppRoot')
);
