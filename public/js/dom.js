// Centralise les accès DOM pour éviter les requêtes dispersées.
export function getDomRefs() {
  return {
    historyList: document.getElementById("history"),
    targetInput: document.getElementById("targetId"),
    directionSelect: document.getElementById("direction"),
    selfBadge: document.getElementById("selfBadge"),
    cubeCount: document.getElementById("cubeCount"),
    linkCount: document.getElementById("linkCount"),
    cubeScene: document.getElementById("cubeScene"),
  };
}

// Branche les boutons de la page sur les événements Socket.IO.
export function bindControls({ socket, targetInput, directionSelect }) {
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      socket.emit("cube:move", { movement: button.dataset.move });
    });
  });

  document.getElementById("connectBtn").addEventListener("click", () => {
    const targetId = targetInput.value.trim();
    if (!targetId) {
      return;
    }
    socket.emit("cubes:connect", { targetId, direction: directionSelect.value });
  });
}

// Affiche l'identité locale du joueur connecté.
export function setSelfBadge(selfBadge, cubeId) {
  selfBadge.textContent = `Mon cube : ${cubeId.slice(0, 6)}`;
}

// Met à jour les compteurs visibles dans l'interface.
export function updateCounters({ cubeCount, linkCount, cubeTotal, linkTotal }) {
  cubeCount.textContent = `${cubeTotal} ${cubeTotal > 1 ? "cubes" : "cube"}`;
  linkCount.textContent = `${linkTotal} ${linkTotal > 1 ? "liens" : "lien"}`;
}

// Rend l'historique serveur dans l'ordre inverse de lecture.
export function renderHistory(historyList, history) {
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
      return `<li class="history-item"><span>${time}</span>${escapeHtml(entry.text)}</li>`;
    })
    .join("");
}

// Échappe les contenus texte avant insertion dans le DOM.
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
