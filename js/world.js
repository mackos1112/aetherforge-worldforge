// ─────────────────────────────────────────────────────────────────────────────
// AETHERFORGE WORLDFORGE — world.js
// ES Module entry point bootstrapping the visualizer
// ─────────────────────────────────────────────────────────────────────────────

import { WorldVisualizer } from './world/visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new WorldVisualizer();
});
