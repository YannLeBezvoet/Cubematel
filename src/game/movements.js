// Traduit un mouvement de l'UI en réaction métier minimale.
function getMovementAction(movement, cube) {
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
      activity:
        cube.character === "Dodger" ? "dribble et tire" : "fait du lasso avec sa corde",
    },
  };

  return actions[movement] || null;
}

module.exports = { getMovementAction };
