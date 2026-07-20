// ─────────────────────────────────────────────────────────────────────────────
// AETHERFORGE WORLDFORGE — world.js
// ES Module entry point bootstrapping the visualizer
// ─────────────────────────────────────────────────────────────────────────────

import { WorldVisualizer } from './world/visualizer.js?v=1.0.4';

document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new WorldVisualizer();
});
