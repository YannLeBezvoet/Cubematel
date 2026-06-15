const { CUBE_COLORS } = require("./constants");

// Réutilise d'abord la palette connue avant de générer une couleur de secours.
function pickRandomAvailableColor(cubes) {
  const usedColors = new Set([...cubes.values()].map((cube) => cube.color).filter(Number.isInteger));
  const availableColors = CUBE_COLORS.filter((color) => !usedColors.has(color));
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  let color;
  do {
    const red = 96 + Math.floor(Math.random() * 160);
    const green = 96 + Math.floor(Math.random() * 160);
    const blue = 96 + Math.floor(Math.random() * 160);
    color = (red << 16) | (green << 8) | blue;
  } while (usedColors.has(color));

  return color;
}

module.exports = { pickRandomAvailableColor };
