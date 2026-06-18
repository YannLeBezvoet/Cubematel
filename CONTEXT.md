# Cubematel — Contexte applicatif

> Ce fichier est la source d'orientation rapide pour tout travail sur ce dépôt.
> Il doit être mis à jour à chaque changement qui modifie l'architecture, les modules,
> les règles métier, les événements réseau ou les conventions visuelles.

---

## Nature du projet

Cubematel est une recréation web temps réel du jouet **Cube World de Mattel** (2004).
Chaque joueur connecté reçoit un cube LCD animé contenant un personnage pixel art.
Les cubes peuvent être reliés entre eux (horizontalement ou verticalement).
Le serveur est la seule source de vérité — le client ne mute jamais l'état localement.

**Stack :**
- Serveur : Node.js ≥ 18, Express v5, Socket.IO v4 (CommonJS)
- Client : PixiJS v7 (chargé via CDN/vendor), ES modules natifs, Socket.IO client
- Tests : `node --test` (runner natif Node.js)
- Pas de bundler, pas de TypeScript, pas de framework front

**Démarrage :**
```bash
npm install && npm start   # http://localhost:3000
npm test                   # tests unitaires
```

---

## Architecture

```
src/
├── server.js              # Bootstrap Express + Socket.IO ; exporte { app, server, game }
├── socket-handlers.js     # Branche les événements Socket.IO ; appelle game.* puis broadcastWorld
└── game/
    ├── index.js           # Ré-export de CubeWorldGame, CHARACTERS, CUBE_COLORS
    ├── cube-world-game.js # Classe CubeWorldGame — état du monde (Map<id, cube>)
    ├── constants.js       # CHARACTERS = ['Dodger','Whip'] ; CUBE_COLORS (12 couleurs hex)
    ├── coordinates.js     # Placement et connexion des cubes sur la grille
    ├── movements.js       # Traduit un mouvement UI → { emotion, activity, orientation? }
    └── colors.js          # Sélection aléatoire d'une couleur disponible

public/
├── index.html             # Point d'entrée HTML ; charge PIXI via /vendor et app.js
├── app.js                 # Point d'entrée client : crée socket, scène, bind contrôles
├── styles.css
└── js/
    ├── dom.js             # getDomRefs, bindControls, setSelfBadge, historique DOM
    ├── scene/
    │   ├── index.js       # createScene() — factory ; expose setMyCubeId / handleWorldUpdate / setup
    │   ├── setup.js       # Initialisation PixiJS, calques, ResizeObserver, fond, animation
    │   ├── world.js       # renderWorld() — diff cubeNodes, dessin des liens, historique
    │   ├── animation.js   # Boucle ticker (bobbing, lerp position, flip animé)
    │   ├── pan.js         # Caméra drag et déplacement des calques
    │   ├── background.js  # Étoiles + particules flottantes (décor)
    │   └── errors.js      # showSceneError() — message d'erreur fatal dans la scène
    └── renderers/
        ├── cube-node.js   # createCubeNode / drawCube — conteneur PIXI d'un cube
        └── stickman.js    # drawStickman / drawProp — pixel art (grille P=3px)
```

---

## Modèle de données (cube)

```js
{
  id: string,            // socket.id
  playerName: string,    // "Joueur-XXXX"
  color: number,         // 0xRRGGBB (un des 12 CUBE_COLORS)
  character: string,     // "Dodger" | "Whip"
  orientation: string,   // "upright" | "upside_down"
  emotion: string,       // "happy" | "surpris" | "joyeux" | "curieux" | "désorienté"
  activity: string,      // description texte de l'activité courante
  connectedTo: string[], // ids des cubes adjacents (recalculé par _syncConnections)
  x: number,             // position sur la grille logique
  y: number,
}
```

**État diffusé :** `game.getState()` → `{ cubes: cube[], history: { text, timestamp }[] }` (20 dernières entrées)

---

## Événements Socket.IO

| Direction      | Événement         | Payload                            | Effet                                      |
|----------------|-------------------|------------------------------------|--------------------------------------------|
| Serveur→Client | `world:update`    | `{ cubes, history }`               | Snapshot complet du monde                  |
| Client→Serveur | `cube:move`       | `{ movement }` (shake/flip/tilt/play) | Met à jour émotion + activité du cube   |
| Client→Serveur | `cubes:connect`   | `{ targetId, direction }`          | Place le cube cible adjacent au source     |
| (auto)         | `connect`         | —                                  | Crée un cube pour le nouveau socket        |
| (auto)         | `disconnect`      | —                                  | Supprime le cube et recalcule les liens    |

---

## Règles métier clés

1. Chaque joueur possède exactement un cube, identifié par son `socket.id`.
2. Deux cubes sont voisins uniquement s'ils sont **adjacents orthogonalement** (Δx=1,Δy=0 ou Δx=0,Δy=1).
3. Une face ne peut accueillir qu'un seul voisin — `placeConnectedCube` cherche la première case libre dans l'axe demandé.
4. La couleur est choisie aléatoirement parmi les couleurs non encore utilisées.
5. `_syncConnections` reconstruit `connectedTo` depuis les coordonnées à chaque mutation.
6. L'historique public est limité aux **20 dernières entrées**.

---

## Rendu visuel (PixiJS)

Chaque cube est un `PIXI.Container` avec les couches (de bas en haut) :
`plate` (ombre) → `halo` (glow coloré) → `cubeShape` (cadre + écran LCD) → `figure` (stickman) → `prop` (icône personnage)

**Stickman :** grille pixel art, 1 unité = P=3px. Origine = centre des hanches.
- Pose des bras selon `emotion` : `surpris`→wide, `joyeux`→play (Dodger/Whip différent), `curieux`→curious, default→down.
- `upside_down` : `figure.scale.y = -1`, `figure.y = -19` (gravité inversée).
- Props : ballon (Dodger) ou lasso (Whip), toujours en bas de l'écran LCD.

**Animations :** bobbing sinusoïdal par frame (phase aléatoire par cube), lerp position sur changement de coordonnées, animation flip (rotation Y temporaire via `flipAnim`).

---

## Conventions importantes

- Le serveur n'émet **jamais** vers un socket individuel — tout passe par `io.emit('world:update', ...)`.
- `src/game.js` est un shim de compatibilité qui ré-exporte `src/game/index.js`.
- Les modules client utilisent **ES modules natifs** (`import/export`) ; les modules serveur utilisent **CommonJS** (`require/module.exports`).
- `public/js/package.json` déclare `"type": "module"` pour activer les ES modules dans le dossier client.
- PIXI est accessible via `window.PIXI` (chargé depuis `/vendor/pixi.js/dist/browser/pixi.min.js`).

---

## Tests existants

| Fichier                    | Ce qu'il couvre                                         |
|----------------------------|---------------------------------------------------------|
| `test/game.test.js`        | Connexions, mouvements, couleurs, historique (CommonJS) |
| `test/stickman.test.mjs`   | Rendu stickman : coordonnées des pixels (ES module)     |
