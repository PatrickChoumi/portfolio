# Portfolio — variante « document »

Un portfolio qui est un document. Pas une application qui affiche un
document : un document.

Deux pages HTML statiques, une par langue, produites par un script de cent
lignes. Aucune dépendance — ni pour construire, ni pour servir. **Zéro octet
de JavaScript.**

![Le haut de la page](../docs/captures/minimal-haut.png)

---

## Le parti pris

La variante terminal (à la racine du dépôt) démontre ce qu'on peut faire.
Celle-ci démontre ce dont on peut se passer.

Ce qui a été retiré, et pourquoi :

| Retiré | Pourquoi |
| --- | --- |
| Le JavaScript, en entier | `<details>` fait le dépli, le navigateur fait le thème, un lien fait la langue. Il ne restait rien à écrire. |
| Le bundler | Le site est deux pages et deux polices. Vite apporterait une configuration et un arbre de dépendances pour concaténer un fichier CSS. |
| La seconde police, et le gras | Une seule famille, une seule graisse. La hiérarchie vient de la taille, du blanc et de l'italique. |
| La couleur | Encre sombre sur papier chaud, l'inverse la nuit. Pas d'accent, pas de pastille, pas de badge. |
| Les cartes, ombres et coins arrondis | La seule ligne autorisée est un filet d'un pixel entre deux rangées. |
| Les jauges de compétence | « Quatre sur cinq » ne veut rien dire pour celui qui lit, et beaucoup trop pour celui qui écrit. Une liste suffit. |
| Le sélecteur de thème | Le système d'exploitation connaît déjà la préférence de son utilisateur. Lui redemander est une redondance, pas un service. |

Ce qui reste : du texte bien posé.

## Démarrer

```bash
node serve.mjs       # http://localhost:4321  (reconstruit à chaque F5)
node build.mjs       # écrit dist/
node --test tests/*.test.mjs
```

Aucun `npm install` : il n'y a rien à installer.

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur local, rebuild à chaque requête de page |
| `npm run build` | écrit `dist/` et affiche le poids obtenu |
| `npm test` | 21 tests — audit du contenu et du HTML produit |
| `npm run fonts` | re-télécharge et auto-héberge la police |

## Personnaliser : un seul fichier

Tout vit dans **`content.js`**. Chaque champ traduisible est un objet
`{ fr, en }` ; une chaîne nue sert dans les deux langues.

```js
export const work = [
  {
    id: 'atlas',                       // ancre : /#atlas
    name: 'Atlas',
    year: '2024',
    line: { fr: 'Une ligne, pas deux.', en: 'One line, not two.' },
    detail: { fr: ['…'], en: ['…'] },  // replié par défaut
    stack: ['Node', 'Git'],
    url: null                          // null → pas de lien affiché
  }
];
```

**Les tests refusent ce qui déborde.** Ce n'est pas du zèle : une mise en page
qui repose sur le blanc n'a pas de marge d'erreur. Une accroche de projet est
plafonnée à 80 caractères, la ligne d'un poste à 100, l'accroche de la page à
260, le colophon à 330. Le nombre de paragraphes doit être identique dans les
deux langues, le parcours antéchronologique, les outils tenir en trois
groupes. Chaque limite dépassée fait échouer `npm test`.

> ⚠️ Les données livrées sont un **canevas crédible**, pas une biographie :
> remplace-les par ton parcours réel avant de publier.

## Ce que les tests garantissent

Le colophon, en bas de page, fait des promesses au lecteur. Les tests sont ce
qui les empêche de devenir des mensonges au fil des commits :

- aucune balise `<script>`, aucun gestionnaire d'événement inline, aucune URL `javascript:` — et le colophon continue de l'affirmer dans les deux langues ;
- aucune ressource chargée depuis un tiers, aucune trace de Google Fonts, aucun `@import` distant ;
- la police est bien auto-hébergée et préchargée ;
- un `h1` unique, un lien d'évitement qui pointe sur une cible réelle, chaque section reliée à son titre par `aria-labelledby` ;
- chaque projet et chaque poste a sa rangée `<details>` avec son `<summary>` ;
- les deux pages se renvoient l'une à l'autre (`hreflang`) ;
- **le poids compressé reste sous 10 Ko** — le budget est un test, pas une intention.

## Structure

```
content.js              ← la source unique de vérité
build.mjs               100 lignes : rend, injecte le CSS, copie public/
serve.mjs               40 lignes : serveur local sans dépendance
src/page.mjs            le gabarit — une fonction, une chaîne
src/styles.css          la feuille de style, non minifiée (elle se lit)
src/fonts.css           généré par scripts/fetch-fonts.mjs
public/fonts/           Newsreader, sous-ensemble latin (46 Ko)
tests/                  21 tests node:test
```

Le CSS n'est pas minifié, volontairement : la page se lit aussi en « afficher
la source ». Compressé, l'écart avec une version minifiée se compte en
centaines d'octets.

## Poids

```
index.html      23,0 Ko   gzip 7,2 Ko
en/index.html   22,3 Ko   gzip 7,0 Ko
dist/           91 Ko au total, polices comprises
                0 octet de JavaScript
```

Le CSS est inline dans chaque page : sur un site de deux pages, un fichier
séparé coûterait un aller-retour de plus pour économiser un cache que
personne n'atteindra.

## Déploiement

`dist/` est entièrement statique et n'a besoin d'aucune réécriture d'URL —
il n'y a que deux chemins, `/` et `/en/`. N'importe quel hébergeur statique
convient, sans configuration.

## Licence

Le code est réutilisable. Le contenu appartient à son auteur. Newsreader est
sous SIL Open Font License 1.1 (voir `public/fonts/LICENSE.txt`).
