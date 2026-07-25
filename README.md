# patrickchoumi/portfolio

Une page qui se lit simplement — et qui s'explore aussi au terminal, pour qui
en a envie.

![Accueil](docs/captures/accueil-clair.png)

---

## L'idée

Le contenu du site vit dans un seul fichier de données, et se rend de deux
façons : une page éditoriale, et un système de fichiers explorable à la
commande. `cd projects` déplace la page ; cliquer sur un projet déplace le
shell.

**Le terminal est un bonus, jamais un péage.** Tout le contenu se lit sans
jamais l'ouvrir : pas de séquence de démarrage, pas de modale, pas d'étape
obligée. Il s'annonce en une ligne sous l'accroche, un bouton dans le
sommaire, et le rappel discret de la barre de statut.

Un portfolio classique décrit la façon de travailler de son auteur. Celui-ci
la met en pratique sous les yeux du visiteur :

| Ce qui est affirmé | Ce qui le prouve, dans le site même |
| --- | --- |
| « Peu de dépendances » | zéro dépendance à l'exécution ; 31 Ko gzip de code (HTML + CSS + JS), plus 160 Ko de polices auto-hébergées |
| « Rien n'est envoyé nulle part » | aucune requête vers un tiers — polices auto-hébergées, aucun traceur, aucun cookie ; un test échoue si un hôte externe est contacté |
| « Les garanties se prouvent » | 48 tests unitaires + 24 vérifications navigateur, en CI |
| « La clarté est une fonctionnalité » | un seul fichier de données, dont la page, le terminal, la palette et le CV imprimé dérivent |

## Le portrait, deux fois

C'est le principe du site appliqué au visage : **une seule image, deux rendus.**

Dans le sommaire, la photo de profil est affichée en duotone — désaturée puis
teintée à l'accent, inversée en thème sombre. Dans le terminal, `portrait`
convertit **le même fichier** en tableau de caractères, à la volée :

![Le portrait dans neofetch](docs/captures/portrait-neofetch.png)

`neofetch` s'en sert comme un vrai neofetch se sert du logo de sa
distribution — le dessin à gauche, la fiche à droite. Et cliquer sur la photo
dans le sommaire ouvre le terminal dessus.

La conversion (`src/js/ascii.js`) se fait dans le navigateur, au moment où on
la demande : aucune étape de build, aucun décodeur d'image à écrire, aucune
dépendance. N'importe quel format que le navigateur sait lire fonctionne
(png, jpg, webp, avif), la largeur suit celle du terminal, et le résultat est
mis en cache.

Un détail qui a demandé un essai raté : **les caractères jouent l'encre, pas
la lumière.** Inverser la rampe selon le thème paraissait logique — sur fond
sombre, les pixels clairs denses. Sur un dessin au trait, dont le fond est
blanc, cela remplit tout le cadre de `@` et le visage disparaît. Un trait
reste un trait, quel que soit le fond : les pixels sombres sont denses, dans
les deux thèmes.

### Mettre ta photo

Dépose ton image dans **`public/avatar.png`**. C'est tout — rien à compiler,
rien à configurer. Le chemin est déclaré une fois dans `src/data/profile.js`
(`identity.avatar`) si tu veux un autre nom ou un autre format.

Sans fichier, tout se dégrade proprement : le sommaire garde le monogramme
`~/`, `neofetch` sa vignette, et `portrait` explique quoi faire.

## Le parti pris visuel

Filiation avec le système « Terminal » du projet *Theory* : monospace pour
l'ossature, filets fins, un seul accent, palette d'éditeur claire et sombre.
Trois règles tiennent l'ensemble.

**1. Deux voix, toutes deux techniques.** JetBrains Mono porte l'ossature —
titres, sommaire, chiffres, terminal, barre de statut. Inter porte la prose.
Un serif éditorial a été essayé ici et retiré : il donnait au site l'air d'une
revue, alors que le sujet est un poste de travail.

**2. Aucune boîte.** Ni carte, ni ombre, ni coin arrondi, ni badge, ni
pastille. La seule ligne autorisée est un filet d'un pixel entre deux rangées.
La structure vient du blanc et de l'alignement.

**3. Un seul accent, rare.** Un bleu — celui des dossiers dans un `ls`. Il
marque la page courante, le curseur, l'invite du shell et le mot souligné du
titre. Nulle part ailleurs.

L'interface, elle, assume d'être un outil : barre de statut en bas (mode,
chemin courant, raccourcis), papier millimétré au fond, noms de fichiers dans
le sommaire. La justification est plafonnée à 34 rem, soit environ 70
caractères : au-delà, l'œil perd la ligne en revenant à la marge.

Ce qui a été retiré en cours de route, et pourquoi :

| Retiré | Pourquoi |
| --- | --- |
| La séquence de démarrage | Un faux log de boot annonce « ce site est pour les initiés » avant même la première phrase. |
| La gouttière de numéros de ligne | Du bruit sur chaque écran pour une métaphore que le sommaire porte déjà. |
| Les onglets de buffer | Ils répétaient le sommaire, en travers de la lecture. |
| Les jauges de compétence | « Quatre sur cinq » ne veut rien dire pour celui qui lit, et beaucoup trop pour celui qui écrit. Une phrase honnête à la place. |
| Les cartes, chips et pastilles | Des rangées séparées d'un filet disent la même chose sans encadrer. |

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | sert le build, avec repli SPA |
| `npm test` | tests unitaires (logique pure, sans navigateur) |
| `npm run test:e2e` | build + harnais navigateur (Chromium) |
| `npm run check` | tout : tests, build, harnais |
| `npm run fonts` | re-télécharge et auto-héberge les polices |

## Personnaliser : un seul fichier

Tout le contenu vit dans **`src/data/profile.js`**. Il n'y a pas de texte en
dur dans le HTML, pas de « version texte » à tenir à jour en parallèle.
Modifier ce fichier met à jour, d'un coup :

- la page (accueil, à propos, parcours, projets, stack, contact) ;
- l'arborescence du terminal et le contenu de chaque fichier virtuel ;
- l'index de la palette de commandes ;
- le CV que produit `cv`, et la version imprimée du site.

Chaque champ traduisible est un objet `{ fr, en }`. Une chaîne nue est utilisée
telle quelle dans les deux langues — pratique pour les noms propres.

```js
export const projects = [
  {
    slug: 'atlas',                    // → /projets/atlas et projects/atlas/
    name: 'Atlas',
    year: '2024',
    status: 'wip',                    // live | wip | archived
    tagline: { fr: '…', en: '…' },    // une ligne, 90 caractères maximum
    summary: { fr: '…', en: '…' },
    highlights: { fr: ['…'], en: ['…'] },
    metrics: [{ label: { fr: 'commits/s', en: 'commits/s' }, value: '~9k' }],
    stack: ['Node', 'Git'],
    links: [{ label: { fr: 'Code', en: 'Source' }, url: 'https://…' }]
  }
];
```

L'audit de contenu (`npm test`) refuse les dérives courantes : slug dupliqué,
traduction manquante, nombre de faits marquants différent entre les langues,
parcours qui n'est plus antéchronologique, accroche trop longue pour sa
rangée, lien relatif là où il faut une URL absolue, ou nom de techno accentué
laissé en français dans la version anglaise.

> ⚠️ Les données livrées sont un **canevas crédible**, pas une biographie :
> remplace-les par ton parcours réel avant de publier.

## Le terminal

![Terminal](docs/captures/terminal.png)

Ouvrir : <kbd>`</kbd> ou <kbd>²</kbd> (même touche physique en AZERTY), la
phrase sous l'accroche, ou le bouton `>_` du sommaire.

```
/
├── about.md          principles.md    resume.md    contact.md
├── experience/       README.md (git log) + un .md par poste
├── projects/         un dossier par projet : README.md, stack.txt, links.txt
└── stack/            un .txt par groupe
```

Vingt-deux commandes : `ls` (`-a`, `-l`), `cd`, `pwd`, `cat`, `tree`, `find`,
`grep`, `open`, `whoami`, `neofetch`, `portrait`, `cv`, `print`, `mail`,
`theme`, `lang`, `history`, `clear`, `date`, `echo`, `uname`, `exit` — plus
quelques-unes qui ne sont pas dans `help`.

- <kbd>Tab</kbd> complète les commandes et les chemins (préfixe commun le plus long) ;
- <kbd>↑</kbd> <kbd>↓</kbd> parcourent un historique persistant ;
- <kbd>Ctrl</kbd>+<kbd>L</kbd> efface, <kbd>Ctrl</kbd>+<kbd>C</kbd> annule, <kbd>Échap</kbd> ferme ;
- un pipe est accepté, vers `grep` uniquement : `cat about.md | grep clarté` ;
- une commande mal tapée propose la plus proche (distance de Levenshtein).

## Raccourcis clavier

| Touche | Effet |
| --- | --- |
| <kbd>`</kbd> / <kbd>²</kbd> | ouvre ou ferme le terminal |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> | palette : sections, fichiers, commandes, liens |
| <kbd>?</kbd> | ouvre le terminal sur `help` |
| <kbd>Échap</kbd> | ferme ce qui est ouvert |

## Architecture

```
index.html              charpente : des conteneurs, aucun contenu
src/data/profile.js     ← la source unique de vérité
src/data/fs.js          projette profile.js en arborescence explorable
src/data/lang.js        sélection de langue (pur, testable)
src/js/main.js          orchestration — une route, deux vues
src/js/render.js        rendu de la page depuis les données
src/js/shell.js         moteur du terminal (historique, complétion, pipe)
src/js/commands.js      registre des commandes (pur, testable)
src/js/palette.js       palette Ctrl+K
src/js/router.js        routes réelles (History API), analyse pure
src/js/i18n.js          FR/EN, sans rechargement
src/js/repl.js          la question qui s'écrit, sur l'accueil
src/js/ascii.js         l'image convertie en caractères, dans le navigateur
src/js/effects.js       révélation au défilement + easter egg
src/styles/main.css     design system
scripts/fetch-fonts.mjs auto-hébergement des polices
tests/                  48 tests node:test — logique pure
tests-e2e/browser.mjs   24 vérifications navigateur
tests-e2e/make-png.mjs  encodeur PNG minimal (mire du harnais, sans dépendance)
```

Le principe structurant : **`navigate()` est le seul point de passage**. Clic
dans le sommaire, entrée de la palette, commande `cd`, bouton Précédent du
navigateur, lien profond — tout converge au même endroit, qui met à jour la
section, l'URL, le sommaire et le répertoire courant du shell.

## Accessibilité

Lien d'évitement, navigation entièrement au clavier, `:focus-visible` visible
partout, contrastes vérifiés dans les deux thèmes, sortie du terminal en
`role="log"` / `aria-live="polite"`, boutons à glyphe étiquetés en `aria-label`
suivant la langue, animations coupées en `prefers-reduced-motion`.

Un test du harnais vérifie qu'aucun chrome retiré (onglets, gouttière,
séquence de démarrage) n'est revenu, et que le terminal est bien fermé au
chargement. Le portrait en caractères est vérifié de bout en bout : le harnais
génère une mire PNG (`tests-e2e/make-png.mjs`, trente lignes de zlib, sans
dépendance) et contrôle la largeur, la hauteur et la variété des niveaux du
dessin obtenu.

## Déploiement

Le build produit un `dist/` entièrement statique. Le site utilise des routes
réelles : configure le repli SPA vers `index.html`.

| Hébergeur | À faire |
| --- | --- |
| Netlify | `/* /index.html 200` dans `_redirects` |
| Vercel | rewrite `/(.*)` → `/index.html` |
| Cloudflare Pages | automatique |
| nginx | `try_files $uri $uri/ /index.html;` |
| GitHub Pages | copier `index.html` en `404.html` |

## Licence

Le code est réutilisable. Le contenu (parcours, projets, textes) appartient à
son auteur — remplace-le par le tien. Les polices sont sous SIL Open Font
License 1.1 (voir `public/fonts/LICENSE.txt`).
