# Banaweer Trading Establishment website

A bilingual (English / Arabic) website for **Banaweer Trading Establishment** (مؤسسة بنوير التجارية). It has four pages (Home, About Us, Blog, Contact Us) plus a page for each blog post, in both languages.

It is a plain static site: one small Node.js script turns the text files into ready-to-host HTML. There is nothing to install besides Node.js 18 or newer, and no database or server code.

---

## Quick start

```bash
npm start
```

This builds the site into `dist/` and opens a preview at <http://localhost:8080/>.

- `npm run build`: rebuild `dist/` after you change any text, post or setting.
- `npm run serve`: preview `dist/` without rebuilding.

**To publish**, upload the contents of `dist/` to any static host, such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your existing web hosting.

---

## Business details

Real details came from banaweer.com and the Salla store at banaweer.sa:

- **Store:** `https://banaweer.sa`. Category cards link to the store's real categories on `salla.sa/banaweer.sa/...`, because category pages don't open under the `banaweer.sa` domain.
- **Showroom:** Al-Sabeen Showroom, 6405 Prince Majed St, Al-Mushrifah, Jeddah 23341. Open Saturday–Thursday 9 AM–11 PM, closed Friday. The map uses the Google Maps pin.
- **Phones:** showroom +966 12 671 6633 (also WhatsApp Business), plus three customer-service numbers.
- **Email and VAT:** Store@banaweer.com, VAT number 300123853400003.
- **Social:** Instagram, X, Facebook and Snapchat.

All of this lives in `config.json` and in the `business` section of both language files.

## Still to do before launch

| What | Where |
|---|---|
| **Activate the contact form** | One-time email confirmation (see below) |
| Photos | See "Replacing images" below |
| Your domain | `config.json` → `siteUrl`, currently `https://banaweer.com` |

### Contact form

Contact form messages are emailed to **Store@banaweer.com** through [FormSubmit](https://formsubmit.co), a free service that needs no account. The form checks every field and blocks spam with a hidden field that only bots fill in, plus a minimum fill time.

Each email arrives as a table with the visitor's name, phone, email, inquiry type, message, page language and page address. Replying to it replies straight to the visitor.

**One-time activation, required before messages arrive:**

1. Send one test message from the contact page, either on the live site or in the local preview.
2. FormSubmit emails an activation link to Store@banaweer.com. Open it and click **Activate Form**. Check the spam folder if it doesn't arrive.
3. From then on, every message is delivered.

**Optional, recommended:** after activation, FormSubmit gives you a random alias such as `https://formsubmit.co/ajax/a1b2c3...`. Paste it into `config.json` → `formEndpoint` in place of the email address, then run `npm run build`. That way the email address doesn't appear in the page source, where spam bots could collect it.

To use a different service (Formspree, Getform, Basin or your own API), put its endpoint URL in `formEndpoint`. If `formEndpoint` is empty, the form only pretends to send on `localhost`, and on a live site it asks visitors to call or WhatsApp instead.

---

## Customer reviews

The homepage reviews come from `src/reviews.json`. They were copied from the Salla store's reviews page (`storeReviewsUrl` in `config.json`). Each review shows the customer's first name only, the star rating and the month. The English page shows a translation, marked "Translated from Arabic".

To add a new review, add an entry at the top of the `reviews` list with the same fields, then run `npm run build`.

## Changing text

All on-page text lives in two files:

- `src/i18n/en.json`: English
- `src/i18n/ar.json`: Arabic

Both files use the same keys. For example, `home.hero.title` is the big homepage headline in each language. Edit the text, keep the quotes and commas intact, then run `npm run build`. You never need to touch the layout code to change wording.

---

## Adding a blog post

Each post is a Markdown file. Put the English version in `src/posts/en/` and the Arabic version in `src/posts/ar/`, and give both **the same file name**. That shared name is how the language toggle links the two versions together.

```markdown
---
title: "Your post title"
excerpt: "One or two sentences shown on the blog cards."
date: 2026-12-01
category: maintenance
author: Banaweer Team
cover: road
---
Your article text. Use ## for headings, - for bullet lists, 1. for numbered lists,
**bold**, *italic* and [links](https://example.com).
```

- **File name** becomes the URL: `winter-riding-tips.md` → `/en/blog/winter-riding-tips/`.
- **category**: one of `buying-guides`, `maintenance`, `routes`, `safety`, `news`.
- **cover**: a built-in placeholder name (`mountain`, `road`, `sport`, `city`, `rideons`, `moto`, `parts`, `hero`, `showroom`, `workshop`, `accessories`, `motodisplay`) or a path to your own image, such as `/assets/uploads/my-photo.jpg` (save that file in `src/assets/uploads/`).
- Add `draft: true` to hide a post.

Run `npm run build`. The post appears on the blog page, in "Latest articles" on the homepage, in related posts, and in `sitemap.xml`. Reading time is calculated for you.

### Editing blog posts with a CMS (optional)

The site includes a ready-made [Decap CMS](https://decapcms.org) setup (`src/admin/`), which gives you a web editor at `yoursite.com/admin/` for writing posts in both languages. It needs:

1. The project stored in a Git repository (GitHub, GitLab or Bitbucket).
2. Hosting on Netlify, with build command `npm run build` and publish directory `dist`.
3. **Netlify Identity** and **Git Gateway** turned on in the Netlify dashboard, and editors invited by email.

If you don't use it, delete `src/admin/`. Posts can always be added as files.

---

## Replacing images

All images are currently generated placeholder illustrations. To use real photos:

1. Save the photo in `src/assets/img/`. Aim for about 1600×1000 px, JPG or WebP, under ~300 KB.
2. In `build.js`, point the image at your file. For example, change `img('hero')` to `img('/assets/img/hero.jpg')`. Search for `img(` to find every image. Category cards use the category key (`mountain`, `road`, …) and the About gallery uses `showroom`, `workshop`, `accessories`, `rideons`.
3. Run `npm run build`.

You can also skip the code edit and save an SVG with the same name as a placeholder, such as `src/assets/img/hero.svg`. A file you provide always takes priority over the generated placeholder.

Placeholder alt text is in the language files (keys ending in `alt` / `imageAlt`). Update it to describe the real photos.

**Social sharing image:** many social networks don't display SVG previews. Add a 1200×630 JPG, for example `src/assets/img/og-image.jpg`, and change the `ogImage` default in `build.js`.

**Logo:** there are three logo files in `src/assets/img/`:

- `logo.png`: white and orange on a transparent background. It's shown directly in the dark header and footer.
- `logo.webp`: black on white. Search engines use it, because they show logos on light backgrounds.
- `icon.png`: a 192×192 square icon for browser tabs and phone home screens.

To change the logo, replace these files and keep the same names. If the new `logo.png` has a different shape, update `width` and `height` in `LOGO_MARK` in `build.js`.

---

## What is included

- **Language switching**: an `EN | عربي` toggle on every page that links to the same page in the other language. Separate URLs per language (`/en/…`, `/ar/…`), `hreflang` tags, and a remembered choice: the root `/` sends returning visitors to their last language, and first-time visitors to their browser's language.
- **Full RTL**: Arabic pages use `dir="rtl"`. Layout spacing uses CSS logical properties, so navigation, alignment, icons and arrows all mirror. English uses Montserrat and Arabic uses Cairo.
- **Store button**: in the header on every screen size (icon + label), in the footer, in hero and CTA blocks, and on category and product cards. It always opens the external store in a new tab with `rel="noopener"`.
- **Header**: sticky, shrinks on scroll, with a hamburger menu on mobile. The menu closes with Esc and has proper `aria-expanded`.
- **SEO**: per-page and per-language titles and descriptions, canonical URLs, Open Graph tags, `sitemap.xml` with language alternates, `robots.txt`, schema.org `BikeStore` (LocalBusiness) markup on every page, and `BlogPosting` markup on posts.
- **Accessibility**: skip link, visible focus rings, labelled form fields with inline errors, alt text, keyboard-friendly blog filters, and respect for "reduce motion".
- **Performance**: no frameworks, one small CSS file and one small JS file, lazy-loaded images and map, and fonts loaded per language only.
- **Floating WhatsApp button** on every page.

## Project structure

```
config.json            Site settings (store URL, contacts, map, socials)
build.js               Builds everything into dist/
serve.js               Local preview server
src/i18n/en.json       English text
src/i18n/ar.json       Arabic text
src/posts/en/*.md      English blog posts
src/posts/ar/*.md      Arabic blog posts
src/assets/css/        Stylesheet
src/assets/js/         Menu, language memory, blog filters, contact form
src/admin/             Optional Decap CMS
dist/                  Generated website (upload this)
```
