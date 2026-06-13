const CHARACTERS = ["Dodger", "Whip"];

class CubeWorldGame {
  constructor() {
    this.cubes = new Map();
    this.links = new Set();
    this.history = [];
  }

  createCube(id, playerName, preferredCharacter) {
    const character = CHARACTERS.includes(preferredCharacter)
      ? preferredCharacter
      : CHARACTERS[this.cubes.size % CHARACTERS.length];
    const position = this._findFirstFreeCoordinate();

    const cube = {
      id,
      playerName,
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

  removeCube(id) {
    const cube = this.cubes.get(id);
    if (!cube) {
      return;
    }

    this.cubes.delete(id);
    [...this.links].forEach((link) => {
      if (link.includes(id)) {
        this.links.delete(link);
      }
    });

    this._record(`${cube.character} (${cube.playerName}) quitte la ville.`);
    this._syncConnections();
  }

  moveCube(id, movement) {
    const cube = this.cubes.get(id);
    if (!cube) {
      return;
    }

    const actions = {
      shake: {
        emotion: "surpris",
        activity: "rit en étant secoué",
      },
      flip: {
        emotion: "désorienté",
        activity: "pleure puis retrouve son équilibre",
        orientation: cube.orientation === "upright" ? "upside_down" : "upright",
      },
      tilt: {
        emotion: "curieux",
        activity: "regarde autour de lui",
      },
      play: {
        emotion: "joyeux",
        activity: cube.character === "Dodger" ? "dribble et tire" : "fait du lasso avec sa corde",
      },
    };

    const action = actions[movement];
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

  connectCubes(sourceId, targetId, direction) {
    if (sourceId === targetId || !this.cubes.has(sourceId) || !this.cubes.has(targetId)) {
      return;
    }

    this._ensureAllCoordinates();
    const orientation = direction === "vertical" ? "verticalement" : "horizontalement";
    const key = [sourceId, targetId].sort().join("::");
    this.links.add(key);
    this._placeConnectedCube(sourceId, targetId, direction);
    this._syncConnections();

    const source = this.cubes.get(sourceId);
    const target = this.cubes.get(targetId);
    this._record(
      `${source.character} et ${target.character} relient leurs cubes ${orientation} et discutent ensemble.`
    );
    this._recordInteractions(sourceId, targetId);
  }

  getState() {
    this._ensureAllCoordinates();
    return {
      cubes: [...this.cubes.values()],
      history: this.history.slice(-20),
    };
  }

  _syncConnections() {
    this.cubes.forEach((cube) => {
      cube.connectedTo = [];
    });

    this.links.forEach((key) => {
      const [a, b] = key.split("::");
      const cubeA = this.cubes.get(a);
      const cubeB = this.cubes.get(b);
      if (!cubeA || !cubeB) {
        return;
      }
      cubeA.connectedTo.push(b);
      cubeB.connectedTo.push(a);
    });
  }

  _findFirstFreeCoordinate(ignoredCubeId) {
    const searchLimit = this.cubes.size + 2;
    for (let y = -searchLimit; y <= searchLimit; y += 1) {
      for (let x = -searchLimit; x <= searchLimit; x += 1) {
        if (!this._isPositionTaken(x, y, ignoredCubeId)) {
          return { x, y };
        }
      }
    }
    return { x: searchLimit + 1, y: 0 };
  }

  _ensureAllCoordinates() {
    this.cubes.forEach((cube) => {
      if (Number.isFinite(cube.x) && Number.isFinite(cube.y)) {
        return;
      }
      const position = this._findFirstFreeCoordinate(cube.id);
      cube.x = position.x;
      cube.y = position.y;
    });
  }

  _isPositionTaken(x, y, ignoredCubeId) {
    return [...this.cubes.values()].some(
      (cube) => cube.id !== ignoredCubeId && cube.x === x && cube.y === y
    );
  }

  _placeConnectedCube(sourceId, targetId, direction) {
    const source = this.cubes.get(sourceId);
    const target = this.cubes.get(targetId);
    if (!source || !target) {
      return;
    }

    const axis = direction === "vertical" ? "vertical" : "horizontal";
    const currentCandidates = this._connectionCandidates(source, axis, 1);
    const targetAlreadyPlaced = currentCandidates.some(
      (candidate) => candidate.x === target.x && candidate.y === target.y
    );
    if (targetAlreadyPlaced) {
      return;
    }

    const maxDistance = Math.max(2, this.cubes.size + 1);
    for (let distance = 1; distance <= maxDistance; distance += 1) {
      const candidates = this._connectionCandidates(source, axis, distance);
      const destination = candidates.find(
        (candidate) => !this._isPositionTaken(candidate.x, candidate.y, target.id)
      );
      if (destination) {
        target.x = destination.x;
        target.y = destination.y;
        return;
      }
    }
  }

  _connectionCandidates(source, axis, distance) {
    if (axis === "vertical") {
      return [
        { x: source.x, y: source.y + distance },
        { x: source.x, y: source.y - distance },
      ];
    }
    return [
      { x: source.x + distance, y: source.y },
      { x: source.x - distance, y: source.y },
    ];
  }

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

  _record(text) {
    this.history.push({ text, timestamp: Date.now() });
  }
}

module.exports = { CubeWorldGame, CHARACTERS };
