import { object, string } from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import options from './locales/ru.js';
import render, { STATE_STATUSES } from './view.js';

const app = () => {
  const PROXY_URL = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  const SUCCESS_HTTP_CODE_MIN = 200;
  const SUCCESS_HTTP_CODE_MAX = 299;

  const i18nInstance = i18next.createInstance();
  i18nInstance.init(options)
    .then((i18n) => {
      const state = {
        rssForm: {
          status: '',
          isUpdated: true,
          currentUrl: '',
          urls: [],
          feeds: [],
          modalContent: {},
          getUid: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
        },
        rssUI: {
          viewedUrls: [],
        },
      };

      const schema = object({
        url: string().url().required(),
      });

      const watchedState = onChange(state, () => {
        render(state, i18n);
      });

      const sendRequest = (url) => axios.get(PROXY_URL + encodeURIComponent(url))
        .catch(() => {
          watchedState.rssForm.status = STATE_STATUSES.NETWORK_PROBLEMS;
        });

      const rssParse = (content) => new DOMParser().parseFromString(content, 'application/xhtml+xml');

      const feedsUpdate = (promises) => {
        Promise
          .all(promises)
          .then((data) => {
            data.forEach((item) => {
              if (
                item.status >= SUCCESS_HTTP_CODE_MIN
                                && item.status <= SUCCESS_HTTP_CODE_MAX
              ) {
                const content = rssParse(item.data.contents);
                if (!content.querySelector('parsererror')) {
                  if (state.rssForm.currentUrl.length) {
                    state.rssForm.urls = [...state.rssForm.urls, state.rssForm.currentUrl];
                  }
                  state.rssForm.currentUrl = '';
                  const itemList = [];
                  const items = content.querySelectorAll('item');
                  items.forEach((current) => {
                    itemList.push({
                      title: current.querySelector('title').innerHTML,
                      description: current.querySelector('description')?.innerHTML ?? current.innerHTML,
                      link: current.querySelector('link').innerHTML,
                      dataId: state.rssForm.getUid(),
                    });
                  });
                  const currentLink = content.querySelector('link').innerHTML;
                  const links = [];
                  state.rssForm.feeds.forEach((feed) => {
                    links.push(feed.link);
                  });
                  if (!links.includes(currentLink)) {
                    state.rssForm.feeds.push({
                      link: currentLink,
                      title: content.querySelector('title').innerHTML,
                      description: content.querySelector('description')?.innerHTML ?? content.innerHTML,
                      items: itemList,
                    });
                  }
                  watchedState.rssForm.status = STATE_STATUSES.RENDERING;
                } else {
                  watchedState.rssForm.status = STATE_STATUSES.PARSE_ERROR;
                }
              } else {
                watchedState.rssForm.status = STATE_STATUSES.NETWORK_PROBLEMS;
              }
            });
          });
      };

      const form = document.getElementsByClassName('rss-form').item(0);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.rssForm.isUpdated = false;
        const data = new FormData(form);
        const url = data.get('url');
        schema
          .validate({ url })
          .then(() => {
            if (state.rssForm.urls.includes(url)) {
              throw Error(STATE_STATUSES.URL_EXIST);
            }
            watchedState.rssForm.status = STATE_STATUSES.SUBMITTING;
            return sendRequest(url);
          })
          .then((responseData) => {
            if (responseData) {
              watchedState.rssForm.status = STATE_STATUSES.PROCESSING;
              state.rssForm.currentUrl = url;
              feedsUpdate([responseData]);
            }
          })
          .catch((error) => {
            watchedState.rssForm.status = error.message;
          })
          .finally(() => {
            setTimeout(function recursion() {
              const promises = state.rssForm.urls.map((currentUrl) => sendRequest(currentUrl));
              state.rssForm.isUpdated = true;
              feedsUpdate(promises);
              setTimeout(recursion, 5000);
            }, 5000);
          });
      });
    });
};

export default app;
