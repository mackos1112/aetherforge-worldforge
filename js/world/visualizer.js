import { BIOMES, BIOME_KEYS } from './biomes.js?v=1.0.3';
import { WorldEngine } from './engine.js?v=1.0.3';

export class WorldVisualizer {
    constructor() {
        this.container = document.getElementById('worldCanvasContainer');
        this.canvas    = document.getElementById('worldCanvas');
        this.ctx       = this.canvas.getContext('2d');
        this.inspector = document.getElementById('worldInspectorContent');

        this.viewMode      = 'surface';
        this.selectedTile  = null;
        this.selectedLayer= null;
        this.selectedMat = null;

        // Camera
        this.scale = 1.0;
        this.panX  = 0;
        this.panY  = 0;
        this._panning = false;
        this._startX  = 0;
        this._startY  = 0;
        this._didPan  = false;

        // Overlays
        this.showPolitical  = false;
        this.showTopography = true;
        this.showCities     = true;
        this.showPOIs       = true;

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx    = this.offscreenCanvas.getContext('2d');

        // Cached image data for surface map (fast redraw)
        this._surfaceCache = null;
        this._cacheW = 0;
        this._cacheH = 0;

        this._initUI();
        this._regenerate();
        this._setupEvents();
    }

    _initUI() {
        this.inp_seed  = document.getElementById('inputWorldSeed');
        this.btn_rand  = document.getElementById('btnRandomWorldSeed');
        this.sel_size  = document.getElementById('selectPlanetSize');
        this.sel_core  = document.getElementById('selectCoreType');
        this.sel_tect  = document.getElementById('selectTectonics');
        this.sel_atm   = document.getElementById('selectAtmosphere');
        this.sel_clim  = document.getElementById('selectClimate');
        this.btn_forge = document.getElementById('btnForgeWorld');
        this.chk_pol   = document.getElementById('chkPoliticalView');
        this.chk_cit   = document.getElementById('chkShowCities');
        this.chk_poi   = document.getElementById('chkShowPOIs');
        
        // New elements
        this.chk_magic     = document.getElementById('chkAllowMagic');
        this.sel_landmass  = document.getElementById('selectLandmass');
        this.chk_topo      = document.getElementById('chkTopography');
        this.inp_custom_w  = document.getElementById('inputCustomWidth');
        this.inp_custom_h  = document.getElementById('inputCustomHeight');
        this.div_custom_dim= document.getElementById('customDimGroup');

        this.inp_seed.value = Math.floor(Math.random() * 999999).toString();

        this.sel_size.addEventListener('change', () => {
            this.div_custom_dim.style.display = (this.sel_size.value === 'custom') ? 'block' : 'none';
        });
    }

    _showOverlay()  { const o = document.getElementById('worldLoadingOverlay'); if (o) o.style.display = 'flex'; }
    _hideOverlay()  { const o = document.getElementById('worldLoadingOverlay'); if (o) o.style.display = 'none'; }

    _regenerate() {
        this._showOverlay();
        // Defer actual work by one frame so the browser can paint the spinner
        setTimeout(() => {
            try {
                const seed = this.inp_seed.value || String(Math.random());
                let customW = this.inp_custom_w ? parseInt(this.inp_custom_w.value, 10) : 512;
                let customH = this.inp_custom_h ? parseInt(this.inp_custom_h.value, 10) : 256;
                if (isNaN(customW) || customW <= 0) customW = 512;
                if (isNaN(customH) || customH <= 0) customH = 256;
                const allowMagic = this.chk_magic ? this.chk_magic.checked : true;
                const landmass = this.sel_landmass ? this.sel_landmass.value : 'continents';

                this.world = new WorldEngine(
                    seed,
                    this.sel_size.value,
                    this.sel_core.value,
                    this.sel_tect.value,
                    this.sel_atm.value,
                    this.sel_clim.value,
                    customW,
                    customH,
                    allowMagic,
                    landmass
                );
                this._surfaceCache = null;
                this.selectedTile  = this.world.getSector(Math.floor(this.world.width / 2), Math.floor(this.world.height / 2));
                this._resetCamera();
                this._resizeCanvas();
                this._updateInspector();
                this._showToast('🌍 World forged — seed: ' + seed);
            } catch (err) {
                console.error('World forge error:', err);
                this._showToast('⚠️ World forge error: ' + err.message);
            } finally {
                this._hideOverlay();
            }
        }, 30);
    }

    _resetCamera() { this.scale = 1; this.panX = 0; this.panY = 0; }

    _resizeCanvas() {
        const r = this.container.getBoundingClientRect();
        this.canvas.width  = r.width  || 800;
        this.canvas.height = r.height || 600;
        this._surfaceCache = null;
        this._draw();
    }

    _setupEvents() {
        window.addEventListener('resize', () => this._resizeCanvas());
        this.btn_rand.addEventListener('click',  () => { this.inp_seed.value = Math.floor(Math.random() * 999999).toString(); });
        this.btn_forge.addEventListener('click', () => this._regenerate());  // overlay shown inside _regenerate
        this.chk_pol.addEventListener('change',  () => { this.showPolitical = this.chk_pol.checked; this._surfaceCache = null; this._draw(); });
        this.chk_topo.addEventListener('change', () => { this.showTopography = this.chk_topo.checked; this._surfaceCache = null; this._draw(); });
        this.chk_cit.addEventListener('change',  () => { this.showCities    = this.chk_cit.checked; this._draw(); });
        this.chk_poi.addEventListener('change',  () => { this.showPOIs      = this.chk_poi.checked; this._draw(); });
        if (this.chk_magic)    this.chk_magic.addEventListener('change',    () => this._regenerate());
        if (this.sel_landmass) this.sel_landmass.addEventListener('change', () => this._regenerate());

        // View tabs
        document.querySelectorAll('#worldViewTabs .level-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#worldViewTabs .level-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.viewMode = tab.getAttribute('data-view');
                const ctrl = document.getElementById('worldMapControls');
                ctrl.style.display = (this.viewMode === 'surface') ? 'flex' : 'none';
                document.getElementById('txtWorldViewTitle').textContent =
                    this.viewMode === 'surface' ? 'Global Surface Map' :
                    this.viewMode === 'slice'   ? 'Planetary Concentric Slice' : 'Geological Drill Profile';
                this._resetCamera();
                this._draw();
                this._updateInspector();
            });
        });

        // Zoom buttons
        document.getElementById('btnWorldZoomIn').addEventListener('click',    () => { this.scale = Math.min(8, this.scale * 1.25); this._draw(); });
        document.getElementById('btnWorldZoomOut').addEventListener('click',   () => { this.scale = Math.max(0.3, this.scale / 1.25); this._draw(); });
        document.getElementById('btnWorldZoomReset').addEventListener('click', () => { this._resetCamera(); this._draw(); });

        // Mouse
        this.canvas.addEventListener('mousedown', e => {
            this._panning = true;
            this._didPan  = false;
            this._startX  = e.clientX - this.panX;
            this._startY  = e.clientY - this.panY;
        });
        this.canvas.addEventListener('mousemove', e => {
            if (this._panning) {
                const dx = e.clientX - this._startX - this.panX;
                const dy = e.clientY - this._startY - this.panY;
                if (Math.abs(dx) + Math.abs(dy) > 3) this._didPan = true;
                this.panX = e.clientX - this._startX;
                this.panY = e.clientY - this._startY;
                this._draw();
            } else if (this.viewMode === 'surface') {
                const s = this._tileFromMouse(e);
                if (s) {
                    document.getElementById('txtWorldCoords').textContent = `Lat: ${s.lat}°, Lon: ${s.lon}°`;
                    document.getElementById('txtWorldSector').textContent = `${s.biome}${s.isRiver ? ' (River)' : ''}`;
                }
            }
        });
        this.canvas.addEventListener('mouseup', e => {
            this._panning = false;
            if (this._didPan) return;  // was a pan, not a click
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            if (this.viewMode === 'surface') {
                const s = this._tileFromMouse(e);
                if (s) { this.selectedTile = s; this._draw(); this._updateInspector(); }
            } else if (this.viewMode === 'slice') {
                const l = this._sliceLayerFromMouse(mx, my);
                if (l) { this.selectedLayer = l; this._updateInspector(); }
            } else {
                const m = this._profileMatFromMouse(mx, my);
                if (m) { this.selectedMat = m; this._updateInspector(); }
            }
        });
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            this.scale = Math.min(8, Math.max(0.3, this.scale * factor));
            this._surfaceCache = null;
            this._draw();
        }, { passive: false });
    }

    // ── Tile Helpers ─────────────────────────────────────────────────────────
    _tileSize() {
        const cw = this.canvas.width, ch = this.canvas.height;
        const tw = cw / this.world.width;
        const th = ch / this.world.height;
        return Math.min(tw, th) * this.scale;
    }
    _mapOrigin() {
        const ts  = this._tileSize();
        const mw  = this.world.width  * ts;
        const mh  = this.world.height * ts;
        return { ox: (this.canvas.width  - mw) / 2 + this.panX,
                 oy: (this.canvas.height - mh) / 2 + this.panY,
                 ts };
    }
    _tileFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const { ox, oy, ts } = this._mapOrigin();
        const tx = Math.floor((mx - ox) / ts);
        const ty = Math.floor((my - oy) / ts);
        if (tx >= 0 && tx < this.world.width && ty >= 0 && ty < this.world.height) return this.world.grid[ty][tx];
        return null;
    }

    // ── Draw Dispatcher ───────────────────────────────────────────────────────
    _draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.world) return;
        if (this.viewMode === 'surface')       this._drawSurface();
        else if (this.viewMode === 'slice')    this._drawSlice();
        else                                   this._drawProfile();
    }

    // ── Surface Map ───────────────────────────────────────────────────────────
    _drawSurface() {
        const { ox, oy, ts } = this._mapOrigin();
        const W = this.world.width, H = this.world.height;

        // Build a pixel buffer for the base terrain (cached)
        if (!this._surfaceCache || this._cacheW !== W || this._cacheH !== H) {
            this._buildSurfaceCache(W, H);
        }
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offscreenCanvas, Math.round(ox), Math.round(oy), W * ts, H * ts);
        this.ctx.imageSmoothingEnabled = true;

        // Topography contours
        if (this.showTopography) {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            const thresholds = [0.52, 0.57, 0.62, 0.67, 0.72, 0.77, 0.82, 0.87, 0.92, 0.97];
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const idx = y * W + x;
                    const hCurrent = this.world.heightMap[idx];
                    if (hCurrent < 0.49) continue;

                    // Right neighbor
                    const nx = (x + 1) % W;
                    const nIdxX = y * W + nx;
                    const hRight = this.world.heightMap[nIdxX];
                    if (hRight >= 0.49) {
                        for (const th of thresholds) {
                            if ((hCurrent < th && hRight >= th) || (hCurrent >= th && hRight < th)) {
                                this.ctx.beginPath();
                                this.ctx.moveTo(ox + (x + 1) * ts, oy + y * ts);
                                this.ctx.lineTo(ox + (x + 1) * ts, oy + (y + 1) * ts);
                                this.ctx.stroke();
                                break;
                            }
                        }
                    }

                    // Bottom neighbor
                    if (y < H - 1) {
                        const nIdxY = (y + 1) * W + x;
                        const hBottom = this.world.heightMap[nIdxY];
                        if (hBottom >= 0.49) {
                            for (const th of thresholds) {
                                if ((hCurrent < th && hBottom >= th) || (hCurrent >= th && hBottom < th)) {
                                    this.ctx.beginPath();
                                    this.ctx.moveTo(ox + x * ts, oy + (y + 1) * ts);
                                    this.ctx.lineTo(ox + (x + 1) * ts, oy + (y + 1) * ts);
                                    this.ctx.stroke();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Draw smooth vector rivers
        if (this.world.riverPaths && this.world.riverPaths.length > 0) {
            this.ctx.strokeStyle = '#3a94b4';
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // Adjust river width based on zoom/tile size
            const baseWidth = Math.max(1.0, ts * 0.45);
            
            for (const path of this.world.riverPaths) {
                if (path.length < 2) continue;
                
                this.ctx.beginPath();
                this.ctx.lineWidth = baseWidth;
                
                let first = true;
                for (let k = path.length - 1; k >= 0; k--) {
                    const pt = path[k];
                    const px = ox + (pt.x + 0.5) * ts;
                    const py = oy + (pt.y + 0.5) * ts;
                    
                    if (!first) {
                        const prevPt = path[k + 1];
                        const dx = Math.abs(pt.x - prevPt.x);
                        if (dx > W / 2) {
                            // Toroidal map wrap safety
                            this.ctx.stroke();
                            this.ctx.beginPath();
                            this.ctx.moveTo(px, py);
                            continue;
                        }
                    }
                    
                    if (first) {
                        this.ctx.moveTo(px, py);
                        first = false;
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.stroke();
            }
        }

        // Political overlay
        if (this.showPolitical) {
            const nMap = this.world.nationMap;
            for (let y = 0; y < H; y++) {
                const rowOffset = y * W;
                for (let x = 0; x < W; x++) {
                    const idx = rowOffset + x;
                    const nationId = nMap[idx];
                    if (nationId !== -1) {
                        const col = this.world.nations[nationId].color;
                        this.ctx.fillStyle = this._hexToRgba(col, 0.38);
                        this.ctx.fillRect(ox + x * ts, oy + y * ts, ts, ts);
                    }
                }
            }
            // Nation borders
            this.ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            this.ctx.lineWidth = 1;
            const dirs = [[1,0],[0,1]];
            for (let y = 0; y < H; y++) {
                const rowOffset = y * W;
                for (let x = 0; x < W; x++) {
                    const idx = rowOffset + x;
                    const nationId = nMap[idx];
                    for (const [dx, dy] of dirs) {
                        const nx = (x + dx + W) % W, ny = Math.min(H - 1, y + dy);
                        const nbIdx = ny * W + nx;
                        const nbNationId = nMap[nbIdx];
                        if (nationId !== nbNationId && (nationId !== -1 || nbNationId !== -1)) {
                            this.ctx.beginPath();
                            if (dx === 1) { this.ctx.moveTo(ox + (x+1)*ts, oy + y*ts); this.ctx.lineTo(ox + (x+1)*ts, oy + (y+1)*ts); }
                            else          { this.ctx.moveTo(ox + x*ts, oy + (y+1)*ts); this.ctx.lineTo(ox + (x+1)*ts, oy + (y+1)*ts); }
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        // Selected tile highlight
        if (this.selectedTile) {
            const { x, y } = this.selectedTile;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = Math.max(1.5, 2.5 * Math.min(this.scale, 2));
            this.ctx.strokeRect(ox + x * ts + 0.5, oy + y * ts + 0.5, ts - 1, ts - 1);
        }

        // Cities overlay — map pins
        if (this.showCities) {
            for (const c of this.world.cities) {
                const px = ox + (c.x + 0.5) * ts;
                const py = oy + (c.y + 0.5) * ts;
                const r = Math.max(2, (c.isCapital ? 5.5 : 3.5) * Math.min(this.scale * 0.75, 2.2));
                const isSelected = this.selectedTile && this.selectedTile.x === c.x && this.selectedTile.y === c.y;

                // Outer glow halo for capitals or selected city (only when big enough)
                if ((c.isCapital || isSelected) && r >= 3) {
                    try {
                        const glowGrad = this.ctx.createRadialGradient(px, py, r * 0.3, px, py, r * 2.8);
                        glowGrad.addColorStop(0, isSelected ? 'rgba(100, 220, 255, 0.5)' : 'rgba(255, 209, 102, 0.45)');
                        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
                        this.ctx.fillStyle = glowGrad;
                        this.ctx.beginPath();
                        this.ctx.arc(px, py, r * 2.8, 0, Math.PI * 2);
                        this.ctx.fill();
                    } catch (e) { /* skip glow at extreme zoom */ }
                }

                // Base pin circle — use gradient only when r is large enough to avoid DOMException
                this.ctx.beginPath();
                this.ctx.arc(px, py, r, 0, Math.PI * 2);
                if (r >= 3) {
                    try {
                        const pinGrad = this.ctx.createRadialGradient(px - r * 0.25, py - r * 0.25, 0.5, px, py, r);
                        if (c.isCapital) {
                            pinGrad.addColorStop(0, '#ffe9a0');
                            pinGrad.addColorStop(0.6, '#dfc45d');
                            pinGrad.addColorStop(1, '#a0852a');
                        } else {
                            pinGrad.addColorStop(0, '#f0f0f0');
                            pinGrad.addColorStop(0.6, '#bdc3c7');
                            pinGrad.addColorStop(1, '#808b96');
                        }
                        this.ctx.fillStyle = pinGrad;
                    } catch (e) {
                        this.ctx.fillStyle = c.isCapital ? '#dfc45d' : '#bdc3c7';
                    }
                } else {
                    // Solid fallback at small scales
                    this.ctx.fillStyle = c.isCapital ? '#dfc45d' : '#bdc3c7';
                }
                this.ctx.fill();
                this.ctx.strokeStyle = isSelected ? '#00e5ff' : (c.isCapital ? '#8c7625' : '#333');
                this.ctx.lineWidth = Math.max(0.5, isSelected ? 2 : 1);
                this.ctx.stroke();

                // Castle battlement crown for capitals (only when rendered large enough)
                if (c.isCapital && r >= 5) {
                    const cr = r * 0.52;
                    this.ctx.fillStyle = '#a0852a';
                    for (let m = -1; m <= 1; m++) {
                        const bx = px + m * cr * 0.65;
                        this.ctx.fillRect(bx - cr * 0.18, py - r - cr * 0.55, cr * 0.35, cr * 0.5);
                    }
                }

                // Label (only when tile size is large enough to be legible)
                if (ts >= 4) {
                    this.ctx.fillStyle = c.isCapital ? '#ffe599' : '#dde1e4';
                    this.ctx.font = `${c.isCapital ? 'bold ' : ''}${Math.max(8, Math.min(12, ts * 0.9))}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = '#000';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillText(c.name, px, py - r - 4);
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // POIs overlay
        if (this.showPOIs) {
            for (const p of this.world.pois) {
                const px = ox + (p.x + 0.5) * ts, py = oy + (p.y + 0.5) * ts;
                const sz = Math.max(5, Math.min(10, ts * 0.65));
                this.ctx.beginPath();
                this.ctx.moveTo(px, py - sz);
                this.ctx.lineTo(px + sz * 0.7, py);
                this.ctx.lineTo(px, py + sz);
                this.ctx.lineTo(px - sz * 0.7, py);
                this.ctx.closePath();
                this.ctx.fillStyle   = '#ff4d6d';
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth   = 1;
                this.ctx.fill();
                this.ctx.stroke();
                if (ts >= 5) {
                    this.ctx.fillStyle = '#ffd166';
                    this.ctx.font = `${Math.max(8, Math.min(10, ts * 0.7))}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = '#000'; this.ctx.shadowBlur = 4;
                    this.ctx.fillText(p.label, px, py + sz + 10);
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // Macro Magic Anomalies (Leyline Networks & Arcane Nebulae visible at full world scale)
        this._drawMacroMagicAnomalies(ox, oy, ts, W, H);

        // Legend
        this._drawLegend();
    }

    _drawMacroMagicAnomalies(ox, oy, ts, W, H) {
        if (!this.world || !this.world.anomalyEpicenters || this.world.anomalyEpicenters.length === 0) return;

        this.ctx.save();
        try {
            const time = Date.now() * 0.002;

            for (const epicenter of this.world.anomalyEpicenters) {
                if (!epicenter) continue;
                const px = ox + (epicenter.x + 0.5) * ts;
                const py = oy + (epicenter.y + 0.5) * ts;
                const radPx = Math.max(14, epicenter.radius * ts);

                let colorCore = 'rgba(192, 132, 252, 0.45)';
                let colorGlow = 'rgba(168, 85, 247, 0.22)';
                let colorBeam = '#d8b4fe';

                if (epicenter.type === 'Mana Wastes' || epicenter.type === 'Astral Rift') {
                    colorCore = 'rgba(56, 189, 248, 0.45)';
                    colorGlow = 'rgba(14, 165, 233, 0.22)';
                    colorBeam = '#7dd3fc';
                } else if (epicenter.type === 'Fey Wildwood' || epicenter.type === 'Bioluminescent Jungle') {
                    colorCore = 'rgba(74, 222, 128, 0.45)';
                    colorGlow = 'rgba(34, 197, 94, 0.22)';
                    colorBeam = '#86efac';
                } else if (epicenter.type === 'Obsidian Spireland') {
                    colorCore = 'rgba(244, 63, 94, 0.45)';
                    colorGlow = 'rgba(225, 29, 72, 0.22)';
                    colorBeam = '#fda4af';
                }

                // 1. Radial Energy Field Nebula
                try {
                    if (isFinite(px) && isFinite(py) && radPx > 0) {
                        const grad = this.ctx.createRadialGradient(px, py, Math.max(0.1, radPx * 0.1), px, py, Math.max(1, radPx * 1.5));
                        grad.addColorStop(0, colorCore);
                        grad.addColorStop(0.5, colorGlow);
                        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                        this.ctx.fillStyle = grad;
                        this.ctx.beginPath();
                        this.ctx.arc(px, py, radPx * 1.5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } catch (e) {}

                // 2. Spiraling Leyline Arcs
                this.ctx.strokeStyle = colorBeam;
                this.ctx.lineWidth = Math.max(1, Math.min(3, ts * 0.4));
                this.ctx.globalAlpha = 0.7;

                const numArcs = 5;
                for (let a = 0; a < numArcs; a++) {
                    const angleOffset = (a / numArcs) * Math.PI * 2 + time * 0.5;
                    this.ctx.beginPath();
                    for (let r = 5; r <= radPx * 1.2; r += 4) {
                        const rotAngle = angleOffset + (r / radPx) * 1.8;
                        const ax = px + Math.cos(rotAngle) * r;
                        const ay = py + Math.sin(rotAngle) * r;
                        if (r === 5) this.ctx.moveTo(ax, ay);
                        else this.ctx.lineTo(ax, ay);
                    }
                    this.ctx.stroke();
                }

                // 3. Floating Arcane Spark Particles
                this.ctx.fillStyle = '#ffffff';
                const numParticles = 8;
                for (let p = 0; p < numParticles; p++) {
                    const pAngle = (p / numParticles) * Math.PI * 2 - time * 0.8 + p;
                    const pDist = (0.2 + 0.7 * Math.sin(time + p * 1.5)) * radPx;
                    const spX = px + Math.cos(pAngle) * pDist;
                    const spY = py + Math.sin(pAngle) * pDist;
                    const pSize = Math.max(1.2, Math.min(3.5, ts * 0.3));

                    this.ctx.beginPath();
                    this.ctx.arc(spX, spY, pSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // 4. Region Macro Label
                if (ts >= 1.5) {
                    this.ctx.globalAlpha = 1.0;
                    this.ctx.fillStyle = colorBeam;
                    this.ctx.font = `bold ${Math.max(10, Math.min(14, ts * 1.2))}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = '#000';
                    this.ctx.shadowBlur = 6;
                    this.ctx.fillText(`⚡ ${epicenter.type} Zone`, px, py - radPx * 1.2 - 4);
                    this.ctx.shadowBlur = 0;
                }
            }
        } catch (err) {
            console.error('Error drawing macro magic anomalies:', err);
        } finally {
            this.ctx.restore();
        }
    }

    _buildSurfaceCache(W, H) {
        this.offscreenCanvas.width = W;
        this.offscreenCanvas.height = H;
        const img = new ImageData(W, H);
        const data = img.data;
        const hMap = this.world.heightMap;
        const bMap = this.world.biomeMap;
        const rMap = this.world.riverMap;

        for (let ty = 0; ty < H; ty++) {
            const rowOffset = ty * W;
            for (let tx = 0; tx < W; tx++) {
                const idx = rowOffset + tx;

                const biomeIdx = bMap[idx];
                const biome = BIOME_KEYS[biomeIdx] || 'Ocean';
                const info = BIOMES[biome] || BIOMES['Plains'] || BIOMES['Ocean'];
                let [r, g, b] = (info && info.col) ? info.col : [60, 120, 170];

                // Height-based shading (hillshade)
                const h = hMap[idx];
                
                // Calculate terrain gradient (normal vector)
                const westTx = (tx - 1 + W) % W;
                const eastTx = (tx + 1) % W;
                const northTy = Math.max(0, ty - 1);
                const southTy = Math.min(H - 1, ty + 1);
                
                const hWest = hMap[ty * W + westTx];
                const hEast = hMap[ty * W + eastTx];
                const hNorthVal = hMap[northTy * W + tx];
                const hSouthVal = hMap[southTy * W + tx];
                
                // Scale factor to amplify or reduce slope impact
                const slopeScale = 4.0; 
                const dx = (hEast - hWest) * slopeScale;
                const dy = (hSouthVal - hNorthVal) * slopeScale;
                
                // Light source from North-West (135 degrees)
                const lx = -0.707;
                const ly = -0.707;
                const lz = 0.5;
                
                // Normal vector components: N = (-dx, -dy, 1) normalized
                const len = Math.sqrt(dx * dx + dy * dy + 1.0);
                const nx = -dx / len;
                const ny = -dy / len;
                const nz = 1.0 / len;
                
                // Dot product for diffuse lighting
                const dot = nx * lx + ny * ly + nz * lz;
                
                // Combine height coloring + directional shading (stepped 10 levels)
                const steps = 10;
                const hStepped = Math.floor(h * steps) / steps;
                const heightFactor = 0.5 + hStepped * 0.5;
                const lightFactor = Math.max(0.4, Math.min(1.6, dot * 1.5));
                const shade = heightFactor * lightFactor;
                
                r = Math.min(255, Math.max(0, Math.round(r * shade)));
                g = Math.min(255, Math.max(0, Math.round(g * shade)));
                b = Math.min(255, Math.max(0, Math.round(b * shade)));

                // River tint override
                if (rMap[idx] === 1) { r = 58; g = 148; b = 180; }
                const pIdx = (ty * W + tx) * 4;
                data[pIdx]   = r;
                data[pIdx+1] = g;
                data[pIdx+2] = b;
                data[pIdx+3] = 255;
            }
        }
        this.offscreenCtx.putImageData(img, 0, 0);
        this._surfaceCache = true;
        this._cacheW = W;
        this._cacheH = H;
    }

    _drawLegend() {
        const ctx = this.ctx;
        const items = [
            { col: [12, 24, 58], label: 'Deep Ocean' },
            { col: [22, 54, 105], label: 'Ocean' },
            { col: [52, 112, 48], label: 'Forest' },
            { col: [86, 148, 52], label: 'Grassland' },
            { col: [210, 170, 80], label: 'Desert' },
            { col: [88, 88, 112], label: 'Mountain' },
            { col: [230, 188, 70], label: 'Dune Sea' },
            { col: [96, 28, 18], label: 'Volcano' },
        ];
        const boxW = 134;
        const boxH = items.length * 16 + 14;
        const x0 = this.canvas.width - boxW - 14;
        const y0 = 14;
        ctx.fillStyle = 'rgba(10,11,14,0.82)';
        ctx.fillRect(x0 - 6, y0, boxW, boxH);
        ctx.font = '10px Share, sans-serif';
        items.forEach((it, i) => {
            const y = y0 + 8 + i * 16;
            ctx.fillStyle = `rgb(${it.col[0]},${it.col[1]},${it.col[2]})`;
            ctx.fillRect(x0, y, 12, 10);
            ctx.fillStyle = '#e5e0c3';
            ctx.textAlign = 'left';
            ctx.fillText(it.label, x0 + 18, y + 9);
        });
    }

    _hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }

    // ── Concentric Slice ──────────────────────────────────────────────────────
    _drawSlice() {
        const ctx = this.ctx;
        const cx  = this.canvas.width / 2 + this.panX;
        const cy  = this.canvas.height / 2 + this.panY;
        const S   = this.scale;

        const R = {
            innerCore: 45 * S, outerCore: 90 * S,
            mantle: 160 * S, astheno: 185 * S,
            litho: 202 * S,  crust: 214 * S,
            tropo: 228 * S,  strato: 242 * S,
            meso: 256 * S,   thermo: 272 * S,
            exo: 290 * S,    magneto: 330 * S,
        };
        this._sliceR = R;

        // Background stars
        ctx.fillStyle = '#08090e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < 200; i++) {
            const sx = (i * 137.508) % this.canvas.width;
            const sy = (i * 253.7)   % this.canvas.height;
            ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 3) * 0.15})`;
            ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
        }

        // Magnetosphere glow
        const mgGrad = ctx.createRadialGradient(cx, cy, R.exo, cx, cy, R.magneto);
        mgGrad.addColorStop(0, 'rgba(100, 160, 255, 0.25)');
        mgGrad.addColorStop(1, 'rgba(60, 100, 220, 0.0)');
        ctx.fillStyle = mgGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.magneto, 0, Math.PI*2); ctx.fill();

        // Atmosphere rings
        const atmosRings = [
            { r: R.exo,    col: 'rgba(255,255,255,0.03)' },
            { r: R.thermo, col: 'rgba(255,200,100,0.07)' },
            { r: R.meso,   col: 'rgba(130,210,255,0.10)' },
            { r: R.strato, col: 'rgba(160,235,255,0.16)' },
            { r: R.tropo,  col: 'rgba(200,240,255,0.28)' },
        ];
        for (const ar of atmosRings) {
            ctx.fillStyle = ar.col;
            ctx.beginPath(); ctx.arc(cx, cy, ar.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, ar.r, 0, Math.PI*2); ctx.stroke();
        }

        // Surface ring
        const N = this.world.width;
        for (let i = 0; i < N; i++) {
            const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
            const tx = Math.floor(i);
            const ty = Math.floor(this.world.height / 2);
            const idx = ty * this.world.width + tx;
            const biomeIdx = this.world.biomeMap[idx];
            const biome = BIOME_KEYS[biomeIdx] || 'Ocean';
            const info = BIOMES[biome] || BIOMES['Ocean'];
            const [r, g, b] = info.col;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * R.crust, cy + Math.sin(angle) * R.crust);
            ctx.arc(cx, cy, R.crust, angle, angle + (Math.PI * 2 / N) + 0.01);
            ctx.lineTo(cx + Math.cos(angle + Math.PI * 2 / N) * R.tropo, cy + Math.sin(angle + Math.PI * 2 / N) * R.tropo);
            ctx.arc(cx, cy, R.tropo, angle + Math.PI * 2 / N, angle, true);
            ctx.closePath();
            ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
            ctx.fill();
        }

        // Crust
        ctx.fillStyle = '#7a6a6a';
        ctx.beginPath(); ctx.arc(cx, cy, R.crust, 0, Math.PI*2); ctx.fill();

        // Lithosphere
        ctx.fillStyle = '#4a4040';
        ctx.beginPath(); ctx.arc(cx, cy, R.litho, 0, Math.PI*2); ctx.fill();

        // Asthenosphere
        const asGrad = ctx.createRadialGradient(cx, cy, R.astheno * 0.9, cx, cy, R.astheno);
        asGrad.addColorStop(0, '#6e1a1a'); asGrad.addColorStop(1, '#3a0f0f');
        ctx.fillStyle = asGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.astheno, 0, Math.PI*2); ctx.fill();

        // Mantle
        const mGrad = ctx.createRadialGradient(cx, cy, R.outerCore, cx, cy, R.mantle);
        mGrad.addColorStop(0, '#a03010'); mGrad.addColorStop(1, '#601a08');
        ctx.fillStyle = mGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.mantle, 0, Math.PI*2); ctx.fill();

        // Outer core
        let cCore = '#ffd166';
        if (this.world.coreType === 'silicate') cCore = '#7a7aaa';
        if (this.world.coreType === 'gold-molten') cCore = '#ffb703';
        if (this.world.coreType === 'crystal') cCore = '#00f5d4';
        const ocGrad = ctx.createRadialGradient(cx, cy, R.innerCore, cx, cy, R.outerCore);
        ocGrad.addColorStop(0, cCore); ocGrad.addColorStop(1, '#a03010');
        ctx.fillStyle = ocGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.outerCore, 0, Math.PI*2); ctx.fill();

        // Inner core
        const icGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R.innerCore);
        icGrad.addColorStop(0, '#ffffff');
        icGrad.addColorStop(0.4, cCore);
        icGrad.addColorStop(1, this._adjustBrightness(cCore, -40));
        ctx.fillStyle = icGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.innerCore, 0, Math.PI*2); ctx.fill();

        // Separators
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        for (const r of Object.values(R)) {
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        }
        // Labels with connector lines and target dots
        const layersInfo = [
            { name: 'Magnetosphere',          rInner: R.exo,      rOuter: R.magneto,    a: -0.55 },
            { name: 'Exosphere',              rInner: R.thermo,   rOuter: R.exo,        a: -0.45 },
            { name: 'Thermosphere',           rInner: R.meso,      rOuter: R.thermo,     a: -0.35 },
            { name: 'Mesosphere / Stratosphere', rInner: R.tropo, rOuter: R.meso,      a: -0.25 },
            { name: 'Troposphere',            rInner: R.crust,    rOuter: R.tropo,      a: -0.15 },
            { name: 'Crust / Lithosphere',    rInner: R.astheno,  rOuter: R.crust,      a: -0.05 },
            { name: 'Asthenosphere',          rInner: R.mantle,   rOuter: R.astheno,    a: 0.05 },
            { name: 'Mantle',                 rInner: R.outerCore,rOuter: R.mantle,     a: 0.15 },
            { name: 'Outer Core',             rInner: R.innerCore,rOuter: R.outerCore,  a: 0.25 },
            { name: 'Inner Core',             rInner: 0,          rOuter: R.innerCore,  a: 0.35 },
        ];

        layersInfo.forEach((lyr) => {
            const rMid = lyr.rInner === 0 ? lyr.rOuter * 0.45 : (lyr.rInner + lyr.rOuter) / 2;
            const a = lyr.a;
            
            // Outer point where label is placed
            const outerR = R.magneto + 30;
            const xText = cx + Math.cos(a) * outerR;
            const yText = cy + Math.sin(a) * outerR;
            
            // Inner point inside the layer
            const xLayer = cx + Math.cos(a) * rMid;
            const yLayer = cy + Math.sin(a) * rMid;
            
            // Draw pointer line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(229, 224, 195, 0.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.moveTo(xLayer, yLayer);
            ctx.lineTo(xText, yText);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
            
            // Draw a small dot at the end inside the layer
            ctx.beginPath();
            ctx.fillStyle = '#ffd166';
            ctx.arc(xLayer, yLayer, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = '#e5e0c3';
            ctx.font = `${Math.max(9, 11 * S)}px 'Share', sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(lyr.name, xText + 4, yText + 3);
        });
    }

    _adjustBrightness(hex, amt) {
        const r = Math.min(255, Math.max(0, parseInt(hex.slice(1,3), 16) + amt));
        const g = Math.min(255, Math.max(0, parseInt(hex.slice(3,5), 16) + amt));
        const b = Math.min(255, Math.max(0, parseInt(hex.slice(5,7), 16) + amt));
        return `rgb(${r},${g},${b})`;
    }

    _sliceLayerFromMouse(mx, my) {
        const cx  = this.canvas.width / 2 + this.panX;
        const cy  = this.canvas.height / 2 + this.panY;
        const d   = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) / this.scale;
        const R   = { innerCore:45, outerCore:90, mantle:160, astheno:185, litho:202, crust:214,
                      tropo:228, strato:242, meso:256, thermo:272, exo:290, magneto:330 };
        if (d <= R.innerCore) return { layer: this.world.coreLayers[5] };
        if (d <= R.outerCore) return { layer: this.world.coreLayers[4] };
        if (d <= R.mantle)    return { layer: this.world.coreLayers[3] };
        if (d <= R.astheno)   return { layer: this.world.coreLayers[2] };
        if (d <= R.litho)     return { layer: this.world.coreLayers[1] };
        if (d <= R.crust)     return { layer: this.world.coreLayers[0] };
        if (d <= R.tropo)     return { layer: this.world.atmosphereLayers[0] };
        if (d <= R.strato)    return { layer: this.world.atmosphereLayers[1] };
        if (d <= R.meso)      return { layer: this.world.atmosphereLayers[2] };
        if (d <= R.thermo)    return { layer: this.world.atmosphereLayers[3] };
        if (d <= R.exo)       return { layer: this.world.atmosphereLayers[4] };
        if (d <= R.magneto)   return { layer: this.world.atmosphereLayers[5] };
        return null;
    }

    // ── Geological Profile ────────────────────────────────────────────────────
    _drawProfile() {
        const ctx = this.ctx;
        const CW = this.canvas.width, CH = this.canvas.height;
        ctx.fillStyle = '#0a0b0e';
        ctx.fillRect(0, 0, CW, CH);

        const colW  = Math.min(280, CW * 0.35) * this.scale;
        const colX  = CW / 2 - colW / 2 + this.panX;
        const startY= 60 * this.scale + this.panY;
        const tile  = this.selectedTile || this.world.grid[0][0];

        const layers = [
            { h: 70,  label: 'Atmosphere / Air Column',          col: [180, 220, 255, 0.15],soil: 'N₂, O₂, CO₂, Ar vapour' },
            { h: 55,  label: `A-Horizon: ${tile.soil}`,          col: [120, 80, 40, 1],    soil: tile.soil },
            { h: 70,  label: 'B-Horizon: Subsoil / Regolith',    col: [140, 120, 90, 1],   soil: 'Iron oxide clay, fragmented parent rock' },
            { h: 100, label: `C-Horizon: Weathered ${tile.bedrock}`,col:[80,78,90,1],       soil: tile.bedrock },
            { h: 120, label: `R-Horizon: Solid Bedrock`,         col: [55, 55, 70, 1],     soil: tile.bedrock + ' (consolidated)' },
            { h: 80,  label: `Geothermal Zone (${tile.magmaPct}% heat index)`,col:[130,30,10,1],soil:'Molten basalt, dissolved gases' },
        ];

        let curY = startY;
        this._profileLayers = [];
        for (const lyr of layers) {
            const lh = lyr.h * this.scale;
            const [r, g, b, a] = lyr.col;

            const grad = ctx.createLinearGradient(colX, curY, colX + colW, curY + lh);
            grad.addColorStop(0,   `rgba(${r+15},${g+10},${b+10},${a})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
            grad.addColorStop(1,   `rgba(${Math.max(0,r-20)},${Math.max(0,g-15)},${Math.max(0,b-15)},${a})`);
            ctx.fillStyle = grad;
            ctx.fillRect(colX, curY, colW, lh);

            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(colX, curY, colW, lh);

            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(9, 11 * Math.min(this.scale, 1.5))}px 'Share', sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
            ctx.fillText(lyr.label, colX + colW / 2, curY + lh / 2 + 4);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffd166';
            ctx.font = `${Math.max(8, 10 * Math.min(this.scale, 1.5))}px 'Share', sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(`⟵ ${lyr.soil}`, colX - 6, curY + lh / 2 + 4);

            this._profileLayers.push({ y1: curY, y2: curY + lh, x1: colX, x2: colX + colW,
                name: lyr.label, desc: lyr.soil });
            curY += lh;
        }

        const depthScale = [0, 1, 5, 20, 50, 120];
        ctx.fillStyle = '#6688aa';
        ctx.font = `${Math.max(8, 9 * Math.min(this.scale, 1.5))}px 'Share', sans-serif`;
        ctx.textAlign = 'left';
        layers.forEach((lyr, i) => {
            const ly = startY + layers.slice(0, i).reduce((a,b) => a + b.h, 0) * this.scale;
            ctx.fillText(`−${depthScale[i]}m`, colX + colW + 10, ly + 10);
        });
    }

    _profileMatFromMouse(mx, my) {
        if (!this._profileLayers) return null;
        for (const l of this._profileLayers) {
            if (mx >= l.x1 && mx <= l.x2 && my >= l.y1 && my <= l.y2) {
                return { name: l.name, desc: l.desc };
            }
        }
        return null;
    }

    // ── Inspector ─────────────────────────────────────────────────────────────
    _updateInspector() {
        let html = '';

        if (this.viewMode === 'surface') {
            const tile = this.selectedTile;
            if (!tile) { this.inspector.innerHTML = '<p>Click a tile to inspect.</p>'; return; }
            const nation = tile.nationId !== -1 ? this.world.nations[tile.nationId] : null;
            const isOcean = ['Deep Ocean','Ocean','Shallow Sea','Trench','Coral Reef','Kelp Forest'].includes(tile.biome);

            html += `<div class="inspector-section">
                <h3>${tile.biome}</h3>
                <p><strong>Coords</strong>: ${tile.lat}°${tile.lat > 0 ? 'N' : 'S'}, ${tile.lon}°${tile.lon > 0 ? 'E' : 'W'}</p>
                <p><strong>Grid</strong>: [${tile.x}, ${tile.y}]</p>
            </div>`;

            html += `<div class="inspector-section">
                <h4>Environmental Readings</h4>
                <p>🌡️ <strong>Temperature</strong>: ${tile.temp}°C</p>
                <p>💧 <strong>Moisture</strong>: ${tile.moisture}%</p>
                ${!isOcean ? `<p>🪨 <strong>Soil</strong>: ${tile.soil}</p>
                <p>⛰️ <strong>Bedrock</strong>: ${tile.bedrock}</p>
                <p>🔥 <strong>Geothermal Index</strong>: ${tile.magmaPct}%</p>
                <p>🌊 <strong>Aquifer Depth</strong>: ~${tile.aquifer}m</p>` : ''}
                ${tile.isRiver ? '<p>〰️ <strong>Hydrological</strong>: River channel</p>' : ''}
                ${tile.isLake  ? '<p>🏞️ <strong>Hydrological</strong>: Lake basin</p>' : ''}
            </div>`;

            html += `<div class="inspector-section">
                <h4>Survival & Travel</h4>
                <p>🥾 <strong>Terrain Difficulty</strong>: ${tile.travelSpeed}</p>
                <p>🍎 <strong>Survival Likelihood</strong>: ${tile.forageRating}</p>
                ${tile.localMinorFaction !== 'None' ? `<p>🚩 <strong>Local Active Group</strong>: ${tile.localMinorFaction}</p>` : ''}
            </div>`;

            if (!isOcean) {
                html += `<div class="inspector-section">
                    <h4>Political Territory</h4>`;
                if (nation) {
                    html += `<p>🏴 <strong>${nation.name}</strong></p>
                    <div style="width:100%;height:4px;border-radius:2px;background:${nation.color};margin:4px 0;opacity:0.85;"></div>`;
                } else {
                    html += `<p style="color:var(--text-secondary)">🌿 Unclaimed Wilderness</p>`;
                }
                if (tile.city) {
                    html += `<p>${tile.city.isCapital ? '🏛️' : '🏘️'} <strong>${tile.city.name}</strong> ${tile.city.isCapital ? '(Capital)' : 'Settlement'} — pop. ${tile.city.pop.toLocaleString()}</p>
                    
                    <div style="display:flex; align-items:center; gap:16px; margin: 12px 0; padding: 12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                        <canvas id="cityShieldCanvas" width="120" height="145" style="background:transparent; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.65)); flex-shrink:0;"></canvas>
                        <div style="flex:1;">
                            <h5 style="margin:0 0 4px 0; font-family:'Share',sans-serif; color:#dfc45d; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Coat of Arms</h5>
                            <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.45; margin:0;">
                                <span id="shieldBlazonText" style="font-style:italic;">Generating heraldry...</span>
                            </p>
                        </div>
                    </div>

                    <a href="city.html?seed=${tile.city.seed}&size=${tile.city.size}" target="_blank"
                       class="btn btn-primary" style="width:100%; font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px; margin-top:8px;">
                       🏰 Visit City Map (Forge 2D Layout)
                    </a>`;
                }
                html += `</div>`;
            }

            const details = tile.details;
            html += `<div class="inspector-section">
                <h4>Adventure & Lore</h4>
                <p style="font-size:12.5px; line-height:1.5; color:var(--text-secondary); font-style:italic; margin-bottom:8px;">"${details.desc}"</p>
                <h5 style="margin-top:10px; margin-bottom:4px; font-family:'Share',sans-serif; color:#ffd166; font-size:13px;">Local Rumors & Hooks:</h5>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #ffe599; line-height: 1.45;">
                    ${details.hooks.map(h => `<li style="margin-bottom:6px;">${h}</li>`).join('')}
                </ul>
            </div>`;

            html += `<div class="inspector-section"><h4>⚔️ Points of Interest</h4>`;
            if (tile.poi) {
                html += `<div class="poi-box">
                    <p><strong>${tile.poi.name}</strong></p>
                    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">${tile.poi.desc}</p>
                    <p style="font-size:11px;font-family:monospace;color:var(--watabou-highlight);">Seed: ${tile.poi.seed}</p>
                </div>
                <a href="dungeon.html?seed=${encodeURIComponent(tile.poi.seed)}&theme=${tile.poi.theme}" target="_blank"
                   class="btn btn-primary" style="width:100%;font-size:12px;display:block;text-align:center;margin-top:6px;">
                   ⚔️ Explore Location (Forge Dungeon)
                </a>`;
            } else {
                html += `<p style="font-size:12px;color:var(--text-secondary);">No dungeon points discovered in this sector.</p>`;
            }
            html += `</div>`;

        } else if (this.viewMode === 'slice') {
            const sel = this.selectedLayer;
            if (!sel) {
                html = '<p style="color:var(--text-secondary);font-size:13px;">Click a ring or arc to inspect its properties.</p>';
            } else {
                const l = sel.layer;
                html = `<div class="inspector-section"><h3>${l.name}</h3>
                    <p><strong>Depth / Altitude</strong>: ${l.alt || l.thickness}</p></div>
                <div class="inspector-section"><h4>Physical Properties</h4>
                    ${l.temp ? `<p>🌡️ <strong>Temperature</strong>: ${l.temp}</p>` : ''}
                    ${l.pressure ? `<p>📉 <strong>Pressure</strong>: ${l.pressure}</p>` : ''}
                    ${l.state ? `<p>⚗️ <strong>State of Matter</strong>: ${l.state}</p>` : ''}
                    ${l.composition ? `<p>🧪 <strong>Composition</strong>: ${l.composition}</p>` : ''}
                </div>
                <div class="inspector-section"><h4>Description</h4>
                    <p style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${l.desc}</p>
                </div>`;
            }
        } else {
            const m = this.selectedMat;
            if (!m) {
                html = '<p style="color:var(--text-secondary);font-size:13px;">Click a stratum in the drill column to analyze.</p>';
            } else {
                html = `<div class="inspector-section"><h3>${m.name}</h3></div>
                <div class="inspector-section"><h4>Composition</h4>
                    <p style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${m.desc}</p>
                </div>`;
            }
        }

        this.inspector.innerHTML = html;

        const shieldCanvas = document.getElementById('cityShieldCanvas');
        if (shieldCanvas && this.selectedTile && this.selectedTile.city) {
            this._drawCityCoatOfArms(shieldCanvas, this.selectedTile.city);
        }
    }

    _drawCityCoatOfArms(canvas, city) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Seeded LCG RNG
        const hRng = new (class {
            constructor(seed) { this.s = (Number(seed) || 54321) >>> 0; }
            next() {
                this.s = Math.imul(1664525, this.s) + 1013904223 >>> 0;
                return this.s / 4294967296;
            }
            range(a, b) { return a + this.next() * (b - a); }
            int(a, b) { return Math.floor(this.range(a, b + 0.9999)); }
            pick(arr) { return arr[this.int(0, arr.length - 1)]; }
        })(city.seed);

        // ── Tincture palettes ────────────────────────────────────────────────
        const metals  = [
            { name: 'Or (Gold)',    val: '#D4A017', hi: '#F5D76E', lo: '#9A6E0A' },
            { name: 'Argent',      val: '#D8DDE3', hi: '#FFFFFF', lo: '#9AAAB4' }
        ];
        const colors  = [
            { name: 'Gules',       val: '#8B0000', hi: '#C0392B', lo: '#5C0000' },
            { name: 'Azure',       val: '#003580', hi: '#1A6DBF', lo: '#001E5C' },
            { name: 'Vert',        val: '#1A5C2A', hi: '#27AE60', lo: '#0A3318' },
            { name: 'Sable',       val: '#1A1A1A', hi: '#4D4D4D', lo: '#000000' },
            { name: 'Purpure',     val: '#5B1A7A', hi: '#8E44AD', lo: '#3A0D52' }
        ];
        const tinctures = [...metals, ...colors];

        // Pick two contrasting tinctures (metal+color or color+metal)
        let c1, c2;
        if (hRng.next() < 0.6) {
            c1 = hRng.pick(metals);  c2 = hRng.pick(colors);
        } else {
            c1 = hRng.pick(colors);  c2 = hRng.pick(metals);
        }
        // charge must contrast with both
        let cc = hRng.pick(tinctures);
        while (cc.val === c1.val || cc.val === c2.val) cc = hRng.pick(tinctures);

        // ── Field divisions ──────────────────────────────────────────────────
        const divType = hRng.pick(['solid','pale','fess','quarterly','bend','bend-sin','chevron','gyronny','paly','barry']);

        // ── Shield path (classic heater) ─────────────────────────────────────
        const pad = 7;
        const sw = W - pad * 2, sh = H - pad * 2;
        const sx = pad, sy = pad;

        const shieldPath = () => {
            ctx.beginPath();
            // top-left corner round
            ctx.moveTo(sx + sw * 0.12, sy);
            ctx.lineTo(sx + sw * 0.88, sy);
            // top-right chamfer
            ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + sh * 0.08);
            // right side tapering inward
            ctx.lineTo(sx + sw, sy + sh * 0.54);
            // right curve toward point
            ctx.bezierCurveTo(
                sx + sw,      sy + sh * 0.82,
                sx + sw * 0.5, sy + sh,
                sx + sw * 0.5, sy + sh
            );
            // left curve from point
            ctx.bezierCurveTo(
                sx + sw * 0.5, sy + sh,
                sx,            sy + sh * 0.82,
                sx,            sy + sh * 0.54
            );
            ctx.lineTo(sx, sy + sh * 0.08);
            ctx.quadraticCurveTo(sx, sy, sx + sw * 0.12, sy);
            ctx.closePath();
        };

        // ── Helper: draw field pattern ───────────────────────────────────────
        const fillField = (colA, colB, type) => {
            ctx.fillStyle = colA.val;
            ctx.fillRect(sx, sy, sw, sh);

            ctx.fillStyle = colB.val;
            const cx = sx + sw / 2, cy = sy + sh / 2;

            if (type === 'pale') {
                ctx.fillRect(cx, sy, sw / 2, sh);
            } else if (type === 'fess') {
                ctx.fillRect(sx, cy, sw, sh / 2);
            } else if (type === 'quarterly') {
                ctx.fillRect(cx, sy, sw / 2, sh / 2);
                ctx.fillRect(sx, cy, sw / 2, sh / 2);
            } else if (type === 'bend') {
                ctx.beginPath();
                ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy);
                ctx.lineTo(sx + sw, sy + sh); ctx.closePath();
                ctx.fill();
            } else if (type === 'bend-sin') {
                ctx.beginPath();
                ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + sh);
                ctx.lineTo(sx + sw, sy + sh); ctx.closePath();
                ctx.fill();
            } else if (type === 'chevron') {
                ctx.beginPath();
                ctx.moveTo(sx, sy + sh * 0.62);
                ctx.lineTo(cx, sy + sh * 0.22);
                ctx.lineTo(sx + sw, sy + sh * 0.62);
                ctx.lineTo(sx + sw, sy + sh);
                ctx.lineTo(cx, sy + sh * 0.5);
                ctx.lineTo(sx, sy + sh);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'gyronny') {
                // 8-piece radial
                for (let g = 0; g < 8; g += 2) {
                    const a1 = (g / 8) * Math.PI * 2 - Math.PI / 8;
                    const a2 = ((g + 1) / 8) * Math.PI * 2 - Math.PI / 8;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, sw, a1, a2);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (type === 'paly') {
                // 6 vertical stripes alternating
                const stripeW = sw / 6;
                for (let i = 0; i < 6; i += 2) {
                    ctx.fillRect(sx + i * stripeW, sy, stripeW, sh);
                }
            } else if (type === 'barry') {
                // 6 horizontal stripes
                const stripeH = sh / 6;
                for (let i = 0; i < 6; i += 2) {
                    ctx.fillRect(sx, sy + i * stripeH, sw, stripeH);
                }
            }
            // solid: already done above
        };

        // ── Draw field (clipped to shield) ───────────────────────────────────
        ctx.save();
        shieldPath();
        ctx.clip();

        fillField(c1, c2, divType);

        // Subtle field texture: stipple if a color field
        if (c1.val !== metals[0].val && c1.val !== metals[1].val) {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            for (let y = sy; y < sy + sh; y += 5) {
                for (let x = sx; x < sx + sw; x += 5) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }

        ctx.restore();

        // ── Inner border fillet (1px dark) ───────────────────────────────────
        ctx.save();
        shieldPath();
        ctx.clip();
        const innerPad = 5;
        ctx.beginPath();
        ctx.moveTo(sx + sw * 0.12 + innerPad, sy + innerPad);
        ctx.lineTo(sx + sw * 0.88 - innerPad, sy + innerPad);
        ctx.quadraticCurveTo(sx + sw - innerPad, sy + innerPad, sx + sw - innerPad, sy + sh * 0.08 + innerPad);
        ctx.lineTo(sx + sw - innerPad, sy + sh * 0.54);
        ctx.bezierCurveTo(
            sx + sw - innerPad, sy + sh * 0.80,
            sx + sw * 0.5,      sy + sh - innerPad * 1.5,
            sx + sw * 0.5,      sy + sh - innerPad * 1.5
        );
        ctx.bezierCurveTo(
            sx + sw * 0.5,      sy + sh - innerPad * 1.5,
            sx + innerPad,      sy + sh * 0.80,
            sx + innerPad,      sy + sh * 0.54
        );
        ctx.lineTo(sx + innerPad, sy + sh * 0.08 + innerPad);
        ctx.quadraticCurveTo(sx + innerPad, sy + innerPad, sx + sw * 0.12 + innerPad, sy + innerPad);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // ── Charges ──────────────────────────────────────────────────────────
        const chargeType = hRng.pick(['castle','crown','lion','tree','swords','eagle','fleur','dragon']);
        const chX = sx + sw * 0.5, chY = sy + sh * 0.44;
        const chSz = sw * 0.34;

        ctx.save();
        shieldPath();
        ctx.clip();
        ctx.fillStyle = cc.val;
        ctx.strokeStyle = cc.lo || 'rgba(0,0,0,0.4)';
        ctx.lineJoin = 'round';
        ctx.lineCap  = 'round';

        if (chargeType === 'castle') {
            // Detailed keep with towers and portcullis
            const bw = chSz * 1.4, bh = chSz * 1.1;
            const bx = chX - bw / 2, by = chY - bh * 0.55;
            // Main body
            ctx.fillRect(bx, by + bh * 0.3, bw, bh * 0.7);
            // Battlements (7 merlons)
            const mW = bw / 9, mH = bh * 0.2;
            for (let m = 0; m < 9; m += 2) {
                ctx.fillRect(bx + m * mW, by + bh * 0.1, mW, mH);
            }
            // Two side towers
            const tW = bw * 0.24, tH = bh * 0.9;
            ctx.fillRect(bx - tW * 0.3, by, tW, tH);
            ctx.fillRect(bx + bw - tW * 0.7, by, tW, tH);
            // Tower battlement
            const tmW = tW / 3;
            [bx - tW * 0.3, bx + bw - tW * 0.7].forEach(tx => {
                ctx.fillRect(tx, by - mH * 0.8, tmW, mH);
                ctx.fillRect(tx + tmW * 2, by - mH * 0.8, tmW, mH);
            });
            // Gate arch
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            const gW = bw * 0.22, gH = bh * 0.35;
            const gX = chX - gW / 2, gY = by + bh - gH;
            ctx.beginPath();
            ctx.moveTo(gX, gY + gH);
            ctx.lineTo(gX, gY + gH * 0.5);
            ctx.arc(gX + gW / 2, gY + gH * 0.5, gW / 2, Math.PI, 0);
            ctx.lineTo(gX + gW, gY + gH);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Portcullis bars
            ctx.fillStyle = cc.val;
            ctx.globalAlpha = 0.5;
            const pbX = chX - gW/2, pbY = by + bh - gH;
            for (let b = 0; b < 3; b++) {
                ctx.fillRect(pbX + gW * 0.25 * b, pbY, gW * 0.06, gH * 0.75);
            }
            ctx.globalAlpha = 1;

        } else if (chargeType === 'crown') {
            // Imperial crown with arches and jewels
            const cW = chSz * 1.5, cH = chSz * 1.1;
            const cx2 = chX, base = chY + cH * 0.3;
            // Band
            ctx.fillRect(cx2 - cW/2, base - cH * 0.25, cW, cH * 0.25);
            // Five spires
            const spireXs = [0, 0.22, 0.44].map(f => cx2 + (f - 0.22) * cW);
            const spireH = [cH * 0.85, cH * 0.55, cH * 0.55];
            [-0.44, -0.22, 0, 0.22, 0.44].forEach((f, i) => {
                const sx2 = cx2 + f * cW;
                const sh2 = i % 2 === 0 ? cH * 0.85 : cH * 0.55;
                ctx.beginPath();
                ctx.moveTo(sx2 - cW * 0.06, base - cH * 0.25);
                ctx.lineTo(sx2, base - sh2);
                ctx.lineTo(sx2 + cW * 0.06, base - cH * 0.25);
                ctx.fill();
                // jewel on top
                ctx.beginPath();
                ctx.arc(sx2, base - sh2, cW * 0.04, 0, Math.PI * 2);
                ctx.fill();
            });
            // Jewels on band
            for (let j = -2; j <= 2; j++) {
                ctx.beginPath();
                ctx.arc(cx2 + j * cW * 0.22, base - cH * 0.12, cW * 0.04, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (chargeType === 'lion') {
            // Heraldic lion rampant (stylized)
            const lSz = chSz * 1.2;
            // Body
            ctx.beginPath();
            ctx.ellipse(chX, chY + lSz * 0.1, lSz * 0.3, lSz * 0.45, -0.3, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.arc(chX + lSz * 0.2, chY - lSz * 0.5, lSz * 0.22, 0, Math.PI * 2);
            ctx.fill();
            // Mane
            ctx.beginPath();
            ctx.arc(chX + lSz * 0.2, chY - lSz * 0.5, lSz * 0.3, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.stroke();
            // Front paw raised
            ctx.beginPath();
            ctx.moveTo(chX + lSz * 0.15, chY - lSz * 0.15);
            ctx.bezierCurveTo(chX + lSz * 0.55, chY - lSz * 0.25, chX + lSz * 0.6, chY, chX + lSz * 0.5, chY + lSz * 0.1);
            ctx.lineWidth = lSz * 0.12;
            ctx.stroke();
            // Tail
            ctx.beginPath();
            ctx.moveTo(chX - lSz * 0.25, chY + lSz * 0.45);
            ctx.bezierCurveTo(chX - lSz * 0.55, chY, chX - lSz * 0.3, chY - lSz * 0.3, chX - lSz * 0.1, chY - lSz * 0.5);
            ctx.lineWidth = lSz * 0.07;
            ctx.stroke();

        } else if (chargeType === 'tree') {
            // Oak tree with detailed canopy
            const tH = chSz * 1.3;
            // Trunk
            ctx.fillRect(chX - chSz * 0.1, chY - chSz * 0.1, chSz * 0.2, tH * 0.55);
            // Three overlapping canopy circles
            [[0, -0.55, 0.42],[-.28, -0.35, 0.32],[.28, -0.35, 0.32]].forEach(([dx, dy, r]) => {
                ctx.beginPath();
                ctx.arc(chX + chSz * dx, chY + tH * dy, chSz * r, 0, Math.PI * 2);
                ctx.fill();
            });
            // Root lines
            ctx.lineWidth = chSz * 0.07;
            [[-0.25, 0.45],[0, 0.5],[0.25, 0.45]].forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(chX, chY - chSz * 0.1 + tH * 0.55);
                ctx.lineTo(chX + chSz * dx, chY + tH * dy);
                ctx.stroke();
            });

        } else if (chargeType === 'swords') {
            // Two crossed swords with pommels
            const sL = chSz * 1.3;
            const drawSword = (angle) => {
                ctx.save();
                ctx.translate(chX, chY);
                ctx.rotate(angle);
                // blade
                ctx.beginPath();
                ctx.moveTo(0, -sL * 0.55);
                ctx.lineTo(sL * 0.055, sL * 0.3);
                ctx.lineTo(-sL * 0.055, sL * 0.3);
                ctx.closePath();
                ctx.fill();
                // crossguard
                ctx.fillRect(-sL * 0.28, sL * 0.28, sL * 0.56, sL * 0.06);
                // grip
                ctx.fillRect(-sL * 0.06, sL * 0.33, sL * 0.12, sL * 0.22);
                // pommel
                ctx.beginPath();
                ctx.ellipse(0, sL * 0.57, sL * 0.1, sL * 0.07, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            drawSword(-Math.PI / 5);
            drawSword( Math.PI / 5);

        } else if (chargeType === 'eagle') {
            // Heraldic eagle displayed
            const eSz = chSz * 1.35;
            // Body
            ctx.beginPath();
            ctx.ellipse(chX, chY + eSz * 0.05, eSz * 0.18, eSz * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.arc(chX, chY - eSz * 0.38, eSz * 0.14, 0, Math.PI * 2);
            ctx.fill();
            // Beak
            ctx.beginPath();
            ctx.moveTo(chX + eSz * 0.1, chY - eSz * 0.41);
            ctx.lineTo(chX + eSz * 0.28, chY - eSz * 0.35);
            ctx.lineTo(chX + eSz * 0.1, chY - eSz * 0.3);
            ctx.fill();
            // Wings (both sides)
            [1, -1].forEach(side => {
                ctx.beginPath();
                ctx.moveTo(chX, chY - eSz * 0.1);
                ctx.bezierCurveTo(
                    chX + side * eSz * 0.5, chY - eSz * 0.4,
                    chX + side * eSz * 0.75, chY + eSz * 0.1,
                    chX + side * eSz * 0.55, chY + eSz * 0.35
                );
                ctx.bezierCurveTo(
                    chX + side * eSz * 0.35, chY + eSz * 0.5,
                    chX + side * eSz * 0.15, chY + eSz * 0.3,
                    chX, chY - eSz * 0.1
                );
                ctx.fill();
            });
            // Talons
            [-.12, .12].forEach(dx => {
                ctx.lineWidth = eSz * 0.05;
                ctx.beginPath();
                ctx.moveTo(chX + dx * chSz, chY + eSz * 0.43);
                ctx.lineTo(chX + dx * chSz, chY + eSz * 0.56);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(chX + dx * chSz, chY + eSz * 0.52);
                ctx.lineTo(chX + (dx - 0.1) * chSz, chY + eSz * 0.58);
                ctx.moveTo(chX + dx * chSz, chY + eSz * 0.52);
                ctx.lineTo(chX + (dx + 0.1) * chSz, chY + eSz * 0.58);
                ctx.stroke();
            });

        } else if (chargeType === 'fleur') {
            // Fleur-de-lis
            const fSz = chSz * 1.3;
            const drawPetal = (cx2, cy2, r, topAngle) => {
                ctx.beginPath();
                ctx.arc(cx2, cy2, r, topAngle + 0.3, topAngle + Math.PI - 0.3);
                ctx.arc(cx2, cy2, r * 0.6, topAngle + Math.PI - 0.3, topAngle + Math.PI * 2 - 0.3, true);
                ctx.closePath();
                ctx.fill();
            };
            // Center petal
            drawPetal(chX, chY - fSz * 0.15, fSz * 0.35, Math.PI);
            // Side petals
            drawPetal(chX - fSz * 0.3, chY + fSz * 0.05, fSz * 0.22, Math.PI * 1.5);
            drawPetal(chX + fSz * 0.3, chY + fSz * 0.05, fSz * 0.22, Math.PI * 0.5);
            // Stem
            ctx.fillRect(chX - fSz * 0.07, chY + fSz * 0.15, fSz * 0.14, fSz * 0.38);
            // Base curl
            ctx.beginPath();
            ctx.arc(chX, chY + fSz * 0.53, fSz * 0.18, 0, Math.PI);
            ctx.fill();

        } else { // dragon
            // Wyvern silhouette
            const dSz = chSz * 1.2;
            // Body
            ctx.beginPath();
            ctx.ellipse(chX - dSz * 0.05, chY + dSz * 0.1, dSz * 0.22, dSz * 0.35, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.ellipse(chX + dSz * 0.3, chY - dSz * 0.38, dSz * 0.17, dSz * 0.13, -0.5, 0, Math.PI * 2);
            ctx.fill();
            // Neck
            ctx.lineWidth = dSz * 0.13;
            ctx.beginPath();
            ctx.moveTo(chX + dSz * 0.1, chY - dSz * 0.07);
            ctx.bezierCurveTo(chX + dSz * 0.25, chY - dSz * 0.2, chX + dSz * 0.25, chY - dSz * 0.3, chX + dSz * 0.2, chY - dSz * 0.38);
            ctx.stroke();
            // Wing
            ctx.beginPath();
            ctx.moveTo(chX, chY - dSz * 0.05);
            ctx.bezierCurveTo(chX - dSz * 0.45, chY - dSz * 0.5, chX - dSz * 0.65, chY - dSz * 0.1, chX - dSz * 0.5, chY + dSz * 0.2);
            ctx.bezierCurveTo(chX - dSz * 0.35, chY + dSz * 0.1, chX - dSz * 0.1, chY + dSz * 0.05, chX, chY - dSz * 0.05);
            ctx.fill();
            // Tail curl
            ctx.lineWidth = dSz * 0.08;
            ctx.beginPath();
            ctx.moveTo(chX - dSz * 0.1, chY + dSz * 0.42);
            ctx.bezierCurveTo(chX + dSz * 0.3, chY + dSz * 0.55, chX + dSz * 0.5, chY + dSz * 0.3, chX + dSz * 0.35, chY + dSz * 0.15);
            ctx.stroke();
        }
        ctx.restore();

        // ── Shading: inner light from top-left ───────────────────────────────
        ctx.save();
        shieldPath();
        ctx.clip();
        const shine = ctx.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh * 0.6);
        shine.addColorStop(0,    'rgba(255,255,255,0.20)');
        shine.addColorStop(0.4,  'rgba(255,255,255,0.05)');
        shine.addColorStop(0.5,  'rgba(0,0,0,0)');
        shine.addColorStop(1,    'rgba(0,0,0,0.28)');
        ctx.fillStyle = shine;
        ctx.fillRect(sx, sy, sw, sh);
        ctx.restore();

        // ── Outer border: triple-line gold filigree ──────────────────────────
        ctx.save();
        // Thick dark shadow
        shieldPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 7;
        ctx.stroke();
        // Gold outer band
        shieldPath();
        ctx.strokeStyle = '#C8960C';
        ctx.lineWidth = 5;
        ctx.stroke();
        // Gold highlight
        shieldPath();
        ctx.strokeStyle = '#F2C84B';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Inner thin line
        ctx.save();
        ctx.translate(4, 4);
        ctx.scale((sw - 8) / sw, (sh - 8) / sh);
        ctx.translate(-4, -4);
        shieldPath();
        ctx.strokeStyle = 'rgba(242,200,75,0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        ctx.restore();

        // ── Corner boss ornaments ─────────────────────────────────────────────
        ctx.save();
        const bossSz = 3.5;
        ctx.fillStyle = '#F2C84B';
        ctx.strokeStyle = '#9A6E0A';
        ctx.lineWidth = 0.8;
        [[sx + sw * 0.12, sy],[sx + sw * 0.88, sy],[sx, sy + sh * 0.08],[sx + sw, sy + sh * 0.08]].forEach(([bx2, by2]) => {
            ctx.beginPath();
            ctx.arc(bx2, by2, bossSz, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        ctx.restore();

        // ── Blazon text ──────────────────────────────────────────────────────
        const divNames = { solid:'a Solid Field', pale:'Per Pale', fess:'Per Fess', quarterly:'Quarterly',
            bend:'Per Bend', 'bend-sin':'Per Bend Sinister', chevron:'Per Chevron',
            gyronny:'Gyronny', paly:'Paly of Six', barry:'Barry of Six' };
        const chargeNames = { castle:'Castle Keep', crown:'Royal Crown', lion:'Lion Rampant',
            tree:'Sacred Oak', swords:'Crossed Swords', eagle:'Eagle Displayed',
            fleur:'Fleur-de-Lis', dragon:'Wyvern' };
        const blazonEl = document.getElementById('shieldBlazonText');
        if (blazonEl) {
            blazonEl.textContent = `${divNames[divType]} of ${c1.name} & ${c2.name}, charged with a ${chargeNames[chargeType]} in ${cc.name}.`;
        }
    }

    _hexToRgbArr(hex) {
        return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    }

    _showToast(msg) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `background:rgba(20,22,30,0.95);color:#e5e0c3;padding:10px 18px;border-radius:6px;
            font-family:'Share',sans-serif;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.5);
            border-left:3px solid #6688aa;opacity:1;transition:opacity 0.5s;`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 550); }, 2400);
    }
}
