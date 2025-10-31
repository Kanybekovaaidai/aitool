/*
  KnowledgeShare MVP JavaScript
  - Manages questions and answers in-memory and persists to localStorage
  - Features: add question, add answer, like counts, toggle answers, smooth UI updates
  - Keep DOM updates efficient and scoped per card
*/

(() => {
  // --- Data handling ----------------------------------------------------
  const STORAGE_KEY = 'knowledgeShare.v1';

  // Load or initialize data
  let state = {
    questions: [] // {id, text, likes, answers: [{id,text,likes}]}
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load state', e);
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Failed to save state', e); }
  }

  function uid(prefix = '') { return prefix + Math.random().toString(36).slice(2,9); }

  // --- DOM refs ---------------------------------------------------------
  const feedEl = document.getElementById('feed');
  const qForm = document.getElementById('questionForm');
  const qInput = document.getElementById('questionInput');
  const yearEl = document.getElementById('year');
  const themeToggle = document.getElementById('themeToggle');
  // Contact elements
  const contactForm = document.getElementById('contactForm');
  const contactName = document.getElementById('contactName');
  const contactEmail = document.getElementById('contactEmail');
  const contactMessage = document.getElementById('contactMessage');
  const messagesList = document.getElementById('messagesList');

  // Autosize utility for textareas so typed letters are always visible
  function autosizeTextarea(el){
    if (!el) return;
    // set to auto to shrink when deleting
    el.style.height = 'auto';
    const pad = parseFloat(getComputedStyle(el).paddingTop || 0) + parseFloat(getComputedStyle(el).paddingBottom || 0);
    el.style.height = (el.scrollHeight + 2) + 'px';
  }

  // Attach autosize to given textarea and on input
  function attachAutosize(el){
    if (!el) return;
    autosizeTextarea(el);
    el.addEventListener('input', () => autosizeTextarea(el));
  }

  // --- Rendering --------------------------------------------------------
  function render() {
    // clear
    feedEl.innerHTML = '';
    // render each question as a card
    state.questions.slice().reverse().forEach(q => {
      feedEl.appendChild(createQuestionCard(q));
    });

    // render contact messages (if any)
    renderMessages();
  }

  function createQuestionCard(q) {
    const card = document.createElement('article');
    card.className = 'card enter';
    card.dataset.id = q.id;

    // Question row
    const qRow = document.createElement('div'); qRow.className = 'q-row';
    const qText = document.createElement('div'); qText.className = 'q-text';
    qText.textContent = q.text;

    const qActions = document.createElement('div'); qActions.className = 'q-actions';

    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.setAttribute('aria-label','Like question');
    likeBtn.innerHTML = `👍 <span class="count">${q.likes||0}</span>`;
    likeBtn.addEventListener('click', () => {
      q.likes = (q.likes||0) + 1;
      likeBtn.querySelector('.count').textContent = q.likes;
      save();
      likeBtn.classList.add('like-active');
    });

    // Toggle answers
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'icon-btn';
    toggleBtn.textContent = 'Answers';
    toggleBtn.addEventListener('click', () => {
      answersEl.classList.toggle('hidden');
    });

    qActions.appendChild(likeBtn);
    qActions.appendChild(toggleBtn);

    qRow.appendChild(qText);
    qRow.appendChild(qActions);

    // Answers section
    const answersEl = document.createElement('div');
    answersEl.className = 'answers';

    // Answer form
    const aForm = document.createElement('form');
    aForm.className = 'answer-form';
    aForm.innerHTML = `
      <input type="text" placeholder="Write an answer..." required />
      <button class="btn">Reply</button>
    `;
    // ensure answer input is visible and readable
    const answerInput = aForm.querySelector('input');
    if (answerInput){
      answerInput.style.minWidth = '0';
      answerInput.style.color = '#071127';
      answerInput.style.fontSize = '0.98rem';
      answerInput.style.letterSpacing = '0.1px';
    }
    aForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = aForm.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const ans = { id: uid('a_'), text, likes: 0 };
      q.answers = q.answers || [];
      q.answers.push(ans);
      save();
      // render new answer into list without re-rendering whole feed
      const item = createAnswerItem(q, ans);
      aList.appendChild(item);
      item.classList.add('enter');
      input.value = '';
    });

    // Answers list
    const aList = document.createElement('div');
    aList.className = 'answer-list';
    (q.answers || []).forEach(a => aList.appendChild(createAnswerItem(q,a)));

    answersEl.appendChild(aForm);
    answersEl.appendChild(aList);

    card.appendChild(qRow);
    card.appendChild(answersEl);

    return card;
  }

  function createAnswerItem(q, a) {
    const item = document.createElement('div');
    item.className = 'answer';
    item.dataset.id = a.id;

    const text = document.createElement('div');
    text.textContent = a.text;
    text.style.marginBottom = '6px';

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.justifyContent = 'space-between';
    meta.style.alignItems = 'center';

    const small = document.createElement('div');
    small.className = 'small muted';
    small.textContent = 'Just now';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.innerHTML = `❤️ <span class="count">${a.likes||0}</span>`;
    likeBtn.addEventListener('click', () => {
      a.likes = (a.likes||0) + 1;
      likeBtn.querySelector('.count').textContent = a.likes;
      save();
      likeBtn.classList.add('like-active');
    });

    meta.appendChild(small);
    meta.appendChild(likeBtn);

    item.appendChild(text);
    item.appendChild(meta);

    return item;
  }

  // --- Events -----------------------------------------------------------
  qForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = qInput.value.trim();
    if (!text) return;
    const q = { id: uid('q_'), text, likes: 0, answers: [] };
    state.questions.push(q);
    save();
    // Prepend a card (rendering quickly)
    const card = createQuestionCard(q);
    feedEl.insertBefore(card, feedEl.firstChild);
    card.classList.add('enter');
    qInput.value = '';
  });

  // Contact form handling: basic validation and local persistence
  const CONTACT_KEY = 'knowledgeShare.messages.v1';

  function loadMessages() {
    try {
      const raw = localStorage.getItem(CONTACT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveMessage(msg) {
    const current = loadMessages();
    current.push(msg);
    try { localStorage.setItem(CONTACT_KEY, JSON.stringify(current)); } catch (e) { console.warn(e); }
  }

  function renderMessages() {
    if (!messagesList) return;
    const msgs = loadMessages();
    messagesList.innerHTML = '';
    if (msgs.length === 0) {
      messagesList.innerHTML = '<div class="small muted">No messages yet.</div>';
      return;
    }
    msgs.slice().reverse().forEach(m => {
      const item = document.createElement('div');
      item.className = 'message-item';
      item.innerHTML = `<div>${escapeHtml(m.message)}</div><div class="message-meta"><span>${escapeHtml(m.name)} • ${escapeHtml(m.email)}</span><span>${new Date(m.time).toLocaleString()}</span></div>`;
      messagesList.appendChild(item);
    });
  }

  // Small helper to escape HTML in user input when rendering
  function escapeHtml(str){
    return (str||'').toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = contactName.value.trim();
      const email = contactEmail.value.trim();
      const message = contactMessage.value.trim();
      if (!name || !email || !message) return alert('Please fill in all fields.');
      // basic email check
      const emailRe = /^\S+@\S+\.\S+$/;
      if (!emailRe.test(email)) return alert('Please enter a valid email.');

      const msg = { id: uid('m_'), name, email, message, time: Date.now() };
      saveMessage(msg);
      renderMessages();
      contactForm.reset();
      // subtle UX: focus name for next message
      contactName.focus();
      // notification (tiny)
      const prev = document.querySelector('.contact-notice');
      if (prev) prev.remove();
      const note = document.createElement('div');
      note.className = 'contact-notice small muted';
      note.textContent = 'Message saved locally. Thank you!';
      contactForm.appendChild(note);
      setTimeout(() => note.remove(), 3000);
    });
  }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });

  // --- Init -------------------------------------------------------------
  function init() {
    yearEl.textContent = new Date().getFullYear();
    load();
    render();
    // Small UX: focus the question input on load
    qInput.focus();
    // Attach autosize to main textareas
    attachAutosize(qInput);
    attachAutosize(contactMessage);
  }

  // Expose for debugging (optional)
  window.KnowledgeShare = { state, save, load, render };

  init();

})();
