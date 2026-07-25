// ═══════════════════════════════════════════════════════════════════════
//  LE JEU DE COMMANDES
//
//  Chaque commande est une fonction pure-ish : elle reçoit (args, ctx) et
//  renvoie un tableau de lignes à afficher. `ctx` expose le système de
//  fichiers, le répertoire courant, et les actions qui touchent au reste de
//  la page (naviguer, changer de thème, vider l'écran).
//
//  Découper ainsi permet de tester le parseur et la résolution de chemins
//  sans navigateur (tests/shell.test.mjs) : seules les commandes qui
//  déclarent `effect` touchent au DOM.
// ═══════════════════════════════════════════════════════════════════════

import { resolvePath, lookup, formatPath, walk } from '../data/fs.js';
import { identity, host, projects, experience, stack } from '../data/profile.js';

// ─── Analyse de la ligne de commande ──────────────────────────────────
// Gère les guillemets (« grep "deux mots" ») et le pipe unique vers grep,
// qui est le seul enchaînement utile ici — inutile d'écrire un shell POSIX.
export function tokenize(line) {
  const tokens = [];
  let cur = '';
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur) { tokens.push(cur); cur = ''; }
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

export function parseLine(line) {
  const [left, ...rest] = line.split('|');
  const pipe = rest.length ? tokenize(rest.join('|').trim()) : null;
  const tokens = tokenize(left.trim());
  return { name: tokens[0] || '', args: tokens.slice(1), pipe };
}

// ─── Lignes de sortie ─────────────────────────────────────────────────
// Une « ligne » est { text, cls } ou { html } pour le rare cas où l'on veut
// colorer finement (ls, tree, neofetch).
const line = (text = '', cls = '') => ({ text, cls });
const err = (text) => ({ text, cls: 'is-err' });
const dim = (text) => ({ text, cls: 'is-dim' });
const html = (h, cls = '') => ({ html: h, cls });

// Colorisation légère d'un fichier « markdown » du VFS.
export function colorize(content) {
  return content.split('\n').map((l) => {
    if (l.startsWith('# ')) return html(`<span class="h1">${escapeHtml(l.slice(2))}</span>`);
    if (l.startsWith('## ')) return html(`<span class="h1">${escapeHtml(l.slice(3))}</span>`);
    if (/^\s*[·•-]\s/.test(l)) return html(escapeHtml(l).replace(/^(\s*)([·•-])/, '$1<span class="p">$2</span>'));
    if (/^\s*\d+\.\s/.test(l)) return html(escapeHtml(l).replace(/^(\s*)(\d+\.)/, '$1<span class="num">$2</span>'));
    if (l.startsWith('$ ')) return html(`<span class="p">$</span> <span class="kw">${escapeHtml(l.slice(2))}</span>`);
    if (/^\*\s/.test(l)) return html(`<span class="p">*</span>${escapeHtml(l.slice(1))}`);
    if (/https?:\/\//.test(l)) {
      return html(escapeHtml(l).replace(/(https?:\/\/[^\s]+)/g, '<a class="lnk" href="$1" target="_blank" rel="noopener">$1</a>'));
    }
    return line(l);
  });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Vignette de secours : utilisée par `neofetch` tant qu'aucune photo n'est
// déposée dans public/avatar.png.
const FALLBACK_ART = [
  '   ▄▄▄▄▄▄▄▄▄▄▄   ',
  '  █ ▄▄▄▄▄▄▄▄▄ █  ',
  '  █ █  ~/   █ █  ',
  '  █ █  ▸_   █ █  ',
  '  █ █▄▄▄▄▄▄▄█ █  ',
  '  █▄▄▄▄▄▄▄▄▄▄▄█  ',
  '   ▀▀▀▀▀▀▀▀▀▀▀   '
];

// ─── Le registre ──────────────────────────────────────────────────────
// `usage` alimente `help` ; `complete` alimente la touche Tab.
export const COMMANDS = {
  help: {
    usage: { fr: 'liste les commandes', en: 'list the commands' },
    run: (args, ctx) => {
      const names = Object.keys(COMMANDS).filter((n) => !COMMANDS[n].hidden).sort();
      const width = Math.max(...names.map((n) => n.length));
      return [
        html(`<span class="h1">${ctx.lang === 'en' ? 'Commands' : 'Commandes'}</span>`),
        line(''),
        ...names.map((n) => html(
          `  <span class="dir">${n.padEnd(width)}</span>  <span class="file">${escapeHtml(ctx.tx(COMMANDS[n].usage))}</span>`
        )),
        line(''),
        dim(ctx.lang === 'en'
          ? 'Tab completes paths · ↑↓ walks history · Ctrl+L clears · Esc closes'
          : 'Tab complète les chemins · ↑↓ parcourt l’historique · Ctrl+L efface · Échap ferme')
      ];
    }
  },

  ls: {
    usage: { fr: 'liste le contenu d’un dossier', en: 'list a directory' },
    complete: 'path',
    run: (args, ctx) => {
      const showAll = args.includes('-a') || args.includes('-la');
      const long = args.includes('-l') || args.includes('-la');
      const target = args.find((a) => !a.startsWith('-'));
      const segs = target ? resolvePath(ctx.cwd, target) : ctx.cwd;
      const node = lookup(ctx.root, segs);
      if (!node) return [err(`ls: ${target}: ${ctx.t('shell.nosuchfile')}`)];
      if (node.type === 'file') return [html(renderEntry(node, long))];
      const children = node.children.filter((c) => showAll || !c.name.startsWith('.'));
      if (!children.length) return [dim('(vide)')];
      return children.map((c) => html(renderEntry(c, long)));
    }
  },

  cd: {
    usage: { fr: 'change de dossier', en: 'change directory' },
    complete: 'dir',
    run: (args, ctx) => {
      if (!args[0] || args[0] === '~') { ctx.setCwd([]); return []; }
      const segs = resolvePath(ctx.cwd, args[0]);
      const node = lookup(ctx.root, segs);
      if (!node) return [err(`cd: ${args[0]}: ${ctx.t('shell.nosuchfile')}`)];
      if (node.type !== 'dir') return [err(`cd: ${args[0]}: ${ctx.t('shell.notadir')}`)];
      ctx.setCwd(segs);
      // Le shell pilote la page : entrer dans un dossier qui a une route
      // fait suivre la vue lisible. C'est tout l'intérêt des deux vues.
      if (node.route) ctx.navigate(node.route, { silent: true });
      return [];
    }
  },

  pwd: {
    usage: { fr: 'affiche le chemin courant', en: 'print working directory' },
    run: (args, ctx) => [line(formatPath(ctx.cwd))]
  },

  cat: {
    usage: { fr: 'affiche un fichier', en: 'print a file' },
    complete: 'file',
    run: (args, ctx) => {
      if (!args[0]) return [err(`cat: ${ctx.t('shell.needarg')}`)];
      const node = lookup(ctx.root, resolvePath(ctx.cwd, args[0]));
      if (!node) return [err(`cat: ${args[0]}: ${ctx.t('shell.nosuchfile')}`)];
      if (node.type === 'dir') return [err(`cat: ${args[0]}: ${ctx.t('shell.notafile')}`)];
      return colorize(node.content);
    }
  },

  tree: {
    usage: { fr: 'affiche l’arborescence', en: 'print the tree' },
    complete: 'dir',
    run: (args, ctx) => {
      const segs = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
      const node = lookup(ctx.root, segs);
      if (!node || node.type !== 'dir') return [err(`tree: ${args[0] || '.'}: ${ctx.t('shell.nosuchfile')}`)];
      const out = [html(`<span class="dir">${escapeHtml(formatPath(segs))}</span>`)];
      const draw = (n, prefix) => {
        const kids = n.children.filter((c) => !c.name.startsWith('.'));
        kids.forEach((c, i) => {
          const last = i === kids.length - 1;
          const branch = last ? '└── ' : '├── ';
          const cls = c.type === 'dir' ? 'dir' : 'file';
          out.push(html(`<span class="is-dim">${prefix}${branch}</span><span class="${cls}">${escapeHtml(c.name)}${c.type === 'dir' ? '/' : ''}</span>`));
          if (c.type === 'dir') draw(c, prefix + (last ? '    ' : '│   '));
        });
      };
      draw(node, '');
      return out;
    }
  },

  find: {
    usage: { fr: 'cherche un fichier par son nom', en: 'find files by name' },
    run: (args, ctx) => {
      const needle = (args[0] || '').toLowerCase();
      const hits = walk(ctx.root)
        .filter(({ path }) => !needle || path.join('/').toLowerCase().includes(needle))
        .map(({ node, path }) => html(`<span class="${node.type === 'dir' ? 'dir' : 'file'}">${escapeHtml('/' + path.join('/'))}</span>`));
      return hits.length ? hits : [dim(ctx.t('shell.matchesNone'))];
    }
  },

  grep: {
    usage: { fr: 'cherche un motif dans le contenu', en: 'search content for a pattern' },
    run: (args, ctx) => {
      const needle = (args[0] || '').toLowerCase();
      if (!needle) return [err(`grep: ${ctx.t('shell.needarg')}`)];
      const out = [];
      for (const { node, path } of walk(ctx.root)) {
        if (node.type !== 'file' || !node.content) continue;
        node.content.split('\n').forEach((l, i) => {
          if (!l.toLowerCase().includes(needle)) return;
          const marked = escapeHtml(l).replace(new RegExp(escapeRe(escapeHtml(args[0])), 'ig'), (m) => `<mark>${m}</mark>`);
          out.push(html(`<span class="dir">/${escapeHtml(path.join('/'))}</span><span class="is-dim">:${i + 1}:</span> ${marked}`));
        });
      }
      return out.length ? out : [dim(ctx.t('shell.matchesNone'))];
    }
  },

  open: {
    usage: { fr: 'ouvre un chemin dans la page lisible', en: 'open a path in the readable page' },
    complete: 'path',
    run: (args, ctx) => {
      if (!args[0]) return [err(`open: ${ctx.t('shell.needarg')}`)];
      const segs = resolvePath(ctx.cwd, args[0]);
      const node = lookup(ctx.root, segs);
      if (!node) return [err(`open: ${args[0]}: ${ctx.t('shell.nosuchfile')}`)];
      if (!node.route) return [dim(ctx.t('shell.noroute'))];
      ctx.navigate(node.route);
      return [html(`<span class="is-ok">→</span> ${escapeHtml(formatPath(segs))} — ${escapeHtml(ctx.t('shell.opened'))}`)];
    }
  },

  whoami: {
    usage: { fr: 'qui parle', en: 'who is speaking' },
    run: (args, ctx) => [
      html(`<span class="h1">${escapeHtml(identity.name)}</span>`),
      line(ctx.tx(identity.role)),
      line(ctx.tx(identity.location)),
      line(''),
      html(`<a class="lnk" href="mailto:${identity.email}">${identity.email}</a>`)
    ]
  },

  neofetch: {
    usage: { fr: 'la fiche machine', en: 'the machine card' },
    // Un vrai neofetch affiche le logo de la distribution à gauche et les
    // informations à droite. Ici le « logo » est le portrait de l'auteur,
    // converti en caractères depuis le même fichier que celui du sommaire :
    // une seule source, deux rendus — le principe du site, appliqué au visage.
    run: async (args, ctx) => {
      // Le dessin prend la moitié gauche, la fiche tient dans le reste : on
      // laisse toujours de quoi écrire « Role: … » à droite.
      const art = (await ctx.ascii(Math.max(24, Math.min(52, ctx.columns() - 40)))) || FALLBACK_ART;
      const info = [
        [`${identity.handle}@${host}`, ''],
        ['─'.repeat(26), ''],
        [ctx.lang === 'en' ? 'Role' : 'Rôle', ctx.tx(identity.role)],
        [ctx.lang === 'en' ? 'Location' : 'Lieu', ctx.tx(identity.location)],
        [ctx.lang === 'en' ? 'Projects' : 'Projets', String(projects.length)],
        [ctx.lang === 'en' ? 'Roles' : 'Postes', String(experience.length)],
        [ctx.lang === 'en' ? 'Skill groups' : 'Groupes stack', String(stack.length)],
        [ctx.lang === 'en' ? 'Runtime deps' : 'Dépendances', '0'],
        [ctx.lang === 'en' ? 'Theme' : 'Thème', ctx.theme()],
        [ctx.lang === 'en' ? 'Uptime' : 'Depuis', ctx.uptime()]
      ];
      const width = Math.max(...art.map((l) => l.length));
      const rows = Math.max(art.length, info.length);
      const out = [];
      // Les informations sont centrées verticalement sur le portrait : collées
      // en haut, la fiche paraît bancale dès que le dessin est plus haut.
      const offset = Math.max(0, Math.floor((art.length - info.length) / 2));
      for (let i = 0; i < rows; i++) {
        const left = (art[i] || '').padEnd(width);
        const entry = info[i - offset];
        const right = entry
          ? (entry[1] ? `<b>${escapeHtml(entry[0])}</b>: ${escapeHtml(entry[1])}` : `<b>${escapeHtml(entry[0])}</b>`)
          : '';
        out.push(html(`<span class="art">${escapeHtml(left)}</span>  ${right}`));
      }
      return out;
    }
  },

  portrait: {
    usage: { fr: 'affiche la photo de profil en caractères', en: 'render the profile picture as characters' },
    run: async (args, ctx) => {
      // Sans argument, le portrait est cadré pour tenir dans la fenêtre du
      // terminal : on le voit en entier, sans faire défiler. Avec un argument
      // (`portrait 90`), on demande explicitement plus de détail, quitte à
      // devoir dérouler.
      const asked = Number(args[0]);
      const cols = Math.min(120, Math.max(20, asked || ctx.columns()));
      const art = await ctx.ascii(cols, asked ? {} : { maxRows: ctx.rows() - 2 });
      if (!art) {
        // Le chemin vient des données : le message ne peut pas mentir sur
        // l'endroit où déposer le fichier.
        const where = `public${identity.avatar || '/avatar.png'}`;
        return [
          dim(ctx.lang === 'en'
            ? `No picture yet. Drop one at ${where} and reload.`
            : `Pas encore de photo. Dépose-la dans ${where} et recharge.`)
        ];
      }
      const out = art.map((l) => html(`<span class="art">${escapeHtml(l)}</span>`));
      // Le cadrage automatique privilégie la vue d'ensemble ; on dit comment
      // en demander plus, sinon personne ne devine que l'argument existe.
      if (!asked) {
        out.push(dim(ctx.lang === 'en'
          ? '`portrait 90` for a larger, more detailed one.'
          : '`portrait 90` pour une version plus grande et plus détaillée.'));
      }
      return out;
    }
  },

  cv: {
    usage: { fr: 'affiche le CV (et propose l’impression)', en: 'print the résumé' },
    run: (args, ctx) => {
      const node = lookup(ctx.root, ['resume.md']);
      return [
        ...colorize(node.content),
        line(''),
        dim(ctx.lang === 'en' ? 'Tip: `print` opens the browser print dialog (PDF-ready).' : 'Astuce : `print` ouvre la boîte d’impression (prêt pour le PDF).')
      ];
    }
  },

  print: {
    usage: { fr: 'ouvre la boîte d’impression du CV', en: 'open the résumé print dialog' },
    run: (args, ctx) => { ctx.print(); return [dim(ctx.lang === 'en' ? 'Printing…' : 'Impression…')]; }
  },

  mail: {
    usage: { fr: 'écrit un message', en: 'write a message' },
    run: (args, ctx) => {
      ctx.openUrl(`mailto:${identity.email}`);
      return [html(`<span class="is-ok">→</span> <a class="lnk" href="mailto:${identity.email}">${identity.email}</a>`)];
    }
  },

  theme: {
    usage: { fr: 'bascule ou fixe le thème (dark|light)', en: 'toggle or set the theme (dark|light)' },
    run: (args, ctx) => [line(`${ctx.t('shell.themeNow')} ${ctx.setTheme(args[0])}`, 'is-ok')]
  },

  lang: {
    usage: { fr: 'bascule ou fixe la langue (fr|en)', en: 'toggle or set the language (fr|en)' },
    run: (args, ctx) => [line(`${ctx.t('shell.langNow')} ${ctx.setLang(args[0])}`, 'is-ok')]
  },

  history: {
    usage: { fr: 'rappelle les commandes tapées', en: 'recall typed commands' },
    run: (args, ctx) => {
      const h = ctx.history();
      if (!h.length) return [dim(ctx.t('shell.historyEmpty'))];
      return h.map((c, i) => html(`<span class="is-dim">${String(i + 1).padStart(3)}</span>  ${escapeHtml(c)}`));
    }
  },

  clear: {
    usage: { fr: 'efface l’écran', en: 'clear the screen' },
    run: (args, ctx) => { ctx.clear(); return []; }
  },

  date: {
    usage: { fr: 'la date, comme il se doit', en: 'the date, as one does' },
    run: (args, ctx) => [line(new Date().toString())]
  },

  echo: {
    usage: { fr: 'répète', en: 'repeat' },
    run: (args) => [line(args.join(' '))]
  },

  uname: {
    usage: { fr: 'informations « système »', en: '“system” information' },
    run: (args, ctx) => [line(args.includes('-a')
      ? `portfolio 1.0.0 vanilla-js x86_64 ${ctx.lang === 'en' ? 'no framework, no tracker, no cookie' : 'aucun framework, aucun traceur, aucun cookie'}`
      : 'portfolio')]
  },

  exit: {
    usage: { fr: 'referme le terminal', en: 'close the terminal' },
    run: (args, ctx) => { ctx.close(); return []; }
  },

  // ─── Easter eggs ────────────────────────────────────────────────────
  sudo: {
    hidden: true,
    usage: { fr: '…', en: '…' },
    run: (args, ctx) => {
      if (args.join(' ') === 'hire-me') {
        return [
          html('<span class="is-ok">[sudo] mot de passe : ••••••••</span>'),
          line(''),
          html(`<span class="h1">${ctx.lang === 'en' ? 'Access granted.' : 'Accès accordé.'}</span>`),
          line(ctx.lang === 'en'
            ? 'Fastest path: an email describing the problem, not the job title.'
            : 'Le plus court chemin : un email qui décrit le problème, pas l’intitulé du poste.'),
          html(`<a class="lnk" href="mailto:${identity.email}">${identity.email}</a>`)
        ];
      }
      return [err(ctx.lang === 'en'
        ? `${identity.handle} is not in the sudoers file. This incident will be reported.`
        : `${identity.handle} n’est pas dans le fichier sudoers. Cet incident sera signalé.`)];
    }
  },

  rm: {
    hidden: true,
    usage: { fr: '…', en: '…' },
    run: (args, ctx) => [
      err(ctx.lang === 'en'
        ? 'rm: refusing to remove a career built over ten years.'
        : 'rm : refus de supprimer une carrière construite en dix ans.'),
      dim(ctx.lang === 'en' ? '(nice try, though)' : '(bien tenté, cela dit)')
    ]
  },

  vim: {
    hidden: true,
    usage: { fr: '…', en: '…' },
    run: (args, ctx) => [
      line(ctx.lang === 'en' ? 'Vim opened. Good luck.' : 'Vim est ouvert. Bonne chance.'),
      dim(':q! — ' + (ctx.lang === 'en' ? 'you are free' : 'te voilà libre'))
    ]
  },

  matrix: {
    hidden: true,
    usage: { fr: '…', en: '…' },
    run: (args, ctx) => { ctx.matrix(); return [dim(ctx.lang === 'en' ? 'Follow the white rabbit.' : 'Suis le lapin blanc.')]; }
  },

  coffee: {
    hidden: true,
    usage: { fr: '…', en: '…' },
    run: (args, ctx) => [
      html('<span class="p">     ( (</span>'),
      html('<span class="p">      ) )</span>'),
      html('<span class="p">   ........</span>'),
      html('<span class="p">   |      |]</span>'),
      html('<span class="p">   \\      /</span>'),
      html('<span class="p">    `----\'</span>'),
      line(''),
      line(ctx.lang === 'en' ? 'Always.' : 'Toujours.')
    ]
  }
};

function renderEntry(node, long) {
  const isDir = node.type === 'dir';
  const name = escapeHtml(node.name) + (isDir ? '/' : '');
  const cls = isDir ? 'dir' : 'file';
  if (!long) return `<span class="${cls}">${name}</span>`;
  const size = isDir ? `${node.children.length} ${node.children.length > 1 ? 'entrées' : 'entrée'}` : `${(node.content || '').length} o`;
  return `<span class="is-dim">${isDir ? 'd' : '-'}rw-r--r--</span>  <span class="is-dim">${String(size).padStart(12)}</span>  <span class="${cls}">${name}</span>`;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Distance de Levenshtein bornée — sert au « peut-être : » quand une
// commande est mal tapée. Une suggestion vaut mieux qu'un mur.
export function nearestCommand(name) {
  const names = Object.keys(COMMANDS);
  let best = null, bestScore = 3;
  for (const candidate of names) {
    const d = distance(name, candidate);
    if (d < bestScore) { bestScore = d; best = candidate; }
  }
  return best;
}

function distance(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
