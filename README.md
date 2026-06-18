# Cubematel

Jeu temps réel Node.js inspiré de Cube World, avec serveur Socket.IO et rendu PixiJS.

## Lancement

```bash
npm install
npm start
```

Le projet écoute sur `http://localhost:3000`.

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` | démarre le serveur |
| `npm test` | exécute les tests de logique |

## Architecture

```text
src/server.js
  -> bootstrap HTTP
src/socket-handlers.js
  -> branche les événements Socket.IO
src/game.js
  -> compatibilité simple vers src/game/
src/game/
  -> logique de jeu, couleurs, coordonnées, mouvements
public/js/
  -> DOM, scène Pixi, rendu et interactions
```

## Règles métier

1. Un cube reçoit un personnage, une couleur et une position libre.
2. Deux cubes sont voisins seulement s'ils sont adjacents orthogonalement.
3. Une face ne peut accueillir qu'un seul voisin.
4. Le serveur reste la source de vérité.
5. L'historique public est limité aux 20 dernières entrées.

## Fichiers clés

| Fichier | Responsabilité |
|---|---|
| `src/game/cube-world-game.js` | état du monde et mutations |
| `src/game/coordinates.js` | placement et alignement |
| `src/game/colors.js` | sélection de couleur |
| `src/game/movements.js` | traduction mouvement -> action |
| `public/js/scene-setup.js` | initialisation Pixi |
| `public/js/scene-pan.js` | caméra et pan |
| `public/js/scene-world.js` | rendu du snapshot serveur |
| `public/js/cube-node.js` | fabrique et rendu d'un nœud cube (frame LCD + figure) |
| `public/js/stickman.js` | dessin pixel art du stickman et des icônes de prop |

## Rendu visuel

Chaque cube est rendu comme un boîtier LCD inspiré du Cube World de Mattel :

- **Cadre coloré** : bordure arrondie dans la couleur du personnage.
- **Écran LCD** : fond gris foncé simulant un écran à cristaux liquides.
- **Stickman pixel art** : personnage en blocs carrés noirs (4×4 px chacun).
- **Poses** : les bras changent selon l'émotion (`surpris`, `joyeux`, `curieux`, défaut).
- **Prop** : icône en bas de l'écran — ballon pour Dodger, lasso pour Whip.

## Tests

Les tests couvrent les mouvements, les connexions, les couleurs et l'alignement des cubes.
