import {watchState} from './watchers.js';
import {object, string} from 'yup';
import i18next from 'i18next';
import ru from "./locales/ru.json";
import {setLocale} from 'yup';

const app = () => {

    const resources = {
        ru: {
            translation: ru
        }
    };

    i18next.init({
        lng: "ru",
        // debug: true,
        resources
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
        },
        urls: [],
        viewedUrls: [],
        feeds: [],
    };

    const schema = object({
        url: string()
            .url()
            .required()
            .notOneOf([state.urls])
    });

    const rssParse = (content) => {
        return new DOMParser().parseFromString(content, "text/xml");
    };

    const urlsByPass = (urls) => {
        const promises = [];
        Array.prototype.forEach.call(urls, url => {
            promises.push(
                fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url.toString())}`)
                    .then(response => {
                        if (response.ok) return response.json();
                    })
            )
        });
        return promises;
    };

    const feedsUpdate = (promises) => {
        Promise.all(promises)
            .then((data) => {
                data.forEach((item) => {
                    const content = rssParse(item.contents);
                    if (!content.querySelector('parsererror')) {
                        const itemList = [];
                        const items = content.querySelectorAll('item');
                        items.forEach((item) => {
                            itemList.push({
                                'title': item.querySelector('title').innerHTML,
                                'description': item.querySelector('description').innerHTML,
                                'link': item.querySelector('link').innerHTML,
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
                                'link': currentLink,
                                'title': content.querySelector('title').innerHTML,
                                'description': content.querySelector('description').innerHTML,
                                'items': itemList,
                            });
                        }
                    } else {
                        watchState(state).rssForm.error = i18next.t(ru.rssForm.feedback.notValidRss);
                    }

                });
            })
            .catch(() => {
                watchState(state).rssForm.error = i18next.t(ru.rssForm.feedback.networkProblems);
                watchState(state).rssForm.isValid = false;
            })
    };

    const form = document.getElementsByClassName('rss-form').item(0);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const url = data.get('url');
        schema.validate({url})
            .then(() => {
                state.urls.push(url);
                state.rssForm.isValid = true;
                feedsUpdate(urlsByPass(state.urls));
            })
            .catch((error) => {
                watchState(state).rssForm.error = error.message;
                watchState(state).rssForm.isValid = false;
            })
            .finally(() => {
                 let update = setTimeout(function recursion() {
                     feedsUpdate(urlsByPass(state.urls));
                     update = setTimeout(recursion, 5000);
                 }, 5000);
            });
    });
}

export default app;
