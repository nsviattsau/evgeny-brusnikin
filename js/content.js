// =============================================================
//  SITE CONTENT — edit this file to personalise the memorial.
//  All visitor-facing text is in Russian; comments are in English.
//  Use **double asterisks** in biography paragraphs for bold text.
//
//  TODO: everything marked [ЗАПОЛНИТЬ] is placeholder text —
//  replace it with real facts before publishing.
// =============================================================

export const person = {
  // Full name as it should appear in the header
  fullName: 'Евгений Сергеевич Брусникин',

  // Dates in ISO format (YYYY-MM-DD). They are rendered in Russian.
  // TODO: replace with the real dates.
  born: '1940-01-01',
  died: '2026-01-01',

  // Optional places (set to '' to hide)
  bornPlace: '',
  diedPlace: '',

  // Portrait: put your photo in /images and change the path.
  portrait: 'images/portrait-placeholder.svg',
  portraitAlt: 'Портрет Евгения Сергеевича Брусникина',

  // Short line under the name (set to '' to hide)
  epigraph: 'Пока мы помним — он с нами.',
};

// Farewell / memorial ceremony. Set `ceremony = null` to hide the section.
export const ceremony = {
  title: 'Прощание',
  date: '2026-01-05',          // TODO
  time: '11:00',               // TODO
  place: '[ЗАПОЛНИТЬ: место]',
  address: '[ЗАПОЛНИТЬ: адрес]',
  // Optional link to a map (Yandex/Google). Set to '' to hide the button.
  mapUrl: '',
  note: 'Мы будем рады всем, кто захочет проститься.',
};

// Biography paragraphs, in order.
export const biography = [
  '[ЗАПОЛНИТЬ] Евгений Сергеевич родился … Где прошло детство, кем были родители.',
  '[ЗАПОЛНИТЬ] Учёба и работа: где учился, кем работал, чем гордился в профессии.',
  '[ЗАПОЛНИТЬ] Семья: супруга, дети, внуки и правнуки.',
  '[ЗАПОЛНИТЬ] Каким его помнят: увлечения, привычки, любимые слова и дела.',
];

// Footer line
export const footerText = 'Создано с любовью и уважением';
