// ═══════════════════════════════════════════════════════════════════════
//  LE SEUL FICHIER À ÉDITER.
//
//  Tout le site en découle : la page lisible ET le shell interactif. Les
//  deux vues sont deux rendus des mêmes données — il n'y a pas de contenu
//  dupliqué dans le HTML, pas de « version texte » à tenir à jour.
//
//  Chaque champ traduisible est un objet { fr, en }. Le helper `tx()`
//  (src/js/i18n.js) choisit la langue à l'affichage. Si tu n'écris qu'une
//  chaîne simple au lieu d'un objet, elle est utilisée telle quelle dans
//  les deux langues — pratique pour les noms propres.
// ═══════════════════════════════════════════════════════════════════════

export const identity = {
  name: 'Patrick Choumi',
  // Nom complet — n'apparaît que sur le CV (`cv` au terminal, et l'impression
  // de la page), où l'état civil a sa place.
  fullName: 'Ismaël Patrick Choumi Nami',
  handle: 'patrickchoumi',
  role: {
    fr: 'Élève ingénieur — génie informatique',
    en: 'Engineering student — computer engineering'
  },
  location: { fr: 'Yaoundé, Cameroun', en: 'Yaoundé, Cameroon' },
  // 'open' | 'listening' | 'closed' — pilote la pastille de disponibilité.
  availability: 'listening',
  availabilityLabel: {
    open: { fr: 'Disponible pour une mission', en: 'Available for work' },
    listening: { fr: 'À l’écoute des bons projets', en: 'Open to the right projects' },
    closed: { fr: 'Indisponible actuellement', en: 'Not available right now' }
  },
  email: 'patrickchoumi@gmail.com',

  // L'avatar. Le MÊME fichier sert deux fois : affiché dans le sommaire et
  // sur la page « à propos », et converti en caractères par les commandes
  // `portrait` et `wallpaper` du terminal (src/js/ascii.js).
  //
  // L'extension doit correspondre au contenu réel du fichier : un JPEG nommé
  // .png fonctionne dans la plupart des navigateurs (ils reniflent le type),
  // mais pas partout, et jamais chez un hébergeur qui renvoie
  // `X-Content-Type-Options: nosniff`. Ici c'est un JPEG, donc `.jpg`.
  //
  // Absent → le sommaire garde le monogramme « ~/ » et `neofetch` sa vignette.
  avatar: '/avatar.jpg',
  avatarNote: {
    fr: 'Personnage de Blue Lock — ce n’est pas une photo de moi.',
    en: 'A Blue Lock character — not a photo of me.'
  },

  links: [
    { label: 'GitHub', url: 'https://github.com/PatrickChoumi', handle: '@PatrickChoumi' },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/isma%C3%ABl-patrick-choumi-nami-9819673b8/',
      handle: 'Ismaël Patrick Choumi Nami'
    },
    { label: 'Email', url: 'mailto:patrickchoumi@gmail.com', handle: 'patrickchoumi@gmail.com' }
  ]
};

export const hero = {
  kicker: {
    fr: 'portfolio · système de fichiers',
    en: 'portfolio · filesystem'
  },
  title: {
    fr: 'Je construis des choses<br />qui <span class="emphasis">tiennent</span>.',
    en: 'I build things<br />that <span class="emphasis">hold up</span>.'
  },
  lede: {
    fr: 'Élève ingénieur en génie informatique à Yaoundé. Je code depuis trois ans, par goût des <em>fondations</em> plus que des frameworks du mois : structures de données, accessibilité, performance réelle, code qu’on peut relire dans deux ans. Ce site en est un échantillon — une trentaine de kilo-octets de code, et aucune dépendance à l’exécution.',
    en: 'Computer engineering student in Yaoundé. I have been coding for three years, drawn to <em>foundations</em> rather than this month’s framework: data structures, accessibility, real-world performance, code you can still read two years later. This site is a sample — about thirty kilobytes of code, zero runtime dependencies.'
  },
  // Le REPL de l'accueil tape ces paires. Volontairement des convictions,
  // pas des slogans : c'est le seul endroit du site qui parle à la première
  // personne sans détour.
  repl: {
    fr: [
      { q: 'quelle est ta première question sur un projet ?', a: 'Qui va le maintenir dans deux ans, et avec quel budget d’attention ?' },
      { q: 'pourquoi si peu de dépendances ?', a: 'Chaque dépendance est une dette : une surface d’API, une faille potentielle, une migration à venir.' },
      { q: 'accessibilité : contrainte ou méthode ?', a: 'Méthode. Un site navigable au clavier est un site dont la structure est honnête.' },
      { q: 'et la performance ?', a: 'Ce n’est pas une optimisation finale. C’est une décision d’architecture prise le premier jour.' }
    ],
    en: [
      { q: 'first question you ask on a project?', a: 'Who maintains this in two years, and with how much attention to spare?' },
      { q: 'why so few dependencies?', a: 'Every dependency is debt: an API surface, a potential CVE, a migration waiting to happen.' },
      { q: 'accessibility: constraint or method?', a: 'Method. A site that works with a keyboard is a site with an honest structure.' },
      { q: 'and performance?', a: 'Not a final optimisation. An architecture decision made on day one.' }
    ]
  }
};

export const about = {
  title: { fr: 'À propos', en: 'About' },
  file: 'about.md',
  body: {
    fr: [
      'Je code depuis trois ans. J’ai commencé par le C et Linux, puis j’ai suivi la pente : Python, JavaScript, un peu de Java. Ce qui m’intéresse, c’est ce qui se passe sous l’abstraction — comprendre la couche du dessous change la façon dont on écrit celle du dessus.',
      'Mon travail tourne autour d’une idée simple : **la clarté est une fonctionnalité**. Un code lisible se corrige plus vite, une interface lisible se traverse sans notice, une donnée bien nommée survit à son auteur. Le reste — la vitesse, la robustesse, l’accessibilité — en découle souvent naturellement.',
      'En pratique, ça donne : peu de dépendances, des tests sur la logique qui compte, des URL réelles et partageables, un contraste vérifié, un fonctionnement au clavier. Rien de spectaculaire pris isolément. C’est l’accumulation qui fait la différence.',
      'En dehors du code : les échecs, la lecture — romans et mangas — et le sport.'
    ],
    en: [
      'I have been coding for three years. I started with C and Linux, then followed the slope: Python, JavaScript, a bit of Java. What interests me is what happens beneath the abstraction — understanding the layer below changes how you write the one above.',
      'My work revolves around one idea: **clarity is a feature**. Readable code is fixed faster, a readable interface needs no manual, well-named data outlives its author. The rest — speed, robustness, accessibility — usually follows.',
      'In practice: few dependencies, tests on the logic that matters, real shareable URLs, verified contrast, full keyboard operation. Nothing spectacular taken one at a time. The accumulation is what makes the difference.',
      'Away from the keyboard: chess, reading — novels and manga — and sport.'
    ]
  },
  // Repris aussi par le `neofetch` du shell et la fiche de l'accueil.
  facts: [
    { key: 'formation', label: { fr: 'Formation', en: 'Studies' }, value: { fr: 'ENSPY — génie informatique, jusqu’en 2029', en: 'ENSPY — computer engineering, until 2029' } },
    { key: 'terrain', label: { fr: 'Terrain', en: 'Ground' }, value: { fr: 'C · Python · JavaScript · Linux', en: 'C · Python · JavaScript · Linux' } },
    { key: 'langues', label: { fr: 'Langues', en: 'Languages' }, value: { fr: 'Français · Anglais', en: 'French · English' } },
    { key: 'loisirs', label: { fr: 'Loisirs', en: 'Off-hours' }, value: { fr: 'Échecs · romans et mangas · sport', en: 'Chess · novels and manga · sport' } }
  ]
};

// ─── Parcours ─────────────────────────────────────────────────────────
// Un parcours de formation, rendu comme un `git log --graph` : chaque étape
// est un commit. Le plus récent en premier.
export const experience = [
  {
    slug: 'enspy',
    company: { fr: 'École Nationale Supérieure Polytechnique de Yaoundé', en: 'National Advanced School of Engineering, Yaoundé' },
    role: { fr: 'Élève ingénieur — génie informatique', en: 'Engineering student — computer engineering' },
    start: '2024',
    end: null, // null = en cours
    place: { fr: 'Yaoundé, Cameroun', en: 'Yaoundé, Cameroon' },
    summary: {
      fr: 'Cycle d’ingénieur en génie informatique, jusqu’en 2029. Les deux premières années sont un cycle préparatoire — mathématiques et sciences physiques — et l’informatique se mène en parallèle.',
      en: 'Engineering degree in computer engineering, through 2029. The first two years are a preparatory cycle — mathematics and physical sciences — with computing carried on in parallel.'
    },
    highlights: {
      fr: [
        'Cycle préparatoire 2024–2026 : mathématiques et sciences physiques.',
        'Informatique menée en parallèle du programme : C, Python, JavaScript.',
        'HTML, CSS et LaTeX appris en autodidacte.'
      ],
      en: [
        'Preparatory cycle 2024–2026: mathematics and physical sciences.',
        'Computing carried alongside the curriculum: C, Python, JavaScript.',
        'HTML, CSS and LaTeX learned self-taught.'
      ]
    },
    stack: ['C', 'Python', 'JavaScript', 'HTML', 'CSS', 'LaTeX']
  },
  {
    slug: 'uy1',
    company: { fr: 'Université de Yaoundé I', en: 'University of Yaoundé I' },
    role: { fr: 'Filière informatique', en: 'Computer science' },
    start: '2023',
    end: '2024',
    place: { fr: 'Yaoundé, Cameroun', en: 'Yaoundé, Cameroon' },
    summary: {
      fr: 'Une année consacrée aux fondations : le C d’abord, puis Java, et Linux comme environnement de travail quotidien plutôt que comme sujet d’étude.',
      en: 'A year spent on foundations: C first, then Java, with Linux as a daily working environment rather than a subject.'
    },
    highlights: {
      fr: [
        'Maîtrise du C : pointeurs, mémoire, compilation séparée.',
        'Java : types, objets, bibliothèque standard.',
        'Linux au quotidien — shell, permissions, outillage.'
      ],
      en: [
        'C in depth: pointers, memory, separate compilation.',
        'Java: types, objects, standard library.',
        'Linux daily — shell, permissions, tooling.'
      ]
    },
    stack: ['C', 'Java', 'Linux']
  }
];

// ─── Projets ──────────────────────────────────────────────────────────
// `status` : 'live' | 'wip' | 'planned' | 'archived'.
// « planned » existe pour ne pas avoir à mentir : un projet qui n'a pas
// encore commencé n'est ni en ligne ni en cours. Les descriptions ci-dessous
// décrivent donc une intention, pas un résultat — c'est le statut qui le dit.
export const projects = [
  {
    slug: 'theory',
    name: 'Theory',
    year: '2026',
    status: 'wip',
    tagline: {
      fr: 'La théorie de la programmation, structurée pour durer.',
      en: 'Programming theory, structured to last.'
    },
    summary: {
      fr: 'Une application d’apprentissage qui enseigne les fondations de la programmation : le *pourquoi* avant le *comment*, validé par des quiz sans complaisance, ancré par la répétition espacée. Deux éditions ouvertes (Python, C), tout fonctionne hors-ligne, rien ne quitte le navigateur sauf si l’utilisateur active la synchronisation.',
      en: 'A learning application teaching the foundations of programming: the *why* before the *how*, validated by uncompromising quizzes, anchored by spaced repetition. Two editions live (Python, C), works fully offline, nothing leaves the browser unless the user opts into sync.'
    },
    highlights: {
      fr: [
        'Moteur de répétition espacée (SM-2 adapté) : la révision ramène ce qui a été raté, pas ce qui est acquis.',
        'Contenu pré-rendu à la compilation — chaque leçon est une page HTML statique, indexable, servie sans configuration serveur.',
        'Audit de contenu automatisé en CI : un quiz mal formé ou une leçon incohérente fait échouer le build.',
        'Chargement dynamique par module : le bundle initial ne contient que la structure, pas les leçons.'
      ],
      en: [
        'Spaced-repetition engine (adapted SM-2): review brings back what was missed, not what is mastered.',
        'Content pre-rendered at build time — every lesson is a static, indexable HTML page, served with zero server config.',
        'Automated content audit in CI: a malformed quiz or an inconsistent lesson fails the build.',
        'Per-module dynamic loading: the initial bundle carries structure only, not lessons.'
      ]
    },
    metrics: [
      { label: { fr: 'modules', en: 'modules' }, value: '26' },
      { label: { fr: 'tests', en: 'tests' }, value: '63' },
      { label: { fr: 'dépendances runtime', en: 'runtime deps' }, value: '0' }
    ],
    stack: ['JavaScript', 'Vite', 'Node', 'PostgreSQL', 'PWA'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/theory' }
    ]
  },
  {
    slug: 'portfolio',
    // Un nom de projet est une chaîne nue : il s'affiche tel quel dans les
    // deux langues. « Ce portfolio » laissait donc du français sur la page
    // anglaise.
    name: 'Portfolio',
    year: '2026',
    status: 'wip',
    tagline: {
      fr: 'Un portfolio qui est aussi un système de fichiers.',
      en: 'A portfolio that is also a filesystem.'
    },
    summary: {
      fr: 'Le site que tu lis. Deux vues sur les mêmes données : une page éditoriale, et un shell interactif (touche `` ` ``) où le contenu devient une arborescence explorable — `ls`, `cd`, `cat`, `tree`, `grep`, `open`. Les deux vues restent synchronisées : naviguer change le répertoire courant, et `open` fait défiler la page.',
      en: 'The site you are reading. Two views over the same data: an editorial page, and an interactive shell (`` ` `` key) where the content becomes a browsable tree — `ls`, `cd`, `cat`, `tree`, `grep`, `open`. Both views stay in sync: navigating changes the working directory, and `open` scrolls the page.'
    },
    highlights: {
      fr: [
        'Système de fichiers virtuel dérivé d’un seul fichier de données — aucun contenu dupliqué entre la page et le terminal.',
        'Shell complet : historique persistant, complétion par Tab, résolution de chemins relatifs, pipes vers `grep`.',
        'Routes réelles (History API) : chaque section et chaque projet a son URL partageable.',
        'Aucune dépendance à l’exécution, thème clair/nuit, bilingue, navigable entièrement au clavier.'
      ],
      en: [
        'Virtual filesystem derived from a single data file — no content duplicated between page and terminal.',
        'Full shell: persistent history, Tab completion, relative path resolution, piping into `grep`.',
        'Real routes (History API): every section and project has a shareable URL.',
        'Zero runtime dependencies, light/dark theme, bilingual, fully keyboard operable.'
      ]
    },
    metrics: [
      { label: { fr: 'dépendances runtime', en: 'runtime deps' }, value: '0' },
      { label: { fr: 'commandes shell', en: 'shell commands' }, value: '20+' },
      { label: { fr: 'sources de vérité', en: 'sources of truth' }, value: '1' }
    ],
    stack: ['JavaScript', 'Vite', 'CSS'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/portfolio' }
    ]
  },
  {
    slug: 'atlas',
    name: 'Atlas',
    year: '2026',
    status: 'planned',
    tagline: {
      fr: 'Cartographier la dette technique d’un dépôt, sans jugement.',
      en: 'Mapping a repository’s technical debt, without judgement.'
    },
    summary: {
      fr: 'Un outil en ligne de commande qui lit l’historique Git d’un dépôt et croise trois signaux — fréquence de modification, taille des fichiers, densité de correctifs — pour faire apparaître les zones où le coût de changement est le plus élevé. L’idée n’est pas de noter le code, mais de rendre visible où l’attention manque.',
      en: 'A command-line tool that reads a repository’s Git history and crosses three signals — change frequency, file size, bugfix density — to surface the areas where the cost of change is highest. The point is not to grade code, but to make visible where attention is missing.'
    },
    highlights: {
      fr: [
        'Analyse incrémentale : un dépôt de 40 000 commits est traité en quelques secondes après le premier passage.',
        'Sortie en texte, JSON ou carte de chaleur SVG — utilisable en CI comme en réunion.',
        'Zéro configuration : les seuils sont dérivés de la distribution du dépôt lui-même.'
      ],
      en: [
        'Incremental analysis: a 40,000-commit repository is processed in seconds after the first pass.',
        'Text, JSON or SVG heatmap output — usable in CI as well as in a meeting.',
        'Zero configuration: thresholds are derived from the repository’s own distribution.'
      ]
    },
    metrics: [
      { label: { fr: 'commits/s', en: 'commits/s' }, value: '~9k' },
      { label: { fr: 'formats de sortie', en: 'output formats' }, value: '3' }
    ],
    stack: ['Node', 'Git', 'SVG'],
    links: []
  },
  {
    slug: 'ttyf',
    name: 'ttyf',
    year: '2026',
    status: 'planned',
    tagline: {
      fr: 'Un formateur de tableaux pour terminaux, en 200 lignes.',
      en: 'A table formatter for terminals, in 200 lines.'
    },
    summary: {
      fr: 'Une petite bibliothèque qui aligne des colonnes dans un terminal en tenant compte de ce que les autres oublient : les caractères larges (CJK), les emoji, les séquences ANSI de couleur, et les largeurs de terminal qui changent en cours de route.',
      en: 'A small library that aligns terminal columns while handling what others forget: wide characters (CJK), emoji, ANSI colour sequences, and terminal widths that change mid-run.'
    },
    highlights: {
      fr: [
        'Calcul de largeur conforme à Unicode UAX #11, testé sur un corpus de 500 cas limites.',
        'Aucune dépendance, aucune allocation superflue : conçu pour tourner dans une boucle.',
        'API en une fonction — le genre d’outil qu’on n’a pas à réapprendre.'
      ],
      en: [
        'Unicode UAX #11 compliant width calculation, tested against a 500-case edge corpus.',
        'No dependencies, no superfluous allocation: designed to run inside a loop.',
        'One-function API — the kind of tool you never have to relearn.'
      ]
    },
    metrics: [
      { label: { fr: 'lignes', en: 'lines' }, value: '~200' },
      { label: { fr: 'cas testés', en: 'tested cases' }, value: '500' }
    ],
    stack: ['JavaScript', 'Unicode'],
    links: []
  }
];

// ─── Stack ────────────────────────────────────────────────────────────
// Pas de niveau chiffré : chaque entrée porte à la place une phrase qui dit
// ce qu'on en sait vraiment — plus honnête, et plus utile.
export const stack = [
  {
    group: { fr: 'Langages', en: 'Languages' },
    items: [
      { name: 'C', note: { fr: 'Le premier, et celui qui explique les autres.', en: 'The first one, and the one that explains the rest.' } },
      { name: 'Python', note: { fr: 'Scripts, prototypes, algorithmique.', en: 'Scripts, prototypes, algorithms.' } },
      { name: 'JavaScript', note: { fr: 'Le terrain principal aujourd’hui.', en: 'The main ground today.' } },
      { name: 'Java', note: { fr: 'Types, objets, bibliothèque standard.', en: 'Types, objects, standard library.' } }
    ]
  },
  {
    group: { fr: 'Interface', en: 'Interface' },
    items: [
      { name: { fr: 'HTML et CSS', en: 'HTML and CSS' }, note: { fr: 'Grid, cascade layers, color-mix — appris en autodidacte.', en: 'Grid, cascade layers, color-mix — self-taught.' } },
      { name: { fr: 'Accessibilité', en: 'Accessibility' }, note: { fr: 'Clavier, ARIA, contraste — vérifiés, pas supposés.', en: 'Keyboard, ARIA, contrast — verified, not assumed.' } },
      { name: 'LaTeX', note: { fr: 'Comptes rendus et documents de cours.', en: 'Lab reports and course documents.' } }
    ]
  },
  {
    group: { fr: 'Environnement', en: 'Environment' },
    items: [
      { name: 'Linux', note: { fr: 'Shell, permissions, outillage au quotidien.', en: 'Shell, permissions, daily tooling.' } },
      { name: 'Git', note: { fr: 'Branches, historique lisible, retours en arrière.', en: 'Branches, readable history, going back.' } },
      { name: { fr: 'Tests', en: 'Testing' }, note: { fr: 'Sur la logique qui casse, pas sur les getters.', en: 'On logic that breaks, not on getters.' } }
    ]
  }
];

// ─── Convictions ──────────────────────────────────────────────────────
// Trois principes, numérotés. C'est ce qui remplace le mur de logos.
export const principles = [
  {
    name: { fr: 'La clarté est une fonctionnalité', en: 'Clarity is a feature' },
    desc: {
      fr: 'Un nom juste vaut trois commentaires. Le code est lu bien plus souvent qu’il n’est écrit — l’optimiser pour la lecture est le meilleur rendement disponible.',
      en: 'A precise name beats three comments. Code is read far more often than written — optimising for reading is the best return available.'
    }
  },
  {
    name: { fr: 'Les garanties se prouvent', en: 'Guarantees get proven' },
    desc: {
      fr: 'Une promesse sans test est une intention. Ce qui compte vraiment doit échouer bruyamment en intégration continue, sinon la garantie s’érode en silence.',
      en: 'A promise without a test is an intention. What truly matters must fail loudly in CI, otherwise the guarantee erodes in silence.'
    }
  },
  {
    name: { fr: 'Le poids est un choix', en: 'Weight is a choice' },
    desc: {
      fr: 'Chaque kilo-octet et chaque dépendance sont des décisions, pas des accidents. La contrainte assumée dès le départ produit des interfaces plus rapides que l’optimisation tardive.',
      en: 'Every kilobyte and every dependency is a decision, not an accident. Constraint accepted up front beats late optimisation every time.'
    }
  }
];

export const contact = {
  title: { fr: 'Contact', en: 'Contact' },
  lede: {
    fr: 'Un projet, une question technique, ou juste envie d’en discuter : le plus simple reste l’email. Je réponds sous quelques jours.',
    en: 'A project, a technical question, or just a conversation: email is simplest. I answer within a few days.'
  },
  note: {
    fr: 'Ce site ne dépose aucun cookie, ne charge aucun traceur, et n’envoie rien nulle part. Le thème, la langue et l’historique du shell restent dans ton navigateur.',
    en: 'This site sets no cookies, loads no trackers, and sends nothing anywhere. Theme, language and shell history stay in your browser.'
  }
};

// Nom de la « machine » affiché dans le prompt du shell et le neofetch.
export const host = 'portfolio';
