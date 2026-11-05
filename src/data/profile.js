// ═══════════════════════════════════════════════════════════════════════
//  LE SEUL FICHIER À ÉDITER.
//
//  Tout le site en découle : la coupe de l'accueil, les fiches, le shell.
//  Il n'y a pas de contenu dupliqué dans le HTML, pas de « version texte »
//  à tenir à jour.
//
//  Chaque champ traduisible est un objet { fr, en }. Une chaîne nue est
//  utilisée telle quelle dans les deux langues — pratique pour les noms
//  propres.
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

// ─── Les couches de la machine ────────────────────────────────────────
//
//  L'ARMATURE DU SITE. Chaque projet déclare la couche où il travaille, et
//  l'accueil en fait une coupe : l'application en haut, l'image du système
//  tout en bas. Ce n'est pas un classement décoratif — c'est le fait le plus
//  intéressant de ce portfolio. Les projets ne sont pas tous du même genre
//  parce qu'ils ne sont pas à la même profondeur.
//
//  `depth` va de 0 (la surface, ce que l'utilisateur touche) à 3 (ce sur quoi
//  la machine démarre). L'ordre d'affichage en découle, dans la coupe comme
//  dans la liste.
export const layers = [
  {
    slug: 'application',
    depth: 0,
    name: { fr: 'Application', en: 'Application' },
    note: {
      fr: 'Ce que quelqu’un ouvre, lit, remplit. La couche où une erreur se voit tout de suite.',
      en: 'What someone opens, reads, fills in. The layer where a mistake shows at once.'
    }
  },
  {
    slug: 'bureau',
    depth: 1,
    name: { fr: 'Bureau', en: 'Desktop' },
    note: {
      fr: 'Les fenêtres, les contrôles, la géométrie. Ce qui donne son grain à un système entier.',
      en: 'Windows, controls, geometry. What gives a whole system its grain.'
    }
  },
  {
    slug: 'service',
    depth: 2,
    name: { fr: 'Service', en: 'Service' },
    note: {
      fr: 'Ce qui tourne sans qu’on le regarde, et qui veille sur ce que fait une autre application.',
      en: 'What runs while nobody watches, keeping an eye on what another application does.'
    }
  },
  {
    slug: 'socle',
    depth: 3,
    name: { fr: 'Socle', en: 'Base' },
    note: {
      fr: 'L’image, le démarrage, le chiffrement. En dessous, il n’y a plus que le matériel.',
      en: 'The image, the boot, the encryption. Below this there is only hardware.'
    }
  }
];

export const hero = {
  kicker: {
    fr: 'coupe · de l’application au socle',
    en: 'cross-section · application to base'
  },
  title: {
    fr: 'Je descends<br />jusqu’à la <span class="emphasis">couche du dessous</span>.',
    en: 'I go down<br />to the <span class="emphasis">layer below</span>.'
  },
  lede: {
    fr: 'Élève ingénieur en génie informatique à Yaoundé. Mes projets ne sont pas du même genre parce qu’ils ne sont pas à la même profondeur : un site de réservation, un service qui garde un téléphone, un environnement de bureau, et <em>un système d’exploitation immuable</em>. Comprendre la couche du dessous change la façon dont on écrit celle du dessus — c’est la seule chose que j’ai vraiment apprise.',
    en: 'Computer engineering student in Yaoundé. My projects are not of one kind because they are not at one depth: a booking site, a service that guards a phone, a desktop environment, and <em>an immutable operating system</em>. Understanding the layer below changes how you write the one above — it is the one thing I have really learned.'
  },
  repl: {
    fr: [
      { q: 'quelle est ta première question sur un projet ?', a: 'À quelle couche il vit, et ce qui casse quand celle du dessous bouge.' },
      { q: 'pourquoi écrire un OS alors qu’il en existe ?', a: 'Pour la même raison qu’on démonte un moteur : c’est en dessous que les décisions sont prises.' },
      { q: 'comment tu sais qu’une mesure est juste ?', a: 'Je ne le sais pas. Je la fais vérifier par un programme, en machine virtuelle, à chaque build.' },
      { q: 'et quand ce n’est pas fini ?', a: 'Je l’écris. Un AVANCEMENT.md qui ment coûte plus cher qu’un projet en retard.' }
    ],
    en: [
      { q: 'first question you ask on a project?', a: 'Which layer it lives at, and what breaks when the one below moves.' },
      { q: 'why write an OS when they already exist?', a: 'The same reason you take an engine apart: the decisions are made underneath.' },
      { q: 'how do you know a measurement is right?', a: 'I do not. I have a program check it, in a virtual machine, on every build.' },
      { q: 'and when it is not finished?', a: 'I write that down. A status file that lies costs more than a late project.' }
    ]
  }
};

export const about = {
  title: { fr: 'À propos', en: 'About' },
  file: 'about.md',
  body: {
    fr: [
      'Je code depuis trois ans. J’ai commencé par le C et Linux, puis j’ai suivi la pente — et la pente descend. Python, JavaScript, Java pour construire des applications ; puis le C++ et Qt pour habiller un bureau ; puis systemd, les services d’accessibilité et les images immuables pour tenir le système lui-même. Ce qui m’intéresse, c’est ce qui se passe sous l’abstraction.',
      'Mon travail tourne autour d’une idée simple : **la clarté est une fonctionnalité**. Un code lisible se corrige plus vite, une interface lisible se traverse sans notice, une donnée bien nommée survit à son auteur. Le reste — la vitesse, la robustesse, l’accessibilité — en découle souvent naturellement.',
      'Elle a une conséquence que j’applique partout : **chaque dépôt dit où il en est**. Un fichier d’avancement, des décisions numérotées, et ce qui n’a pas encore tourné sur une vraie machine écrit noir sur blanc. Annoncer fini ce qui ne l’est pas coûte plus cher que le retard lui-même.',
      'En dehors du code : les échecs, la lecture — romans et mangas — et le sport.'
    ],
    en: [
      'I have been coding for three years. I started with C and Linux, then followed the slope — and the slope goes down. Python, JavaScript, Java to build applications; then C++ and Qt to dress a desktop; then systemd, accessibility services and immutable images to hold the system itself. What interests me is what happens beneath the abstraction.',
      'My work revolves around one idea: **clarity is a feature**. Readable code is fixed faster, a readable interface needs no manual, well-named data outlives its author. The rest — speed, robustness, accessibility — usually follows.',
      'It has one consequence I apply everywhere: **every repository states where it stands**. A progress file, numbered decisions, and whatever has not yet run on real hardware written down plainly. Calling something finished when it is not costs more than the delay itself.',
      'Away from the keyboard: chess, reading — novels and manga — and sport.'
    ]
  },
  facts: [
    { key: 'formation', label: { fr: 'Formation', en: 'Studies' }, value: { fr: 'ENSPY — génie informatique, jusqu’en 2029', en: 'ENSPY — computer engineering, until 2029' } },
    { key: 'terrain', label: { fr: 'Terrain', en: 'Ground' }, value: { fr: 'C · C++/Qt · Kotlin · TypeScript · Linux', en: 'C · C++/Qt · Kotlin · TypeScript · Linux' } },
    { key: 'langues', label: { fr: 'Langues', en: 'Languages' }, value: { fr: 'Français · Anglais', en: 'French · English' } },
    { key: 'loisirs', label: { fr: 'Loisirs', en: 'Off-hours' }, value: { fr: 'Échecs · romans et mangas · sport', en: 'Chess · novels and manga · sport' } }
  ]
};

// ─── Parcours ─────────────────────────────────────────────────────────
export const experience = [
  {
    slug: 'enspy',
    company: { fr: 'École Nationale Supérieure Polytechnique de Yaoundé', en: 'National Advanced School of Engineering, Yaoundé' },
    role: { fr: 'Élève ingénieur — génie informatique', en: 'Engineering student — computer engineering' },
    place: { fr: 'Yaoundé, Cameroun', en: 'Yaoundé, Cameroon' },
    start: '2024',
    end: null,
    summary: {
      fr: 'Cycle d’ingénieur en génie informatique, jusqu’en 2029. Les deux premières années sont un cycle préparatoire — mathématiques et sciences physiques — et l’informatique se mène en parallèle.',
      en: 'Engineering degree in computer engineering, through 2029. The first two years are a preparatory cycle — mathematics and physical sciences — with computing carried on in parallel.'
    },
    highlights: {
      fr: [
        'Cycle préparatoire 2024–2026 : mathématiques et sciences physiques. Cycle ingénieur depuis la rentrée 2026.',
        'Informatique menée en parallèle du programme : C, Python, JavaScript, puis C++/Qt et Kotlin.',
        'HTML, CSS et LaTeX appris en autodidacte.',
        'Méthodes numériques, algèbre générale, géométrie affine et euclidienne — les notes de cours sont écrites en LaTeX et versionnées.'
      ],
      en: [
        'Preparatory cycle 2024–2026: mathematics and physical sciences. Engineering cycle since autumn 2026.',
        'Computing carried alongside the curriculum: C, Python, JavaScript, then C++/Qt and Kotlin.',
        'HTML, CSS and LaTeX learned self-taught.',
        'Numerical methods, general algebra, affine and Euclidean geometry — course notes written in LaTeX and version-controlled.'
      ]
    },
    stack: ['C', 'C++', 'Python', 'JavaScript', 'LaTeX']
  },
  {
    slug: 'uy1',
    company: { fr: 'Université de Yaoundé I', en: 'University of Yaoundé I' },
    role: { fr: 'Filière informatique', en: 'Computer science' },
    place: { fr: 'Yaoundé, Cameroun', en: 'Yaoundé, Cameroon' },
    start: '2023',
    end: '2024',
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
//
//  `status` : 'live' | 'wip' | 'planned' | 'archived'.
//  `layer`  : le slug d'une couche déclarée plus haut. C'est lui qui place
//             le projet dans la coupe de l'accueil.
//
//  Règle de ce fichier : le statut dit l'état RÉEL, pas l'intention. Les
//  dépôts d'Ankh et d'Ankh DE tiennent chacun un AVANCEMENT.md ; ce qui est
//  écrit ici en découle et ne le dépasse jamais.
export const projects = [
  {
    slug: 'ankh',
    name: 'Ankh',
    year: '2026',
    status: 'wip',
    layer: 'socle',
    tagline: {
      fr: 'Un système d’exploitation immuable, reconstruit à chaque fois.',
      en: 'An immutable operating system, rebuilt every time.'
    },
    summary: {
      fr: 'Mon système personnel, en image immuable : l’OS est reconstruit d’un bloc par l’intégration continue, signé, publié, puis installé tel quel — et on revient à la version précédente d’un redémarrage. Hôte minimal et protégé : Secure Boot, chiffrement LUKS, et la règle de ne jamais désactiver une sécurité pour faire marcher un outil. Une seule image générique, dont on coche les options à l’installation.',
      en: 'My personal system, as an immutable image: the OS is rebuilt whole by continuous integration, signed, published, then installed as is — and one reboot rolls back to the previous version. A minimal, protected host: Secure Boot, LUKS encryption, and the rule never to disable a security feature to make a tool work. One generic image, whose options are ticked at install time.'
    },
    highlights: {
      fr: [
        'Les images sont construites, signées et publiées par la CI ; elles démarrent en machine virtuelle, et le retour arrière y fonctionne.',
        'Image générique : elle doit marcher sur le maximum de PC x86_64 sans réglage propre à une machine.',
        'Les options — Dev, Gaming, Hacking — se cochent à l’installation et se téléchargent ensuite, depuis une seule ISO.',
        'Chaque arbitrage est une décision numérotée et datée, et l’avancement réel tient dans un fichier à part.',
        'Ce qui n’a pas encore tourné sur une vraie machine est écrit comme tel : les procédures de récupération restent des cibles.'
      ],
      en: [
        'Images are built, signed and published by CI; they boot in a virtual machine, and rollback works there.',
        'Generic image: it must run on as many x86_64 PCs as possible with no per-machine tuning.',
        'Options — Dev, Gaming, Hacking — are ticked at install time and downloaded afterwards, from a single ISO.',
        'Every judgement call is a numbered, dated decision, and the real progress lives in a separate file.',
        'Whatever has not yet run on real hardware is written as such: the recovery procedures remain targets.'
      ]
    },
    metrics: [
      { label: { fr: 'phases terminées', en: 'phases done' }, value: '4' },
      { label: { fr: 'décisions consignées', en: 'logged decisions' }, value: '52' },
      { label: { fr: 'démarrage vérifié', en: 'boot verified' }, value: 'VM' }
    ],
    stack: ['Linux', 'OCI', 'Secure Boot', 'LUKS', 'CI'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/Ankh' }
    ]
  },
  {
    slug: 'ankh-de',
    name: 'Ankh DE',
    year: '2026',
    status: 'wip',
    layer: 'bureau',
    tagline: {
      fr: 'La géométrie de Windows 11, mesurée au pixel, portée sur Plasma.',
      en: 'The geometry of Windows 11, measured to the pixel, carried onto Plasma.'
    },
    summary: {
      fr: 'Une suite de thèmes pour KDE Plasma 6 qui donne au bureau les mesures, la typographie et les matières de Windows 11, sous l’identité graphite et violet d’Ankh. Le point intéressant n’est pas la ressemblance : c’est que les mesures sont **relevées par un programme**, en machine virtuelle, à chaque build — barre de titre de 32 px, coins de 8,2 px, interrupteur de 40×20. Un thème qui dérive d’un pixel fait échouer la CI.',
      en: 'A theme suite for KDE Plasma 6 that gives the desktop the measurements, typography and materials of Windows 11, under Ankh’s graphite and violet identity. The interesting part is not the likeness: it is that the measurements are **read by a program**, in a virtual machine, on every build — 32 px title bar, 8.2 px corners, 40×20 switch. A theme that drifts by one pixel fails CI.'
    },
    highlights: {
      fr: [
        'Un QStyle Qt 6 dérivé de Breeze, une décoration de fenêtre KWin, et le thème global qui les relie.',
        'Les mesures de référence sont relevées en VM sur Fedora 44 par l’intégration continue, puis comparées — la ressemblance est une assertion, pas une impression.',
        'S’installe sur Fedora, Arch ou Ubuntu sans modifier un seul fichier de la distribution, et se retire d’un geste.',
        'Dépôt séparé d’Ankh, qui le consommera plus tard : un bureau doit pouvoir servir ailleurs que sur le système qui l’a motivé.'
      ],
      en: [
        'A Qt 6 QStyle derived from Breeze, a KWin window decoration, and the global theme that ties them together.',
        'Reference measurements are read in a VM on Fedora 44 by continuous integration, then compared — the likeness is an assertion, not an impression.',
        'Installs on Fedora, Arch or Ubuntu without touching a single file of the distribution, and uninstalls in one gesture.',
        'A repository separate from Ankh, which will consume it later: a desktop should be usable beyond the system that prompted it.'
      ]
    },
    metrics: [
      { label: { fr: 'fichiers C++', en: 'C++ files' }, value: '92' },
      { label: { fr: 'mesures vérifiées', en: 'verified metrics' }, value: 'CI' },
      { label: { fr: 'distributions visées', en: 'target distros' }, value: '3' }
    ],
    stack: ['C++', 'Qt 6', 'KWin', 'Plasma 6', 'QML'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/Ankh-DE' }
    ]
  },
  {
    slug: 'minsapp',
    name: 'Minsapp',
    year: '2026',
    status: 'wip',
    layer: 'service',
    tagline: {
      fr: 'WhatsApp officiel, sans ce qu’on n’a pas demandé.',
      en: 'Official WhatsApp, without what nobody asked for.'
    },
    summary: {
      fr: 'Une application Android qui ne remplace pas WhatsApp : elle veille à côté. Les Statuts, les Chaînes et Meta AI deviennent inaccessibles, tout le reste fonctionne. Le détour est délibéré — les WhatsApp modifiés font bannir les comptes, alors que ce gardien ne touche ni à l’application ni à son réseau. Il n’a même pas la permission Internet.',
      en: 'An Android app that does not replace WhatsApp: it watches beside it. Status, Channels and Meta AI become unreachable, everything else keeps working. The detour is deliberate — modified WhatsApp clients get accounts banned, whereas this guard touches neither the app nor its network. It does not even hold the Internet permission.'
    },
    highlights: {
      fr: [
        'Repose sur le service d’accessibilité d’Android : il lit l’écran de WhatsApp pour repérer les éléments bannis, et n’enregistre rien.',
        'Chaque bannissement s’active ou se désactive séparément — l’outil a un avis, pas un dogme.',
        'Aucune permission réseau : ce qui est vu ne peut pas sortir, et c’est vérifiable depuis le manifeste.',
        'Écrit en Kotlin, construit par l’intégration continue à chaque poussée.'
      ],
      en: [
        'Built on Android’s accessibility service: it reads WhatsApp’s screen to spot banned elements, and records nothing.',
        'Each ban is toggled separately — the tool has an opinion, not a dogma.',
        'No network permission: what it sees cannot leave, and that is checkable from the manifest.',
        'Written in Kotlin, built by continuous integration on every push.'
      ]
    },
    metrics: [
      { label: { fr: 'permission réseau', en: 'network permission' }, value: '0' },
      { label: { fr: 'éléments bannis', en: 'banned surfaces' }, value: '4' },
      { label: { fr: 'fichiers Kotlin', en: 'Kotlin files' }, value: '10' }
    ],
    stack: ['Kotlin', 'Android', 'Gradle'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/Minsapp' }
    ]
  },
  {
    slug: 'heritage',
    name: 'Héritage',
    year: '2026',
    status: 'wip',
    layer: 'application',
    tagline: {
      fr: 'Réserver une table, en trois gestes et dans deux langues.',
      en: 'Booking a table, in three gestures and two languages.'
    },
    summary: {
      fr: 'Le site vitrine et de réservation d’un restaurant de Bastos, à Yaoundé : cuisine camerounaise contemporaine, charte sombre et or, entièrement bilingue. La réservation choisit la table sur des disponibilités réelles et confirme par trois canaux — base, e-mail, WhatsApp — et l’équipe dispose d’un back-office pour la carte et le service. Refonte d’une première version Node/Express vers Next.js et PostgreSQL.',
      en: 'The showcase and booking site of a restaurant in Bastos, Yaoundé: contemporary Cameroonian cuisine, a dark and gold identity, fully bilingual. Booking picks a table against real availability and confirms over three channels — database, e-mail, WhatsApp — and the team has a back-office for the menu and the service. A rewrite of a first Node/Express version onto Next.js and PostgreSQL.'
    },
    highlights: {
      fr: [
        'Disponibilités en temps réel au moment du choix de la table : on ne réserve pas deux fois la même.',
        'Confirmation sur trois canaux, parce qu’un e-mail qui tombe en spam ne doit pas perdre une réservation.',
        'Back-office complet : carte lue en base, fiches de réservation, tableau de bord des couverts.',
        'Bilingue jusque dans la carte, qui est traduite en base et non dans le code.'
      ],
      en: [
        'Real-time availability at the moment the table is chosen: the same one is never booked twice.',
        'Confirmation over three channels, because an e-mail landing in spam must not lose a booking.',
        'Full back-office: menu read from the database, booking records, a covers dashboard.',
        'Bilingual down to the menu, translated in the database rather than in the code.'
      ]
    },
    metrics: [
      { label: { fr: 'canaux de confirmation', en: 'confirmation channels' }, value: '3' },
      { label: { fr: 'fichiers TypeScript', en: 'TypeScript files' }, value: '123' },
      { label: { fr: 'langues', en: 'languages' }, value: '2' }
    ],
    stack: ['TypeScript', 'Next.js', 'React', 'PostgreSQL'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/HeritageRestaurant' }
    ]
  },
  {
    slug: 'kairus',
    name: 'Kairus',
    year: '2026',
    status: 'wip',
    layer: 'application',
    tagline: {
      fr: 'Une messagerie qui fait l’essentiel, et rien autour.',
      en: 'A messenger that does the essentials, and nothing around them.'
    },
    summary: {
      fr: 'Une messagerie temps réel complète — conversations, groupes, fichiers, vocaux, appels audio de navigateur à navigateur — dans la disposition que tout le monde connaît déjà. Ce qui la distingue n’est pas une grammaire à réapprendre : c’est ce qui a été retiré. Pas d’écran de réglages ; `⌘K` ouvre un point de commande unique qui cherche, crée, bascule le thème et pose ses questions une à une.',
      en: 'A complete real-time messenger — conversations, groups, files, voice notes, browser-to-browser audio calls — in the layout everyone already knows. What sets it apart is not a grammar to relearn: it is what was taken out. No settings screen; `⌘K` opens a single command point that searches, creates, switches theme and asks its questions one at a time.'
    },
    highlights: {
      fr: [
        'Temps réel par WebSocket : envoi optimiste, réconciliation, file d’attente hors ligne et reconnexion à repli exponentiel.',
        'Appels audio en WebRTC — le serveur relaie les présentations, jamais la voix, et applique aux appels les règles des messages.',
        'Sécurité écrite comme une politique : limitation de débit par adresse *et* par nom d’usage, révocation par version de jeton, CSP sans `unsafe-inline` avec le script de thème autorisé par son empreinte.',
        'Pas d’annuaire : hors de vos conversations, seul un nom d’usage exact résout. Un annuaire parcourable plus une boîte ouverte est un outil de harcèlement clé en main.',
        'Mouvement calculé image par image par des ressorts interruptibles, sans bibliothèque d’animation.'
      ],
      en: [
        'Real time over WebSocket: optimistic send, reconciliation, offline queue and exponential-backoff reconnection.',
        'WebRTC audio calls — the server relays introductions, never the voice, and applies the message rules to calls.',
        'Security written as a policy: rate limiting per address *and* per handle, revocation by token version, CSP with no `unsafe-inline` and the theme script allowed by its hash.',
        'No directory: outside your conversations, only an exact handle resolves. A browsable directory plus an open inbox is a ready-made harassment tool.',
        'Motion integrated frame by frame by interruptible springs, with no animation library.'
      ]
    },
    metrics: [
      { label: { fr: 'tests', en: 'tests' }, value: '176' },
      { label: { fr: 'client compressé', en: 'client gzipped' }, value: '57 ko' },
      { label: { fr: 'dépendances client', en: 'client deps' }, value: '3' }
    ],
    stack: ['TypeScript', 'React', 'Node', 'SQLite', 'WebSocket', 'WebRTC'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/kairus' }
    ]
  },
  {
    slug: 'theory',
    name: 'Theory',
    year: '2026',
    status: 'wip',
    layer: 'application',
    tagline: {
      fr: 'La théorie de la programmation, structurée pour durer.',
      en: 'Programming theory, structured to last.'
    },
    summary: {
      fr: 'Une application d’apprentissage qui enseigne les fondations de la programmation : le *pourquoi* avant le *comment*, validé par des quiz sans complaisance, ancré par la répétition espacée. Tout fonctionne hors-ligne, et rien ne quitte le navigateur sauf si l’utilisateur active la synchronisation. Le dépôt est repassé en privé — le lien public a donc été retiré plutôt que laissé mort.',
      en: 'A learning application teaching the foundations of programming: the *why* before the *how*, validated by uncompromising quizzes, anchored by spaced repetition. Everything works offline, and nothing leaves the browser unless the user opts into sync. The repository has gone private — the public link was removed rather than left dead.'
    },
    highlights: {
      fr: [
        'Moteur de répétition espacée : la révision ramène ce qui a été raté, pas ce qui est acquis.',
        'Contenu pré-rendu à la compilation — chaque leçon est une page statique, indexable, servie sans configuration serveur.',
        'Audit de contenu automatisé : un quiz mal formé ou une leçon incohérente fait échouer le build.',
        'Chargement dynamique par module : le bundle initial ne contient que la structure, pas les leçons.'
      ],
      en: [
        'Spaced-repetition engine: review brings back what was missed, not what is mastered.',
        'Content pre-rendered at build time — every lesson is a static, indexable page, served with zero server config.',
        'Automated content audit: a malformed quiz or an inconsistent lesson fails the build.',
        'Per-module dynamic loading: the initial bundle carries structure only, not lessons.'
      ]
    },
    metrics: [
      { label: { fr: 'dépendances runtime', en: 'runtime deps' }, value: '0' },
      { label: { fr: 'hors-ligne', en: 'offline' }, value: '100%' }
    ],
    stack: ['JavaScript', 'Vite', 'Node', 'PWA'],
    links: []
  },
  {
    slug: 'vision',
    name: 'Vision',
    year: '2026',
    status: 'wip',
    layer: 'application',
    tagline: {
      fr: 'Un premier réseau convolutif, écrit pour comprendre.',
      en: 'A first convolutional network, written to understand.'
    },
    summary: {
      fr: 'Un projet d’apprentissage assumé : reconnaître des objets dans une image avec un réseau de neurones convolutif, entraîné sur CIFAR-10 et servi par une petite interface. L’intérêt n’est pas le score — c’est que chaque choix de la pile est justifié par écrit, y compris celui de prendre un jeu de données déjà étiqueté plutôt que d’en collecter un, irréaliste en cinq jours.',
      en: 'An openly pedagogical project: recognising objects in an image with a convolutional neural network, trained on CIFAR-10 and served through a small interface. The point is not the score — it is that every choice in the stack is justified in writing, including taking an already-labelled dataset rather than collecting one, unrealistic in five days.'
    },
    highlights: {
      fr: [
        'Keras plutôt que PyTorch, et la raison est écrite : moins de code d’échafaudage pour un premier CNN.',
        'Le pipeline est séparé en étapes lisibles — chargement, architecture, entraînement, prédiction, interface.',
        'Interface web en Python pur, pour que l’attention reste sur le modèle et pas sur le front.'
      ],
      en: [
        'Keras rather than PyTorch, and the reason is written down: less scaffolding for a first CNN.',
        'The pipeline is split into readable stages — loading, architecture, training, prediction, interface.',
        'Web interface in pure Python, so attention stays on the model rather than the front end.'
      ]
    },
    metrics: [
      { label: { fr: 'classes', en: 'classes' }, value: '10' },
      { label: { fr: 'images', en: 'images' }, value: '60k' }
    ],
    stack: ['Python', 'TensorFlow', 'Keras', 'Streamlit'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/reconnaissanceImage' }
    ]
  },
  {
    slug: 'portfolio',
    name: 'Portfolio',
    year: '2026',
    status: 'wip',
    layer: 'application',
    tagline: {
      fr: 'Une coupe du poste de travail, et un shell qui l’explore.',
      en: 'A cross-section of the workstation, and a shell that explores it.'
    },
    summary: {
      fr: 'Le site que tu lis. L’accueil est une coupe : chaque projet est posé à la profondeur où il travaille, de l’application jusqu’au socle. Et le contenu existe en deux rendus — la page, et un shell interactif (touche `` ` ``) où il devient une arborescence explorable : `ls`, `cd`, `cat`, `tree`, `grep`, `open`. Les deux vues restent synchronisées.',
      en: 'The site you are reading. The home page is a cross-section: each project sits at the depth it works at, from application down to base. And the content exists as two renderings — the page, and an interactive shell (`` ` `` key) where it becomes a browsable tree: `ls`, `cd`, `cat`, `tree`, `grep`, `open`. The two views stay in sync.'
    },
    highlights: {
      fr: [
        'Système de fichiers virtuel dérivé d’un seul fichier de données — aucun contenu dupliqué entre la page et le terminal.',
        'Routes réelles : chaque section et chaque projet a son URL partageable, son titre et sa description propres.',
        'Responsive et contraste ne sont pas affirmés mais mesurés : sept routes à huit largeurs, à chaque build.',
        'Zéro dépendance à l’exécution, polices auto-hébergées, et un test qui échoue si un hôte tiers est contacté.'
      ],
      en: [
        'A virtual filesystem derived from a single data file — no content duplicated between page and terminal.',
        'Real routes: every section and every project has its shareable URL, its own title and description.',
        'Responsiveness and contrast are not claimed but measured: seven routes at eight widths, on every build.',
        'Zero runtime dependencies, self-hosted fonts, and a test that fails if a third-party host is contacted.'
      ]
    },
    metrics: [
      { label: { fr: 'dépendances runtime', en: 'runtime deps' }, value: '0' },
      { label: { fr: 'vérifications', en: 'checks' }, value: '77' },
      { label: { fr: 'code compressé', en: 'code gzipped' }, value: '33 ko' }
    ],
    stack: ['JavaScript', 'Vite', 'CSS'],
    links: [
      { label: { fr: 'Dépôt', en: 'Repository' }, url: 'https://github.com/PatrickChoumi/portfolio' }
    ]
  }
];

// ─── Stack ────────────────────────────────────────────────────────────
// Groupée par couche, comme les projets : ce que j'écris en haut n'est pas
// ce que j'écris en bas, et c'est le propos.
export const stack = [
  {
    group: { fr: 'Application', en: 'Application' },
    items: [
      { name: 'TypeScript', note: { fr: 'Le terrain principal au-dessus du navigateur.', en: 'The main ground above the browser.' } },
      { name: 'React', note: { fr: 'Next.js quand il faut du rendu serveur, rien sinon.', en: 'Next.js when server rendering is needed, nothing otherwise.' } },
      { name: 'Python', note: { fr: 'Scripts, prototypes, et un premier modèle.', en: 'Scripts, prototypes, and a first model.' } },
      { name: { fr: 'HTML et CSS', en: 'HTML and CSS' }, note: { fr: 'Grid, cascade layers, color-mix — appris en autodidacte.', en: 'Grid, cascade layers, color-mix — self-taught.' } }
    ]
  },
  {
    group: { fr: 'Bureau', en: 'Desktop' },
    items: [
      { name: 'C++', note: { fr: 'Qt 6 : styles de contrôles, décoration de fenêtre.', en: 'Qt 6: control styles, window decoration.' } },
      { name: 'Kotlin', note: { fr: 'Android, et ses services d’accessibilité.', en: 'Android, and its accessibility services.' } },
      { name: 'QML', note: { fr: 'Les morceaux de shell qui doivent bouger.', en: 'The shell pieces that have to move.' } }
    ]
  },
  {
    group: { fr: 'Socle', en: 'Base' },
    items: [
      { name: 'C', note: { fr: 'Le premier, et celui qui explique les autres.', en: 'The first one, and the one that explains the rest.' } },
      { name: 'Linux', note: { fr: 'systemd, images immuables, démarrage vérifié.', en: 'systemd, immutable images, verified boot.' } },
      { name: 'Git', note: { fr: 'Branches, historique lisible, retours en arrière.', en: 'Branches, readable history, going back.' } },
      { name: { fr: 'Intégration continue', en: 'Continuous integration' }, note: { fr: 'Là où une mesure devient une garantie.', en: 'Where a measurement becomes a guarantee.' } }
    ]
  }
];

export const principles = [
  {
    name: { fr: 'La clarté est une fonctionnalité', en: 'Clarity is a feature' },
    desc: {
      fr: 'Un code lisible se corrige plus vite, une interface lisible se traverse sans notice, une donnée bien nommée survit à son auteur.',
      en: 'Readable code is fixed faster, a readable interface needs no manual, well-named data outlives its author.'
    }
  },
  {
    name: { fr: 'Les garanties se prouvent', en: 'Guarantees get proven' },
    desc: {
      fr: 'Une mesure vérifiée par un programme vaut mieux qu’une intention écrite dans un README. Si ça compte, ça doit pouvoir échouer en CI.',
      en: 'A measurement checked by a program beats an intention written in a README. If it matters, it must be able to fail in CI.'
    }
  },
  {
    name: { fr: 'L’état réel s’écrit', en: 'The real state gets written down' },
    desc: {
      fr: 'Chaque dépôt dit où il en est, et ce qui n’a pas encore tourné sur une vraie machine. Annoncer fini ce qui ne l’est pas coûte plus cher que le retard.',
      en: 'Every repository states where it stands, and what has not yet run on real hardware. Calling a thing finished when it is not costs more than the delay.'
    }
  }
];

export const contact = {
  title: { fr: 'Contact', en: 'Contact' },
  lede: {
    fr: 'Un projet, une question technique, ou simplement une conversation : l’e-mail est le plus simple. Je réponds en quelques jours.',
    en: 'A project, a technical question, or just a conversation: email is simplest. I answer within a few days.'
  },
  note: {
    fr: 'Ce site est ouvert : son code et son contenu vivent dans le même dépôt que le reste.',
    en: 'This site is open: its code and its content live in the same repository as the rest.'
  }
};

// Nom de machine utilisé par l'invite du shell et par `neofetch`.
export const host = 'portfolio';
