// @ts-check
const { CHARACTERS } = require("./constants");
const { getMovementAction } = require("./movements");
const { pickRandomAvailableColor } = require("./colors");
const {
  ensureAllCoordinates,
  findFirstFreeCoordinate,
  placeConnectedCube,
} = require("./coordinates");

/**
 * @typedef {import('../../types/cube.js').Cube} Cube
 * @typedef {import('../../types/cube.js').HistoryEntry} HistoryEntry
 * @typedef {import('../../types/cube.js').GameState} GameState
 */

class CubeWorldGame {
  constructor() {
    /** @type {Map<string, Cube>} */
    this.cubes = new Map();
    /** @type {HistoryEntry[]} */
    this.history = [];
  }

  /**
   * Creates a cube with a coherent initial state and adds it to the world.
   *
   * @param {string} id
   * @param {string} playerName
   * @param {string} preferredCharacter
   * @returns {Cube}
   */
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

  /**
   * Removes a cube and recomputes all remaining connections.
   *
   * @param {string} id
   */
  removeCube(id) {
    const cube = this.cubes.get(id);
    if (!cube) {
      return;
    }

    this.cubes.delete(id);
    this._record(`${cube.character} (${cube.playerName}) quitte la ville.`);
    this._syncConnections();
  }

  /**
   * Applies a player movement to a cube if the action is recognised.
   *
   * @param {string} id
   * @param {string} movement - "shake" | "flip" | "tilt" | "play"
   */
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

  /**
   * Forces a connection between two cubes if a valid slot is available.
   *
   * @param {string} sourceId
   * @param {string} targetId
   * @param {"horizontal" | "vertical"} direction
   */
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

  /**
   * Returns the public game state snapshot consumed by the client.
   *
   * @returns {GameState}
   */
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

  /**
   * Records interactions between a source cube and its target or neighbours.
   *
   * @param {string} sourceId
   * @param {string} [explicitTargetId]
   */
  _recordInteractions(sourceId, explicitTargetId) {
    const source = this.cubes.get(sourceId);
    if (!source) {
      return;
    }

    const targets = explicitTargetId
      ? [this.cubes.get(explicitTargetId)]
      : source.connectedTo.map((id) => this.cubes.get(id));

    targets
      .filter(/** @param {Cube | undefined} t @returns {t is Cube} */ (t) => t !== undefined)
      .forEach((target) => {
        this._record(`${source.character} passe voir ${target.character} dans le cube voisin.`);
      });
  }

  /**
   * Appends a timestamped entry to the history log.
   *
   * @param {string} text
   */
  _record(text) {
    this.history.push({ text, timestamp: Date.now() });
  }
}

module.exports = { CubeWorldGame };
