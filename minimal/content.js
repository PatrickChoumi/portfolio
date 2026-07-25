// ═══════════════════════════════════════════════════════════════════════
//  LE SEUL FICHIER À ÉDITER.
//
//  Ce site est un document. Le contenu ci-dessous en est le manuscrit ;
//  build.mjs le compose en deux pages HTML, une par langue.
//
//  Chaque champ traduisible est un objet { fr, en }. Une chaîne nue est
//  utilisée telle quelle dans les deux langues (noms propres, technos).
//
//  Une règle de forme, et elle compte : ici, écrire court est la
//  fonctionnalité. Une accroche de projet tient sur une ligne, un fait
//  marquant sur deux. Les tests refusent ce qui déborde — c'est la seule
//  façon de tenir une mise en page qui repose sur le blanc.
//
//  ⚠️  Ces données sont un CANEVAS crédible, pas la vérité : remplace-les
//      par ton parcours réel avant de publier.
// ═══════════════════════════════════════════════════════════════════════

export const site = {
  name: 'Patrick Choumi',
  role: { fr: 'Développeur logiciel', en: 'Software developer' },
  location: { fr: 'France, à distance', en: 'France, remote' },
  email: 'patrickchoumi@gmail.com',
  // Une ligne, au présent. Si elle n'est plus vraie, on la retire.
  availability: {
    fr: 'À l’écoute des bons projets.',
    en: 'Open to the right projects.'
  },
  links: [
    { label: 'GitHub', url: 'https://github.com/patrickchoumi' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/patrickchoumi' }
  ]
};

// L'accroche. Deux phrases maximum : c'est la première chose lue, et la
// seule que certains liront.
export const lede = {
  fr: 'Je construis des applications web qui restent lisibles, rapides et réparables des années après leur mise en ligne. Je m’intéresse moins aux frameworks du mois qu’aux fondations.',
  en: 'I build web applications that stay readable, fast and repairable years after they ship. Less interested in this month’s framework than in foundations.'
};

// Deux ou trois paragraphes. Pas une biographie : une position de travail.
export const intro = {
  fr: [
    'Une dizaine d’années de développement, surtout sur le web, avec des incursions régulières plus bas dans la pile. Ce va-et-vient est délibéré : comprendre ce qui se passe sous l’abstraction change la façon dont on écrit au-dessus.',
    'Une idée sous tout le reste : la clarté est une fonctionnalité. Un code lisible se corrige plus vite, une interface lisible se traverse sans notice, une donnée bien nommée survit à son auteur. La vitesse, la robustesse et l’accessibilité en découlent plus souvent qu’on ne le croit.',
    'En pratique : peu de dépendances, des tests sur la logique qui casse, des URL réelles, un contraste vérifié, un fonctionnement au clavier. Rien de spectaculaire pris isolément.'
  ],
  en: [
    'About a decade of building software, mostly on the web, with regular detours further down the stack. The back and forth is deliberate: understanding what happens beneath an abstraction changes how you write above it.',
    'One idea underneath everything: clarity is a feature. Readable code is fixed faster, a readable interface needs no manual, well-named data outlives its author. Speed, robustness and accessibility follow more often than people expect.',
    'In practice: few dependencies, tests on the logic that breaks, real URLs, verified contrast, full keyboard operation. Nothing spectacular taken one at a time.'
  ]
};

// ─── Travaux ──────────────────────────────────────────────────────────
// Une ligne visible par projet. Le détail est replié : qui veut savoir
// ouvre, les autres continuent de lire.
export const work = [
  {
    id: 'theory',
    name: 'Theory',
    year: '2025',
    line: {
      fr: 'Une application qui enseigne les fondations de la programmation.',
      en: 'An application teaching the foundations of programming.'
    },
    detail: {
      fr: [
        'Le pourquoi avant le comment, validé par des quiz sans complaisance, ancré par la répétition espacée. Deux cursus ouverts, Python et C.',
        'Tout fonctionne hors-ligne et rien ne quitte le navigateur, sauf si l’utilisateur active la synchronisation. Chaque leçon est pré-rendue à la compilation : une page statique, indexable, servie sans configuration serveur.',
        'Un audit de contenu tourne en intégration continue — un quiz mal formé ou une leçon incohérente fait échouer le build.'
      ],
      en: [
        'The why before the how, validated by uncompromising quizzes, anchored by spaced repetition. Two tracks live, Python and C.',
        'Everything works offline and nothing leaves the browser unless the user opts into sync. Every lesson is pre-rendered at build time: a static, indexable page served with zero server config.',
        'A content audit runs in CI — a malformed quiz or an inconsistent lesson fails the build.'
      ]
    },
    stack: ['JavaScript', 'Vite', 'Node', 'PostgreSQL'],
    url: 'https://github.com/patrickchoumi'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    year: '2024',
    line: {
      fr: 'Un outil qui cartographie la dette technique d’un dépôt.',
      en: 'A tool that maps a repository’s technical debt.'
    },
    detail: {
      fr: [
        'Il lit l’historique Git et croise trois signaux — fréquence de modification, taille des fichiers, densité de correctifs — pour faire apparaître les zones où le coût du changement est le plus élevé.',
        'L’objectif n’est pas de noter le code, mais de rendre visible où l’attention manque. Les seuils sont dérivés de la distribution du dépôt lui-même : aucune configuration à écrire.'
      ],
      en: [
        'It reads the Git history and crosses three signals — change frequency, file size, bugfix density — to surface the areas where the cost of change is highest.',
        'The point is not to grade code, but to make visible where attention is missing. Thresholds are derived from the repository’s own distribution: nothing to configure.'
      ]
    },
    stack: ['Node', 'Git'],
    url: null
  },
  {
    id: 'ttyf',
    name: 'ttyf',
    year: '2023',
    line: {
      fr: 'Un formateur de tableaux pour terminaux, en deux cents lignes.',
      en: 'A table formatter for terminals, in two hundred lines.'
    },
    detail: {
      fr: [
        'Il aligne des colonnes en tenant compte de ce que les autres oublient : les caractères larges, les emoji, les séquences ANSI de couleur, et les terminaux qui changent de largeur en cours de route.',
        'Calcul conforme à Unicode UAX #11, éprouvé sur un corpus de cinq cents cas limites. Une seule fonction publique — le genre d’outil qu’on n’a pas à réapprendre.'
      ],
      en: [
        'It aligns columns while handling what others forget: wide characters, emoji, ANSI colour sequences, and terminals that change width mid-run.',
        'Unicode UAX #11 compliant, tested against a corpus of five hundred edge cases. One public function — the kind of tool you never have to relearn.'
      ]
    },
    stack: ['JavaScript'],
    url: null
  }
];

// ─── Parcours ─────────────────────────────────────────────────────────
// Antéchronologique. Une ligne visible, le reste replié.
export const path = [
  {
    id: 'independant',
    years: '2022 —',
    role: { fr: 'Indépendant', en: 'Freelance' },
    place: { fr: 'À distance', en: 'Remote' },
    line: {
      fr: 'Applications web pour des équipes produit qui veulent un socle, pas un prototype de plus.',
      en: 'Web applications for product teams that want a foundation, not one more prototype.'
    },
    detail: {
      fr: [
        'Refonte d’un back-office métier : temps de chargement divisé par quatre en supprimant le rendu côté client d’une table de douze mille lignes.',
        'Mise en place d’une intégration continue qui refuse un build dont le contraste ou les tests d’accessibilité régressent.',
        'Accompagnement d’équipes sur la dette technique : cartographie, priorisation, remboursement par tranches.'
      ],
      en: [
        'Rebuilt an internal back-office: load time cut fourfold by removing client-side rendering of a twelve-thousand-row table.',
        'Set up a CI pipeline that rejects any build where contrast or accessibility tests regress.',
        'Coached teams on technical debt: mapping, prioritising, paying it down in slices.'
      ]
    }
  },
  {
    id: 'scaleup',
    years: '2019 — 2022',
    role: { fr: 'Développeur front senior', en: 'Senior front-end developer' },
    place: { fr: 'Paris', en: 'Paris' },
    line: {
      fr: 'Équipe plateforme d’un produit SaaS : design system, performance, accessibilité.',
      en: 'Platform team of a SaaS product: design system, performance, accessibility.'
    },
    detail: {
      fr: [
        'Design system maison adopté par cinq équipes : tokens, composants accessibles, documentation vivante.',
        'Budget de performance inscrit dans la CI — le poids du bundle est devenu une décision, plus un accident.',
        'Mise en conformité d’un parcours critique, validée par un audit externe.'
      ],
      en: [
        'In-house design system adopted by five teams: tokens, accessible components, living documentation.',
        'Performance budget enforced in CI — bundle weight became a decision, no longer an accident.',
        'Brought a critical user journey into compliance, validated by an external audit.'
      ]
    }
  },
  {
    id: 'agence',
    years: '2016 — 2019',
    role: { fr: 'Développeur full-stack', en: 'Full-stack developer' },
    place: { fr: 'Lyon', en: 'Lyon' },
    line: {
      fr: 'Beaucoup de projets, beaucoup de contextes. L’école du « livrer pour de vrai ».',
      en: 'Many projects, many contexts. The school of actually shipping.'
    },
    detail: {
      fr: [
        'Une quinzaine d’applications livrées, du site éditorial à l’outil métier interne.',
        'Standardisation du socle de départ des projets : deux semaines gagnées par mission.',
        'Formation des juniors sur les fondamentaux du web — HTTP, cache, accessibilité.'
      ],
      en: [
        'Around fifteen applications delivered, from editorial sites to internal business tools.',
        'Standardised the project starter kit: two weeks saved per engagement.',
        'Trained junior developers on web fundamentals — HTTP, caching, accessibility.'
      ]
    }
  }
];

// ─── Outils ───────────────────────────────────────────────────────────
// Une liste, pas un palmarès. Des jauges de compétence donneraient une
// fausse précision : personne ne sait ce que « 4 sur 5 » veut dire.
export const tools = {
  fr: [
    { label: 'Au quotidien', items: ['JavaScript', 'TypeScript', 'CSS', 'Node', 'PostgreSQL'] },
    { label: 'Régulièrement', items: ['Python', 'C', 'SQL', 'Playwright', 'Git'] },
    { label: 'Comme méthode', items: ['Accessibilité', 'Tests', 'Intégration continue', 'Design system'] }
  ],
  en: [
    { label: 'Daily', items: ['JavaScript', 'TypeScript', 'CSS', 'Node', 'PostgreSQL'] },
    { label: 'Regularly', items: ['Python', 'C', 'SQL', 'Playwright', 'Git'] },
    { label: 'As method', items: ['Accessibility', 'Testing', 'Continuous integration', 'Design systems'] }
  ]
};

export const contact = {
  fr: 'Une mission, une question technique, ou juste envie d’en discuter : le plus simple reste l’email. Je réponds sous quelques jours ouvrés.',
  en: 'A project, a technical question, or just a conversation: email is simplest. I answer within a few business days.'
};

// Le colophon. Il dit comment la page est faite — et il doit rester vrai :
// les tests vérifient les chiffres qu'il annonce.
export const colophon = {
  fr: 'Composé en Newsreader. Deux pages HTML statiques, une par langue, produites par un script de cent lignes. Aucune dépendance, aucun framework, aucun octet de JavaScript. Rien n’est mesuré, rien n’est déposé, rien n’est envoyé nulle part.',
  en: 'Set in Newsreader. Two static HTML pages, one per language, produced by a hundred-line script. No dependencies, no framework, not one byte of JavaScript. Nothing is measured, nothing is stored, nothing is sent anywhere.'
};

// Libellés d'interface. Il y en a peu — c'est le but.
export const ui = {
  work: { fr: 'Travaux', en: 'Work' },
  path: { fr: 'Parcours', en: 'Path' },
  tools: { fr: 'Outils', en: 'Tools' },
  contact: { fr: 'Contact', en: 'Contact' },
  colophon: { fr: 'Colophon', en: 'Colophon' },
  more: { fr: 'Lire la suite', en: 'Read more' },
  less: { fr: 'Replier', en: 'Close' },
  otherLang: { fr: 'English', en: 'Français' },
  skip: { fr: 'Aller au contenu', en: 'Skip to content' },
  visit: { fr: 'Voir le projet', en: 'Visit the project' },
  metaDescription: {
    fr: 'Patrick Choumi, développeur logiciel. Applications web lisibles, rapides et réparables.',
    en: 'Patrick Choumi, software developer. Web applications that are readable, fast and repairable.'
  }
};
