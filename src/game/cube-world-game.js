const { CHARACTERS, CUBE_COLORS } = require("./constants");
const { getMovementAction } = require("./movements");
const { pickRandomAvailableColor } = require("./colors");
const {
  ensureAllCoordinates,
  findFirstFreeCoordinate,
  placeConnectedCube,
} = require("./coordinates");

class CubeWorldGame {
  constructor() {
    this.cubes = new Map();
    this.history = [];
  }

  // Crée un cube public avec un état initial cohérent.
  createCube(id, playerName, preferredCharacter) {
    const character = CHARACTERS.includes(preferredCharacter)
      ? preferredCharacter
      : CHARACTERS[this.cubes.size % CHARACTERS.length];
    const position = findFirstFreeCoordinate(this.cubes);
    const color = pickRandomAvailableColor(this.cubes);

    const cube = {
      id,
      playerName,
      color,
      character,
      orientation: "upright",
      emotion: "happy",
      activity: character === "Dodger" ? "jongle avec un ballon" : "saute à la corde",
      connectedTo: [],
      x: position.x,
      y: position.y,
    };

    this.cubes.set(id, cube);
    this._record(`${cube.character} (${cube.playerName}) rejoint la ville.`);
    this._syncConnections();
    return cube;
  }

  // Supprime proprement un cube et recalcule les liens restants.
  removeCube(id) {
    const cube = this.cubes.get(id);
    if (!cube) {
      return;
    }

    this.cubes.delete(id);
    this._record(`${cube.character} (${cube.playerName}) quitte la ville.`);
    this._syncConnections();
  }

  // Applique un mouvement de jeu si l'action est reconnue.
  moveCube(id, movement) {
    const cube = this.cubes.get(id);
    if (!cube) {
      return;
    }

    const action = getMovementAction(movement, cube);
    if (!action) {
      return;
    }

    cube.emotion = action.emotion;
    cube.activity = action.activity;
    if (action.orientation) {
      cube.orientation = action.orientation;
    }

    this._record(`${cube.character} ${action.activity}.`);
    this._recordInteractions(id);
  }

  // Force une connexion entre deux cubes si l'emplacement demandé existe.
  connectCubes(sourceId, targetId, direction) {
    if (sourceId === targetId || !this.cubes.has(sourceId) || !this.cubes.has(targetId)) {
      return;
    }

    ensureAllCoordinates(this.cubes);
    const connected = placeConnectedCube(this.cubes, sourceId, targetId, direction);
    if (!connected) {
      return;
    }

    this._syncConnections();
    const source = this.cubes.get(sourceId);
    const target = this.cubes.get(targetId);
    if (!source?.connectedTo.includes(targetId) || !target) {
      return;
    }

    const orientation = direction === "vertical" ? "verticalement" : "horizontalement";
    this._record(
      `${source.character} et ${target.character} relient leurs cubes ${orientation} et discutent ensemble.`
    );
    this._recordInteractions(sourceId, targetId);
  }

  // Expose uniquement l'état public consommé par le client.
  getState() {
    ensureAllCoordinates(this.cubes);
    return {
      cubes: [...this.cubes.values()],
      history: this.history.slice(-20),
    };
  }

  // Reconstruit les connexions à partir des coordonnées.
  _syncConnections() {
    ensureAllCoordinates(this.cubes);
    this.cubes.forEach((cube) => {
      cube.connectedTo = [];
    });

    const byPosition = new Map();
    this.cubes.forEach((cube) => {
      byPosition.set(`${cube.x},${cube.y}`, cube.id);
    });

    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    this.cubes.forEach((cube) => {
      const connected = new Set();
      neighbors.forEach(([dx, dy]) => {
        const neighborId = byPosition.get(`${cube.x + dx},${cube.y + dy}`);
        if (neighborId && neighborId !== cube.id) {
          connected.add(neighborId);
        }
      });
      cube.connectedTo = [...connected];
    });
  }

  // Journalise les interactions avec un cube ciblé ou ses voisins.
  _recordInteractions(sourceId, explicitTargetId) {
    const source = this.cubes.get(sourceId);
    if (!source) {
      return;
    }

    const targets = explicitTargetId
      ? [this.cubes.get(explicitTargetId)]
      : source.connectedTo.map((id) => this.cubes.get(id));

    targets
      .filter(Boolean)
      .forEach((target) => {
        this._record(`${source.character} passe voir ${target.character} dans le cube voisin.`);
      });
  }

  // Ajoute une entrée horodatée dans l'historique.
  _record(text) {
    this.history.push({ text, timestamp: Date.now() });
  }
}

module.exports = { CubeWorldGame, CHARACTERS, CUBE_COLORS };
