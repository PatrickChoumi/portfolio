// Le gabarit.
//
// Une fonction, une chaîne : `page(lang)` rend le document complet. Pas de
// moteur de template, pas de composants — le HTML est assez court pour être
// lu d'un bout à l'autre, et c'est précisément l'intérêt.
//
// Tout ce qui vient de content.js passe par `esc()`. Le contenu est le nôtre,
// mais l'échappement systématique est une habitude qui ne coûte rien et qui
// évite d'avoir à se demander, dans six mois, si telle chaîne est sûre.

import { site, lede, intro, work, path as career, tools, contact, colophon, ui } from '../content.js';

const t = (value, lang) => {
  if (value == null) return '';
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  return value[lang] ?? value.fr ?? value.en ?? '';
};

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Une rangée dépliable : la même forme pour un projet et pour un poste.
// Le <details> natif porte l'état, l'accessibilité et le clavier — il n'y a
// rien à réimplémenter.
function row({ id, colLeft, title, aside, line, paragraphs, foot }) {
  return `
      <details class="row" id="${esc(id)}">
        <summary>
          <span class="row-year">${esc(colLeft)}</span>
          <span class="row-name">${esc(title)}${aside ? ` <span class="row-place">${esc(aside)}</span>` : ''}</span>
          <span class="row-sign" aria-hidden="true"></span>
          <span class="row-line">${esc(line)}</span>
        </summary>
        <div class="row-detail">
          ${paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
          ${foot ? `<p class="row-foot">${foot}</p>` : ''}
        </div>
      </details>`;
}

export function page(lang) {
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const otherHref = lang === 'fr' ? '/en/' : '/';
  const label = (key) => esc(t(ui[key], lang));

  const workRows = work.map((p) => row({
    id: p.id,
    colLeft: p.year,
    title: p.name,
    line: t(p.line, lang),
    paragraphs: t(p.detail, lang),
    foot: [
      esc(p.stack.join(', ')),
      p.url ? `<a href="${esc(p.url)}" rel="noopener">${label('visit')}</a>` : ''
    ].filter(Boolean).join(' — ')
  })).join('\n');

  const careerRows = career.map((job) => row({
    id: job.id,
    colLeft: job.years,
    title: t(job.role, lang),
    aside: t(job.place, lang),
    line: t(job.line, lang),
    paragraphs: t(job.detail, lang)
  })).join('\n');

  const toolRows = t(tools, lang).map((group) => `
        <li>
          <span class="tools-label">${esc(group.label)}</span>
          <span class="tools-items">${esc(group.items.join(', '))}</span>
        </li>`).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.name)} — ${esc(t(site.role, lang))}</title>
<meta name="description" content="${esc(t(ui.metaDescription, lang))}">
<meta name="color-scheme" content="light dark">
<link rel="alternate" hreflang="${otherLang}" href="${otherHref}">
<link rel="canonical" href="${lang === 'fr' ? '/' : '/en/'}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(site.name)} — ${esc(t(site.role, lang))}">
<meta property="og:description" content="${esc(t(ui.metaDescription, lang))}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23fbfaf7'/><text x='50' y='72' font-family='Georgia,serif' font-size='64' fill='%231a1a18' text-anchor='middle'>P</text></svg>">
<link rel="preload" href="/fonts/newsreader-400.woff2" as="font" type="font/woff2" crossorigin>
<style>__CSS__</style>
</head>
<body>
<a class="skip" href="#main">${label('skip')}</a>

<div class="page">
  <header class="head">
    <a class="lang" href="${otherHref}" hreflang="${otherLang}">${label('otherLang')}</a>
    <h1 class="name">${esc(site.name)}</h1>
    <p class="head-meta">${esc(t(site.role, lang))} — ${esc(t(site.location, lang))}</p>
    <p class="head-status">${esc(t(site.availability, lang))}</p>
  </header>

  <main id="main">
    <p class="lede">${esc(t(lede, lang))}</p>

    <section class="section prose">
      ${t(intro, lang).map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </section>

    <section class="section" aria-labelledby="t-work">
      <h2 class="section-title" id="t-work">${label('work')}</h2>
      <div class="rows">
${workRows}
      </div>
    </section>

    <section class="section" aria-labelledby="t-path">
      <h2 class="section-title" id="t-path">${label('path')}</h2>
      <div class="rows">
${careerRows}
      </div>
    </section>

    <section class="section" aria-labelledby="t-tools">
      <h2 class="section-title" id="t-tools">${label('tools')}</h2>
      <ul class="tools">${toolRows}
      </ul>
    </section>

    <section class="section" aria-labelledby="t-contact">
      <h2 class="section-title" id="t-contact">${label('contact')}</h2>
      <p class="prose">${esc(t(contact, lang))}</p>
      <a class="contact-mail" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      <p class="contact-links">
        ${site.links.map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join('\n        ')}
      </p>
    </section>
  </main>

  <footer class="section" aria-labelledby="t-colophon">
    <h2 class="section-title" id="t-colophon">${label('colophon')}</h2>
    <p class="colophon">${esc(t(colophon, lang))}</p>
  </footer>
</div>
</body>
</html>
`;
}
