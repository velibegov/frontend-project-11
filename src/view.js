export const STATE_STATUSES = {
  NETWORK_PROBLEMS: 'network problems',
  RENDERING: 'success rendering',
  PARSE_ERROR: 'parse error',
  URL_EXIST: 'url exist',
  SUBMITTING: 'submitting',
  PROCESSING: 'processing',
  INVALID_URL: 'url must be a valid URL',
  SHOWING_MODAL: 'showing modal',
};

const processRender = (isBlocked = false) => {
  const input = document.getElementById('url-input');
  const button = document.querySelector('button[type="submit"]');
  if (isBlocked) {
    input.removeAttribute('disabled');
    button.removeAttribute('disabled');
  } else {
    input.setAttribute('disabled', '');
    button.setAttribute('disabled', '');
  }
};

const feedbackRender = (feedback, isError, isUpdated) => {
  if (!isUpdated) {
    const inputElement = document.getElementById('url-input');
    const feedbackElement = document.getElementsByClassName('feedback').item(0);

    if (isError) {
      feedbackElement.classList.remove('text-success');
      feedbackElement.classList.add('text-danger');
      feedbackElement.innerHTML = feedback;
      inputElement.classList.add('is-invalid');
    } else {
      inputElement.classList.remove('is-invalid');
      inputElement.value = '';
      feedbackElement.classList.remove('text-danger');
      feedbackElement.classList.add('text-success');
      feedbackElement.innerHTML = feedback;
      inputElement.focus();
    }
  }
};

const showModal = (state) => {
  const body = document.getElementsByTagName('body').item(0);
  body.setAttribute('style', 'overflow: hidden; padding-right: 17px;');
  body.classList.add('modal-open');
  const modalContainer = document.getElementById('modal');
  modalContainer.classList.add('show');
  modalContainer.setAttribute('style', 'display: block;');
  modalContainer.setAttribute('aria-modal', 'true');
  modalContainer.removeAttribute('aria-hidden');
  const modalTitle = document.getElementsByClassName('modal-title').item(0);
  modalTitle.innerHTML = state.rssForm.modalContent.title;
  const modalBody = document.getElementsByClassName('modal-body').item(0);
  modalBody.innerHTML = state.rssForm.modalContent.description;
  const fullArticle = document.getElementsByClassName('full-article').item(0);
  fullArticle.setAttribute('href', state.rssForm.modalContent.link);
  const modalCloses = modalContainer.querySelectorAll('[data-bs-dismiss="modal"]');
  modalCloses.forEach((closer) => {
    closer.addEventListener('click', () => {
      body.removeAttribute('style');
      body.classList.remove('modal-open');
      modalContainer.classList.remove('show');
      modalContainer.removeAttribute('style');
      modalContainer.removeAttribute('aria-modal');
      modalContainer.setAttribute('aria-hidden', 'true');
      state.rssForm.modalContent = {};
      state.rssForm.status = '';
    });
  });
};

const feedRender = (state) => {
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

  state.rssForm.feeds.forEach((element) => {
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
      const fwClass = state.rssUI.viewedUrls.includes(item.link) ? 'fw-normal' : 'fw-bold';
      a.classList.add(fwClass);
      a.setAttribute('href', item.link);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-id', item.dataId);
      a.innerHTML = item.title;
      a.addEventListener('click', () => {
        state.rssUI.viewedUrls.push(item.link);
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal');
      });
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-id', item.dataId);
      button.setAttribute('data-bs-target', '#modal');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.innerHTML = 'Просмотр';
      button.addEventListener('click', () => {
        const { id } = button.dataset;
        const viewed = document.querySelector(`a[data-id="${id}"]`);
        viewed.classList.remove('fw-bold');
        viewed.classList.add('fw-normal');
        const items = state.rssForm.feeds.map((feed) => feed.items).flat();
        const content = items.reduce((carry, current) => {
          if (current.dataId === id) {
            carry = current;
          }
          return carry;
        }, {});
        state.rssForm.modalContent = {
          title: content.title,
          description: content.description.replace('<![CDATA[', '').replace(']]>', ''),
          link: content.link,
        };
        state.rssUI.viewedUrls.push(viewed.href);
        showModal(state);
      });

      postLi.append(a);
      postLi.append(button);
      postsUl.append(postLi);
    });
  });

  feedsBorder.append(feedsUl);
  feeds.append(feedsBorder);

  postsBorder.append(postsUl);
  posts.append(postsBorder);
};

const render = (state, i18n) => {
  switch (state.rssForm.status) {
    case STATE_STATUSES.SUBMITTING:
      processRender();
      break;
    case STATE_STATUSES.PROCESSING:
      processRender(true);
      break;
    case STATE_STATUSES.URL_EXIST:
      feedbackRender(i18n('rssForm.feedback.urlAlreadyExists'), true, state.rssForm.isUpdated);
      break;
    case STATE_STATUSES.INVALID_URL:
      feedbackRender(i18n('rssForm.feedback.notValidUrl'), true, state.rssForm.isUpdated);
      break;
    case STATE_STATUSES.NETWORK_PROBLEMS:
      feedbackRender(i18n('rssForm.feedback.networkProblems'), true, state.rssForm.isUpdated);
      break;
    case STATE_STATUSES.PARSE_ERROR:
      feedbackRender(i18n('rssForm.feedback.notValidRss'), true, state.rssForm.isUpdated);
      break;
    case STATE_STATUSES.SHOWING_MODAL:
      showModal(state);
      break;
    case STATE_STATUSES.RENDERING:
      feedbackRender(i18n('rssForm.feedback.success'), false, state.rssForm.isUpdated);
      feedRender(state);
      break;
    default: break;
  }
};

export default render;
