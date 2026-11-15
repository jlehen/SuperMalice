'use strict';

// =====================================================================
//  LES NIVEAUX DE SUPER MALICE
//  Chaque niveau est dessiné avec des lettres : une lettre = une case.
//  Tu peux modifier les cartes ci-dessous pour inventer tes propres niveaux !
//  (Toutes les lignes d'un niveau doivent avoir la même longueur.)
//
//   .  vide                      #  sol
//   B  brique                    -  plateforme qu'on traverse par dessous
//   ~  lave (chocolat au monde des bonbons)   ^  ronces (au sol)     v  ronces (qui pendent)
//   =  pont arc-en-ciel (une plateforme qu'on traverse par dessous)
//   M  champignon qui fait rebondir (guimauve au monde des bonbons)
//      (dans les Champignons Géants, "theme: mushrooms" : chaque rangée de - ou de M côte à côte est un grand
//      chapeau de champignon sur son grand pied ; les M sont les chapeaux bleus à pois qui font rebondir)
//      (avec le badge Super Saut, ↓ gardé en arrivant dessus : Malice s'accroupit sur le chapeau, et saute encore plus haut)
//      (dans le Défi du Super Saut, "theme: sousbois" : - et M sont aussi de grands chapeaux, = est une branche sur un
//      tronc |, et au-dessus du sol, les murs # sont de grosses souches couvertes de mousse)
//      (dans le Marais aux Cabanes, "theme: marsh" : ~ est de la boue où l'on s'enfonce, comme le chocolat ;
//      chaque rangée de 3 - ou plus est le plancher d'une cabane sur pilotis, et = est un pont de corde)
//   w  flaque d'eau, posée sur le sol (plouf ! et Gizmo devient un Gremlin)
//   |  tronc d'arbre (dans le décor : on passe devant ; dans les Grands Arbres, - est une branche)
//   *  pissenlit géant, planté sur une branche ou qui flotte en l'air : on l'attrape en le touchant,
//      et on descend tout doucement avec (↓ pour le lâcher ; il repousse au bout de quelques secondes)
//   _  eau de la rivière (plouf : on ressort sur la berge, tout mouillé, avec un cœur en moins ;
//      la Sirène et le Pingouin nagent dedans)
//   n  nénuphar avec une fleur (solide)        c  nénuphar grignoté : il tremble, puis il coule
//      (les nénuphars se mettent dans la rangée de la surface de l'eau)
//   O  escargot (il laisse de la bave qui glisse)
//   m  taupe (cachée sous l'herbe ; quand Malice passe, elle file sous ses pieds et jaillit du sol)
//   h  hérisson (quand Malice approche, il se met en boule : ça pique ! On lui saute dessus quand il se déroule)
//   s  sanglier (quand il voit Malice, il gratte le sol, puis il fonce tout droit jusqu'à se cogner ou jusqu'au
//      bord : on lui saute dessus pendant qu'il gratte, ou quand il est étourdi ; seul le sanglier qui fonce fait mal)
//   J  liane : elle pend du haut de la première case J, aussi longue que les J les uns sous les autres (mettre du
//      bois ou un champignon juste au-dessus). On l'attrape en sautant dessus, on se balance avec ← →, et on saute
//      pour se lancer (tous les personnages)
//   q  écureuil (dans le décor : il grignote un gland devant son trou, et y file quand Malice arrive)
//   k  nid d'oisillons (dans le décor : ils piaillent quand Malice passe)
//   p  le nid secret : un oisillon qui fait un câlin à Malice et lui donne une vie (une seule fois)
//      (dans le Vieux Chêne, "theme: oak" : # est le bois du tronc, et - un champignon-étagère accroché au bois)
//   i  lucioles (un petit groupe qui éclaire la nuit, et qui suit Malice un moment)
//   j  grande fleur-lanterne qui brille (elle éclaire tout autour, la nuit)
//   l  lapin (gentil ; sur l'herbe, il sort la tête de son trou ; dans un terrier, il parle : voir "lapins")
//   L  bloc lutin : 5 bonbons    F  bloc lutin : fruit de la passion
//   K  bloc lutin : caramel      C  bloc lutin : chips au vinaigre
//   S  bloc lutin : étoile (5 bonbons si on n'a pas pris Super Malice)
//   o  bonbon     y  sucette (vaut 5)     b  balle multicolore
//   E  gros oeil à pattes        R  Rubik's cube
//   D  coccinelle                W  coccinelle volante
//   V  chauve-souris (sous le plafond)       A  stalactite qui tombe (sous le plafond)
//   Y  oiseau grincheux          U  ourson en gélatine
//   Q  gros œil bonbon (gentil : si on l'attrape, une vie en plus)
//   g r e t d  minerais (or, rubis, émeraude, topaze, diamant) : ils éclairent la grotte
//   H  plateforme qui va à droite (3 cases)
//   I  plateforme qui monte (3 cases)
//   T  fleur qui parle (ses phrases sont dans "talk", dans l'ordre)
//   @  anneau doré pour la moustache-grappin
//   Z  trophée du badge (fin d'un stage d'entraînement)
//   P  départ de Malice          !  drapeau (on y repart si on perd une vie)
//   G  arrivée du niveau         N  le bébé oiseau (on le sauve dans le volcan)
//   X  la famille du bébé oiseau (fin du jeu)
//   &  le boss du niveau (voir "boss" ; ses pieds sur le sol de la case du dessous)
//
//  "storms" : les colonnes où tombent les éclairs au chocolat [début, fin].
//  "winds" : les colonnes où souffle le vent [début, fin, sens] (1 = vers la droite, -1 = vers la gauche).
//  "updrafts" : les colonnes où l'air monte [début, fin, rangée] : avec un pissenlit, on remonte
//             jusqu'à cette rangée (des feuilles s'envolent pour qu'on les voie).
//  "terrier" : à partir de cette rangée, on est sous terre (les galeries d'un terrier secret, avec des racines) :
//             la caméra n'y descend que quand Malice y tombe. Le niveau a alors plus de 13 rangées.
//             Un bloc lutin posé sur un trou qui descend au terrier le cache : on l'écrase pour y entrer.
//  "lapins" : ce que disent les lapins du terrier, dans l'ordre, de gauche à droite.
//  "dark" : il fait noir (on ne voit qu'autour de Malice et de ce qui brille).
//             "nuit" : c'est la nuit, en plus doux (la lune, les lucioles et les fleurs éclairent).
//  "clairDeLune" : [première colonne, dernière colonne] : la nuit, la lune éclaire ce grand champ
//             (il y fait bien moins noir).
//  "basVisible" : la caméra montre le bas du niveau (la boue sous les ponts du marais : le niveau n'a que
//             12 rangées, presque la hauteur de l'écran) ; elle ne monte que pendant un très haut saut, pour que
//             la tête de Malice reste à l'écran (même au-dessus du haut du niveau : voir World.updateCamera).
//  "haut" : le niveau est bien plus haut que l'écran (on monte dans les grands arbres) : comme pour "grimpe", la caméra
//             suit la branche ou le chapeau où Malice a les pieds, et sa tête ne sort jamais de l'écran (même au-dessus
//             du haut du niveau, après un très grand saut).
//  "cachette" : [première colonne, première rangée, dernière colonne, dernière rangée] : un coin secret caché derrière
//             un gros feuillage (tout en haut d'un arbre) ; les feuilles s'écartent quand Malice entre dedans.
//  "feuillage" : [[première colonne, première rangée, dernière colonne, dernière rangée], …] : de gros feuillages dans
//             le décor (on passe à travers), par exemple pour accrocher des lianes J sans branche où marcher.
//  "galeries" : les passages bas sous un plafond (une ou deux cases de haut, entre deux cases solides)
//             sont dessinés comme des galeries de terre : une butte se lit comme une colline percée d'un tunnel.
//  "grimpe" : on monte dans le niveau (bien plus haut que l'écran) : la caméra suit l'étage où Malice a les pieds,
//             et les fleurs qui parlent et les drapeaux vont de bas en haut (un drapeau se touche).
//  "tronc" : [première colonne, dernière colonne] : le tronc creux du Vieux Chêne (ses murs compris). À gauche, c'est
//             dehors (la forêt) : on voit le tronc de l'extérieur, avec sa porte (le trou en bas de son mur de gauche),
//             et dedans, l'écran reste entre ses murs.
//  "couronne" : tout en haut, la rangée (dans le fond) où le tronc s'ouvre sur les feuilles du chêne.
//  "music" : la musique du niveau, si ce n'est pas celle de son monde (voir SONGS dans music.js).
//  "sansBadges" : pour les personnages qui n'ont pas les badges (tous sauf Malice) :
//             "add" : des cases en plus [ligne, colonne, "lettres"] (les anneaux dorés disparaissent),
//             "talk" : d'autres phrases pour les fleurs { numéro de la phrase : "phrase" }.
//
//  LES MONDES
//  "world" : le monde du niveau (1 = la Prairie, 2 = la Forêt… voir WORLDS juste en dessous).
//             Dans un monde, les niveaux se suivent dans l'ordre où ils sont écrits ici :
//             le premier est le 1-1, le suivant le 1-2… Pour ajouter un niveau à un monde,
//             il suffit d'écrire un niveau de plus avec son "world" : la carte suit toute seule.
//  "badge" : c'est le stage d'entraînement du monde (une case étoile à côté du chemin, juste
//             avant le monde suivant). Un seul stage par monde.
//  "boss" : le niveau se termine par un boss : son nom (voir js/boss/ : "epouvantail"…) ; il attend sur le "&"
//             de la carte. Sur le dernier niveau d'un monde, sa case devient le château du bout du monde.
//  "arene" : [première colonne, dernière colonne] : l'arène du boss (20 colonnes, la largeur de l'écran).
//             Quand Malice y entre, le boss se réveille et on ne peut plus en sortir tant qu'il n'est pas battu ;
//             l'arrivée (G) n'apparaît qu'après. Mettre un drapeau (!) juste avant : on y repart si on perd une vie.
// =====================================================================

// "sequel" : le retour à la maison (après avoir sauvé le bébé oiseau). Le bébé oiseau est sur
// la casquette de Malice, et c'est lui qui donne les conseils (les "T" ne font pas pousser de fleur).
// "theme" : le décor du monde sur la carte (et celui de ses niveaux, s'ils n'en ont pas un autre).
const WORLDS = [
  { name: "La Prairie", theme: "meadow" },
  { name: "La Forêt", theme: "forest" },
  { name: "La Vallée des Orages", theme: "storm" },
  { name: "Les Pentes du Volcan", theme: "mountain" },
  { name: "Le Cœur du Volcan", theme: "volcano" },
  { name: "La Grotte", theme: "cave", sequel: true },
  { name: "La Montagne des Nuages", theme: "sky", sequel: true },
  { name: "Le Pays des Bonbons", theme: "candy", sequel: true },
];

const LEVELS = [
  {
    world: 1,
    name: "La Prairie Fleurie",
    theme: "meadow",
    intro: "Le bébé oiseau a besoin de toi !",
    storms: [],
    talk: [
      "Bonjour Malice ! Le bébé oiseau est coincé dans le volcan. Va vite le sauver !",
      "Tape les blocs lutin avec ta tête pour les casser !",
      "Les gros yeux veulent t'attraper. Saute-leur sur la tête !",
      "La lave, ça brûle ! Saute bien par-dessus.",
      "Le caramel colle les ennemis par terre. Essaie-le sur les gros yeux !",
      "Il y a un bloc lutin tout là-haut. Monte sur la plateforme !",
      "Saute sur ce bloc lutin et appuie vers le bas pour l'écraser !",
      "Pour courir, appuie une fois vite sur {AVANCER}, puis rappuie et reste appuyée ! Avec de l'élan, tu sautes bien plus loin.",
    ],
    map: [
      '........................................................................................................................................................................................................',
      '........................................................................................................................................................................................................',
      '........................................................................................................................................................................................................',
      '........................................................................................................................................................................................................',
      '.............................................................................................................L..........................................................................................',
      '...............................................................................S........................................................................................................................',
      '.........................................................y..............................................................................................................................................',
      '..........................................................................................................ooo.............................................y.............................................',
      '...............BLB..............oo.....ooo......BKB...................ooo....----........................#######...................................................oLo..................................',
      '......................................#####............................................................#########..................o.o.o..................---.......................ooooo................',
      '..P..T..ooo.T........T.ww.E...T.......#####...T........E....E....!.........T......ww.^^....E...E...E.###########.....T..BFB....E.......^.ww.!.T..E........................E....E..............G.........',
      '################################..####################################...#######################################...###################################........##########################################',
      '################################~~####################################~~~#######################################~~~###################################~~~~~~~~##########################################',
    ],
  },
  {
    world: 1,
    name: "Les Grands Arbres",
    theme: "treetops",
    intro: "Tout là-haut, de branche en branche !",
    storms: [],
    updrafts: [[88, 91, 4], [157, 161, 4]],
    talk: [
      "Bienvenue dans les Grands Arbres\u00a0! On est tout là-haut\u00a0: saute de branche en branche, et ne tombe pas\u00a0!",
      "Un pissenlit géant\u00a0! Touche-le\u00a0: il t'emporte dans les airs. Dirige-toi avec {FLECHES}, et appuie sur {BAS} pour le lâcher.",
      "Tu vois les feuilles qui s'envolent\u00a0? C'est un courant d'air\u00a0! Avec un pissenlit, arrête-toi dedans\u00a0: tu vas monter tout là-haut\u00a0!",
      "Ce pissenlit flotte en l'air. Saute pour l'attraper\u00a0!",
      "Un très grand vol\u00a0! Appuie sur {AVANCER} sans lâcher\u00a0: au milieu, le courant d'air te fera remonter.",
    ],
    map: [
      '..............................................................................................................................................................................................................',
      '.................................................................................................||...........................................................................................................',
      '.................................................................................||..............||..........................................C................................................................',
      '............K...........................||.T....*o.o.............................||..........yooo||.y.....F..||........................||.................................................S...................',
      '..............||........................||-------....o.................L.........||.........----------.......||.....*..................||..T.....*............................................................',
      '...........ooo||..........||............||............o.o........................||......o.......||.....ooo..||........................||---------..o.o...........o..................||.......................',
      '...........-------......L.||.......o..!.||Eo..............oo......||.oo.E........||.......o......||.....-----||........................||...............o.o.....o...o.o..............||.ooo...................',
      '..............||..........||.........--------................o....||------.......||......o......!||..........||........................||.oo................o.o.........o............||------.................',
      '.........oo...||.oo....ooo||...E........||........................||..........oT.||...*.......-----------..T.||E.......................||-----.......................................||............ooooo.G....',
      '..P..T.....---------..------------......||........................||.........----------..........||.......---------....................||..........................................E.||...E......#############',
      '#########.....||..........||............||.....................--------------....||..............||..........||.....................!..||.................................-----------------------#############',
      '#########.....||..........||............||........................||.............||..............||..........||..................-----------------...................................||..........#############',
      '#########.....||..........||............||........................||.............||..............||..........||........................||............................................||..........#############',
      '#########.....||..........||............||........................||.............||..............||..........||........................||............................................||..........#############',
    ],
  },
  {
    world: 1,
    name: "La Rivière aux Nénuphars",
    theme: "river",
    intro: "Saute de nénuphar en nénuphar !",
    storms: [],
    terrier: 13,
    talk: [
      "Bienvenue à la Rivière aux Nénuphars\u00a0! Saute de nénuphar en nénuphar… et ne tombe pas dans l'eau\u00a0: brrr, elle est toute froide\u00a0!",
      "Un escargot\u00a0! Il laisse de la bave qui brille\u00a0: dessus, ça glisse, et tu n'arrives plus à t'arrêter\u00a0! Saute-lui sur la coquille.",
      "Regarde bien les nénuphars\u00a0: ceux qui ont une fleur sont solides. Les autres sont grignotés\u00a0: ils tremblent, puis ils coulent\u00a0! Ne reste pas dessus\u00a0!",
      "Psst… les lapins ont creusé un terrier secret, plein de bonbons. Mais où est l'entrée\u00a0?",
      "La grande rivière\u00a0! Le rondin est plein de bave d'escargot\u00a0: ça glisse\u00a0! Ne t'arrête pas dessus, saute vite au nénuphar suivant.",
    ],
    lapins: [
      "Bienvenue dans notre terrier\u00a0! Tous ces bonbons sont pour toi. Pour ressortir, grimpe sur les racines, tout au bout\u00a0!",
      "Chut… Tu es juste sous la rivière\u00a0! Tu entends l'eau qui coule\u00a0?",
    ],
    map: [
      '......................................................................................................................................................................................................................',
      '......................................................................................................................................................................................................................',
      '......................................................................................................................................................................................................................',
      '......................................................................................................................................................................................................................',
      '......................................................................................................................................................................................................................',
      '......................................................................................................................................................................................................................',
      '..............................................ooooo................................ooooo..........o.o.o..........................................o.y.o................................BFB.........oooooo..............',
      '..............................................-----.........................y......-----............O.......................o..o.................-----............................................------..............',
      '...........BLB.........................K..........................................................------.........C............O.............S......................................o.o................................',
      '...........................o.o.o.o.................................o.o.o..............o..o.................................------........................o.o......................#########...........................',
      '..P..T..ooo...........E..............T....B.....O......B.oE.!.T..............O..................!.......T...l........T............o......!..O...........................!..oo.################..............E....G....',
      '##########################__n__n__##############################__n__c__c__#####__n__c__c__n__################L########__n_________n__c_######__c___c__n___c__#####---###########################__c__c__#############',
      '##########################________##############################___________#####______________################.########_________________######________________#####...###########################________#############',
      '##############################################################################################################.####################################################...################################################',
      '###########################################################################################################........................................................---################################################',
      '###########################################################################################################..............................bbbbb........................################################################',
      '###########################################################################################################...................y..........-----...........L............################################################',
      '###########################################################################################################......................o.o.o.o...........................---################################################',
      '###########################################################################################################..................###......................................################################################',
      '###########################################################################################################.....l..ooooooooo.###................O....l......oooooo....################################################',
      '######################################################################################################################################################################################################################',
    ],
  },
  {
    world: 1,
    name: "La Prairie la Nuit",
    theme: "night",
    dark: "nuit",
    music: "meadow-night",
    intro: "Les lucioles éclairent le chemin !",
    storms: [],
    updrafts: [[80, 82, 4]],
    clairDeLune: [185, 211],
    // au bout, l'Épouvantail garde son champ (voir js/boss/epouvantail.js)
    boss: "epouvantail",
    arene: [192, 211],
    talk: [
      "Bienvenue dans la Prairie la Nuit\u00a0! Il fait noir… mais les lucioles et les fleurs qui brillent éclairent le chemin. Approche-toi des lucioles\u00a0: elles vont te suivre\u00a0!",
      "Tu vois le petit tas de terre qui bouge\u00a0? C'est une taupe\u00a0! Quand la terre tremble sous tes pieds, saute vite\u00a0! Et quand elle sort, saute-lui sur le casque\u00a0!",
      "Le caramel colle les taupes\u00a0: elles ne peuvent plus rentrer sous terre\u00a0! Casse le bloc lutin pour en avoir.",
      "Un pissenlit géant, tout là-haut\u00a0! Attrape-le et vole par-dessus le grand trou. Au milieu, le courant d'air te fera remonter\u00a0!",
      "La rivière dort, elle aussi… Saute de nénuphar en nénuphar, mais ne reste pas sur ceux qui n'ont pas de fleur\u00a0!",
      "Plein de taupes\u00a0! Sur les planches, elles ne peuvent pas t'attraper. Et avec les chips, elles deviennent trop grosses pour rentrer dans leur trou\u00a0!",
      "Chut… Voici le champ de l'Épouvantail\u00a0! Saute par-dessus ses citrouilles. Le caramel colle ses bras\u00a0: alors, saute-lui sur le chapeau\u00a0!",
    ],
    map: [
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '........................................................................................................................................C...............S...........................................................',
      '.................................................................................i.......................................i..........................................................................................',
      '...............o......................................................y............................................................................i................................................................',
      '.............................o.o.o.o......oio.........o.o.o.................*...............ooo....................o.o.o....o.o.o.........................................ooo.....o.o...............................',
      '........i.....BLB................................BKB..-----..............####..o.o.o.o.................BFB..............................ooooo...o.y.o...ooooo.......................................................',
      '.......................................................................######...........................................................-----...-----...-----.......................................................',
      '..P..T..ooo.j.......E....T.......m....j..j....jT....E...m.......!..T.########..........j...........m.......!.T...........O.........jT......m...E....m..m........j...!..j.....m...j...j.T..!...................G..&..',
      '##########################################...################################.........########################__n__c__n_###__c__n_################################################...###############################',
      '##########################################...################################.........########################__________###_______################################################...###############################',
    ],
  },
  {
    world: 1,
    name: "Le Défi de la Roulade",
    theme: "meadow",
    badge: "roulade",
    galeries: true,
    intro: "",
    storms: [],
    talk: [
      "Bienvenue au stage d'entraînement\u00a0! Termine-le pour gagner le badge Roulade.",
      "Pour faire une roulade, {ROULADE}\u00a0! En boule, tu passes dans les tout petits trous, comme celui sous la butte.",
      "Un gros œil, sous un plafond trop bas pour sauter par-dessus\u00a0! Roule\u00a0: en boule, tu passes sous lui sans avoir mal\u00a0!",
      "Un escargot dans le tunnel\u00a0! Roule\u00a0: tu passes à travers lui. Tant que tu es sous le plafond, tu continues de rouler toute seule.",
      "Les taupes\u00a0! Quand la terre tremble, roule vite plus loin. Et si une taupe est dehors, roule à travers elle\u00a0!",
      "Plein de petits trous à la suite, et un très long tunnel\u00a0! Roule, relève-toi, et roule encore\u00a0!",
      "Le dernier défi\u00a0: un gros œil, et un tunnel juste derrière lui. Une seule roulade pour passer les deux\u00a0!",
      "Bravo\u00a0! Va chercher ton badge\u00a0!",
    ],
    map: [
      '..........................................................................................................................................................',
      '..........................................................................................................................................................',
      '..........................................................................................................................................................',
      '..........................................................................................................................................................',
      '..........................................................................................................................................................',
      '..............###........######.............################........................................###..###..###...##########.......##########...........',
      '..............###........######.............################........................................###..###..###...##########.......##########...........',
      '..............###........######.............################..................o.o.o.................###..###..###...##########.......##########...........',
      '..............###........######.............################........................................###..###..###...##########.......##########...........',
      '..............###........##..##.............################........................................###..###..###...##########.......##..######.......Z...',
      '..P..T...T....ooo...T......E.oo....!....T....O..oo................T..........m.....m.........!..T...o....o....o.......o.o.o.o....T.....E..ooo....T..#####.',
      '##########################################################################################################################################################',
      '##########################################################################################################################################################',
    ],
  },
  {
    world: 2,
    name: "La Forêt des Épines",
    theme: "forest",
    intro: "Attention aux ronces, ça pique !",
    storms: [],
    talk: [
      "Bienvenue dans la forêt ! Les ronces, ça pique : saute par-dessus.",
      "Les chips au vinaigre rendent les ennemis tout gros et tout essoufflés !",
      "Les coccinelles lancent leurs points noirs. Saute-leur dessus, et écrase aussi les points noirs !",
      "Sous les ronces qui pendent, ne saute pas : marche tout doucement !",
    ],
    map: [
      '.......................................................................................................................................................................................................................',
      '.......................................................................................................................................................................................................................',
      '.......................................................................................................................................................................................................................',
      '...........................................................K...........................................................................................................................................................',
      '.......................................................................................................................................................................................................................',
      '.......................................................................................................o.o.............................................................................................................',
      '..........................................................---..........................................................................................................................................................',
      '......................................BBBBBBBBB........o...............ooo..............................^.........................BBBBBBBBBBBB.........................................................................',
      '...................BCB......ooo........v..v..v........---......................................BLBFB..#####.........................v..v..v..v...........BSB.............................LCL...........................',
      '.......................................................................---............................#####...............................................................---..............................ooo.........',
      '..P..T...^^..ooo.T.......D.......T.ww..o.o.o.o....E.............D..!...........^^^....E..ww.D.........#####...D...E...!......T.......oo.oo.oo.....E...D.......E..E..D..!........ww.####.......D.....E...^......G.......',
      '############################...#######################################.....#############################################...#############################################.......########################################',
      '############################~~~#######################################~~~~~#############################################~~~#############################################~~~~~~~########################################',
    ],
  },
  {
    world: 2,
    name: "Les Champignons Géants",
    theme: "mushrooms",
    intro: "Saute de chapeau en chapeau !",
    storms: [],
    talk: [
      "Bienvenue chez les Champignons Géants\u00a0! Ici, tout est énorme… même les champignons\u00a0!",
      "Les chapeaux des champignons, c'est comme des plateformes\u00a0: saute de chapeau en chapeau\u00a0! Par en dessous, on passe à travers.",
      "Les champignons bleus à pois blancs font rebondir\u00a0! Saute dessus, et garde {SAUT} appuyé pour monter encore plus haut\u00a0!",
      "Un hérisson\u00a0! Quand tu t'approches, il se met en boule\u00a0: ne lui saute pas dessus, ça pique\u00a0! Attends qu'il se déroule pour renifler… et là, saute-lui vite dessus\u00a0!",
      "Le caramel colle les piquants des hérissons\u00a0: ils ne peuvent plus se mettre en boule\u00a0! Casse le bloc lutin pour en avoir.",
      "Oh, le très grand trou\u00a0! Rebondis sur le champignon bleu pour sauter jusqu'au grand chapeau.",
      "Avec les chips, les hérissons deviennent tout gros\u00a0: bien trop gros pour se mettre en boule\u00a0!",
    ],
    map: [
      '........................................................................................................................................................................................................................',
      '........................................................................................................................................................................................................................',
      '.............................................y..........................................................................................................................................................................',
      '........................................................................................................................................................................................................................',
      '.............................................o...........................................................................................................F..............................................................',
      '..........................oooo..................o.o.o...............................................................................o.o.o....................................................ooooo......................',
      '..........................----...............o..-----...............................................................................------.............o.o.o.................................-----......................',
      '................................................................o.o.o.o..................oo...oo...........ooo........BSB..............................-----...............................................o.o.o........',
      '...........o.o..L................................................................BKB.......................---.............................--...........................BCB........h....................................',
      '...........---........---......--..oo.....................................................................................................................h....................-------..................................',
      '...................................--..............................h.......................h....h......--......--.....................................########................................................h.........',
      '..P..T..ooo........T....................T...MMM....oooT........########.....!..T........###########.ooo....................!.T..MM..............D.....########......!.T.........^^^^.....MMM.........!.....#####...G....',
      '##################################....################################################################............#################..........######...########...#######################################################',
      '##################################....################################################################............#################..........######...########...#######################################################',
    ],
  },
  {
    world: 2,
    name: "Le Marais aux Cabanes",
    theme: "marsh",
    intro: "Gare aux sangliers dans la brume !",
    storms: [],
    basVisible: true,
    talk: [
      "Bienvenue au Marais aux Cabanes\u00a0! Ici, on passe de cabane en cabane par les ponts de corde… et attention à la boue\u00a0!",
      "La boue, ça ne brûle pas, mais on s'y enfonce tout doucement\u00a0! Si tu tombes dedans, saute vite pour en sortir\u00a0!",
      "Attention, un sanglier\u00a0! Quand il gratte le sol avec sa patte, c'est qu'il va foncer\u00a0! Saute-lui vite dessus pendant qu'il gratte… ou grimpe sur une cabane\u00a0!",
      "Un sanglier qui fonce, on ne peut pas l'arrêter\u00a0: saute par-dessus\u00a0! Mais s'il se cogne contre les caisses, il voit des étoiles\u00a0: c'est le moment de lui sauter dessus\u00a0!",
      "Le caramel colle les sangliers par terre\u00a0: ils ne peuvent plus foncer\u00a0! Casse le bloc lutin pour en avoir.",
      "Avec les chips, les sangliers deviennent tout gros\u00a0: bien trop lourds pour foncer\u00a0!",
    ],
    map: [
      '............................................................................................................................................................................................................................................',
      '............................................................................................................................................................................................................................................',
      '.......................BLB............................................................................................................................................................BFB...................................................',
      '.........................................................y...........................................y......................................................................................................................................',
      '............................................................................................................................................................................................................................................',
      '............................................................................................................................................................................................................................................',
      '...............o.....ooo..o.o.o....oo...................ooo.................BSB.............oo.......h...............BKB.......oo......oo.............BCB.....................oo..o.o.ooo............oo..o.o.h...o.o........................',
      '....................-----=====----====----.............-----........................oooooo.----=====-----===..................----====----...................................----=====----...!......----====----====........................',
      '..............o.o...................................................B..................h...................................B.................B................ooo............................######................................B........',
      '..P..T..oooT.........................T...T...!...............s......B...!..o.o......######............o........!....T......B.o.o....s........B...!..T............^^...D................s.....######.....................ooo...s....B...G....',
      '##############...#################....#########....##############################...#######.....#.....##...#..############################################...###########...########################.....#.....##.....#######################',
      '##############~~~#################~~~~#########~~~~##############################~~~#######~~~~~#~~~~~##~~~#~~############################################~~~###########~~~########################~~~~~#~~~~~##~~~~~#######################',
    ],
  },
  {
    world: 2,
    name: "Dans le Vieux Chêne",
    theme: "oak",
    music: "forest-oak",
    intro: "Grimpe tout en haut du Vieux Chêne !",
    storms: [],
    // on grimpe : la caméra suit les étages, les drapeaux et les fleurs vont de bas en haut
    grimpe: true,
    // le tronc (murs compris) : colonnes 14 à 39 ; dehors, à gauche, la clairière au pied du chêne
    tronc: [14, 39],
    // le bord du tronc, tout en haut (dans le fond), sous les feuilles de la couronne
    couronne: 3.5,
    // tout en haut, Pépé Chêne et son hérisson Ronchon gardent la couronne (voir js/boss/chene.js)
    boss: "chene",
    arene: [18, 37],
    talk: [
      "Voici le Vieux Chêne, le plus vieil arbre de la Forêt\u00a0! Il est tout creux\u00a0: entre par la porte, et grimpe tout en haut, jusqu'à sa couronne de feuilles\u00a0!",
      "Une liane\u00a0! Saute dessus pour t'y accrocher. Balance-toi avec {FLECHES}, et saute pour t'envoler\u00a0!",
      "Deux lianes à la suite\u00a0! Garde la flèche appuyée pour te balancer bien haut, et saute de l'une à l'autre au-dessus des ronces.",
      "Pour monter à l'étage, attrape la liane, balance-toi vers le champignon… et saute dessus\u00a0!",
      "Attention, un sanglier\u00a0! Quand il gratte le sol, saute-lui dessus… et s'il fonce, grimpe vite sur un champignon\u00a0! S'il se cogne contre les caisses, il voit des étoiles.",
      "Le grand trou du Vieux Chêne\u00a0! Passe de liane en liane. Si tu tombes, pas grave\u00a0: tu retombes à l'étage du dessous.",
      "Tu y es presque\u00a0! Prends la grande liane, et saute sur les champignons. Chut… tout là-haut, Pépé Chêne, le vieux Roi de la Forêt, fait la sieste avec Ronchon, son hérisson\u00a0!",
    ],
    map: [
      '################......................##',
      '################......................##',
      '################......................##',
      '################......................##',
      '################......................##',
      '################......................##',
      '################......................##',
      '################......................##',
      '################...!..........G.....&.##',
      '################..######################',
      '################oo......J.............##',
      '################--......J.............##',
      '################..k.....J.............##',
      '################----....J.............##',
      '################........J.............##',
      '################......................##',
      '################................F.....##',
      '################............---.......##',
      '################......................##',
      '################.h.................!T.##',
      '################################------##',
      '################.................k....##',
      '################................---...##',
      '################...K..................##',
      '################...................---##',
      '################.........o.o.o........##',
      '################......B..D.....s....q.##',
      '################-----###################',
      '################....J........J........##',
      '################.............J........##',
      '################..................S...##',
      '################.oo...................##',
      '################......o.o.............##',
      '################.........h..^^^.....!.##',
      '#################################-----##',
      '################.......J...J...J....k.##',
      '################.......J...J...J...---##',
      '################.......J.y.J...J......##',
      '################.......J...J...J.---..##',
      '################.........o...o........##',
      '################...................---##',
      '################......................##',
      '################.!.T...............oo.##',
      '################----##............######',
      '################......................##',
      '################..--..................##',
      '################........ooo..C........##',
      '################--......---...........##',
      '################................B.....##',
      '################q.ooo..s........B.T.!.##',
      '#################################-----##',
      '################.................J....##',
      '################...................ooo##',
      '################......K...............##',
      '################......................##',
      '################...........o..o.......##',
      '################.....B..h...^^......T.##',
      '################-----###################',
      '..............##......J...J...........##',
      '..............##..---.J...J...........##',
      '..............##......J.o.J...........##',
      '..............##--..o.......o.........##',
      '..............##......................##',
      '..............##qoo.^^^^^^^^^...T..!..##',
      '..............##################------##',
      '..............##.......J.........k....##',
      '...........y..##.......J........---...##',
      '..............##.......J....L.........##',
      '.....................o...o.........---##',
      '........o.o.o.........................##',
      '..P...T..........T...^^^^^.ooo.h......##',
      '########################################',
    ],
  },
  {
    world: 2,
    name: "Le Défi du Super Saut",
    theme: "sousbois",
    badge: "saut",
    intro: "",
    storms: [],
    // le sous-bois est bien plus haut que l'écran : la caméra suit Malice dans les grands arbres
    haut: true,
    // tout en haut du grand arbre de la fin, un gros feuillage cache un nid (p) et des bonbons
    cachette: [115, 0, 122, 3],
    // au-dessus des lianes, le feuillage du grand arbre (on passe à travers : on ne marche pas dessus)
    feuillage: [[94, 0, 106, 2]],
    talk: [
      "Bienvenue au stage d'entraînement\u00a0! Termine-le pour gagner le badge Super Saut.",
      "Cette grosse souche est bien trop haute\u00a0! Reste appuyée sur {BAS} pour t'accroupir, puis saute avec {SAUT}\u00a0: tu sauteras deux fois plus haut\u00a0!",
      "Les blocs lutin tout là-haut cachent des bonbons. Fais un super saut pour les casser\u00a0!",
      "Grimpe dans le grand arbre\u00a0: un super saut jusqu'à la première branche, puis un autre, et encore un autre\u00a0!",
      "Cette souche est encore plus haute\u00a0! Monte d'abord sur la marche, et fais ton super saut de là-haut.",
      "Un champignon bleu\u00a0! Saute dessus en restant appuyée sur {BAS}. Quand ça brille, saute avec {SAUT}\u00a0!",
      "Tout là-haut, des lianes\u00a0! Fais un super saut sur le champignon bleu pour en attraper une. Balance-toi avec {FLECHES}, et saute de liane en liane\u00a0!",
      "Le dernier défi\u00a0: un super saut, un champignon bleu, une liane… et le badge\u00a0! Chut… tu entends piailler, tout en haut de ce grand arbre\u00a0?",
      "Bravo\u00a0! Va chercher ton badge\u00a0!",
    ],
    map: [
      '.....................................................................................................................oo...............................',
      '....................................................................................................................y....y................-----.......',
      '...................................y.....................................................................=====.....oo..p.o................J...........',
      '................................................................................................J....J....J.||.....=======................J...........',
      '....................................................oooo........................................J....J....J.||.......||...................J...........',
      '....................................................####........................................J....J....J.||......o||...................J...........',
      '....................................................####........................................J....J....J.||.......||...................J...........',
      '................................yyy.................####...............o.o.o.yy.................J....J....J.||......o||........................T..Z...',
      '................................======..............####...............-----####.....................J....J.||.!.T...||........................#######',
      '....................................||..............####....................####.....................J....J.||#####=====.......................#######',
      '....................................||............oo####................o...####..................o.........||#####..||........................#######',
      '....................................||............######....................####.......................o....||#####..||........................#######',
      '....................................||o.o...o.T...######...............o....####............................||#####..||........................#######',
      '....................................=======#############........||..........####............................||#####..||........................#######',
      '..................y.................||.....#############........||.....o....####............................||#####..||........................#######',
      '........||............BLLLB.........||.....#############........||..........####............................||#####..||........................#######',
      '........||....ooo...................||.....#############........||....o.....####............................||#####..||.............o.o........#######',
      '........||....###................ooo||.....#############........||..........####............................||#####..||.............###........#######',
      '........||....###................======....#############........||..........####............................||#####..||.............###........#######',
      '........||....###...................||.....#############........||..........####............................||#####..||.............###........#######',
      '........||....###...................||.....#############........||...MMM....####............................||#####..||.............###........#######',
      '........||....###...................||.....#############........||..........####............................||#####..||.............###........#######',
      '..P..T..||.T..###..T...o.o.o.!.T....||.....#############.!.o.o..||T.........####..o.o.o..o...T.MM..o.o.o.o..||#####..||......o.o.o..###..MM....#######',
      '######################################################################################################################################################',
      '######################################################################################################################################################',
    ],
  },
  {
    world: 3,
    name: "La Vallée des Orages",
    theme: "storm",
    intro: "Il pleut des éclairs au chocolat !",
    storms: [[33,78],[134,182]],
    talk: [
      "Il pleut des éclairs au chocolat ! Regarde bien les ombres par terre.",
      "Les Rubik's cubes s'énervent quand tu t'approches. Saute-leur vite dessus ou cours loin !",
      "Ouf, ici il ne pleut pas. Repose-toi un peu !",
    ],
    map: [
      '.................................................................................................................................................................................................................................',
      '.................................................................................................................................................................................................................................',
      '...........................................yyy...................................................................................................................................................................................',
      '.................................................................................................................................................................................................................................',
      '.................................................................................................................................................................................................................................',
      '.....................................................................C...........................................................................................................................................................',
      '.............................................................................................................................................yoo.................................................................................',
      '.............................................................................................................................................###.................................................................................',
      '.........BKB...............ooo.............oo.........LFL...........---...............................BSB....................................###...........LKL...................................................................',
      '...................................o.o.o..####............................................................................................######...........................................---................ooooo..............',
      '..P..T.......oo.T....ww.R.................####....E.........R....^........D.....!......T..ww..R....R........E....D...^^...E...!...........######......R.........D.ww..E.....R...^.......!............E.....D............G........',
      '###########################...####################################################...###########################################...#######################################################.....##################################',
      '###########################~~~####################################################~~~###########################################~~~#######################################################~~~~~##################################',
    ],
  },
  {
    world: 4,
    name: "Les Pentes du Volcan",
    theme: "mountain",
    intro: "Le volcan est tout près !",
    storms: [[82,110]],
    talk: [
      "Le volcan est tout près ! Courage Malice !",
      "Cette plateforme bouge : attends le bon moment pour sauter !",
      "Attention, les éclairs au chocolat tombent aussi par ici !",
    ],
    map: [
      '...........................................................................................................................................................................................................................................',
      '.....................................................yy....................................................................................................................................................................................',
      '...........................................................................................................................................................................................................................................',
      '...........................................................................................................................................................................................................................................',
      '......................................................................W....................................................................................................................................................................',
      '.................................................LCL.....................................................................................................................oo.!..............................................................',
      '..............W.......................................................yo....................................................ooo.............W..........................########.....................................W......................',
      '..........................oo.........................R.................................................................................................................########............................................................',
      '.........BFB...................................#########...............---..............BKB.........................................................LSL................########.............BFB............................................',
      '.........................H................##############..........---............................###.....................H.....H.......................................########...........................---..............ooooo...........',
      '..P..T........ww.E...T................##################....D.!...............T.....E........R...###...E...D..ww.^^...!................E.........D.......R..R...E...I..########.....D....E..............................E..........G.......',
      '########################..........##############################............############################################............####################################################################.......############################',
      '########################~~~~~~~~~~##############################~~~~~~~~~~~~############################################~~~~~~~~~~~~####################################################################~~~~~~~############################',
    ],
  },
  {
    world: 4,
    name: "Le Défi de la Moustache-Grappin",
    theme: "badge",
    badge: "grappin",
    intro: "",
    storms: [],
    talk: [
      "Bienvenue ! Termine ce stage pour gagner le badge Moustache-Grappin.",
      "Près d'un anneau doré, appuie sur {GRAPPIN} : ta grosse moustache va s'y accrocher !",
      "Balance-toi avec {FLECHES} pour prendre de l'élan, puis saute avec {SAUT} pour te lancer !",
      "Accrochée à un anneau, appuie encore sur {GRAPPIN} pour attraper le suivant. Et ça marche aussi pour grimper !",
      "Super ! Va chercher ton badge !",
    ],
    map: [
      '................................................................................................................',
      '................................................................................................................',
      '................................................................................................................',
      '.....................ooo......................ooo.....................................o.o.o.o...................',
      '................................................................@.yyy...........................................',
      '.................................................@................####...................@......................',
      '..............@.......@.....................@.....................####..............@.........@.................',
      '..................................................................####..........................................',
      '..................................................................####..........................................',
      '..................................................................####...................................Z......',
      '..P.T....T...................T..........................T.........####.............................T...#####....',
      '##################........##############..............##########################.................###############',
      '##################~~~~~~~~##############~~~~~~~~~~~~~~##########################~~~~~~~~~~~~~~~~~###############',
    ],
  },
  {
    world: 5,
    name: "Le Cœur du Volcan",
    theme: "volcano",
    intro: "Sauve le bébé oiseau !",
    storms: [],
    talk: [
      "Tu y es presque ! J'entends le bébé oiseau qui appelle à l'aide !",
      "Ce mur est très haut ! Accroupis-toi et fais un super saut.",
      "Pour traverser cette lave, accroche ta moustache aux anneaux dorés !",
    ],
    sansBadges: {
      add: [[8, 83, "---"], [9, 97, "--"], [9, 101, "--"], [9, 105, "---"]],
      talk: {
        1: "Ce mur est très haut ! Monte sur la petite plateforme pour sauter par-dessus.",
        2: "Plein de lave ! Saute de plateforme en plateforme pour traverser.",
      },
    },
    map: [
      '............................................................................................................................................................................................................................',
      '............................................................................................................................................................................................................................',
      '............................................................................................................................................................................................................................',
      '....................................................................................................ooo.....................................................................................................................',
      '........................................................W.............................................................................................................................................................######',
      '.......................................................................................oooo............@......................................................................W.......................................######',
      '......................................................................................#####.......@........@.................................................yy.......................................................######',
      '......................................................................................#####....................................................................................................................N......######',
      '.........BFB..................LKL.......^.................---.................BCB.....#####..................................LSL.............................---.....................BFB.....................####.....######',
      '......................---.............####.........H..................................#####.............................................................---.....................................---..H.......####.....######',
      '..P..T.........E...................R..####....D.................!.....E...R........DT.#####..T..................!.....R..R........E...D...E...D...^.................!.....R.......E.......D..................####.....######',
      '####################......########################............#################################...............########################################............############################...............####.....######',
      '####################~~~~~~########################~~~~~~~~~~~~#################################~~~~~~~~~~~~~~~########################################~~~~~~~~~~~~############################~~~~~~~~~~~~~~~####~~~~~######',
    ],
  },
  {
    world: 6,
    name: "La Grotte aux Cristaux",
    theme: "cave",
    dark: true,
    intro: "Ramène le bébé oiseau chez lui !",
    storms: [],
    talk: [
      "Piou ! Merci de m'avoir sauvé, Malice ! Ramène-moi chez ma famille, au pays des bonbons !",
      "Il fait tout noir ici ! Ramasse les minerais qui brillent : ça fait de la lumière !",
      "Les pointes du plafond tremblent quand on passe dessous… et elles tombent ! Ne t'arrête pas !",
      "Un gros champignon ! Saute dessus pour rebondir tout là-haut. Garde {SAUT} appuyé pour monter encore plus haut !",
      "Chut… des chauves-souris dorment au plafond. Si elles se réveillent, saute-leur sur la tête !",
      "Je vois de la lumière ! C'est la sortie de la grotte !",
    ],
    map: [
      '######################################################################################################################################..............##################################################..............',
      '######################################################################################################################################..............##################################################..............',
      '................####.................A.A.A........................V.....V..................A..A.............########.V....V...........................................V....V....V.....A.A.####......................',
      '............................................................................................................########................................................................................................',
      '.................................................r..........................................................########.......................ood.oo...................................................................',
      '...................................................oo........................e.....................yy.........####.........................------...................................................................',
      '................................................#####...................................................................................................ooo.........................................................',
      '................................................#####......................-----....................................................................................................................................',
      '.....................o.o.o..BLB.................#####...ooo.........................BKB...................BCB....................BSB####................................BFB...................oooooo................',
      '............g...................................#####....................................................t..........................####..............H.............g........e........................r.............',
      '..P..T..ooo...T...ww............E.T.ooo.....T.M.#####.T........!....oo.oo.......E.......D..........M............R..ww.o.o.o..!......####.M......E...............!.................E..D..............T........G......',
      '######################...################################....####################################..##..###############################################........#################################....#################',
      '######################~~~################################~~~~####################################~~##~~###############################################~~~~~~~~#################################~~~~#################',
    ],
  },
  {
    world: 7,
    name: "La Montagne des Nuages",
    theme: "sky",
    winds: [[45, 54, 1], [121, 131, -1], [186, 194, 1]],
    intro: "Tout là-haut, dans les nuages !",
    storms: [],
    talk: [
      "Waouh, on est dans les nuages ! Ne tombe pas, c'est tout en bas !",
      "Les arcs-en-ciel, c'est solide : on peut marcher dessus !",
      "Attention, un oiseau grincheux ! Il vole en faisant des vagues. Saute-lui sur la tête !",
      "Ouh, du vent ! Il souffle par moments et il pousse fort. Regarde les flèches blanches.",
      "Accroche ta moustache aux anneaux dorés avec {GRAPPIN} pour traverser !",
      "Le vent souffle contre nous ! Attends qu'il se calme, puis saute !",
    ],
    sansBadges: {
      add: [[9, 102, "=="], [9, 110, "=="]],
      talk: { 4: "Saute sur les petits arcs-en-ciel pour traverser !" },
    },
    map: [
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................',
      '...............................................................W......................................................................................W.............................................................',
      '.......................................................................................................@....@...@...................................................................................................',
      '.........................................Y...................yyy...........................Y................................................Y......yyy..................................Y...........................',
      '................................................oooo........#####................................Y..........................oooooo................-----.....Y........Y..............................................',
      '............BLB.......................BKB......................................oo.......BSB..............ooo.............................BFB......................................BLB......ooooo....................',
      '......................o.o.o.o..................======.............................................................................................................o.o.o.o.o.........................................',
      '..P..T..ooo......T.............E.ww.T.......T...........!..........R....H......##.....T........E..ww.....####.......!...T............R..........E.........E...................!......R...............E.......G......',
      '#####################=======###################......##################............##################............############....################################==========#################.....###################',
      '#####################.......###################......##################............##################............############....################################..........#################.....###################',
    ],
  },
  {
    world: 8,
    name: "Le Monde des Bonbons",
    theme: "candy",
    intro: "La famille du bébé oiseau est tout près !",
    storms: [],
    talk: [
      "Piou piou ! Ça sent le bonbon : on est presque chez moi !",
      "Regarde, un gros œil bonbon ! Il est gentil mais timide. Attrape-le : il donne une vie !",
      "Une rivière de chocolat ! On ne se brûle pas, mais on s'enfonce. Saute vite pour en sortir !",
      "Les oursons en gélatine rebondissent partout ! Saute-leur sur la tête.",
      "Les guimauves, ça rebondit ! Saute de guimauve en guimauve au-dessus du chocolat.",
      "Je les entends ! C'est ma famille ! Piou piou piou !",
    ],
    map: [
      '..............................................................................................................................................................................................................................',
      '..............................................................................................................................................................................................................................',
      '..............................................................................................................................................................................................................................',
      '..............................................................................................................................................................................................................................',
      '......................................................................................................y.Q..y..................................................................................................................',
      '......................................................................................................------.............y....................................................................................................',
      '..................................................oo..oo................yyy..........................................o.......o..............................................oo..............oo..oo............................',
      '.......................................................................-----........oo.....................................................................................----...............................................',
      '.......................ooooo......BLB...........................BKB.....................................................................BFB.............ooooo.......BSB.......................................................',
      '.........................................................................................................................................................................................................ooooo................',
      '..P..T..oooT....Q...T..........T.....U....U..T...............!......D.....U...Q...H.........U...U...M.....R.....!..................U........U...Q...D...........!......R.....U.....E...................T............X.........',
      '#######################.....####################..M...M...########################......###########################..M...M...M..########################.....#############################..M...M..###########################',
      '#######################~~~~~####################~~~~~~~~~~########################~~~~~~###########################~~~~~~~~~~~~~########################~~~~~#############################~~~~~~~~~###########################',
    ],
  },
];
