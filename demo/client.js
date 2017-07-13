import React from 'react';
import ReactDOM from 'react-dom';
import { DFPPrebidContainer } from '../lib';

ReactDOM.render(
  React.createElement('div', {
    children: [
      React.createElement(DFPPrebidContainer, {
        domID: 'Bloco_Diarios_View_Docside_elm0',
        slot: 'Bloco_Diarios_View_Docside',
        dimensions: [[300, 250], [300,600]],
        adNetwork: '1045205',
        bids: [
          {
            bidder: 'aol',
            params: {
              placement: '4601503',
              network: '11111.1'
            }
          },
          {
            bidder: 'criteo',
            params: {
              zoneId: '797450'
            }
          },
          {
            bidder: 'appnexus',
            params: {
              placementId: '10433394'
            }
          }
        ]
      }),
      React.createElement(DFPPrebidContainer, {
        domID: 'Bloco_Diarios_View_Toppage_elm0',
        slot: 'Bloco_Diarios_View_Toppage',
        dimensions: [[728, 90], [970, 90]],
        adNetwork: '1045205',
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
