import Parse from 'url-parse';
import Notification from '@/components/Notification/main.js';
import { HCI } from '@/config/types';
import _ from 'lodash';
export const state = function() {
  return {
    latestBundleId:   '',
    bundlePending:    false,
    showBundleModal:  false,
    bundlePercentage: 0
  };
};

export const mutations = {
  setLatestBundleId(state, bundleId) {
    state.latestBundleId = bundleId;
  },

  setBundlePending(state, value) {
    state.bundlePending = value;
  },

  toggleBundleModal(state, value) {
    state.showBundleModal = value;
  },

  setBundlePercentage(state, value) {
    state.bundlePercentage = value;
  }
};

export const getters = {
  getBundleId(state) {
    return state.latestBundleId;
  },

  isBundlePending(state) {
    return state.bundlePending;
  },

  isShowBundleModal(state) {
    return state.showBundleModal;
  },

  getBundlePercentage(state) {
    return state.bundlePercentage;
  }
};

export const actions = {
  async bundleProgress({
    state, dispatch, commit, rootGetters
  }) {
    const parse = Parse(window.history.href);

    const id = state.latestBundleId;
    let bundleCrd = await dispatch('cluster/find', { type: HCI.SUPPORT_BUNDLE, id }, { root: true });
    const t = rootGetters['i18n/t'];

    let count = 0;

    await commit('setBundlePending', true);
    const timer = setInterval(async() => {
      count = count + 1;
      if (count % 3 === 0) { // ws mayby disconnect
        bundleCrd = await dispatch('cluster/find', {
          type: HCI.SUPPORT_BUNDLE,
          id,
          opt:  { force: true }
        }, { root: true });
      }

      if (bundleCrd.bundleState !== 'ready') {
        bundleCrd = rootGetters['cluster/byId'](HCI.SUPPORT_BUNDLE, id);
        const percentage = bundleCrd.precent;

        commit('setBundlePercentage', percentage);

        if (bundleCrd?.bundleMessage) {
          Notification.warning({
            duration: 0,
            title:    t('harvester.notification.title.error'),
            message:  bundleCrd?.bundleMessage
          });
          clearInterval(timer);
          commit('setBundlePending', false);
        }
      } else {
        const name = id.split('/')[1];

        commit('setBundlePercentage', 1);

        setTimeout(() => {
          commit('toggleBundleModal', false);
          commit('setBundlePending', false);
          commit('setBundlePercentage', 0);
        }, 600);

        window.location.href = `${ parse.origin }/v1/supportbundles/${ name }/download`;
        clearInterval(timer);
      }
    }, 1000);
  }
};
