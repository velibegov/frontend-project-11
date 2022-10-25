import { object, string, setLocale } from 'yup';
import i18next from 'i18next';
import ru from './locales/ru.json';
import watchState from './watchers.js';

const app = () => {
  const resources = {
    ru: {
      translation: ru,
    },
  };

  i18next.init({
    lng: 'ru',
    resources,
  });

  setLocale({
    mixed: {
      notOneOf: i18next.t(ru.rssForm.feedback.urlAlreadyExists),
    },
    string: {
      url: i18next.t(ru.rssForm.feedback.notValidUrl),
    },
  });

  const state = {
    rssForm: {
      isValid: false,
      feedback: '',
      error: '',
      uniqAttribute: 0,
      modalContent: {},
    },
    urls: [],
    viewedUrls: [],
    feeds: [],
  };

  const schema = object({
    url: string()
      .url()
      .required()
      .notOneOf([state.urls]),
  });

  const rssParse = (content) => new DOMParser().parseFromString(content, 'text/xml');

  const urlsBypass = (urls) => {
    const promises = [];
    Array.prototype.forEach.call(urls, (url) => {
      promises.push(
        fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url.toString())}`)
          .then((response) => response.json()),
      );
    });
    return promises;
  };

  const addPreviewListeners = () => {
    const elements = document.querySelectorAll('button[data-id]');
    elements.forEach((element) => {
      element.addEventListener('click', () => {
        const id = parseInt(element.dataset.id, 10);
        const viewed = document.querySelector(`a[data-id="${id}"]`);
        let content = [];
        state.feeds.map((feed) => content = feed.items.filter((item) => item.dataId === id));
        state.rssForm.modalContent = {
          title: content[0].title,
          description: content[0].description.replace('<![CDATA[', '').replace(']]>', ''),
          link: content[0].link,
        };
        watchState(state).viewedUrls.push(viewed.href);
      });
    });
  };

  const feedsUpdate = (promises) => {
    Promise.all(promises)
      .then((data) => {
        data.forEach((item) => {
          const content = rssParse(item.contents);
          if (!content.querySelector('parsererror')) {
            const itemList = [];
            const items = content.querySelectorAll('item');
            items.forEach((current) => {
              itemList.push({
                title: current.querySelector('title').innerHTML,
                description: current.querySelector('description').innerHTML,
                link: current.querySelector('link').innerHTML,
                dataId: state.rssForm.uniqAttribute += 1,
              });
            });
            state.rssForm.feedback = i18next.t(ru.rssForm.feedback.success);
            const currentLink = content.querySelector('link').innerHTML;
            const links = [];
            state.feeds.forEach((feed) => {
              links.push(feed.link);
            });
            if (!links.includes(currentLink)) {
              watchState(state).feeds.push({
                link: currentLink,
                title: content.querySelector('title').innerHTML,
                description: content.querySelector('description').innerHTML,
                items: itemList,
              });
            }
          } else {
            watchState(state).rssForm.error = i18next.t(ru.rssForm.feedback.notValidRss);
          }
        });
      })
      .then(() => {
        addPreviewListeners();
      })
      .catch(() => {
        watchState(state).rssForm.error = i18next.t(ru.rssForm.feedback.networkProblems);
        watchState(state).rssForm.isValid = false;
      });
  };

  const form = document.getElementsByClassName('rss-form').item(0);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const url = data.get('url');
    schema.validate({ url })
      .then(() => {
        state.urls.push(url);
        state.rssForm.isValid = true;
        feedsUpdate(urlsBypass(state.urls));
      })
      .catch((error) => {
        watchState(state).rssForm.error = error.message;
        watchState(state).rssForm.isValid = false;
      })
      .finally(() => {
        let update = setTimeout(function recursion() {
          feedsUpdate(urlsBypass(state.urls));
          update = setTimeout(recursion, 5000);
        }, 5000);
      });
  });
};

export default app;
