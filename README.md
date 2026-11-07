# Super Malice 🍬

Un jeu de plateforme imaginé par Alice.

**Malice** (casquette rose, salopette rose, t-shirt blanc, cheveux blonds et grosse moustache noire)
doit traverser 5 mondes pour sauver le **bébé oiseau** coincé sur un rocher au cœur du volcan…
puis le ramener chez sa famille, au pays des bonbons !

👉 **Jouer : https://jlehen.github.io/SuperMalice/**

## Les 8 niveaux et les 2 stages d'entraînement

1. **La Prairie Fleurie** : on apprend à jouer, des fleurs qui parlent donnent des conseils
2. **La Forêt des Épines** : ronces, coccinelles et chips au vinaigre
   - ⭐ **Stage d'entraînement : le Défi du Super Saut** → on gagne le badge *Super Saut*
3. **La Vallée des Orages** : il pleut des éclairs au chocolat, attention aux Rubik's cubes
4. **Les Pentes du Volcan** : plateformes qui bougent et coccinelles volantes
   - ⭐ **Stage d'entraînement : le Défi de la Moustache-Grappin** → on gagne le badge *Moustache-Grappin*
5. **Le Cœur du Volcan** : la lave partout… et le bébé oiseau à sauver ! (il faut utiliser les deux badges)

**Le retour à la maison** (débloqué quand on a sauvé le bébé oiseau) : le bébé oiseau voyage sur la casquette
de Malice, pépie de temps en temps, et c'est lui qui donne les conseils.

6. **La Grotte aux Cristaux** : il fait noir ! Les minerais (or, rubis, émeraude, topaze, diamant) éclairent
   tout autour de Malice pendant un moment, de leur couleur. Champignons qui font rebondir,
   stalactites qui tremblent puis tombent, chauves-souris qui dorment au plafond puis foncent sur Malice.
7. **La Montagne des Nuages** : ponts arc-en-ciel, oiseaux grincheux qui volent en faisant des vagues,
   et du vent qui souffle par rafales (les flèches blanches montrent où et dans quel sens).
8. **Le Monde des Bonbons** : rivières de chocolat (on ne se brûle pas, on s'enfonce : vite, il faut sauter !),
   guimauves qui font rebondir, oursons en gélatine qui sautent partout, et des gros yeux bonbons tout gentils
   qui s'enfuient : si on en attrape un, une vie en plus et tous les cœurs ! Au bout, toute la famille oiseau
   attend dans son nid, sur un gâteau géant.

## Les personnages

**Super Malice** est toujours là. À chaque fois qu'on charge le jeu, **3 autres personnages** sont tirés au hasard
parmi 13 : on choisit son personnage après « Jouer ». Chacun a un pouvoir (touche **B**, ou le bouton étoile sur tablette) :

| Personnage | Pouvoir |
|---|---|
| Le Lutin | un bloc lutin magique apparaît sous ses pieds (il disparaît au bout de 6 secondes) |
| La Biche | double saut |
| Gros Bonbon | garder B : il roule en boule et rebondit très haut |
| Ronaxel | tire un ballon ; en l'air, saut « SIUUU ! » tout là-haut |
| Le Poussin | en l'air, il bat des ailes 3 fois pour remonter |
| Luisy | saute très haut, et plane en gardant le saut appuyé |
| Messi | garder B (ou courir) : il dribble à travers les ennemis |
| La Licorne | charge arc-en-ciel avec sa corne, même en l'air |
| Bébé Dragon | crache des bulles de feu, et la lave ne lui fait rien |
| Le Pingouin | glisse sur le ventre et renverse tout |
| Le Chat Ninja | s'accroche aux murs et saute de mur en mur |
| La Sirène | une vague qui renverse les ennemis ; en l'air, une bulle l'emporte vers le haut |
| Le Dinosaure | BOUM : le sol tremble (aussi en écrasant vers le bas) |

Tous gardent le caramel, les chips et les badges.

**Méthode cachée pour tester** : sur l'écran d'accueil, toucher (ou cliquer) **5 fois de suite le numéro de version**
en bas à droite : tous les personnages apparaissent. On peut aussi mettre `?personnages=tous` dans l'adresse,
ou `?perso=licorne` pour jouer directement avec un personnage (`index.html?niveau=2&perso=dino`).

Les dessins sont dans [`js/persos/`](js/persos/) (un fichier par personnage), les pouvoirs dans [`js/pouvoirs.js`](js/pouvoirs.js).
La page [`outils/galerie.html`](outils/galerie.html) montre tous les personnages dans toutes leurs poses.

## Les badges

- **Super Saut** : rester appuyé sur ↓ pour s'accroupir, puis sauter → on saute deux fois plus haut.
- **Moustache-Grappin** : près d'un anneau doré, appuyer sur **V** : la moustache de Malice s'y accroche.
  On se balance avec ← →, on saute pour se lancer, et on peut enchaîner les anneaux.

## Quand Malice a mal

Chaque danger lui fait quelque chose de différent quand elle perd de l'énergie :

| Danger | Ce qui arrive à Malice |
|---|---|
| Ronces au sol | ça pique les fesses ! Elle s'envole en se tenant les fesses toutes rouges |
| Ronces qui pendent | une grosse bosse soulève sa casquette (avec les épines plantées dedans) |
| Éclairs au chocolat | électrocutée : figée, on voit son squelette, puis les cheveux en pétard qui fument |
| Boulets des coccinelles | K.O. une demi-seconde : la langue qui pend, les yeux mi-clos, des étoiles autour de la tête |
| Gros œil | hypnotisée : yeux en spirale, elle avance les bras tendus comme une somnambule |
| Rubik's cube | toutes ses couleurs sont mélangées, puis reviennent une par une (clic, clic…) |
| Morceaux de cube qui explose | toute noire de suie, cheveux en pétard, elle tousse des petits nuages |
| Coccinelle | couverte de points noirs, qui sautent un par un (le dernier sur le nez) |

## Commandes

| Clavier | Action |
|---|---|
| ← → (ou Q D) | Marcher |
| → une fois vite, puis → sans lâcher | Courir (marche aussi vers la gauche) |
| Espace, ↑ ou Z | Sauter (garder appuyé pour sauter plus haut) |
| ↓ ou S en l'air | Écraser vers le bas (casse les blocs lutin) |
| X | Lancer du caramel |
| C | Lancer des chips |
| V | Moustache-grappin (avec le badge) |
| B | Pouvoir du personnage |
| Échap ou P | Pause |
| M | Couper le son |

Sur tablette ou téléphone (à tenir à l'horizontale), des gros boutons apparaissent sur l'écran.
Pour courir, c'est pareil avec le bouton ◀ ou ▶ (ou la manette) : un appui rapide, puis on rappuie
et on reste appuyé. En courant, on saute beaucoup plus loin.

Quand Malice touche un drapeau, il se transforme en papillon : si elle perd une vie, elle repartira de là
(le papillon l'attend, posé en haut du mât). Le drapeau de l'arrivée devient un grand papillon étoilé qui lui tourne autour.

Astuce : si on ne touche à rien pendant quelques secondes, Malice se tourne vers toi et fait une grimace.
Une manette de jeu fonctionne aussi.

## Difficulté (choisie au début)

- **Bébé** : comme Gentil, en plus doux. Les ennemis sont plus lents, les éclairs plus rares,
  l'étoile dure 30 secondes au lieu de 15 et protège même de la lave (Malice rebondit dessus),
  et surtout le caramel et les chips marchent pour toujours : un ennemi collé ou essoufflé le reste.
- **Gentil** : vies illimitées, on repart du dernier drapeau.
- **Classique** : 3 vies ; si on les perd toutes, on recommence le niveau.
- **Difficile** : 3 vies ; si on les perd toutes, retour au tout début du jeu
  (pendant le retour à la maison : retour à la grotte).

Les ennemis sont aussi un peu plus rapides en Classique et en Difficile.
100 friandises (bonbons, sucettes, balles) donnent une vie en plus.

La progression (niveaux débloqués) est gardée dans le navigateur. Pour tout effacer :
« Jouer » → écran « Choisis un niveau » → **Recommencer depuis le début** (une confirmation est demandée).

## Inventer ses propres niveaux

Les niveaux sont dessinés avec des lettres dans [`js/levels.js`](js/levels.js) : une lettre = une case.
La légende est en haut du fichier (`#` = sol, `~` = lave, `E` = gros œil, `S` = bloc lutin avec une étoile…).
Il suffit de modifier les lettres et de recharger la page.

Pour tester directement un niveau : `index.html?niveau=3` (de 1 à 8), ou un stage d'entraînement : `index.html?stage=1`
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
  | La Grotte aux Cristaux | do mineur, lent et mystérieux : la mélodie au célesta revient en écho, bourdon d'orgue, gouttes d'eau |
  | La Montagne des Nuages | ballade planante en fa majeur, flûte de pan, harpe en arpèges, nappes de cordes, carillon à vent |
  | Le Monde des Bonbons | polka de fête foraine : orgue de barbarie, tuba « oum-pa », glockenspiel, wood-blocks |
  | Victoire | marche triomphale en ré majeur, avec la vraie fin du morceau |
  | La famille oiseau (grande fin) | chanson joyeuse en mi majeur, flûte et guitare ; les oisillons répondent en sifflant avec des trilles |
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
| `js/heroes.js` | La liste des personnages, et ce qu'ils ont tous en commun pour les dessiner |
| `js/persos/` | Le dessin de chaque personnage |
| `js/pouvoirs.js` | Les pouvoirs des personnages |
| `js/art.js` | Dessins des personnages et objets |
| `js/scenery.js` | Dessins des décors de tous les mondes |
| `js/audio.js` | Sons, instruments et lecteur de musique |
| `js/music.js` | La partition du thème et ses variations |
| `js/input.js` | Clavier, écran tactile, manette |
| `js/levels.js` | Les cartes des niveaux |
| `js/version.js` | Numéro de version (rempli automatiquement à la publication) |
