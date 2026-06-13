const socket = io();
const cubeGrid = document.getElementById("cubeGrid");
const historyList = document.getElementById("history");
const targetInput = document.getElementById("targetId");
const selfBadge = document.getElementById("selfBadge");
const cubeCount = document.getElementById("cubeCount");
const linkCount = document.getElementById("linkCount");
let myCubeId = "";

const palettes = {
  Dodger: {
    top: "#82dbff",
    left: "#33a0d8",
    right: "#1f6cba",
    glow: "#7fd4ff",
    accent: "#ffbf47",
    scene: "#122845",
  },
  Whip: {
    top: "#ffd886",
    left: "#ff9d52",
    right: "#d15d54",
    glow: "#ffb776",
    accent: "#8be5b2",
    scene: "#341c2e",
  },
};

socket.on("connect", () => {
  myCubeId = socket.id;
  selfBadge.textContent = `Mon cube : ${myCubeId.slice(0, 6)}`;
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    socket.emit("cube:move", { movement: button.dataset.move });
  });
});

document.getElementById("connectBtn").addEventListener("click", () => {
  const targetId = targetInput.value.trim();
  const direction = document.getElementById("direction").value;
  if (!targetId) {
    return;
  }
  socket.emit("cubes:connect", { targetId, direction });
});

cubeGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-target]");
  if (!button) {
    return;
  }
  targetInput.value = button.dataset.target;
  targetInput.focus();
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function createIdFragment(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function getPose(cube) {
  const byEmotion = {
    happy: {
      headX: 40,
      headY: 26,
      body: "40 42 40 82",
      leftArm: "40 54 22 46",
      rightArm: "40 54 58 46",
      leftLeg: "40 82 26 106",
      rightLeg: "40 82 54 106",
      mouth: "M32 31 Q40 37 48 31",
      browLeft: "M31 22 L37 21",
      browRight: "M43 21 L49 22",
    },
    surpris: {
      headX: 40,
      headY: 24,
      body: "40 40 40 82",
      leftArm: "40 50 18 28",
      rightArm: "40 50 62 28",
      leftLeg: "40 82 27 107",
      rightLeg: "40 82 53 107",
      mouth: "M40 35 a4 4 0 1 0 0.01 0",
      browLeft: "M30 20 L36 18",
      browRight: "M44 18 L50 20",
    },
    joyeux: {
      headX: 40,
      headY: 24,
      body: "40 40 40 82",
      leftArm: "40 50 24 34",
      rightArm: "40 50 64 36",
      leftLeg: "40 82 28 106",
      rightLeg: "40 82 56 100",
      mouth: "M31 31 Q40 40 49 31",
      browLeft: "M31 22 L37 22",
      browRight: "M43 22 L49 22",
    },
    curieux: {
      headX: 44,
      headY: 25,
      body: "42 41 35 82",
      leftArm: "38 54 18 50",
      rightArm: "38 54 58 44",
      leftLeg: "35 82 24 106",
      rightLeg: "35 82 48 106",
      mouth: "M36 33 Q41 36 47 32",
      browLeft: "M35 21 L40 20",
      browRight: "M44 19 L50 20",
    },
    désorienté: {
      headX: 40,
      headY: 25,
      body: "40 41 46 80",
      leftArm: "43 55 20 62",
      rightArm: "43 55 60 49",
      leftLeg: "46 80 31 106",
      rightLeg: "46 80 57 106",
      mouth: "M33 35 Q40 31 47 35",
      browLeft: "M31 21 L38 23",
      browRight: "M43 23 L49 21",
    },
  };

  return byEmotion[cube.emotion] || byEmotion.happy;
}

function renderProp(cube, palette) {
  if (cube.character === "Dodger") {
    return `
      <circle cx="72" cy="88" r="10" fill="${palette.accent}" stroke="#062138" stroke-width="2.5" />
      <path d="M62 88h20M72 78c5 3 5 17 0 20M65 81c4 4 10 10 14 14M65 95c5-3 10-8 14-14" stroke="#062138" stroke-width="1.8" stroke-linecap="round" fill="none" />
    `;
  }

  return `
    <path d="M65 72c16 4 23 15 20 28-4 14-18 20-31 14" fill="none" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round" />
    <circle cx="58" cy="112" r="4.5" fill="${palette.accent}" />
  `;
}

function renderStickFigure(cube, palette) {
  const pose = getPose(cube);
  const [bodyX1, bodyY1, bodyX2, bodyY2] = pose.body.split(" ");
  const [leftArmX1, leftArmY1, leftArmX2, leftArmY2] = pose.leftArm.split(" ");
  const [rightArmX1, rightArmY1, rightArmX2, rightArmY2] = pose.rightArm.split(" ");
  const [leftLegX1, leftLegY1, leftLegX2, leftLegY2] = pose.leftLeg.split(" ");
  const [rightLegX1, rightLegY1, rightLegX2, rightLegY2] = pose.rightLeg.split(" ");
  const orientation = cube.orientation === "upside_down" ? "rotate(180 40 60)" : "";

  return `
    <g transform="${orientation}">
      <circle cx="${pose.headX}" cy="${pose.headY}" r="12" fill="#fff7dc" stroke="#0d2038" stroke-width="2.5" />
      <line x1="${bodyX1}" y1="${bodyY1}" x2="${bodyX2}" y2="${bodyY2}" stroke="#f8fbff" stroke-width="4.5" stroke-linecap="round" />
      <line x1="${leftArmX1}" y1="${leftArmY1}" x2="${leftArmX2}" y2="${leftArmY2}" stroke="#f8fbff" stroke-width="4.5" stroke-linecap="round" />
      <line x1="${rightArmX1}" y1="${rightArmY1}" x2="${rightArmX2}" y2="${rightArmY2}" stroke="#f8fbff" stroke-width="4.5" stroke-linecap="round" />
      <line x1="${leftLegX1}" y1="${leftLegY1}" x2="${leftLegX2}" y2="${leftLegY2}" stroke="#f8fbff" stroke-width="4.5" stroke-linecap="round" />
      <line x1="${rightLegX1}" y1="${rightLegY1}" x2="${rightLegX2}" y2="${rightLegY2}" stroke="#f8fbff" stroke-width="4.5" stroke-linecap="round" />
      <circle cx="${pose.headX - 4}" cy="${pose.headY - 2}" r="1.7" fill="#0d2038" />
      <circle cx="${pose.headX + 4}" cy="${pose.headY - 2}" r="1.7" fill="#0d2038" />
      <path d="${pose.mouth}" stroke="#0d2038" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="${pose.browLeft}" stroke="#0d2038" stroke-width="1.8" stroke-linecap="round" />
      <path d="${pose.browRight}" stroke="#0d2038" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="40" cy="58" r="28" fill="none" stroke="${palette.glow}" stroke-opacity="0.18" stroke-width="10" />
    </g>
  `;
}

function renderCubeIllustration(cube) {
  const palette = palettes[cube.character] || palettes.Dodger;
  const id = createIdFragment(cube.id);
  const clipId = `frontFace-${id}`;
  const gradientId = `glow-${id}`;
  const safeEmotion = escapeHtml(cube.emotion);
  const safeCharacter = escapeHtml(cube.character);

  return `
    <svg viewBox="0 0 300 220" role="img" aria-label="${safeCharacter} ${safeEmotion}">
      <defs>
        <radialGradient id="${gradientId}" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${palette.scene}" stop-opacity="0" />
        </radialGradient>
        <clipPath id="${clipId}">
          <polygon points="112 76 188 76 188 145 150 168 112 145" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="300" height="220" rx="18" fill="${palette.scene}" />
      <circle cx="150" cy="84" r="90" fill="url(#${gradientId})" />
      <circle cx="45" cy="38" r="3" fill="rgba(255,255,255,0.8)" />
      <circle cx="256" cy="54" r="2.5" fill="rgba(255,255,255,0.7)" />
      <circle cx="240" cy="28" r="1.7" fill="rgba(255,255,255,0.45)" />
      <ellipse cx="150" cy="182" rx="74" ry="18" fill="rgba(0,0,0,0.34)" />
      <g>
        <polygon points="150 26 208 58 150 91 92 58" fill="${palette.top}" />
        <polygon points="92 58 92 151 150 184 150 91" fill="${palette.left}" />
        <polygon points="208 58 208 151 150 184 150 91" fill="${palette.right}" />
        <polygon points="112 76 188 76 188 145 150 168 112 145" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.26)" stroke-width="2" />
        <g clip-path="url(#${clipId})">
          <rect x="112" y="76" width="76" height="92" fill="rgba(255,255,255,0.04)" />
          <circle cx="150" cy="130" r="44" fill="${palette.glow}" fill-opacity="0.16" />
          <g transform="translate(112 76)">
            ${renderStickFigure(cube, palette)}
            ${renderProp(cube, palette)}
          </g>
        </g>
      </g>
      <g>
        <rect x="18" y="16" width="90" height="28" rx="14" fill="rgba(6,12,22,0.52)" stroke="rgba(255,255,255,0.12)" />
        <text x="63" y="34" text-anchor="middle" fill="#edf4ff" font-size="13" font-weight="700">${safeEmotion}</text>
      </g>
      <text x="150" y="205" text-anchor="middle" fill="#edf4ff" font-size="14" font-weight="700">${safeCharacter}</text>
    </svg>
  `;
}

function renderCubeCard(cube) {
  const isSelf = cube.id === myCubeId;
  const neighbors = cube.connectedTo.length
    ? cube.connectedTo
        .map((id) => `<span class="neighbor-chip">${escapeHtml(id.slice(0, 6))}</span>`)
        .join("")
    : '<span class="neighbor-empty">Aucun voisin</span>';

  return `
    <article class="cube-card ${isSelf ? "is-self" : ""}">
      <div class="cube-visual">${renderCubeIllustration(cube)}</div>
      <div class="cube-info">
        <div class="cube-meta">
          <div class="cube-name">${escapeHtml(cube.playerName)}</div>
          <div class="cube-tag">${isSelf ? "Mon cube" : escapeHtml(cube.character)}</div>
        </div>
        <div class="cube-details">
          <div class="detail-line"><strong>ID :</strong> ${escapeHtml(cube.id)}</div>
          <div class="detail-line"><strong>Humeur :</strong> ${escapeHtml(cube.emotion)}</div>
          <div class="detail-line"><strong>Action :</strong> ${escapeHtml(cube.activity)}</div>
          <div class="detail-line"><strong>Orientation :</strong> ${cube.orientation === "upside_down" ? "à l'envers" : "droite"}</div>
        </div>
        <div class="neighbor-list">${neighbors}</div>
        ${
          isSelf
            ? ""
            : `<button data-target="${escapeHtml(cube.id)}">Connecter à ce cube</button>`
        }
      </div>
    </article>
  `;
}

function renderHistory(history) {
  if (!history.length) {
    historyList.innerHTML = '<li class="empty-state">La ville attend ses premiers mouvements.</li>';
    return;
  }

  historyList.innerHTML = history
    .slice()
    .reverse()
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return `
        <li class="history-item">
          <span>${time}</span>
          ${escapeHtml(entry.text)}
        </li>
      `;
    })
    .join("");
}

socket.on("world:update", (state) => {
  const cubes = state.cubes.slice().sort((a, b) => {
    if (a.id === myCubeId) {
      return -1;
    }
    if (b.id === myCubeId) {
      return 1;
    }
    return a.playerName.localeCompare(b.playerName, "fr");
  });

  cubeCount.textContent = `${cubes.length} ${cubes.length > 1 ? "cubes" : "cube"}`;
  const uniqueLinks = new Set(
    cubes.flatMap((cube) => cube.connectedTo.map((target) => [cube.id, target].sort().join("::")))
  );
  linkCount.textContent = `${uniqueLinks.size} ${uniqueLinks.size > 1 ? "liens" : "lien"}`;

  if (!cubes.length) {
    cubeGrid.innerHTML = '<div class="empty-state">Aucun cube connecté pour le moment.</div>';
  } else {
    cubeGrid.innerHTML = cubes.map(renderCubeCard).join("");
  }

  renderHistory(state.history);
});
