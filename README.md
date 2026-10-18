# Super Malice 🍬

Un jeu de plateforme imaginé par Alice.

**Malice** (casquette rose, salopette rose, t-shirt blanc, cheveux blonds et grosse moustache noire)
doit traverser 5 mondes pour sauver le **bébé oiseau** coincé sur un rocher au cœur du volcan.

👉 **Jouer : https://jlehen.github.io/SuperMalice/**

## Les 5 niveaux et les 2 stages d'entraînement

1. **La Prairie Fleurie** : on apprend à jouer, des fleurs qui parlent donnent des conseils
2. **La Forêt des Épines** : ronces, coccinelles et chips au vinaigre
   - ⭐ **Stage d'entraînement : le Défi du Super Saut** → on gagne le badge *Super Saut*
3. **La Vallée des Orages** : il pleut des éclairs au chocolat, attention aux Rubik's cubes
4. **Les Pentes du Volcan** : plateformes qui bougent et coccinelles volantes
   - ⭐ **Stage d'entraînement : le Défi de la Moustache-Grappin** → on gagne le badge *Moustache-Grappin*
5. **Le Cœur du Volcan** : la lave partout… et le bébé oiseau à sauver ! (il faut utiliser les deux badges)

## Les badges

- **Super Saut** : rester appuyé sur ↓ pour s'accroupir, puis sauter → on saute deux fois plus haut.
- **Moustache-Grappin** : près d'un anneau doré, appuyer sur **V** : la moustache de Malice s'y accroche.
  On se balance avec ← →, on saute pour se lancer, et on peut enchaîner les anneaux.

## Commandes

| Clavier | Action |
|---|---|
| ← → (ou Q D) | Marcher |
| Espace, ↑ ou Z | Sauter (garder appuyé pour sauter plus haut) |
| ↓ ou S en l'air | Écraser vers le bas (casse les blocs lutin) |
| X | Lancer du caramel |
| C | Lancer des chips |
| V | Moustache-grappin (avec le badge) |
| Échap ou P | Pause |
| M | Couper le son |

Sur tablette ou téléphone (à tenir à l'horizontale), des gros boutons apparaissent sur l'écran.

Astuce : si on ne touche à rien pendant quelques secondes, Malice se tourne vers toi et fait une grimace.
Une manette de jeu fonctionne aussi.

## Difficulté (choisie au début)

- **Bébé** : comme Gentil, en plus doux. Les ennemis sont plus lents, les éclairs plus rares,
  l'étoile dure 30 secondes au lieu de 15, et surtout le caramel et les chips marchent pour toujours :
  un ennemi collé ou essoufflé le reste.
- **Gentil** : vies illimitées, on repart du dernier drapeau.
- **Classique** : 3 vies ; si on les perd toutes, on recommence le niveau.
- **Difficile** : 3 vies ; si on les perd toutes, retour au tout début du jeu.

Les ennemis sont aussi un peu plus rapides en Classique et en Difficile.
100 friandises (bonbons, sucettes, balles) donnent une vie en plus.

La progression (niveaux débloqués) est gardée dans le navigateur. Pour tout effacer :
« Jouer » → écran « Choisis un niveau » → **Recommencer depuis le début** (une confirmation est demandée).

## Inventer ses propres niveaux

Les niveaux sont dessinés avec des lettres dans [`js/levels.js`](js/levels.js) : une lettre = une case.
La légende est en haut du fichier (`#` = sol, `~` = lave, `E` = gros œil, `S` = bloc lutin avec une étoile…).
Il suffit de modifier les lettres et de recharger la page.

Pour tester directement un niveau : `index.html?niveau=3`, ou un stage d'entraînement : `index.html?stage=1`
(on peut ajouter `&difficulte=bebe`, `&difficulte=classique` ou `&difficulte=difficile`).

## Pour les grands : comment c'est fait

- Pure page web (HTML + JavaScript), sans aucune dépendance ni étape de compilation.
- Tous les dessins sont faits en code (canvas), tous les sons et musiques sont synthétisés (Web Audio).
- Les musiques sont des variations sur le thème de *Super Mario Bros.* (partition « Overworld »,
  et « Invincible » pour l'étoile), transcrites dans [`js/music.js`](js/music.js) puis réarrangées pour chaque monde :

  | Monde | Variation |
  |---|---|
  | Écran titre | la version d'origine, façon console 8 bits |
  | La Prairie Fleurie | calypso au steel drum, basse 3+3+2 |
  | La Forêt des Épines | do mineur en 12/8, flûte et harpe, entrées en canon |
  | Stage du Super Saut | bossa nova, accords de jazz, vibraphone |
  | La Vallée des Orages | do mineur rapide, arpèges électriques, la mélodie passe à la basse |
  | Les Pentes du Volcan | valse à 3/4 en mode lydien, accordéon et tuba |
  | Stage de la Moustache-Grappin | jazz swing, walking bass, substitution de triton |
  | Le Cœur du Volcan | marche épique en mineur, pédale d'orgue, timbales |
  | Victoire | marche triomphale en ré majeur, avec la vraie fin du morceau |
  | Étoile (invincible) | disco arc-en-ciel : la mélodie ne bouge pas, les accords changent sous elle, puis tout monte d'un ton |
- Polices : Fredoka et Luckiest Guy (Google Fonts).
- Le site est publié automatiquement sur GitHub Pages à chaque `git push` sur `main`
  (voir [`.github/workflows/pages.yml`](.github/workflows/pages.yml)).
- Le numéro de version (en bas à droite de l'écran d'accueil) est calculé à la publication :
  `1.<nombre de commits> · <date>`. Il augmente à chaque mise à jour ; en local, il affiche « dev ».
- Pour jouer en local : ouvrir `index.html` dans un navigateur (double-clic), ou lancer
  `python3 -m http.server` dans le dossier puis aller sur http://localhost:8000.

| Fichier | Contenu |
|---|---|
| `index.html`, `css/style.css` | Page, menus, boutons tactiles |
| `js/game.js` | Déroulement du jeu, menus, HUD |
| `js/world.js` | Un niveau en cours : décor, collisions, caméra |
| `js/entities.js` | Malice, ennemis, bonus, dangers |
| `js/art.js` | Dessins des personnages et objets |
| `js/scenery.js` | Dessins des décors des 5 mondes |
| `js/audio.js` | Sons, instruments et lecteur de musique |
| `js/music.js` | La partition du thème et ses variations |
| `js/input.js` | Clavier, écran tactile, manette |
| `js/levels.js` | Les cartes des niveaux |
| `js/version.js` | Numéro de version (rempli automatiquement à la publication) |
