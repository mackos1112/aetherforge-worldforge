import { BIOMES, BIOME_KEYS } from './biomes.js';
import { WorldEngine } from './engine.js';

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
                const customW = this.inp_custom_w ? parseInt(this.inp_custom_w.value, 10) : 512;
                const customH = this.inp_custom_h ? parseInt(this.inp_custom_h.value, 10) : 256;
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
        const pw = Math.max(1, Math.round(W * ts));
        const ph = Math.max(1, Math.round(H * ts));
        if (!this._surfaceCache || this._cacheW !== pw || this._cacheH !== ph) {
            this._buildSurfaceCache(pw, ph, W, H);
        }
        this.ctx.putImageData(this._surfaceCache, Math.round(ox), Math.round(oy));

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

        // Cities overlay
        if (this.showCities) {
            for (const c of this.world.cities) {
                const px = ox + (c.x + 0.5) * ts, py = oy + (c.y + 0.5) * ts;
                const r  = (c.isCapital ? 5 : 3) * Math.min(this.scale * 0.7, 2);
                this.ctx.beginPath();
                this.ctx.arc(px, py, r, 0, Math.PI * 2);
                this.ctx.fillStyle = c.isCapital ? '#ffd166' : '#ffffff';
                this.ctx.fill();
                this.ctx.strokeStyle = '#111';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                if (ts >= 4) {
                    this.ctx.fillStyle = c.isCapital ? '#ffe599' : '#e5e0c3';
                    this.ctx.font = `${c.isCapital ? 'bold ' : ''}${Math.max(8, Math.min(12, ts * 0.9))}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = '#000'; this.ctx.shadowBlur = 3;
                    this.ctx.fillText(c.name, px, py - r - 2);
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

        // Legend
        this._drawLegend();
    }

    _buildSurfaceCache(pw, ph, W, H) {
        const img = new ImageData(pw, ph);
        const data = img.data;
        const hMap = this.world.heightMap;
        const bMap = this.world.biomeMap;
        const rMap = this.world.riverMap;

        for (let iy = 0; iy < ph; iy++) {
            const ty = Math.floor(iy / ph * H);
            const rowOffset = ty * W;
            for (let ix = 0; ix < pw; ix++) {
                const tx = Math.floor(ix / pw * W);
                const idx = rowOffset + tx;

                const biomeIdx = bMap[idx];
                const biome = BIOME_KEYS[biomeIdx] || 'Ocean';
                const info = BIOMES[biome] || BIOMES['Ocean'];
                let [r, g, b] = info.col;

                // Height-based shading (hillshade)
                const h = hMap[idx];
                
                // Calculate terrain gradient (normal vector)
                const westTx = (tx - 1 + W) % W;
                const eastTx = (tx + 1) % W;
                const northTy = Math.max(0, ty - 1);
                const southTy = Math.min(H - 1, ty + 1);
                
                const hWest = hMap[ty * W + westTx];
                const hEast = hMap[ty * W + eastTx];
                const hNorth = hMap[northTy * W + tx];
                const hSouth = hMap[southTy * W + tx];
                
                // Scale factor to amplify or reduce slope impact
                const slopeScale = 4.0; 
                const dx = (hEast - hWest) * slopeScale;
                const dy = (hSouth - hNorth) * slopeScale;
                
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
                const pIdx = (iy * pw + ix) * 4;
                data[pIdx]   = r;
                data[pIdx+1] = g;
                data[pIdx+2] = b;
                data[pIdx+3] = 255;
            }
        }
        this._surfaceCache = img;
        this._cacheW = pw;
        this._cacheH = ph;
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

        // Labels
        ctx.fillStyle = '#e5e0c3';
        ctx.font = `${Math.max(9, 11 * S)}px 'Share', sans-serif`;
        ctx.textAlign = 'left';
        const labelsRight = [
            [R.exo + R.magneto, 'Magnetosphere'],
            [R.thermo + R.exo,  'Exosphere'],
            [R.strato + R.meso, 'Thermosphere'],
            [R.tropo + R.strato,'Mesosphere / Stratosphere'],
            [R.crust + R.tropo, 'Troposphere'],
            [R.litho + R.crust, 'Crust / Lithosphere'],
            [R.mantle,          'Mantle'],
            [R.outerCore,       'Outer Core'],
            [R.innerCore * 0.5, 'Inner Core'],
        ];
        labelsRight.forEach(([r, label]) => {
            const a = -0.4;
            ctx.fillText(label, cx + Math.cos(a) * r + 6, cy + Math.sin(a) * r);
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
                    html += `<p>${tile.city.isCapital ? '🏛️' : '🏘️'} <strong>${tile.city.name}</strong> ${tile.city.isCapital ? '(Capital)' : 'Settlement'}`;
                    if (tile.city.pop) html += ` — pop. ${tile.city.pop.toLocaleString()}`;
                    html += `</p>`;
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
