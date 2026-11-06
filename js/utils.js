// Small shared helpers (no dependencies).

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

// Escapes text, then turns **bold** into <strong> and newlines into <br>.
export function richText(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// "1938-03-14" -> "14 марта 1938"
export function formatDateRu(iso) {
  if (!iso) return '';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(date)
    .replace(/\s?г\.$/, '');
}

export function yearOf(iso) {
  return iso ? iso.slice(0, 4) : '';
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}
