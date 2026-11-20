#!/usr/bin/env node
/*
 * Banaweer static site builder (no dependencies).
 *   node build.js        -> builds the site into ./dist
 *
 * Content sources:
 *   config.json           site-wide settings (store URL, phone, email, map, socials)
 *   src/i18n/en.json      all English text
 *   src/i18n/ar.json      all Arabic text
 *   src/posts/en/*.md     English blog posts
 *   src/posts/ar/*.md     Arabic blog posts (same file name = same article in the other language)
 *   src/assets/           CSS, JS, uploaded images
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const LANGS = ['en', 'ar'];
const T = {
  en: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/en.json'), 'utf8')),
  ar: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/ar.json'), 'utf8')),
};
const SITE = cfg.siteUrl.replace(/\/$/, '');
const STORE = cfg.storeUrl.replace(/\/$/, '');
const YEAR = new Date().getFullYear();

/* ------------------------------------------------------------------ helpers */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (lang, p = '') => `/${lang}/${p}`;
const abs = (p) => SITE + p;
const other = (lang) => (lang === 'en' ? 'ar' : 'en');
const ext = (href, cls, inner, aria) =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener"${aria ? ` aria-label="${esc(aria)}"` : ''}>${inner}</a>`;
const storeCat = (key) => (cfg.storeCategoryUrls || {})[key] || STORE;
const img = (name) => (/^(\/|https?:)/.test(name) ? name : `/assets/img/${name}.svg`);

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    entry.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}
function fmtDate(iso, lang) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(iso + 'T00:00:00Z'));
}
const num = (n, lang) => (lang === 'ar' ? n.toLocaleString('ar-SA') : String(n));

/* -------------------------------------------------------------------- icons */
const ICONS = {
  bag: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone: '<path d="M5 4h3.5l2 5-2.5 1.5a11 11 0 0 0 5.5 5.5L15 13.5l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>',
  wrench: '<path d="M14.5 6.5a4.2 4.2 0 0 0-5.3 5.3L3.8 17.2a2 2 0 0 0 2.9 2.9l5.4-5.4a4.2 4.2 0 0 0 5.3-5.3l-2.6 2.6-2.4-.5-.5-2.4 2.6-2.6z"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  star: '<path fill="currentColor" stroke="none" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  whatsapp: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
  x: '<path fill="currentColor" stroke="none" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/>',
  tiktok: '<path fill="currentColor" stroke="none" d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.4 1.3V6.6a4.5 4.5 0 0 1-4.4-4.6z"/>',
  snapchat: '<path d="M12 3c3 0 5 2.2 5 5.2v2.3l1.8-.6c.6 0 .8.7.3 1l-2 1c.6 1.8 2 3.1 3.6 3.6.4.1.4.6 0 .8-.8.4-1.8.5-2.3.7-.2.6-.1 1.3-.8 1.3-.8 0-1.6-.4-2.8 0-1 .3-1.7 1.4-2.8 1.4s-1.8-1.1-2.8-1.4c-1.2-.4-2 0-2.8 0-.7 0-.6-.7-.8-1.3-.5-.2-1.5-.3-2.3-.7-.4-.2-.4-.7 0-.8 1.6-.5 3-1.8 3.6-3.6l-2-1c-.5-.3-.3-1 .3-1l1.8.6V8.2C7 5.2 9 3 12 3z"/>',
  facebook: '<path fill="currentColor" stroke="none" d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V9c0-.6.4-1 1-1z"/>',
};
const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
// Brand logo: white + orange on a transparent background (src/assets/img/logo.png), for the dark header/footer.
// logo.webp is the black version on white, used where the logo is shown on light backgrounds (search results).
// icon.png is the square browser-tab / home-screen icon.
const LOGO_FILE = '/assets/img/logo.webp';
const ICON_FILE = '/assets/img/icon.png';
const LOGO_MARK = `<img class="logo-img" src="/assets/img/logo.png" alt="" width="400" height="234" decoding="async">`;

/* --------------------------------------------------------- markdown (subset) */
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) => {
      const external = /^https?:/.test(h);
      return `<a href="${h}"${external ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    });
}
function markdown(src) {
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; };
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) { flushPara(); flushList(); const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`); continue; }
    if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^[\d\u0660-\u0669]+[.)]\s+(.*)$/))) { flushPara(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}
function parsePost(file) {
  const src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter in ${file}`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  if (meta.date) meta.date = String(meta.date).slice(0, 10);
  const words = m[2].split(/\s+/).filter(Boolean).length;
  return { ...meta, body: markdown(m[2]), plain: m[2], minutes: Math.max(1, Math.round(words / 200)) };
}
const POSTS = {};
for (const lang of LANGS) {
  const dir = path.join(ROOT, 'src/posts', lang);
  POSTS[lang] = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
        .map((f) => ({ slug: f.replace(/\.md$/, ''), ...parsePost(path.join(dir, f)) }))
        .filter((p) => p.draft !== 'true')
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : [];
}
// Country calling codes for the contact form's phone field: [code, ISO, Arabic name, English name].
// Saudi Arabia first (default), then the Gulf, the rest of the Arab world, then other common countries.
const COUNTRY_CODES = [
  ['966', 'SA', 'السعودية', 'Saudi Arabia'],
  ['971', 'AE', 'الإمارات', 'UAE'],
  ['965', 'KW', 'الكويت', 'Kuwait'],
  ['974', 'QA', 'قطر', 'Qatar'],
  ['973', 'BH', 'البحرين', 'Bahrain'],
  ['968', 'OM', 'عُمان', 'Oman'],
  ['967', 'YE', 'اليمن', 'Yemen'],
  ['962', 'JO', 'الأردن', 'Jordan'],
  ['20', 'EG', 'مصر', 'Egypt'],
  ['964', 'IQ', 'العراق', 'Iraq'],
  ['963', 'SY', 'سوريا', 'Syria'],
  ['961', 'LB', 'لبنان', 'Lebanon'],
  ['970', 'PS', 'فلسطين', 'Palestine'],
  ['249', 'SD', 'السودان', 'Sudan'],
  ['218', 'LY', 'ليبيا', 'Libya'],
  ['216', 'TN', 'تونس', 'Tunisia'],
  ['213', 'DZ', 'الجزائر', 'Algeria'],
  ['212', 'MA', 'المغرب', 'Morocco'],
  ['90', 'TR', 'تركيا', 'Türkiye'],
  ['92', 'PK', 'باكستان', 'Pakistan'],
  ['91', 'IN', 'الهند', 'India'],
  ['880', 'BD', 'بنغلاديش', 'Bangladesh'],
  ['63', 'PH', 'الفلبين', 'Philippines'],
  ['62', 'ID', 'إندونيسيا', 'Indonesia'],
  ['44', 'GB', 'المملكة المتحدة', 'United Kingdom'],
  ['1', 'US', 'الولايات المتحدة / كندا', 'USA / Canada'],
];
const REVIEWS_FILE = path.join(ROOT, 'src/reviews.json');
const REVIEWS = fs.existsSync(REVIEWS_FILE) ? JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8')).reviews : [];
const hasTranslation = (slug, lang) => POSTS[lang].some((p) => p.slug === slug);

/* ------------------------------------------------- placeholder illustrations */
function bicycle(x, y, s, stroke = '#fff', accent = '#E85D04') {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="-130" cy="0" r="92" stroke="${stroke}" stroke-width="12"/><circle cx="130" cy="0" r="92" stroke="${stroke}" stroke-width="12"/>
    <circle cx="-130" cy="0" r="10" fill="${stroke}"/><circle cx="130" cy="0" r="10" fill="${stroke}"/>
    <path d="M-130 0 L-20 0 L-62 -122 Z M-62 -122 L82 -112 L-20 0 M82 -112 L130 0 M82 -112 L74 -146 L112 -152" stroke="${accent}" stroke-width="13"/>
    <path d="M-92 -136 L-40 -136" stroke="${stroke}" stroke-width="14"/><circle cx="-20" cy="0" r="18" stroke="${stroke}" stroke-width="8"/>
    <path d="M-20 0 L4 26 M-8 26 L16 26" stroke="${stroke}" stroke-width="8"/></g>`;
}
function motorcycle(x, y, s, stroke = '#fff', accent = '#E85D04') {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="-150" cy="20" r="78" stroke="${stroke}" stroke-width="24"/><circle cx="150" cy="20" r="78" stroke="${stroke}" stroke-width="24"/>
    <circle cx="-150" cy="20" r="14" fill="${stroke}"/><circle cx="150" cy="20" r="14" fill="${stroke}"/>
    <path d="M150 20 L96 -110 L70 -128 M96 -110 L130 -118" stroke="${stroke}" stroke-width="14"/>
    <path d="M-150 20 L-40 -20 L40 -20" stroke="${stroke}" stroke-width="12"/>
    <path d="M-60 -64 C-20 -96 50 -100 90 -84 L60 -40 L-40 -40 Z" fill="${accent}" stroke="${accent}" stroke-width="6"/>
    <path d="M-170 -62 L-50 -66 L-40 -44 L-150 -44 Z" fill="${stroke}" stroke="${stroke}" stroke-width="6"/>
    <rect x="-40" y="-36" width="80" height="62" rx="10" fill="#222" stroke="${stroke}" stroke-width="8"/>
    <path d="M-40 26 L-130 40" stroke="${accent}" stroke-width="10"/></g>`;
}
function kidcar(x, y, s, stroke = '#fff', accent = '#E85D04') {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-230 -10 Q-230 -95 -150 -95 L-40 -95 L20 -175 L125 -175 L165 -95 L215 -88 Q250 -78 250 -30 L250 -10 Z" fill="${accent}" stroke="${accent}" stroke-width="8"/>
    <path d="M32 -162 L115 -162 L143 -102 L-5 -102 Z" fill="#241A14" stroke="${stroke}" stroke-width="7"/>
    <path d="M-150 -95 L-150 -150 M-175 -150 H-125" stroke="${stroke}" stroke-width="12"/>
    <circle cx="232" cy="-52" r="13" fill="${stroke}"/>
    <path d="M-60 -60 H60" stroke="#fff" stroke-width="8" opacity=".6"/>
    <circle cx="-135" cy="20" r="68" fill="#1b1b1b" stroke="${stroke}" stroke-width="24"/><circle cx="145" cy="20" r="68" fill="#1b1b1b" stroke="${stroke}" stroke-width="24"/>
    <circle cx="-135" cy="20" r="16" fill="${stroke}"/><circle cx="145" cy="20" r="16" fill="${stroke}"/></g>`;
}
function gear(x, y, s, stroke = '#fff', accent = '#E85D04') {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none">
    <circle r="150" stroke="${accent}" stroke-width="56" stroke-dasharray="40 38.5"/>
    <circle r="122" fill="#1b1b1b" stroke="${accent}" stroke-width="14"/>
    <circle r="62" stroke="${stroke}" stroke-width="14"/><circle r="18" fill="${stroke}"/>
    <path d="M150 230 L330 50 M300 20 L360 80" stroke="${stroke}" stroke-width="26" stroke-linecap="round"/></g>`;
}
function scene(name) {
  const W = 1600, H = 1000;
  const P = {
    hero: ['#1A0C04', '#7A2E05', '#E85D04'], mountain: ['#121A20', '#33404A', '#8A4B1E'],
    road: ['#0F1316', '#2A333B', '#4A5560'], sport: ['#121212', '#2A1408', '#5A2200'],
    city: ['#13141C', '#2A2638', '#4A3F5E'], moto: ['#141110', '#3A2414', '#9A4A12'],
    parts: ['#141414', '#222', '#333'], showroom: ['#151515', '#262626', '#3A3A3A'],
    workshop: ['#121212', '#1F1F1F', '#2C2C2C'], accessories: ['#161210', '#2B2018', '#4A3020'],
    motodisplay: ['#131313', '#2A1A10', '#5A3010'], rideons: ['#16110E', '#3A2416', '#7A3A10'],
  }[name] || ['#141414', '#222', '#333'];
  const defs = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset=".65" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient>
    <radialGradient id="glow" cx=".72" cy=".42" r=".5"><stop offset="0" stop-color="#E85D04" stop-opacity=".35"/><stop offset="1" stop-color="#E85D04" stop-opacity="0"/></radialGradient></defs>`;
  // Category scenes are shifted up so the subject sits above the card's text overlay.
  let land = '', subject = '', shift = 0;
  const dunes = (c1, c2) => `<path d="M0 760 Q 300 640 620 740 T 1200 700 T 1600 730 V1300 H0Z" fill="${c1}"/><path d="M0 850 Q 400 760 820 860 T 1600 820 V1300 H0Z" fill="${c2}"/>`;
  switch (name) {
    case 'hero':
      land = `<circle cx="1140" cy="560" r="170" fill="#FF8A3D" opacity=".85"/>${dunes('#3A1606', '#1A0A04')}`;
      subject = bicycle(1110, 720, 1.25, '#fff');
      break;
    case 'mountain':
      shift = -300;
      land = `<path d="M0 760 L260 520 L420 640 L640 420 L900 700 L1080 540 L1320 720 L1600 500 V1300 H0Z" fill="#1E2830"/><path d="M640 420 L690 478 L665 474 L640 500 L615 470 L592 478Z" fill="#cfd6db" opacity=".5"/><path d="M0 880 Q 500 800 900 880 T 1600 850 V1300 H0Z" fill="#141A1F"/>`;
      subject = bicycle(820, 760, 1.15);
      break;
    case 'road':
      shift = -300;
      land = `<rect y="640" width="1600" height="700" fill="#1A1F24"/><path d="M700 640 L900 640 L1820 1300 L-220 1300Z" fill="#2A3036"/><path d="M800 650 L800 1300" stroke="#E85D04" stroke-width="10" stroke-dasharray="50 40"/>`;
      subject = bicycle(800, 700, 1.05);
      break;
    case 'sport':
      shift = -300;
      land = `${[520, 600, 680, 760, 840].map((y, i) => `<path d="M${80 + i * 40} ${y} H${700 - i * 30}" stroke="#E85D04" stroke-width="${10 - i}" stroke-linecap="round" opacity="${0.6 - i * 0.08}"/>`).join('')}<rect y="820" width="1600" height="500" fill="#0E0E0E"/>`;
      subject = bicycle(980, 690, 1.25);
      break;
    case 'city':
      shift = -300;
      land = `${Array.from({ length: 14 }, (_, i) => { const h = 180 + ((i * 97) % 260); return `<rect x="${i * 118}" y="${760 - h}" width="100" height="${h}" fill="#1D1B28"/>${Array.from({ length: 4 }, (_, k) => `<rect x="${i * 118 + 18 + (k % 2) * 40}" y="${790 - h + Math.floor(k / 2) * 60}" width="22" height="30" fill="#E85D04" opacity=".35"/>`).join('')}`; }).join('')}<rect y="760" width="1600" height="560" fill="#121219"/>`;
      subject = bicycle(800, 760, 1.05);
      break;
    case 'moto':
      shift = -300;
      land = `<circle cx="300" cy="620" r="120" fill="#E85D04" opacity=".4"/>${dunes('#2A1A0E', '#140D08')}`;
      subject = motorcycle(820, 700, 1.25);
      break;
    case 'rideons':
      shift = -300;
      land = `<circle cx="1260" cy="560" r="110" fill="#FF8A3D" opacity=".45"/>${dunes('#2A1A0E', '#140D08')}`;
      subject = kidcar(800, 720, 1.1);
      break;
    case 'parts':
      land =`<rect y="860" width="1600" height="140" fill="#0F0F0F"/>`;
      subject = gear(720, 380, 0.95);
      break;
    case 'workshop':
      land = `<rect y="820" width="1600" height="180" fill="#0E0E0E"/><rect x="120" y="140" width="1360" height="20" fill="#2A2A2A"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${220 + i * 140} 160 v${60 + (i % 3) * 30}" stroke="#555" stroke-width="10" stroke-linecap="round"/>`).join('')}`;
      subject = gear(560, 540, 0.9) + bicycle(1150, 680, 0.75);
      break;
    case 'showroom':
      land = `<rect y="800" width="1600" height="200" fill="#101010"/><path d="M0 800 H1600" stroke="#E85D04" stroke-width="6"/>`;
      subject = bicycle(330, 690, 0.62) + bicycle(800, 690, 0.62, '#fff', '#fff') + bicycle(1270, 690, 0.62);
      break;
    case 'accessories':
      land = `<rect y="820" width="1600" height="180" fill="#0F0C0A"/>${Array.from({ length: 5 }, (_, i) => `<g transform="translate(${260 + i * 270} 420)"><path d="M-90 40 A90 90 0 0 1 90 40 Z" fill="${i % 2 ? '#E85D04' : '#fff'}"/><path d="M-90 40 H90" stroke="#0F0C0A" stroke-width="10"/></g>`).join('')}`;
      subject = '';
      break;
    case 'motodisplay':
      land = `<rect y="800" width="1600" height="200" fill="#0F0F0F"/>`;
      subject = motorcycle(470, 690, 0.8) + motorcycle(1150, 690, 0.8, '#fff', '#fff');
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${defs}<rect width="${W}" height="${H}" fill="url(#sky)"/><rect width="${W}" height="${H}" fill="url(#glow)"/><g transform="translate(0 ${shift})">${land}${subject}</g></svg>`;
}
const SCENES = ['hero', 'mountain', 'road', 'sport', 'city', 'moto', 'parts', 'showroom', 'workshop', 'accessories', 'motodisplay', 'rideons'];

/* ------------------------------------------------------------------- layout */
function jsonLdBusiness(lang) {
  const t = T[lang];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BikeStore',
    name: t.brand.full,
    alternateName: T[other(lang)].brand.full,
    url: abs(url(lang)),
    logo: abs(LOGO_FILE),
    image: abs('/assets/img/hero.svg'),
    telephone: cfg.phone,
    email: cfg.email,
    address: { '@type': 'PostalAddress', streetAddress: t.business.address, addressLocality: t.business.city, addressCountry: 'SA' },
    openingHours: 'Sa-Th 09:00-23:00',
    sameAs: Object.values(cfg.social).filter(Boolean),
  };
  if (cfg.vatNumber) data.vatID = cfg.vatNumber;
  if (cfg.mapLink) data.hasMap = cfg.mapLink;
  if (cfg.geo.latitude && cfg.geo.longitude) data.geo = { '@type': 'GeoCoordinates', latitude: cfg.geo.latitude, longitude: cfg.geo.longitude };
  return data;
}

function layout({ lang, page, p, altP, title, description, body, ogType = 'website', ogImage = '/assets/img/hero.svg', extraLd = [] }) {
  const t = T[lang], o = other(lang), dir = lang === 'ar' ? 'rtl' : 'ltr';
  const altPath = altP === null ? url(o) : url(o, altP ?? p);
  const nav = [['home', ''], ['about', 'about/'], ['blog', 'blog/'], ['contact', 'contact/']];
  const font = lang === 'ar'
    ? 'family=Cairo:wght@400;600;700;800;900'
    : 'family=Montserrat:wght@400;500;600;700;800;900';
  const hreflang = altP === null
    ? `<link rel="alternate" hreflang="${lang}" href="${abs(url(lang, p))}">`
    : `<link rel="alternate" hreflang="en" href="${abs(url('en', lang === 'en' ? p : altP ?? p))}">
<link rel="alternate" hreflang="ar" href="${abs(url('ar', lang === 'ar' ? p : altP ?? p))}">
<link rel="alternate" hreflang="x-default" href="${abs(url('en', lang === 'en' ? p : altP ?? p))}">`;
  const ld = [jsonLdBusiness(lang), ...extraLd].map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`).join('\n');

  const langToggle = `<div class="lang-toggle" role="group" aria-label="${esc(t.nav.langLabel)}">
      ${lang === 'en' ? '<span class="is-active en-label" aria-current="true">EN</span>' : `<a class="en-label" href="${altPath}" hreflang="en" lang="en" data-set-lang="en" aria-label="${esc(t.nav.langSwitch)}">EN</a>`}
      ${lang === 'ar' ? '<span class="is-active ar-label" aria-current="true">عربي</span>' : `<a class="ar-label" href="${altPath}" hreflang="ar" lang="ar" data-set-lang="ar" aria-label="${esc(t.nav.langSwitch)}">عربي</a>`}
    </div>`;

  const socials = [['instagram', 'Instagram'], ['x', 'X'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['snapchat', 'Snapchat']]
    .filter(([k]) => cfg.social[k])
    .map(([k, label]) => `<li>${ext(cfg.social[k], '', icon(k), label)}</li>`).join('')
    + `<li>${ext(`https://wa.me/${cfg.whatsapp}`, '', icon('whatsapp'), 'WhatsApp')}</li>`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(url(lang, p))}">
${hreflang}
<meta name="theme-color" content="#141414">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(t.brand.full)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(url(lang, p))}">
<meta property="og:image" content="${abs(ogImage)}">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_SA' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'ar' ? 'en_US' : 'ar_SA'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ICON_FILE}" type="image/png">
<link rel="apple-touch-icon" href="${ICON_FILE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${font}&display=swap">
<link rel="stylesheet" href="/assets/css/style.css">
<script>try{localStorage.setItem('banaweer-lang','${lang}')}catch(e){}</script>
${ld}
</head>
<body class="page-${page}">
<a class="skip-link" href="#main">${esc(t.nav.skip)}</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="logo" href="${url(lang)}" aria-label="${esc(t.brand.full)} — ${esc(t.nav.home)}">
      ${LOGO_MARK}
      <span class="logo-text"><span class="logo-name">${esc(t.brand.name)}</span><span class="logo-tag">${esc(t.brand.tagline)}</span></span>
    </a>
    <nav id="main-nav" class="main-nav" aria-label="${lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}">
      <ul>${nav.map(([k, href]) => `<li><a href="${url(lang, href)}"${k === page || (k === 'blog' && page === 'post') ? ' aria-current="page"' : ''}>${esc(t.nav[k])}</a></li>`).join('')}</ul>
    </nav>
    <div class="header-actions">
      ${langToggle}
      ${ext(STORE, 'btn-store', `${icon('bag')}<span class="label">${esc(t.nav.shop)}</span>`, t.nav.shopAria)}
      <button class="nav-toggle" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="${esc(t.nav.menu)}" data-label-open="${esc(t.nav.menu)}" data-label-close="${esc(t.nav.close)}">${icon('menu', 'icon-menu')}${icon('close', 'icon-close')}</button>
    </div>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${url(lang)}">${LOGO_MARK}<span class="logo-text"><span class="logo-name">${esc(t.brand.name)}</span><span class="logo-tag">${esc(t.brand.tagline)}</span></span></a>
        <p>${esc(t.footer.blurb)}</p>
        <h2 class="sr-only">${esc(t.footer.follow)}</h2>
        <ul class="socials">${socials}</ul>
      </div>
      <div>
        <h2>${esc(t.footer.quick)}</h2>
        <ul class="footer-links">
          ${nav.map(([k, href]) => `<li><a href="${url(lang, href)}">${esc(t.nav[k])}</a></li>`).join('')}
          <li>${ext(STORE, '', `${icon('bag')}${esc(t.footer.store)}`, `${t.footer.store} ${t.common.newTab}`)}</li>
        </ul>
      </div>
      <div>
        <h2>${esc(t.footer.contact)}</h2>
        <ul class="footer-links">
          <li><a href="tel:${esc(cfg.phone)}">${icon('phone')}<span class="ltr">${esc(cfg.phoneDisplay)}</span></a></li>
          <li>${ext(`https://wa.me/${cfg.whatsapp}`, '', `${icon('whatsapp')}${esc(t.contact.info.whatsapp)}`)}</li>
          <li><a href="mailto:${esc(cfg.email)}">${icon('mail')}<span class="ltr">${esc(cfg.email)}</span></a></li>
          <li><span style="display:inline-flex;gap:10px">${icon('pin')}<span>${esc(t.business.address)}</span></span></li>
        </ul>
      </div>
      <div>
        <h2>${esc(t.footer.hours)}</h2>
        <p style="margin:0">${esc(t.business.hours)}<br>${esc(t.business.hoursNote)}</p>
        <div class="footer-store">${ext(STORE, 'btn btn-primary', `${icon('bag')}${esc(t.common.visitStore)}`, `${t.common.visitStore} ${t.common.newTab}`)}</div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${num(YEAR, lang).replace(/٬/g, '')} ${esc(t.brand.full)}. ${esc(t.footer.rights)}${cfg.vatNumber ? ` · ${esc(t.footer.vat)} <span class="ltr">${esc(cfg.vatNumber)}</span>` : ''}</span>
      <a href="${altPath}" lang="${o}" data-set-lang="${o}">${o === 'ar' ? 'عربي' : 'English'}</a>
    </div>
  </div>
</footer>
${ext(`https://wa.me/${cfg.whatsapp}`, 'fab-whatsapp', icon('whatsapp'), t.contact.info.whatsappCta)}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
}

/* -------------------------------------------------------------- components */
const sectionHead = (eyebrow, title, sub, center = false) =>
  `<div class="section-head${center ? ' center' : ''} reveal">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;

function postCard(post, lang, headingLevel = 3) {
  const t = T[lang];
  const href = url(lang, `blog/${post.slug}/`);
  const catName = t.blog.categories[post.category] || post.category;
  const search = `${post.title} ${post.excerpt} ${catName}`;
  return `<article class="post-card" data-category="${esc(post.category)}" data-search="${esc(search)}">
    <a class="post-media" href="${href}" tabindex="-1" aria-hidden="true"><img src="${img(post.cover)}" alt="" loading="lazy" width="1600" height="1000"></a>
    <div class="post-body">
      <div class="post-meta"><span class="tag">${esc(catName)}</span><time datetime="${post.date}">${fmtDate(post.date, lang)}</time></div>
      <h${headingLevel}><a href="${href}">${esc(post.title)}</a></h${headingLevel}>
      <p>${esc(post.excerpt)}</p>
      <span class="cat-link" aria-hidden="true">${esc(t.common.readMore)} ${icon('arrow', 'icon-dir')}</span>
    </div>
  </article>`;
}

const ctaBanner = (title, text, btn) => `<div class="cta-banner reveal"><div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>${btn}</div>`;

/* -------------------------------------------------------------------- pages */
function homePage(lang) {
  const t = T[lang], h = t.home;
  const cats = ['mountain', 'road', 'sport', 'city', 'rideons', 'parts'];
  const whyIcons = { brands: 'shield', advice: 'chat', service: 'wrench', price: 'tag' };
  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-media"><img src="${img('hero')}" alt="${esc(h.hero.imageAlt)}" width="1600" height="1000" fetchpriority="high"></div>
  <div class="container">
    <div class="hero-content reveal">
      <span class="eyebrow">${esc(h.hero.eyebrow)}</span>
      <h1 id="hero-title">${esc(h.hero.title)}</h1>
      <p>${esc(h.hero.subtitle)}</p>
      <div class="btn-row">
        ${ext(STORE, 'btn btn-primary', `${icon('bag')}${esc(h.hero.shop)}`, `${h.hero.shop} ${t.common.newTab}`)}
        <a class="btn btn-outline-light" href="#categories">${esc(h.hero.explore)} ${icon('arrow', 'icon-dir')}</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="categories" aria-labelledby="cat-title">
  <div class="container">
    ${sectionHead(h.categories.eyebrow, h.categories.title, h.categories.subtitle).replace('<h2>', '<h2 id="cat-title">')}
    <div class="grid grid-3 reveal-stagger">
      ${cats.map((k) => { const c = h.categories.items[k]; return ext(storeCat(k), 'cat-card', `<img src="${img(k)}" alt="${esc(c.alt)}" loading="lazy" width="1600" height="1000"><div class="cat-body"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><span class="cat-link">${esc(h.categories.cta)} ${icon('arrow', 'icon-dir')}</span></div>`, `${c.name}: ${h.categories.cta} ${t.common.newTab}`); }).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-dark" aria-labelledby="why-title">
  <div class="container">
    ${sectionHead(h.why.eyebrow, h.why.title, '').replace('<h2>', '<h2 id="why-title">')}
    <div class="grid grid-4 reveal-stagger">
      ${Object.entries(h.why.items).map(([k, w]) => `<div class="feature"><div class="feature-icon">${icon(whyIcons[k])}</div><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="feat-title">
  <div class="container">
    ${sectionHead(h.featured.eyebrow, h.featured.title, h.featured.subtitle).replace('<h2>', '<h2 id="feat-title">')}
    <div class="grid grid-4 reveal-stagger">
      ${h.featured.items.map((it) => ext(storeCat(it.store || it.img), 'product-card', `<div class="product-media"><img src="${img(it.img)}" alt="" loading="lazy" width="1600" height="1000"></div><div class="product-body"><span class="product-cat">${esc(it.cat)}</span><h3>${esc(it.name)}</h3><span class="cat-link">${esc(h.featured.cta)} ${icon('arrow', 'icon-dir')}</span></div>`, `${it.name}: ${h.featured.cta} ${t.common.newTab}`)).join('\n      ')}
    </div>
  </div>
</section>

<section class="section" aria-labelledby="latest-title">
  <div class="container">
    ${sectionHead(h.latest.eyebrow, h.latest.title, '').replace('<h2>', '<h2 id="latest-title">')}
    <div class="grid grid-3 reveal-stagger">
      ${POSTS[lang].slice(0, 3).map((p) => postCard(p, lang)).join('\n')}
    </div>
    <div class="section-foot"><a class="btn btn-ghost" href="${url(lang, 'blog/')}">${esc(t.common.viewAll)} ${icon('arrow', 'icon-dir')}</a></div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="test-title">
  <div class="container">
    ${sectionHead(h.testimonials.eyebrow, h.testimonials.title, h.testimonials.subtitle, true).replace('<h2>', '<h2 id="test-title">')}
    <!-- Reviews come from src/reviews.json (copied from the Salla store). -->
    <div class="reviews reveal" data-reviews>
      <div class="reviews-track" tabindex="0" role="region" aria-label="${esc(h.testimonials.listLabel)}">
        ${REVIEWS.map((r) => {
          const q = lang === 'ar' ? ['«', '»'] : ['“', '”'];
          const name = r.name[lang] || r.name.ar;
          const month = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(r.date + 'T00:00:00Z'));
          return `<figure class="testimonial">
          <div class="stars" role="img" aria-label="${esc(h.testimonials.rating.replace('{n}', r.stars))}">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= r.stars ? 'on' : ''}">${icon('star')}</span>`).join('')}</div>
          <blockquote${lang === 'en' ? '' : ' lang="ar"'}>${q[0]}${esc(lang === 'en' ? r.en : r.ar)}${q[1]}</blockquote>
          ${lang === 'en' && h.testimonials.translated ? `<p class="translated">${esc(h.testimonials.translated)}</p>` : ''}
          <figcaption class="who"><span class="avatar" aria-hidden="true">${esc([...name][0])}</span><span class="who-text"><strong>${esc(name)}</strong><span class="verified">${icon('checkCircle')}${esc(h.testimonials.verified)}</span><time class="review-date" datetime="${r.date}">${esc(month)}</time></span></figcaption>
        </figure>`;
        }).join('\n        ')}
      </div>
      <div class="reviews-nav">
        <button type="button" class="reviews-btn" data-dir="-1" aria-label="${esc(h.testimonials.prev)}">${icon('arrow', 'icon-back')}</button>
        <button type="button" class="reviews-btn" data-dir="1" aria-label="${esc(h.testimonials.next)}">${icon('arrow', 'icon-dir')}</button>
      </div>
    </div>
    <div class="section-foot btn-row" style="justify-content:center">
      ${cfg.storeReviewsUrl ? ext(cfg.storeReviewsUrl, 'btn btn-ghost', `${icon('bag')}${esc(h.testimonials.store)}`, `${h.testimonials.store} ${t.common.newTab}`) : ''}
      ${cfg.reviewsLink ? ext(cfg.reviewsLink, 'btn btn-ghost', `${icon('star')}${esc(h.testimonials.google)}`, `${h.testimonials.google} ${t.common.newTab}`) : ''}
    </div>
  </div>
</section>

<section class="section" aria-label="${esc(h.showroom.title)}">
  <div class="container">
    ${ctaBanner(h.showroom.title, h.showroom.text, cfg.mapLink
      ? ext(cfg.mapLink, 'btn btn-dark', `${icon('pin')}${esc(h.showroom.cta)}`, `${h.showroom.cta} ${t.common.newTab}`)
      : `<a class="btn btn-dark" href="${url(lang, 'contact/')}">${icon('pin')}${esc(h.showroom.cta)}</a>`)}
  </div>
</section>`;
  return layout({ lang, page: 'home', p: '', title: t.meta.home.title, description: t.meta.home.description, body });
}

function aboutPage(lang) {
  const t = T[lang], a = t.about;
  const fill = (s) => s.replace('{city}', t.business.city).replace('{year}', cfg.founded ? num(cfg.founded, lang).replace(/٬/g, '') : '');
  const gallery = ['showroom', 'workshop', 'accessories', 'rideons'];
  const body = `
<section class="page-hero">
  <div class="container reveal">
    <span class="eyebrow">${esc(a.hero.eyebrow)}</span>
    <h1>${esc(a.hero.title)}</h1>
  </div>
</section>

<section class="section" aria-labelledby="story-title">
  <div class="container split">
    <div class="reveal">
      <h2 id="story-title" style="font-size:clamp(1.8rem,3.6vw,2.6rem)">${esc(a.story.title)}</h2>
      <div class="prose-lg"><p>${esc(fill(a.story.p1))}</p><p>${esc(a.story.p2)}</p></div>
    </div>
    <div class="split-media reveal"><img src="${img('showroom')}" alt="${esc(a.story.imageAlt)}" loading="lazy" width="1600" height="1000"></div>
  </div>
</section>

<section class="section section-alt" aria-label="${esc(`${a.vmv.vision.title}, ${a.vmv.mission.title}, ${a.vmv.values.title}`)}">
  <div class="container">
    <div class="grid grid-3 reveal-stagger">
      ${[['vision', 'eye'], ['mission', 'target'], ['values', 'heart']].map(([k, ic]) => `<div class="vmv-card"><div class="feature-icon">${icon(ic)}</div><h3>${esc(a.vmv[k].title)}</h3><p>${esc(a.vmv[k].text)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-dark" aria-labelledby="offer-title">
  <div class="container">
    ${sectionHead('', a.offer.title, '').replace('<h2>', '<h2 id="offer-title">')}
    <div class="offer-grid reveal-stagger">
      <div class="offer-box"><h3>${esc(a.offer.productsTitle)}</h3><ul class="check-list">${a.offer.products.map((x) => `<li>${icon('checkCircle')}${esc(x)}</li>`).join('')}</ul></div>
      <div class="offer-box"><h3>${esc(a.offer.servicesTitle)}</h3><ul class="check-list">${a.offer.services.map((x) => `<li>${icon('wrench')}${esc(x)}</li>`).join('')}</ul></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="gallery-title">
  <div class="container">
    ${sectionHead('', a.gallery.title, '').replace('<h2>', '<h2 id="gallery-title">')}
    <!-- PLACEHOLDER: replace these images with real showroom photos in src/assets/img/ or src/assets/uploads/. -->
    <div class="gallery reveal-stagger">
      ${gallery.map((g, i) => `<figure><img src="${img(g)}" alt="${esc(a.gallery.items[i])}" loading="lazy" width="1600" height="1000"><figcaption>${esc(a.gallery.items[i])}</figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    ${ctaBanner(t.blog.cta.title, t.blog.cta.text, ext(STORE, 'btn btn-dark', `${icon('bag')}${esc(t.blog.cta.button)}`, `${t.blog.cta.button} ${t.common.newTab}`))}
  </div>
</section>`;
  return layout({ lang, page: 'about', p: 'about/', title: t.meta.about.title, description: t.meta.about.description, body });
}

function blogPage(lang) {
  const t = T[lang], b = t.blog;
  const body = `
<section class="page-hero">
  <div class="container reveal">
    <span class="eyebrow">${esc(b.eyebrow)}</span>
    <h1>${esc(b.title)}</h1>
    <p>${esc(b.subtitle)}</p>
  </div>
</section>

<section class="section" data-blog data-per-page="${cfg.postsPerPage}" data-prev="${esc(b.prev)}" data-next="${esc(b.next)}">
  <div class="container">
    <div class="blog-toolbar">
      <div class="chips" role="group" aria-label="${esc(b.filterLabel)}">
        <button type="button" class="chip" data-cat="all" aria-pressed="true">${esc(b.all)}</button>
        ${Object.entries(b.categories).map(([k, v]) => `<button type="button" class="chip" data-cat="${k}" aria-pressed="false">${esc(v)}</button>`).join('\n        ')}
      </div>
      <div class="search-field" role="search">
        <label class="sr-only" for="blog-search">${esc(b.search)}</label>
        ${icon('search')}
        <input id="blog-search" type="search" placeholder="${esc(b.searchPlaceholder)}" autocomplete="off">
      </div>
    </div>
    <div class="grid grid-3" aria-live="polite">
      ${POSTS[lang].map((p) => postCard(p, lang, 2)).join('\n')}
    </div>
    <p class="no-results" hidden>${esc(b.noResults)}</p>
    <nav class="pagination" aria-label="${esc(b.pagination)}" hidden></nav>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    ${ctaBanner(b.cta.title, b.cta.text, ext(STORE, 'btn btn-dark', `${icon('bag')}${esc(b.cta.button)}`, `${b.cta.button} ${t.common.newTab}`))}
  </div>
</section>`;
  return layout({ lang, page: 'blog', p: 'blog/', title: t.meta.blog.title, description: t.meta.blog.description, body });
}

function postPage(lang, post) {
  const t = T[lang], b = t.blog;
  const p = `blog/${post.slug}/`;
  const pageUrl = abs(url(lang, p));
  const catName = b.categories[post.category] || post.category;
  const related = [
    ...POSTS[lang].filter((x) => x.slug !== post.slug && x.category === post.category),
    ...POSTS[lang].filter((x) => x.slug !== post.slug && x.category !== post.category),
  ].slice(0, 3);
  const enc = encodeURIComponent;
  const shareText = enc(post.title);
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt,
    datePublished: post.date, inLanguage: lang, image: abs(img(post.cover)), mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: post.author || t.brand.full },
    publisher: { '@type': 'Organization', name: t.brand.full, logo: { '@type': 'ImageObject', url: abs(LOGO_FILE) } },
  };
  const body = `
<article>
  <header class="article-hero">
    <div class="container">
      <a class="breadcrumb" href="${url(lang, 'blog/')}">${icon('arrow')}${esc(b.back)}</a>
      <div class="post-meta" style="margin-bottom:14px"><a class="tag" href="${url(lang, 'blog/')}?category=${esc(post.category)}">${esc(catName)}</a></div>
      <h1>${esc(post.title)}</h1>
      <div class="post-meta">
        <span>${esc(b.by)} ${esc(post.author || t.brand.full)}</span><span aria-hidden="true">·</span>
        <time datetime="${post.date}">${fmtDate(post.date, lang)}</time><span aria-hidden="true">·</span>
        <span>${num(post.minutes, lang)} ${esc(b.minRead)}</span>
      </div>
      <div class="article-cover"><img src="${img(post.cover)}" alt="${esc(post.title)}" width="1600" height="1000" fetchpriority="high"></div>
    </div>
  </header>
  <div class="article-body">
    <div class="container">
      <div class="prose">
${post.body}
      </div>
      <div class="share">
        <span class="share-label">${esc(b.share)}</span>
        ${ext(`https://wa.me/?text=${shareText}%20${enc(pageUrl)}`, '', icon('whatsapp'), 'WhatsApp')}
        ${ext(`https://twitter.com/intent/tweet?text=${shareText}&url=${enc(pageUrl)}`, '', icon('x'), 'X')}
        ${ext(`https://www.facebook.com/sharer/sharer.php?u=${enc(pageUrl)}`, '', icon('facebook'), 'Facebook')}
        <button type="button" data-copy-link data-copied="${esc(b.copied)}" aria-label="${esc(b.copyLink)}">${icon('link')}</button>
        <span class="copy-status" role="status" aria-live="polite"></span>
      </div>
    </div>
  </div>
</article>

${related.length ? `<section class="section" aria-labelledby="related-title">
  <div class="container">
    ${sectionHead('', b.related, '').replace('<h2>', '<h2 id="related-title">')}
    <div class="grid grid-3 reveal-stagger">${related.map((r) => postCard(r, lang)).join('\n')}</div>
  </div>
</section>` : ''}

<section class="section${related.length ? ' section-alt' : ''}">
  <div class="container">
    ${ctaBanner(b.cta.title, b.cta.text, ext(STORE, 'btn btn-dark', `${icon('bag')}${esc(b.cta.button)}`, `${b.cta.button} ${t.common.newTab}`))}
  </div>
</section>`;
  const altP = hasTranslation(post.slug, other(lang)) ? p : null;
  return layout({ lang, page: 'post', p, altP, title: `${post.title} | ${t.brand.full}`, description: post.excerpt, body, ogType: 'article', ogImage: img(post.cover), extraLd: [ld] });
}

function contactPage(lang) {
  const t = T[lang], c = t.contact;
  const messages = { ...c.errors, sending: c.sending };
  const field = (name, label, control, full = false) =>
    `<div class="field${full ? ' full' : ''}"><label for="f-${name}">${esc(label)} <span class="req" aria-hidden="true">*</span><span class="sr-only">(${esc(c.required)})</span></label>${control}<p class="field-error" id="e-${name}"></p></div>`;
  const aria = (name) => `id="f-${name}" name="${name}" required aria-describedby="e-${name}"`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(cfg.mapQuery)}&hl=${lang}&output=embed`;
  const body = `
<section class="page-hero">
  <div class="container reveal">
    <span class="eyebrow">${esc(c.eyebrow)}</span>
    <h1>${esc(c.title)}</h1>
    <p>${esc(c.subtitle)}</p>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="contact-grid">
      <div class="form-card reveal">
        <form id="contact-form" novalidate data-endpoint="${esc(cfg.formEndpoint)}" data-messages="${esc(JSON.stringify(messages))}">
          <h2>${esc(c.formTitle)}</h2>
          <div class="form-grid">
            ${field('name', c.fields.name, `<input type="text" ${aria('name')} autocomplete="name" maxlength="100">`)}
            ${field('phone', c.fields.phone, `<div class="phone-group" dir="ltr">
              <span class="phone-code"><span class="phone-code-label" aria-hidden="true">+966</span>${icon('chevron')}
                <select name="country_code" id="f-country" aria-label="${esc(c.fields.countryCode)}">${COUNTRY_CODES.map(([code, iso, ar, en]) => `<option value="${code}"${code === '966' ? ' selected' : ''}>${esc(lang === 'ar' ? ar : en)} (+${code})</option>`).join('')}</select>
              </span>
              <input type="tel" ${aria('phone')} autocomplete="tel-national" inputmode="numeric" dir="ltr" placeholder="5X XXX XXXX" maxlength="16">
            </div>`)}
            ${field('email', c.fields.email, `<input type="email" ${aria('email')} autocomplete="email" dir="ltr" maxlength="120">`)}
            ${field('type', c.fields.type, `<select ${aria('type')}><option value="">${esc(c.fields.typePlaceholder)}</option>${Object.entries(c.types).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>`)}
            ${field('message', c.fields.message, `<textarea ${aria('message')} maxlength="2000"></textarea>`, true)}
          </div>
          <div class="hp" aria-hidden="true"><label for="f-company">Company</label><input type="text" id="f-company" name="company" tabindex="-1" autocomplete="off"></div>
          <input type="hidden" name="_subject" value="${lang === 'ar' ? 'رسالة جديدة من موقع بانوير' : 'New message from the Banaweer website'}">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_captcha" value="false">
          <div class="form-actions">
            <button class="btn btn-primary" type="submit"><span class="label">${esc(c.submit)}</span> ${icon('arrow', 'icon-dir')}</button>
            <p class="form-status" role="status" aria-live="polite"></p>
          </div>
        </form>
        <div id="form-success" class="form-success" hidden tabindex="-1" role="status">
          <div class="feature-icon">${icon('check')}</div>
          <h2>${esc(c.success.title)}</h2>
          <p>${esc(c.success.text)}</p>
        </div>
      </div>

      <aside class="reveal" aria-labelledby="info-title">
        <h2 id="info-title" style="font-size:1.4rem;margin-bottom:18px">${esc(c.info.title)}</h2>
        <div class="info-list">
          <a class="info-item" href="tel:${esc(cfg.phone)}"><span class="feature-icon">${icon('phone')}</span><span><h3>${esc(c.info.call)}</h3><p class="ltr">${esc(cfg.phoneDisplay)}</p></span></a>
          ${(cfg.customerService || []).length ? `<div class="info-item"><span class="feature-icon">${icon('chat')}</span><span><h3>${esc(c.info.customerService)}</h3><p>${cfg.customerService.map((n) => `<a class="ltr" href="tel:${esc(n.tel)}">${esc(n.display)}</a>`).join('<br>')}</p></span></div>` : ''}
          ${ext(`https://wa.me/${cfg.whatsapp}`, 'info-item', `<span class="feature-icon" style="background:#E7F7EE;color:#1FAF54">${icon('whatsapp')}</span><span><h3>${esc(c.info.whatsapp)}</h3><p>${esc(c.info.whatsappCta)}</p></span>`)}
          <a class="info-item" href="mailto:${esc(cfg.email)}"><span class="feature-icon">${icon('mail')}</span><span><h3>${esc(c.info.email)}</h3><p class="ltr">${esc(cfg.email)}</p></span></a>
          <div class="info-item"><span class="feature-icon">${icon('pin')}</span><span><h3>${esc(c.info.address)}</h3><p>${esc(t.business.address)}</p></span></div>
          <div class="info-item"><span class="feature-icon">${icon('clock')}</span><span><h3>${esc(c.info.hours)}</h3><p>${esc(t.business.hours)}<br>${esc(t.business.hoursNote)}</p></span></div>
        </div>
      </aside>
    </div>
    <div class="map-wrap reveal">
      <iframe src="${esc(mapSrc)}" title="${esc(c.mapTitle)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
    ${cfg.mapLink ? `<div class="section-foot">${ext(cfg.mapLink, 'btn btn-ghost', `${icon('pin')}${esc(c.openMap)}`, `${c.openMap} ${t.common.newTab}`)}</div>` : ''}
  </div>
</section>`;
  return layout({ lang, page: 'contact', p: 'contact/', title: t.meta.contact.title, description: t.meta.contact.description, body });
}

function notFoundPage(lang) {
  const t = T[lang];
  const body = `<section class="section not-found"><div class="container"><span class="eyebrow">404</span><h1>${esc(t.notFound.title)}</h1><p>${esc(t.notFound.text)}</p><a class="btn btn-primary" href="${url(lang)}">${esc(t.notFound.home)}</a></div></section>`;
  return layout({ lang, page: '404', p: '404.html', title: `${t.notFound.title} | ${t.brand.full}`, description: t.notFound.text, body })
    .replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
}

function rootRedirect() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.en.brand.full)} | ${esc(T.ar.brand.full)}</title>
<link rel="canonical" href="${abs('/en/')}">
<link rel="alternate" hreflang="en" href="${abs('/en/')}">
<link rel="alternate" hreflang="ar" href="${abs('/ar/')}">
<link rel="alternate" hreflang="x-default" href="${abs('/en/')}">
<link rel="icon" href="${ICON_FILE}" type="image/png">
<script>
  (function () {
    var lang;
    try { lang = localStorage.getItem('banaweer-lang'); } catch (e) {}
    if (lang !== 'en' && lang !== 'ar') {
      var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      lang = /^ar\\b/i.test(nav) ? 'ar' : 'en';
    }
    location.replace('/' + lang + '/');
  })();
</script>
<style>body{font-family:system-ui,sans-serif;background:#141414;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}a{color:#E85D04;font-weight:700;margin:0 12px}</style>
</head>
<body>
<p><a href="/en/">English</a> | <a href="/ar/" lang="ar">عربي</a></p>
</body>
</html>
`;
}

function sitemap() {
  const pages = ['', 'about/', 'blog/', 'contact/'];
  const entries = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const lang of LANGS) {
    for (const p of pages) entries.push({ lang, p, alt: true, lastmod: today });
    for (const post of POSTS[lang]) entries.push({ lang, p: `blog/${post.slug}/`, alt: hasTranslation(post.slug, other(lang)), lastmod: post.date });
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((e) => `  <url>
    <loc>${abs(url(e.lang, e.p))}</loc>
    <lastmod>${e.lastmod}</lastmod>
${e.alt ? LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(url(l, e.p))}"/>`).join('\n') + '\n' : ''}  </url>`).join('\n')}
</urlset>
`;
}

/* -------------------------------------------------------------------- build */
function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'));
  copyDir(path.join(ROOT, 'src/admin'), path.join(DIST, 'admin'));

  for (const s of SCENES) {
    const target = path.join(DIST, 'assets/img', `${s}.svg`);
    if (!fs.existsSync(target)) write(`assets/img/${s}.svg`, scene(s));
  }

  let count = 0;
  for (const lang of LANGS) {
    write(`${lang}/index.html`, homePage(lang));
    write(`${lang}/about/index.html`, aboutPage(lang));
    write(`${lang}/blog/index.html`, blogPage(lang));
    write(`${lang}/contact/index.html`, contactPage(lang));
    write(`${lang}/404.html`, notFoundPage(lang));
    count += 5;
    for (const post of POSTS[lang]) { write(`${lang}/blog/${post.slug}/index.html`, postPage(lang, post)); count++; }
  }
  write('index.html', rootRedirect());
  write('404.html', notFoundPage('en'));
  write('sitemap.xml', sitemap());
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${abs('/sitemap.xml')}\n`);

  const missing = POSTS.en.filter((p) => !hasTranslation(p.slug, 'ar')).map((p) => p.slug)
    .concat(POSTS.ar.filter((p) => !hasTranslation(p.slug, 'en')).map((p) => p.slug));
  console.log(`Built ${count} pages into dist/ (${POSTS.en.length} EN posts, ${POSTS.ar.length} AR posts).`);
  if (missing.length) console.log(`Note: these posts exist in only one language: ${[...new Set(missing)].join(', ')}`);
  if (!cfg.formEndpoint) console.log('Note: config.json formEndpoint is empty. The contact form only simulates success on localhost.');
}

build();
