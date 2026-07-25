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
//
//  ⚠️  Les données ci-dessous sont un CANEVAS crédible, pas la vérité :
//      remplace-les par ton parcours réel avant de publier.
// ═══════════════════════════════════════════════════════════════════════

export const identity = {
  name: 'Patrick Choumi',
  handle: 'patrickchoumi',
  initials: 'PC',
  role: {
    fr: 'Développeur logiciel — web, systèmes, outils',
    en: 'Software developer — web, systems, tooling'
  },
  location: { fr: 'France · à distance', en: 'France · remote' },
  // 'open' | 'listening' | 'closed' — pilote la pastille de disponibilité.
  availability: 'listening',
  availabilityLabel: {
    open: { fr: 'Disponible pour une mission', en: 'Available for work' },
    listening: { fr: 'À l’écoute des bons projets', en: 'Open to the right projects' },
    closed: { fr: 'Indisponible actuellement', en: 'Not available right now' }
  },
  email: 'patrickchoumi@gmail.com',

  // La photo de profil. Le MÊME fichier sert deux fois : affiché dans le
  // sommaire, et converti en caractères par la commande `portrait` du
  // terminal (src/js/ascii.js).
  //
  // L'extension doit correspondre au contenu réel du fichier : un JPEG nommé
  // .png fonctionne dans la plupart des navigateurs (ils reniflent le type),
  // mais pas partout, et jamais chez un hébergeur qui renvoie
  // `X-Content-Type-Options: nosniff`. Ici c'est un JPEG, donc `.jpg`.
  //
  // Absent → le sommaire garde le monogramme « ~/ » et `neofetch` sa vignette.
  avatar: '/avatar.jpg',

  links: [
    { label: 'GitHub', url: 'https://github.com/patrickchoumi', handle: '@patrickchoumi' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/patrickchoumi', handle: '/in/patrickchoumi' },
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
    fr: 'Développeur. Je m’intéresse moins aux frameworks du mois qu’aux <em>fondations</em> : structures de données, accessibilité, performance réelle, code qu’on peut relire dans deux ans. Ce site en est un échantillon — une trentaine de kilo-octets de code, et aucune dépendance à l’exécution.',
    en: 'Developer. Less interested in this month’s framework than in <em>foundations</em>: data structures, accessibility, real-world performance, code you can still read two years later. This site is a sample — about thirty kilobytes of code, zero runtime dependencies.'
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
      'Je développe depuis une dizaine d’années, surtout sur le web, avec des incursions régulières plus bas dans la pile — C, systèmes, outillage. Ce va-et-vient est délibéré : comprendre ce qui se passe sous l’abstraction change la façon dont on écrit au-dessus.',
      'Mon travail tourne autour d’une idée simple : **la clarté est une fonctionnalité**. Un code lisible se corrige plus vite, une interface lisible se traverse sans notice, une donnée bien nommée survit à son auteur. Le reste — la vitesse, la robustesse, l’accessibilité — en découle souvent naturellement.',
      'En pratique, ça donne : peu de dépendances, des tests sur la logique qui compte, des URL réelles et partageables, un contraste vérifié, un fonctionnement au clavier. Rien de spectaculaire pris isolément. C’est l’accumulation qui fait la différence.',
      'Quand je ne code pas, j’écris sur la pédagogie de la programmation — comment on enseigne *le pourquoi* avant *le comment*.'
    ],
    en: [
      'I have been building software for about a decade, mostly on the web, with regular detours further down the stack — C, systems, tooling. The back and forth is deliberate: understanding what happens beneath an abstraction changes how you write above it.',
      'My work revolves around one idea: **clarity is a feature**. Readable code is fixed faster, a readable interface needs no manual, well-named data outlives its author. The rest — speed, robustness, accessibility — usually follows.',
      'In practice: few dependencies, tests on the logic that matters, real shareable URLs, verified contrast, full keyboard operation. Nothing spectacular taken one at a time. The accumulation is what makes the difference.',
      'When I am not coding, I write about teaching programming — how to teach *the why* before *the how*.'
    ]
  },
  // Chiffres affichés dans le `neofetch` du shell et la fiche d'identité.
  facts: [
    { key: 'focus', label: { fr: 'Terrain', en: 'Focus' }, value: { fr: 'Web · systèmes · outils internes', en: 'Web · systems · internal tools' } },
    { key: 'langues', label: { fr: 'Langues', en: 'Languages' }, value: { fr: 'Français (natif) · Anglais (courant)', en: 'French (native) · English (fluent)' } },
    { key: 'method', label: { fr: 'Méthode', en: 'Method' }, value: { fr: 'Peu de dépendances, beaucoup de tests', en: 'Few dependencies, plenty of tests' } }
  ]
};

// ─── Parcours ─────────────────────────────────────────────────────────
// Rendu comme un `git log --graph` : chaque poste est un commit sur la
// branche d'une vie professionnelle. Le plus récent en premier.
export const experience = [
  {
    slug: 'independant',
    company: { fr: 'Indépendant', en: 'Freelance' },
    role: { fr: 'Développeur & consultant', en: 'Developer & consultant' },
    start: '2022',
    end: null, // null = en cours
    place: { fr: 'À distance', en: 'Remote' },
    summary: {
      fr: 'Conception et réalisation d’applications web pour des équipes produit qui ont besoin d’un socle solide plutôt que d’un prototype de plus.',
      en: 'Design and delivery of web applications for product teams that need a solid base rather than one more prototype.'
    },
    highlights: {
      fr: [
        'Refonte d’un back-office métier : temps de chargement divisé par quatre en supprimant le rendu côté client d’une table de 12 000 lignes.',
        'Mise en place d’une CI qui refuse un build dont le contraste ou les tests d’accessibilité régressent.',
        'Accompagnement d’équipes sur la dette technique : cartographie, priorisation, remboursement par tranches.'
      ],
      en: [
        'Rebuilt an internal back-office: load time cut fourfold by removing client-side rendering of a 12,000-row table.',
        'Set up a CI pipeline that rejects any build where contrast or accessibility tests regress.',
        'Coached teams on technical debt: mapping, prioritising, paying it down in slices.'
      ]
    },
    stack: ['TypeScript', 'Node', 'PostgreSQL', 'Vite', 'Playwright']
  },
  {
    slug: 'scaleup-produit',
    company: { fr: 'Scale-up produit', en: 'Product scale-up' },
    role: { fr: 'Développeur front senior', en: 'Senior front-end developer' },
    start: '2019',
    end: '2022',
    place: { fr: 'Paris', en: 'Paris' },
    summary: {
      fr: 'Équipe plateforme d’un produit SaaS B2B. Design system, performance, accessibilité — les fondations que les équipes fonctionnelles consomment tous les jours.',
      en: 'Platform team of a B2B SaaS product. Design system, performance, accessibility — the foundations feature teams consume daily.'
    },
    highlights: {
      fr: [
        'Design system maison adopté par cinq équipes : tokens, composants accessibles, documentation vivante.',
        'Budget de performance inscrit dans la CI — le poids du bundle est devenu une décision, pas un accident.',
        'Mise en conformité RGAA d’un parcours critique, validée par un audit externe.'
      ],
      en: [
        'In-house design system adopted by five teams: tokens, accessible components, living documentation.',
        'Performance budget enforced in CI — bundle weight became a decision, not an accident.',
        'Brought a critical user journey into accessibility compliance, validated by an external audit.'
      ]
    },
    stack: ['TypeScript', 'React', 'CSS', 'Storybook', 'Web Vitals']
  },
  {
    slug: 'agence',
    company: { fr: 'Agence technique', en: 'Technical agency' },
    role: { fr: 'Développeur full-stack', en: 'Full-stack developer' },
    start: '2016',
    end: '2019',
    place: { fr: 'Lyon', en: 'Lyon' },
    summary: {
      fr: 'Beaucoup de projets, beaucoup de contextes. L’école du « livrer pour de vrai » : contraintes de budget, de délai, et des utilisateurs qui ne ressemblent pas à l’équipe.',
      en: 'Many projects, many contexts. The school of actually shipping: budget and deadline constraints, and users who look nothing like the team.'
    },
    highlights: {
      fr: [
        'Une quinzaine d’applications livrées, du site éditorial à l’outil métier interne.',
        'Standardisation du socle de départ des projets : gain de deux semaines par mission.',
        'Formation des juniors sur les fondamentaux du web (HTTP, cache, accessibilité).'
      ],
      en: [
        'Around fifteen applications delivered, from editorial sites to internal business tools.',
        'Standardised the project starter kit: two weeks saved per engagement.',
        'Trained junior developers on web fundamentals (HTTP, caching, accessibility).'
      ]
    },
    stack: ['JavaScript', 'PHP', 'MySQL', 'Docker']
  }
];

// ─── Projets ──────────────────────────────────────────────────────────
export const projects = [
  {
    slug: 'theory',
    name: 'Theory',
    year: '2025',
    status: 'live', // 'live' | 'wip' | 'archived'
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
      { label: { fr: 'Le projet', en: 'The project' }, url: 'https://github.com/patrickchoumi' }
    ]
  },
  {
    slug: 'portfolio',
    name: 'Ce portfolio',
    year: '2026',
    status: 'live',
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
      { label: { fr: 'Code source', en: 'Source' }, url: 'https://github.com/patrickchoumi/portfolio' }
    ]
  },
  {
    slug: 'atlas',
    name: 'Atlas',
    year: '2024',
    status: 'wip',
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
    year: '2023',
    status: 'live',
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
// Pas de niveau chiffré : « quatre sur cinq » ne veut rien dire pour celui qui
// lit, et beaucoup trop pour celui qui écrit. Chaque entrée porte à la place
// une phrase qui dit ce qu'on en sait vraiment — plus honnête, et plus utile.
export const stack = [
  {
    group: { fr: 'Langages', en: 'Languages' },
    items: [
      { name: 'JavaScript / TypeScript', note: { fr: 'Le terrain principal, depuis ES5.', en: 'Main ground, since ES5.' } },
      { name: 'C', note: { fr: 'Assez pour comprendre ce qui se passe en dessous.', en: 'Enough to understand what happens underneath.' } },
      { name: 'Python', note: { fr: 'Outillage, scripts, prototypage.', en: 'Tooling, scripts, prototyping.' } },
      { name: 'SQL', note: { fr: 'Modélisation et lecture de plans d’exécution.', en: 'Modelling and reading query plans.' } }
    ]
  },
  {
    group: { fr: 'Interface', en: 'Interface' },
    items: [
      { name: { fr: 'CSS moderne', en: 'Modern CSS' }, note: { fr: 'Grid, cascade layers, color-mix, container queries.', en: 'Grid, cascade layers, color-mix, container queries.' } },
      { name: { fr: 'Accessibilité (WCAG/RGAA)', en: 'Accessibility (WCAG)' }, note: { fr: 'Clavier, ARIA, contraste — vérifiés, pas supposés.', en: 'Keyboard, ARIA, contrast — verified, not assumed.' } },
      { name: { fr: 'Design system', en: 'Design systems' }, note: { fr: 'Tokens, composants, documentation vivante.', en: 'Tokens, components, living documentation.' } }
    ]
  },
  {
    group: { fr: 'Plateforme', en: 'Platform' },
    items: [
      { name: 'Node', note: { fr: 'Services, CLI, outillage de build.', en: 'Services, CLIs, build tooling.' } },
      { name: 'PostgreSQL', note: { fr: 'Schémas, index, migrations sans interruption.', en: 'Schemas, indexes, zero-downtime migrations.' } },
      { name: 'CI/CD', note: { fr: 'Des garanties automatiques, pas des intentions.', en: 'Automatic guarantees, not intentions.' } },
      { name: { fr: 'Tests (unitaires, E2E)', en: 'Tests (unit, E2E)' }, note: { fr: 'Sur la logique qui casse, pas sur les getters.', en: 'On logic that breaks, not on getters.' } }
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
    fr: 'Une mission, une question technique, ou juste envie d’en discuter : le plus simple reste l’email. Je réponds sous quelques jours ouvrés.',
    en: 'A project, a technical question, or just a conversation: email is simplest. I answer within a few business days.'
  },
  note: {
    fr: 'Ce site ne dépose aucun cookie, ne charge aucun traceur, et n’envoie rien nulle part. Le thème, la langue et l’historique du shell restent dans ton navigateur.',
    en: 'This site sets no cookies, loads no trackers, and sends nothing anywhere. Theme, language and shell history stay in your browser.'
  }
};

// Nom de la « machine » affiché dans le prompt du shell et le neofetch.
export const host = 'portfolio';
