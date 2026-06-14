# Cubematel

Jeu temps réel Node.js inspiré de **Cube World** (Mattel), avec serveur Socket.IO et rendu client 2D via PixiJS.

## 1. Vue d'ensemble

Chaque joueur connecté reçoit un cube dans une ville partagée.  
Le serveur maintient l'état autoritaire (position, connexions, historique, émotion), et tous les clients affichent cet état dans une scène 2D animée.

### Fonctionnalités clés

- Attribution d'un personnage (`Dodger` ou `Whip`) et d'une couleur de cube
- Mouvements interactifs (`shake`, `flip`, `tilt`, `play`)
- Connexions entre cubes horizontalement/verticalement
- Placement sur grille `(x, y)` avec une case voisine maximum par face
- Historique des événements et interactions entre voisins
- Synchronisation temps réel de l'état global (`world:update`)

## 2. Stack technique

- **Runtime** : Node.js 20 (voir `.nvmrc`)
- **Backend** : Express 5 + Socket.IO 4
- **Frontend** : JavaScript ES Modules + PixiJS 7
- **Tests** : `node:test` natif

## 3. Installation et exécution

```bash
nvm use 20.19.6
npm install
npm start
```

Application disponible sur `http://localhost:3000`.

Pour simuler plusieurs joueurs, ouvrir plusieurs onglets.

## 4. Commandes projet

- `npm start` : lance le serveur (`src/server.js`)
- `npm test` : exécute les tests de logique de jeu (`test/game.test.js`)

## 5. Architecture générale

```text
Client (DOM + PixiJS)
  └─ emits: cube:move, cubes:connect
Socket.IO
  └─ Server (Express + CubeWorldGame)
       ├─ update state (Map des cubes + historique)
       └─ broadcast world:update à tous les clients
```

## 6. Protocole temps réel (Socket.IO)

| Canal | Direction | Payload | Rôle |
|---|---|---|---|
| `cube:move` | Client -> Serveur | `{ movement }` | Déclenche une action sur son cube |
| `cubes:connect` | Client -> Serveur | `{ targetId, direction }` | Tente de connecter son cube à un autre |
| `world:update` | Serveur -> Clients | `{ cubes, history }` | Diffuse l'état global mis à jour |

`direction` accepte `horizontal` ou `vertical`.

## 7. Modèle de données

### Cube (serveur)

```js
{
  id,              // string (socket.id)
  playerName,      // "Joueur-xxxx"
  color,           // number (hex)
  character,       // "Dodger" | "Whip"
  orientation,     // "upright" | "upside_down"
  emotion,         // string
  activity,        // string
  connectedTo,     // string[]
  x, y             // number (coordonnées grille)
}
```

### État global (`world:update`)

```js
{
  cubes: Cube[],
  history: [{ text, timestamp }]
}
```

`history` est tronqué aux **20** dernières entrées lors de `getState()`.

## 8. Backend détaillé

### `src/server.js`

- Sert `public/` en statique
- Expose PixiJS depuis `node_modules` via `/vendor`
- Gère la connexion Socket.IO :
  1. création du cube à la connexion
  2. gestion des événements de mouvement/connexion
  3. suppression du cube à la déconnexion
- Réémet `world:update` après chaque mutation

### `src/game.js` (`CubeWorldGame`)

Classe cœur de la simulation :

- `createCube(id, playerName, preferredCharacter)`
  - choisit personnage (préféré si valide, sinon alternance)
  - choisit première coordonnée libre
  - attribue une couleur disponible
  - initialise émotion/activité/orientation
- `moveCube(id, movement)`
  - traduit le mouvement en action via `getMovementAction`
  - met à jour émotion/activité/orientation
  - enregistre historique + interactions voisines
- `connectCubes(sourceId, targetId, direction)`
  - protège les cas invalides (même cube, id absent)
  - positionne la cible au voisinage autorisé si possible
  - recalcule les connexions de voisinage
  - journalise l'action et l'interaction
- `removeCube(id)` : supprime un joueur et resynchronise les liens
- `getState()` : retourne l'état public (`cubes`, `history`)

Méthodes internes :

- `_syncConnections()` : reconstruit `connectedTo` depuis les coordonnées adjacentes (4-neighborhood)
- `_recordInteractions()` : ajoute des lignes de visite entre cubes voisins
- `_record()` : pousse un événement horodaté dans l'historique

### `src/game/constants.js`

- `CHARACTERS = ["Dodger", "Whip"]`
- `CUBE_COLORS` : palette de couleurs prédéfinies

### `src/game/movements.js`

Mappe les actions :

- `shake` -> surpris / rit en étant secoué
- `flip` -> bascule `upright <-> upside_down`
- `tilt` -> curieux
- `play` -> activité dépendante du personnage

### `src/game/colors.js`

`pickRandomAvailableColor(cubes)` :

1. privilégie une couleur encore non utilisée de `CUBE_COLORS`
2. sinon génère une couleur pastel aléatoire unique

### `src/game/coordinates.js`

- `ensureAllCoordinates(cubes)` : garantit `x,y` pour tous les cubes
- `findFirstFreeCoordinate(cubes, ignoredCubeId?)` : recherche la première case libre
- `placeConnectedCube(cubes, sourceId, targetId, direction)` :
  - trouve un emplacement adjacent libre dans l'axe demandé
  - échoue si les deux emplacements possibles sont occupés

## 9. Frontend détaillé

### `public/index.html`

- Structure UI :
  - commandes de mouvement
  - formulaire de connexion vers cube cible
  - scène Pixi (`#cubeScene`)
  - historique (`#history`)

### `public/app.js`

Point d'entrée client :

1. crée la socket
2. récupère les références DOM
3. branche les contrôles
4. instancie la scène
5. synchronise l'id du joueur sur `connect`
6. applique les mises à jour `world:update`

### `public/js/dom.js`

- accès aux éléments DOM (`getDomRefs`)
- binding des boutons/actions (`bindControls`)
- affichage de l'ID local (`setSelfBadge`)
- compteurs cubes/liens (`updateCounters`)
- rendu historique + échappement HTML (`renderHistory`, `escapeHtml`)

### `public/js/scene.js`

Façade de la scène :

- stocke l'état de rendu (`sceneState`)
- gère `setup()` (initialisation Pixi)
- gère `handleWorldUpdate()` (rendu sur snapshot serveur)

### `public/js/scene-setup.js`

- initialise `PIXI.Application`
- configure les layers (background, liens, cubes)
- installe la boucle d'animation (`app.ticker`)
- gère resize (`ResizeObserver` si disponible)
- bascule en erreur UI si l'initialisation échoue

### `public/js/background.js`

- génère le fond animé (étoiles + particules flottantes)
- met à jour les positions de fond à chaque frame

### `public/js/cube-node.js`

- crée un nœud Pixi par cube
- dessine :
  - plaque
  - contour
  - silhouette du personnage
  - texte (joueur + humeur)
- applique inversion visuelle si cube retourné
- clic sur cube -> remplit automatiquement `targetId`

### `public/js/scene-world.js`

- transforme l'état serveur en représentation visuelle :
  - tri des cubes (cube local en priorité)
  - calcul des liens uniques
  - sync ajout/suppression des nodes
  - layout centré sur le cube local
  - rendu graphique de chaque cube

### `public/js/scene-animation.js`

- interpolation douce vers la position cible
- oscillation verticale des cubes non connectés
- intensité d'oscillation pilotée par l'émotion

### `public/js/scene-errors.js`

- fallback visuel unique en cas d'erreur fatale de scène

## 10. Règles métier importantes

1. **Adjacence stricte** : deux cubes sont connectés s'ils sont voisins orthogonaux.
2. **Un voisin par face** : la tentative de connexion échoue si les deux cases de l'axe sont occupées.
3. **Source de vérité serveur** : le client n'invente pas d'état, il applique `world:update`.
4. **Historique borné** : exposition limitée aux 20 dernières entrées.
5. **Robustesse coordonnées** : réalignement automatique des cubes sans `x,y`.

## 11. Tests existants

Fichier : `test/game.test.js`

Cas couverts :

- réaction aux mouvements + orientation
- connexion horizontale et interaction
- unicité/couverture des couleurs
- connexion verticale
- réalignement de cubes sans coordonnées
- contrainte "une face = un voisin"

## 12. Limites actuelles et pistes d'évolution

- Pas de persistance (état perdu au redémarrage serveur)
- Pas d'authentification utilisateur
- Pas de séparation "room" multi-parties
- Rendu des liens visuels possible (layer déjà présent)
- Ajout possible de tests frontend (DOM/scene)

## 13. Arborescence du projet

```text
Cubematel/
├─ public/
│  ├─ app.js
│  ├─ index.html
│  ├─ styles.css
│  └─ js/
│     ├─ background.js
│     ├─ cube-node.js
│     ├─ dom.js
│     ├─ scene.js
│     ├─ scene-animation.js
│     ├─ scene-errors.js
│     ├─ scene-setup.js
│     └─ scene-world.js
├─ src/
│  ├─ game.js
│  ├─ server.js
│  └─ game/
│     ├─ colors.js
│     ├─ constants.js
│     ├─ coordinates.js
│     └─ movements.js
└─ test/
   └─ game.test.js
```
