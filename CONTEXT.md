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
- Client : PixiJS v7 (via `/vendor`), GSAP v3 (via `/vendor`), ES modules natifs, Socket.IO client
- Tests : Vitest (`npm test` = `vitest run`, `npm run test:watch` = `vitest`)
- Typage : TypeScript en mode `checkJs + noEmit` — pas de compilation, vérification par `npm run typecheck`
- Pas de bundler, pas de framework front

**Démarrage :**
```bash
npm install && npm start        # http://localhost:3000
npm test                        # tests unitaires (Vitest)
npm run typecheck               # vérification TypeScript (noEmit)
```

---

## Architecture

```
types/
└── cube.d.ts              # Source de vérité partagée : interfaces Cube, HistoryEntry, GameState

src/
├── server.js              # Bootstrap Express + Socket.IO ; exporte { app, server, game }
├── socket-handlers.js     # Branche les événements Socket.IO ; appelle game.* puis broadcastWorld
└── game/
    ├── index.js           # Ré-export de CubeWorldGame, CHARACTERS, CUBE_COLORS
    ├── cube-world-game.js # Classe CubeWorldGame — état du monde (Map<id, cube>) ; @ts-check
    ├── constants.js       # CHARACTERS = ['Dodger','Whip'] ; CUBE_COLORS (12 couleurs hex)
    ├── coordinates.js     # Placement et connexion des cubes sur la grille
    ├── movements.js       # Traduit un mouvement UI → { emotion, activity, orientation? }
    └── colors.js          # Sélection aléatoire d'une couleur disponible

public/
├── index.html             # Point d'entrée HTML ; charge PIXI + GSAP via /vendor, puis app.js
├── app.js                 # Point d'entrée client : crée socket, scène, bind contrôles
├── styles.css
├── tsconfig.json          # Config TS client (ESNext + DOM, checkJs:false, noEmit)
└── js/
    ├── globals.d.ts       # Étend Window : window.PIXI (PixiJS) et window.gsap (GSAP)
    ├── dom.js             # getDomRefs, bindControls, setSelfBadge, historique DOM
    ├── scene/
    │   ├── index.js       # createScene() — factory ; expose setMyCubeId / handleWorldUpdate / setup
    │   ├── setup.js       # Initialisation PixiJS, calques, ResizeObserver, fond, ticker
    │   ├── world.js       # renderWorld() — diff cubeNodes, tweens GSAP position/flip, historique ; @ts-check
    │   ├── animation.js   # Boucle ticker : bobbing sinusoïdal uniquement (lerp et flip délégués à GSAP)
    │   ├── pan.js         # Caméra drag et déplacement des calques
    │   ├── background.js  # Étoiles + particules flottantes (décor)
    │   └── errors.js      # showSceneError() — message d'erreur fatal dans la scène
    └── renderers/
        ├── cube-node.js   # createCubeNode / drawCube — conteneur PIXI d'un cube ; @ts-check
        └── stickman.js    # drawStickman / drawProp — pixel art (grille P=3px)

tsconfig.json              # Config TS serveur (CommonJS, checkJs:false, noEmit)
vitest.config.mjs          # Configuration Vitest (environment: node)
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

**Animations :**
- **Bobbing** : sinusoïdal par frame dans le ticker Pixi (`animation.js`), intensité selon l'émotion.
- **Transition de position** : `gsap.to(node, { x, y, duration: 0.35, ease: 'power2.out' })` déclenché depuis `world.js/layoutCubes` à chaque `world:update`.
- **Flip d'orientation** : `gsap.to(node.body, { rotation: Math.PI, ease: 'sine.inOut' })` depuis `world.js/startFlipAnimation` ; `drawCube` rappelé dans `onComplete`. L'état en cours est tracé via `node.flipping` (booléen) et `node._pendingCube`.

---

## Conventions importantes

- Le serveur n'émet **jamais** vers un socket individuel — tout passe par `io.emit('world:update', ...)`.
- `src/game.js` est un shim de compatibilité qui ré-exporte `src/game/index.js`.
- Les modules client utilisent **ES modules natifs** (`import/export`) ; les modules serveur utilisent **CommonJS** (`require/module.exports`).
- `public/js/package.json` déclare `"type": "module"` pour activer les ES modules dans le dossier client.
- `window.PIXI` et `window.gsap` sont chargés via `<script src="/vendor/...">` et déclarés dans `public/js/globals.d.ts`.
- Le type `Cube` (et `HistoryEntry`, `GameState`) est défini **une seule fois** dans `types/cube.d.ts` et importé via JSDoc `@typedef {import('...')}` côté serveur et client.
- **TypeScript** : `// @ts-check` activé par fichier sur les modules complexes (`cube-world-game.js`, `cube-node.js`, `world.js`). Pas de compilation — `npm run typecheck` (tsc noEmit) pour vérifier.

---

## Tests existants

Runner : **Vitest** (`npm test` = `vitest run`, `npm run test:watch` = `vitest`).

| Fichier                    | Ce qu'il couvre                                                  |
|----------------------------|------------------------------------------------------------------|
| `test/game.test.mjs`       | Connexions, mouvements, couleurs, historique (format Vitest ESM) |
| `test/stickman.test.mjs`   | Rendu stickman : coordonnées des pixels (format Vitest ESM)      |
