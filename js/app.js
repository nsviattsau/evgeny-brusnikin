import { person, ceremony, biography, footerText } from './content.js';
import { isConfigured, PHOTO_BUCKET, MAX_PHOTO_MB, ALLOWED_PHOTO_TYPES } from './config.js';
import { demoMemories } from './demo-data.js';
import { getSupabase } from './supabase-client.js';
import { $, escapeHtml, richText, formatDateRu, yearOf } from './utils.js';

const INITIAL_VISIBLE = 6;

// ---------- Static content ----------

function renderContent() {
  document.title = `Светлая память — ${person.fullName}`;

  const portrait = $('#portrait');
  portrait.src = person.portrait;
  portrait.alt = person.portraitAlt || person.fullName;

  $('#full-name').textContent = person.fullName;

  const born = [formatDateRu(person.born), person.bornPlace].filter(Boolean).join(', ');
  const died = [formatDateRu(person.died), person.diedPlace].filter(Boolean).join(', ');
  $('#life-dates').textContent = `${born} — ${died}`;

  const epigraph = $('#epigraph');
  if (person.epigraph) epigraph.textContent = `«${person.epigraph}»`;
  else epigraph.remove();

  if (ceremony) {
    $('#ceremony').hidden = false;
    $('#ceremony-title').textContent = ceremony.title;
    $('#ceremony-when').textContent = [formatDateRu(ceremony.date), ceremony.time].filter(Boolean).join(', в ');
    $('#ceremony-place').textContent = ceremony.place;
    $('#ceremony-address').textContent = ceremony.address;
    $('#ceremony-note').textContent = ceremony.note || '';
    if (ceremony.mapUrl) {
      const map = $('#ceremony-map');
      map.href = ceremony.mapUrl;
      map.hidden = false;
    }
  }

  $('#biography-text').innerHTML = biography.map((p) => `<p>${richText(p)}</p>`).join('');
  $('#footer-text').textContent = footerText;
  $('#footer-years').textContent = `${yearOf(person.born)} — ${yearOf(person.died)}`;
}

// ---------- Memories feed ----------

function pluralMemories(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'воспоминание';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'воспоминания';
  return 'воспоминаний';
}

function memoryCard(m) {
  const author = m.author_name ? escapeHtml(m.author_name) : 'Аноним';
  const photo = m.photo_url
    ? `<button class="memory__photo" type="button" data-full="${escapeHtml(m.photo_url)}" aria-label="Открыть фотографию">
         <img src="${escapeHtml(m.photo_url)}" alt="Фотография от: ${author}" loading="lazy">
       </button>`
    : '';
  return `
    <article class="memory">
      <p class="memory__text">${richText(m.message)}</p>
      ${photo}
      <footer class="memory__meta">
        <span class="memory__author">${author}</span>
        <time datetime="${escapeHtml(m.created_at)}">${formatDateRu(m.created_at)}</time>
      </footer>
    </article>`;
}

async function loadMemories() {
  if (!isConfigured) return demoMemories;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('memories')
    .select('id, created_at, author_name, message, photo_path')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map((m) => ({
    ...m,
    photo_url: m.photo_path
      ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(m.photo_path).data.publicUrl
      : null,
  }));
}

async function renderMemories() {
  const list = $('#memories-list');
  const more = $('#memories-more');
  const count = $('#memories-count');

  let memories;
  try {
    memories = await loadMemories();
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="muted">Не удалось загрузить воспоминания. Попробуйте обновить страницу.</p>';
    return;
  }

  if (!memories.length) {
    count.textContent = '';
    list.innerHTML = '<p class="muted">Пока здесь нет воспоминаний. Вы можете стать первым.</p>';
    return;
  }

  count.textContent = `${memories.length} ${pluralMemories(memories.length)}`;

  const draw = (all) => {
    const shown = all ? memories : memories.slice(0, INITIAL_VISIBLE);
    list.innerHTML = shown.map(memoryCard).join('');
    more.hidden = all || memories.length <= INITIAL_VISIBLE;
  };
  draw(false);
  more.onclick = () => draw(true);
}

// ---------- Lightbox ----------

function setupLightbox() {
  const dialog = $('#lightbox');
  const img = $('#lightbox-img');
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-full]');
    if (!trigger) return;
    img.src = trigger.dataset.full;
    img.alt = trigger.querySelector('img')?.alt || '';
    dialog.showModal();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('.lightbox__close')) dialog.close();
  });
}

// ---------- Submission form ----------

function setStatus(text, kind = '') {
  const el = $('#form-status');
  el.textContent = text;
  el.className = `form__status ${kind ? `form__status--${kind}` : ''}`;
}

function validatePhoto(file) {
  if (!file) return null;
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return 'Допустимы только JPG, PNG или WebP.';
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) return `Файл больше ${MAX_PHOTO_MB} МБ.`;
  return null;
}

function setupForm() {
  const form = $('#memory-form');
  const name = $('#f-name');
  const anon = $('#f-anon');
  const message = $('#f-message');
  const photo = $('#f-photo');
  const preview = $('#f-preview');
  const submit = $('#f-submit');

  anon.addEventListener('change', () => {
    name.disabled = anon.checked;
    if (anon.checked) name.value = '';
  });

  message.addEventListener('input', () => {
    $('#f-count').textContent = message.value.length;
  });

  photo.addEventListener('change', () => {
    const file = photo.files[0];
    const problem = validatePhoto(file);
    if (problem) {
      setStatus(problem, 'error');
      photo.value = '';
      preview.hidden = true;
      return;
    }
    setStatus('');
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    if ($('#f-website').value) return; // honeypot triggered: silently ignore bots

    const text = message.value.trim();
    if (!text) return setStatus('Пожалуйста, напишите ваше воспоминание.', 'error');
    if (!$('#f-consent').checked) return setStatus('Пожалуйста, подтвердите согласие на публикацию.', 'error');

    const email = $('#f-email').value.trim();
    if (email && !$('#f-email').checkValidity()) return setStatus('Проверьте адрес email.', 'error');

    const file = photo.files[0];
    const photoProblem = validatePhoto(file);
    if (photoProblem) return setStatus(photoProblem, 'error');

    submit.disabled = true;
    submit.textContent = 'Отправка…';

    try {
      if (!isConfigured) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const supabase = await getSupabase();
        let photoPath = null;

        if (file) {
          const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
          photoPath = `pending/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(photoPath, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
        }

        const { error } = await supabase.from('memories').insert({
          author_name: anon.checked ? null : name.value.trim() || null,
          author_email: email || null,
          message: text,
          photo_path: photoPath,
        });
        if (error) throw error;
      }

      form.reset();
      name.disabled = false;
      preview.hidden = true;
      $('#f-count').textContent = '0';
      setStatus(
        isConfigured
          ? 'Спасибо! Ваше воспоминание отправлено и появится на странице после проверки.'
          : 'Демо-режим: сообщение не сохранено. Подключите Supabase, чтобы форма заработала.',
        'ok',
      );
    } catch (err) {
      console.error(err);
      setStatus('Не удалось отправить сообщение. Попробуйте ещё раз чуть позже.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Отправить';
    }
  });
}

// ---------- Init ----------

if (!isConfigured) $('#demo-banner').hidden = false;
renderContent();
setupLightbox();
setupForm();
renderMemories();
