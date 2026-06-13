# Cubematel

Jeu en ligne Node.js inspiré du jouet **Cube World** de Mattel.

## Démarrer

```bash
npm install
npm start
```

Puis ouvrez `http://localhost:3000` dans plusieurs onglets pour simuler plusieurs cubes.

## Commandes

- `npm test` : tests ciblés sur la logique de simulation
- `npm start` : serveur en ligne (Express + Socket.IO)

## Fonctionnalités implémentées

- Chaque joueur incarne un cube avec un personnage (Dodger ou Whip)
- Réactions aux mouvements : secouer, retourner, incliner, jouer
- Connexion des cubes horizontalement/verticalement
- Interactions entre personnages des cubes connectés (rencontre/discussion/visite)
- Ville partagée en temps réel entre tous les joueurs connectés
