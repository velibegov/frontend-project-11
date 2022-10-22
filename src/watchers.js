import onChange from "on-change";

export const watchState = (state) => onChange(state, (path, value, previousValue) => {
    render(state);
});

const render = (state) => {
    const input = document.getElementById('url-input');
    const feedback = document.getElementsByClassName('feedback').item(0);
    if (state.rssForm.isValid) {
        input.classList.remove('is-invalid');
        input.value = '';
        feedback.classList.remove('text-danger');
        feedback.classList.add('text-success');
        feedback.innerHTML = state.rssForm.feedback;
        input.focus();
    } else {
        feedback.classList.remove('text-success');
        feedback.classList.add('text-danger');
        feedback.innerHTML = state.rssForm.error;
        input.classList.add('is-invalid');
    }

    const feeds = document.getElementsByClassName('feeds').item(0);
    feeds.innerHTML = '';
    const feedsBorder = document.createElement('div');
    feedsBorder.classList.add('card', 'border-0');
    const feedsBody = document.createElement('div');
    feedsBody.classList.add('card-body');
    const feedsTitle = document.createElement('h2');
    feedsTitle.classList.add('card-title', 'h4');
    feedsTitle.innerHTML = 'Фиды';
    const feedsUl = document.createElement('ul');
    feedsUl.classList.add('list-group', 'border-0', 'rounded-0');

    const posts = document.getElementsByClassName('posts').item(0);
    posts.innerHTML = '';
    const postsBorder = document.createElement('div');
    postsBorder.classList.add('card', 'border-0');
    const postsBody = document.createElement('div');
    postsBody.classList.add('card-body');
    const postsTitle = document.createElement('h2');
    postsTitle.classList.add('card-title', 'h4');
    postsTitle.innerHTML = 'Посты';
    const postsUl = document.createElement('ul');
    postsUl.classList.add('list-group', 'border-0', 'rounded-0');

    feedsBody.append(feedsTitle);
    feedsBorder.append(feedsBody);
    postsBody.append(postsTitle);
    postsBorder.append(postsBody);

    state.feeds.forEach((element) => {
        const feedLi = document.createElement('li');
        feedLi.classList.add('list-group-item', 'border-0', 'border-end-0');
        const h3 = document.createElement('h3');
        h3.classList.add('h6', 'm-0');
        h3.innerHTML = element.title;
        const p = document.createElement('p');
        p.classList.add('m-0', 'small', 'text-black-50');
        p.innerHTML = element.description;
        feedLi.append(h3, p);
        feedsUl.append(feedLi);
        element.items.forEach((item) => {
            const postLi = document.createElement('li');
            postLi.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
            const a = document.createElement('a');
            a.classList.add('fw-bold');
            a.setAttribute('href', item.link);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            a.innerHTML = item.title;
            postLi.append(a);
            postsUl.append(postLi);
        });
    });

    feedsBorder.append(feedsUl);
    feeds.append(feedsBorder);

    postsBorder.append(postsUl);
    posts.append(postsBorder);
};
