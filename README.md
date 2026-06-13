# Cubematel

Jeu en ligne Node.js inspiré du jouet **Cube World** de Mattel.

## Démarrer

```bash
nvm use
npm install
npm start
```

Puis ouvrez `http://localhost:3000` dans plusieurs onglets pour simuler plusieurs cubes.

## Prérequis

- Node.js **18+** requis
- avec `nvm`, la version attendue est définie dans `.nvmrc`

## Commandes

- `npm test` : tests ciblés sur la logique de simulation
- `npm start` : serveur en ligne (Express + Socket.IO)

## Fonctionnalités implémentées

- Chaque joueur incarne un cube avec un personnage (Dodger ou Whip)
- Réactions aux mouvements : secouer, retourner, incliner, jouer
- Connexion des cubes horizontalement/verticalement
- Placement des cubes en coordonnées X/Y pour refléter visuellement les connexions gauche/droite et haut/bas
- Interactions entre personnages des cubes connectés (rencontre/discussion/visite)
- Ville partagée en temps réel entre tous les joueurs connectés
- Rendu de la ville en vraie scène 2D temps réel via PixiJS
