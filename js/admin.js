// Moderation panel: sign in as an admin, then approve / reject / delete memories.
import { isConfigured, PHOTO_BUCKET } from './config.js';
import { getSupabase } from './supabase-client.js';
import { $, escapeHtml, richText, formatDateRu } from './utils.js';

const STATUS_LABELS = { pending: 'на проверке', approved: 'опубликовано', rejected: 'отклонено' };

let supabase;
let currentStatus = 'pending';

function show(id, visible) {
  $(id).hidden = !visible;
}

function setPanelStatus(text, kind = '') {
  const el = $('#panel-status');
  el.textContent = text;
  el.className = `form__status ${kind ? `form__status--${kind}` : ''}`;
}

function card(m) {
  const photoUrl = m.photo_path
    ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(m.photo_path).data.publicUrl
    : null;
  const actions = [
    m.status !== 'approved' && `<button class="btn btn--small" data-action="approved" data-id="${m.id}">Опубликовать</button>`,
    m.status !== 'rejected' && `<button class="btn btn--ghost btn--small" data-action="rejected" data-id="${m.id}">Отклонить</button>`,
    `<button class="btn btn--danger btn--small" data-action="delete" data-id="${m.id}" data-photo="${escapeHtml(m.photo_path || '')}">Удалить</button>`,
  ].filter(Boolean).join('');

  return `
    <article class="memory">
      <p class="memory__text">${richText(m.message)}</p>
      ${photoUrl ? `<a class="memory__photo" href="${escapeHtml(photoUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(photoUrl)}" alt="" loading="lazy"></a>` : ''}
      <footer class="memory__meta">
        <span>
          <span class="memory__author">${m.author_name ? escapeHtml(m.author_name) : 'Аноним'}</span>
          ${m.author_email ? `<br><a class="admin__email" href="mailto:${escapeHtml(m.author_email)}">${escapeHtml(m.author_email)}</a>` : ''}
        </span>
        <span><span class="badge">${STATUS_LABELS[m.status]}</span> ${formatDateRu(m.created_at)}</span>
      </footer>
      <div class="admin__actions">${actions}</div>
    </article>`;
}

async function loadList() {
  setPanelStatus('Загрузка…');
  const { data, error } = await supabase
    .from('memories')
    .select('id, created_at, author_name, author_email, message, photo_path, status')
    .eq('status', currentStatus)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    setPanelStatus('Ошибка загрузки. Проверьте, что ваш пользователь добавлен в таблицу admins.', 'error');
    return;
  }
  setPanelStatus(data.length ? `Всего: ${data.length}` : 'Здесь пока пусто.');
  $('#admin-list').innerHTML = data.map(card).join('');
}

async function handleAction(button) {
  const { action, id, photo } = button.dataset;
  button.disabled = true;

  let error;
  if (action === 'delete') {
    if (!confirm('Удалить это воспоминание навсегда?')) {
      button.disabled = false;
      return;
    }
    ({ error } = await supabase.from('memories').delete().eq('id', id));
    if (!error && photo) await supabase.storage.from(PHOTO_BUCKET).remove([photo]);
  } else {
    ({ error } = await supabase.from('memories').update({ status: action }).eq('id', id));
  }

  if (error) {
    console.error(error);
    setPanelStatus('Не удалось выполнить действие.', 'error');
    button.disabled = false;
    return;
  }
  loadList();
}

async function onSession(session) {
  show('#login-form', !session);
  show('#panel', Boolean(session));
  show('#logout', Boolean(session));
  if (session) loadList();
}

async function init() {
  if (!isConfigured) {
    show('#not-configured', true);
    return;
  }
  supabase = await getSupabase();

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('#login-status');
    status.textContent = 'Вход…';
    status.className = 'form__status';
    const { error } = await supabase.auth.signInWithPassword({
      email: $('#l-email').value.trim(),
      password: $('#l-password').value,
    });
    if (error) {
      status.textContent = 'Неверный email или пароль.';
      status.className = 'form__status form__status--error';
    } else {
      status.textContent = '';
    }
  });

  $('#logout').addEventListener('click', () => supabase.auth.signOut());

  document.querySelectorAll('[data-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentStatus = tab.dataset.status;
      document.querySelectorAll('[data-status]').forEach((t) =>
        t.setAttribute('aria-pressed', String(t === tab)),
      );
      loadList();
    });
  });

  $('#admin-list').addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (button) handleAction(button);
  });

  supabase.auth.onAuthStateChange((_event, session) => onSession(session));
  const { data } = await supabase.auth.getSession();
  onSession(data.session);
}

init();
