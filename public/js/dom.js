// @ts-check
/**
 * @file dom.js
 * @description Centralises DOM access and event bindings.
 *
 * Responsibilities:
 *   - Provide a single reference to all DOM elements used.
 *   - Wire buttons to Socket.IO events.
 *   - Update the direction button state based on the available
 *     faces of the selected target cube.
 *
 * @dependencies Socket.IO (via parameter), native DOM
 */

/** Position offsets for each direction (relative to the target cube). */
/** @type {Record<string, [number, number]>} */
const DIRECTION_OFFSETS = {
  above: [0, -1],
  below: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Returns references to the DOM elements used by the application.
 *
 * @returns {{ historyList: HTMLElement, targetInput: HTMLInputElement, directionButtons: HTMLButtonElement[], selfBadge: HTMLElement, cubeCount: HTMLElement, linkCount: HTMLElement, cubeScene: HTMLElement }}
 */
export function getDomRefs() {
  return {
    historyList: /** @type {HTMLElement} */ (document.getElementById("history")),
    targetInput: /** @type {HTMLInputElement} */ (document.getElementById("targetId")),
    directionButtons: /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll(".dir-btn")]),
    selfBadge: /** @type {HTMLElement} */ (document.getElementById("selfBadge")),
    cubeCount: /** @type {HTMLElement} */ (document.getElementById("cubeCount")),
    linkCount: /** @type {HTMLElement} */ (document.getElementById("linkCount")),
    cubeScene: /** @type {HTMLElement} */ (document.getElementById("cubeScene")),
  };
}

/**
 * Wires the page buttons to Socket.IO events.
 *
 * @param {{ socket: any, targetInput: HTMLInputElement, directionButtons: HTMLButtonElement[] }} params
 */
export function bindControls({ socket, targetInput, directionButtons }) {
  document.querySelectorAll("[data-move]").forEach((button) => {
    const btn = /** @type {HTMLElement} */ (button);
    button.addEventListener("click", () => {
      socket.emit("cube:move", { movement: btn.dataset.move });
    });
  });

  directionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const targetId = targetInput.value.trim();
      if (!targetId) return;
      socket.emit("cubes:connect", { targetId, direction: btn.dataset.dir });
    });
  });
}

/**
 * Displays the local identity of the connected player.
 *
 * @param {HTMLElement} selfBadge
 * @param {string} cubeId
 */
export function setSelfBadge(selfBadge, cubeId) {
  selfBadge.textContent = `My cube: ${cubeId.slice(0, 6)}`;
}

/**
 * Updates the visible counters in the UI.
 *
 * @param {{ cubeCount: HTMLElement, linkCount: HTMLElement, cubeTotal: number, linkTotal: number }} params
 */
export function updateCounters({ cubeCount, linkCount, cubeTotal, linkTotal }) {
  cubeCount.textContent = `${cubeTotal} ${cubeTotal > 1 ? "cubes" : "cube"}`;
  linkCount.textContent = `${linkTotal} ${linkTotal > 1 ? "links" : "link"}`;
}

/**
 * Enables or disables the direction buttons based on the available
 * faces of the target cube in the current world state.
 * A face is unavailable if another cube already occupies it.
 * directionButtons may be undefined during the initial render (empty state, no clickable node).
 *
 * @param {HTMLButtonElement[] | undefined} directionButtons
 * @param {Array<{ id: string, x: number, y: number }>} cubes - Snapshot monde
 * @param {string} targetId - ID of the selected target cube
 */
export function updateDirectionButtons(directionButtons, cubes, targetId) {
  if (!directionButtons) return;
  const target = cubes?.find((c) => c.id === targetId);

  directionButtons.forEach((btn) => {
    const dir = btn.dataset.dir;
    if (!target || !dir) {
      btn.disabled = true;
      btn.classList.remove("selected");
      return;
    }
    const [dx, dy] = DIRECTION_OFFSETS[dir];
    const occupied = (cubes ?? []).some(
      (c) => c.id !== targetId && c.x === target.x + dx && c.y === target.y + dy
    );
    btn.disabled = occupied;
    if (occupied) {
      btn.classList.remove("selected");
    }
  });
}

/**
 * Renders the server history in reverse chronological order.
 *
 * @param {HTMLElement} historyList
 * @param {Array<{ text: string, timestamp: number }>} history
 */
export function renderHistory(historyList, history) {
  if (!history.length) {
    historyList.innerHTML = '<li class="empty-state">The town is waiting for its first moves.</li>';
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

/**
 * Escapes text content before insertion into the DOM.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/** @type {Record<string, string>} */
const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
