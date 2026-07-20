import { TILE_TYPES, TILE_COLORS } from './config.js';

export class MapRenderer {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // containerId kept for API compatibility but we no longer CSS-transform it
        this.container = document.getElementById(containerId);

        // Grid properties
        this.tileSize = 32;
        this.gridWidth = 48;
        this.gridHeight = 48;
        this.gridShape = 'square';

        // Camera – pan/zoom applied via ctx transforms
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // State
        this.currentLevelData = null;
        this.currentLevelKey = 'surface';
        this.currentTheme = 'crypt';
        this.currentBiome = 'forest';

        this.roomsData = {};
        this.hoveredCell = { x: -1, y: -1 };
        this.selectedCell = { x: -1, y: -1 };
        this.selectedRoomId = null;
        this.hoveredRoomId = null;

        // Dynamic Play Mode & GM Secrets State
        this.playModeActive = false;
        this.isPlayerView = false;
        this.fogMask = null;

        // Dragging state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // Animation
        this.pulseAngle = 0;
        this.animationFrameId = null;

        this._resizeCanvas();
        this.initEvents();
        this.startAnimation();
    }

    /* ─── Canvas sizing ────────────────────────────────────────────── */

    _resizeCanvas() {
        // canvas lives inside canvasContainer which lives inside canvas-viewport/player-viewport
        // We need the outer viewport element that has the real CSS dimensions
        const container = this.canvas.parentElement;             // canvasContainer div
        const vp = container ? container.parentElement : null;   // canvas-viewport section
        const w  = (vp ? vp.clientWidth  : 0) || window.innerWidth  - 660;
        const h  = (vp ? vp.clientHeight : 0) || window.innerHeight - 64;
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width  = Math.max(1, w);
            this.canvas.height = Math.max(1, h);
        }
    }

    /* ─── Events ───────────────────────────────────────────────────── */

    initEvents() {
        // Drag to pan
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.dragStartX = e.clientX - this.offsetX;
                this.dragStartY = e.clientY - this.offsetY;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.offsetX = e.clientX - this.dragStartX;
                this.offsetY = e.clientY - this.dragStartY;
            } else {
                this.handleMouseMove(e);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Scroll to zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.06;
            const rect   = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // World coord under mouse before zoom
            const worldX = (mouseX - this.offsetX) / this.scale;
            const worldY = (mouseY - this.offsetY) / this.scale;

            if (e.deltaY < 0) {
                this.scale = Math.min(3.0, this.scale + zoomSpeed);
            } else {
                this.scale = Math.max(0.15, this.scale - zoomSpeed);
            }

            // Keep world point under mouse after zoom
            this.offsetX = mouseX - worldX * this.scale;
            this.offsetY = mouseY - worldY * this.scale;
        }, { passive: false });

        // Click select / fog reveal
        this.canvas.addEventListener('click', () => {
            if (this.hoveredCell.x < 0 || this.hoveredCell.y < 0) return;
            const { x, y } = this.hoveredCell;
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;

            if (this.playModeActive && !this.isPlayerView) {
                this.triggerEvent('fogClick', this.hoveredCell);
                return;
            }

            this.selectedCell = { x, y };
            const clickedRoomId = this.findRoomAt(x, y);
            if (clickedRoomId) {
                this.selectedRoomId = clickedRoomId;
                this.triggerEvent('roomSelected', this.selectedRoomId);
            } else {
                this.selectedRoomId = null;
                this.triggerEvent('cellSelected', this.selectedCell);
            }
        });

        window.addEventListener('resize', () => {
            this._resizeCanvas();
            this.centerCamera();
        });
    }

    /* ─── Public API ───────────────────────────────────────────────── */

    triggerEvent(name, detail) {
        this.canvas.dispatchEvent(new CustomEvent(name, { detail }));
    }

    addEventListener(name, cb) {
        this.canvas.addEventListener(name, (e) => cb(e.detail));
    }

    /** Legacy no-op kept so main.js zoom buttons still compile */
    applyTransform() { /* no-op – ctx transforms used in draw() */ }

    centerCamera() {
        this._resizeCanvas();
        const viewW = this.canvas.width;
        const viewH = this.canvas.height;

        let mapW = this.gridWidth  * this.tileSize;
        let mapH = this.gridHeight * this.tileSize;

        if (this.gridShape === 'hex') {
            const c = this.getHexCoordinates(this.gridWidth - 1, this.gridHeight - 1);
            mapW = c.x + c.W;
            mapH = c.y + c.R;
        }

        this.scale   = Math.min(1.2, Math.min(viewW / mapW, viewH / mapH) * 0.92);
        this.offsetX = (viewW - mapW * this.scale) / 2;
        this.offsetY = (viewH - mapH * this.scale) / 2;
    }

    setMapData(levelKey, grid, roomsData, theme, biome, gridShape = 'square') {
        this.currentLevelKey  = levelKey;
        this.currentLevelData = grid;
        this.roomsData        = roomsData;
        this.currentTheme     = theme;
        this.currentBiome     = biome;
        this.gridShape        = gridShape;

        this.gridWidth  = grid[0].length;
        this.gridHeight = grid.length;

        this.selectedRoomId  = null;
        this.hoveredRoomId   = null;
        this.selectedCell    = { x: -1, y: -1 };
        this.hoveredCell     = { x: -1, y: -1 };

        // Resize canvas buffer to match the viewport, then centre
        this._resizeCanvas();
        this.centerCamera();
        // One deferred centering after browser layout settles
        requestAnimationFrame(() => { this._resizeCanvas(); this.centerCamera(); });
    }

    /* ─── Mouse helpers ────────────────────────────────────────────── */

    _screenToWorld(sx, sy) {
        return {
            wx: (sx - this.offsetX) / this.scale,
            wy: (sy - this.offsetY) / this.scale
        };
    }

    handleMouseMove(e) {
        if (!this.currentLevelData) return;
        const rect   = this.canvas.getBoundingClientRect();
        const sx     = e.clientX - rect.left;
        const sy     = e.clientY - rect.top;
        const { wx, wy } = this._screenToWorld(sx, sy);

        let gridX = -1, gridY = -1;

        if (this.gridShape === 'hex') {
            const R = 18.5, W = Math.sqrt(3) * R;
            const approxY = Math.round(wy / (1.5 * R));
            const approxX = Math.round(wx / W);
            let minDist = Infinity;
            for (let r = approxY - 2; r <= approxY + 2; r++) {
                for (let q = approxX - 2; q <= approxX + 2; q++) {
                    if (q >= 0 && q < this.gridWidth && r >= 0 && r < this.gridHeight) {
                        const c  = this.getHexCoordinates(q, r);
                        const dx = wx - c.x, dy = wy - c.y;
                        const d  = Math.sqrt(dx*dx + dy*dy);
                        if (d < c.R && d < minDist) { minDist = d; gridX = q; gridY = r; }
                    }
                }
            }
        } else {
            gridX = Math.floor(wx / this.tileSize);
            gridY = Math.floor(wy / this.tileSize);
        }

        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            if (this.hoveredCell.x !== gridX || this.hoveredCell.y !== gridY) {
                this.hoveredCell    = { x: gridX, y: gridY };
                this.hoveredRoomId  = this.findRoomAt(gridX, gridY);
                this.triggerEvent('cellHover', {
                    x: gridX, y: gridY,
                    tileType: this.currentLevelData[gridY][gridX],
                    roomId:   this.hoveredRoomId
                });
            }
        } else {
            this.hoveredCell   = { x: -1, y: -1 };
            this.hoveredRoomId = null;
        }
    }

    findRoomAt(x, y) {
        if (!this.roomsData) return null;
        for (const [id, r] of Object.entries(this.roomsData)) {
            if (x >= r.rect.x && x < r.rect.x + r.rect.w &&
                y >= r.rect.y && y < r.rect.y + r.rect.h) return id;
        }
        return null;
    }

    /* ─── Animation loop ───────────────────────────────────────────── */

    startAnimation() {
        const step = () => {
            this.pulseAngle = (this.pulseAngle + 0.05) % (Math.PI * 2);
            this.draw();
            this.animationFrameId = requestAnimationFrame(step);
        };
        this.animationFrameId = requestAnimationFrame(step);
    }

    stopAnimation() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    /* ─── Hex geometry ─────────────────────────────────────────────── */

    getHexCoordinates(q, r) {
        const R = 18.5, W = Math.sqrt(3) * R;
        return {
            x: q * W + (r % 2 === 1 ? W / 2 : 0) + W/2 + 2,
            y: r * 1.5 * R + R + 2,
            R, W
        };
    }

    drawHexagonPolygon(ctx, cx, cy, radius, color, strokeColor = null, strokeWidth = 1) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 180) * (60 * i - 30);
            const x = cx + radius * Math.cos(a);
            const y = cy + radius * Math.sin(a);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth   = strokeWidth;
            ctx.stroke();
        }
    }

    /* ─── DRAW ENGINE ──────────────────────────────────────────────── */

    draw() {
        if (!this.currentLevelData) return;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        // Clear & fill background
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, W, H);

        // Subtle dot-grid background
        ctx.fillStyle = 'rgba(255,255,255,0.012)';
        const step = Math.max(8, Math.round(32 * this.scale));
        const ox   = ((this.offsetX % step) + step) % step;
        const oy   = ((this.offsetY % step) + step) % step;
        for (let gx = ox; gx < W; gx += step)
            for (let gy = oy; gy < H; gy += step)
                ctx.fillRect(gx, gy, 1, 1);

        // ── World-space rendering ──
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        let paletteKey = 'caverns';
        if (this.currentLevelKey === 'surface') paletteKey = `surface_${this.currentBiome}`;
        else if (this.currentLevelKey === 'upper') paletteKey = `dungeon_${this.currentTheme}`;
        const colors = TILE_COLORS[paletteKey] || TILE_COLORS.caverns;
        const isHex  = (this.gridShape === 'hex');

        // 1. Draw tiles
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                let tile = this.currentLevelData[y][x];
                if (this.isPlayerView && tile === TILE_TYPES.DUNGEON_SECRET_DOOR)
                    tile = TILE_TYPES.DUNGEON_WALL;

                const color = colors[tile] || TILE_COLORS[TILE_TYPES.VOID] || '#030406';

                if (isHex) {
                    const c = this.getHexCoordinates(x, y);
                    this.drawHexagonPolygon(ctx, c.x, c.y, c.R, color, 'rgba(255,255,255,0.015)', 1);
                    const fogged = this.playModeActive && this.fogMask?.[y]?.[x];
                    if (!(fogged && this.isPlayerView)) this.drawHexTexture(ctx, c.x, c.y, c.R, tile, colors);
                } else {
                    const px = x * this.tileSize, py = y * this.tileSize, sz = this.tileSize;
                    ctx.fillStyle = color;
                    ctx.fillRect(px, py, sz, sz);
                    const fogged = this.playModeActive && this.fogMask?.[y]?.[x];
                    if (!(fogged && this.isPlayerView)) this.drawSquareTexture(ctx, px, py, sz, tile, colors);
                }
            }
        }

        // 2. Wall depth shadows
        if (!isHex && this.currentLevelKey !== 'surface') this.drawSquareWallShadows(ctx);

        // 3. Room highlights
        if (!this.isPlayerView) this.drawHighlights(ctx);

        // 4. Torch/mushroom glows
        this.drawAmbientLights(ctx);

        // 5. Fog of War
        if (this.playModeActive && this.fogMask) this.drawFogOfWarMask(ctx);

        // 6. Selection cursors
        if (!this.isPlayerView) this.drawSelectionRings(ctx);

        ctx.restore();
    }

    /* ─── Tile detail renderers (Square) ───────────────────────────── */

    drawSquareTexture(ctx, px, py, size, tile, colors) {
        const cx = px + size/2, cy = py + size/2, R = size/2;

        if (tile === TILE_TYPES.DUNGEON_ROOM || tile === TILE_TYPES.DUNGEON_CORRIDOR) {
            // Flagstone grid inner lines & subtle mortar detail
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
            if (tile === TILE_TYPES.DUNGEON_ROOM) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.beginPath();
                ctx.moveTo(px + size*0.5, py + 2); ctx.lineTo(px + size*0.5, py + size - 2);
                ctx.stroke();
            }
        } else if (tile === TILE_TYPES.DUNGEON_WALL) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(px, py, size, 2);
            ctx.fillRect(px, py, 2, size);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(px, py + size - 2, size, 2);
            ctx.fillRect(px + size - 2, py, 2, size);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 3, py + size - 3); ctx.lineTo(px + size - 3, py + 3);
            ctx.stroke();
        } else if (tile === TILE_TYPES.SURFACE_TREE) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath(); ctx.arc(cx, cy + 3, size/3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = this.currentBiome === 'volcanic' ? '#3d2521' : '#142a11';
            ctx.beginPath(); ctx.arc(cx, cy - 2, size/3.2, 0, Math.PI*2); ctx.fill();
        } else if (tile === TILE_TYPES.SURFACE_ROCK || tile === TILE_TYPES.CAVERN_OBSTACLE) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(px+4, py+8, size-8, size-12);
            ctx.fillStyle = colors[tile];
            ctx.beginPath();
            ctx.moveTo(cx, py+4); ctx.lineTo(px+size-4, py+size-4); ctx.lineTo(px+4, py+size-4);
            ctx.closePath(); ctx.fill();
        } else if (tile === TILE_TYPES.DUNGEON_OBSTACLE) {
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath(); ctx.arc(cx + 2, cy + 3, R * 0.75, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_OBSTACLE] || '#94a3b8';
            ctx.beginPath(); ctx.arc(cx, cy - 1, R * 0.55, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(cx - R * 0.15, cy - R * 0.25, R * 0.22, 0, Math.PI * 2); ctx.fill();
        } else if (tile === TILE_TYPES.DUNGEON_STAIRS_DOWN) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px+2, py+2, size-4, size-4);
            ctx.strokeStyle = colors[TILE_TYPES.DUNGEON_STAIRS_DOWN]; ctx.lineWidth = 2;
            ctx.strokeRect(px+2, py+2, size-4, size-4);
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_STAIRS_DOWN];
            for (let i = 0; i < 4; i++) ctx.fillRect(px+4+i*3, py+6+i*2, size-8-i*6, 2);
        } else if (tile === TILE_TYPES.CAVERN_STAIRS_UP) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px+2, py+2, size-4, size-4);
            ctx.strokeStyle = colors[TILE_TYPES.CAVERN_STAIRS_UP]; ctx.lineWidth = 2;
            ctx.strokeRect(px+2, py+2, size-4, size-4);
            ctx.fillStyle = colors[TILE_TYPES.CAVERN_STAIRS_UP];
            for (let i = 0; i < 4; i++) ctx.fillRect(px+4+i*3, py+size-8-i*2, size-8-i*6, 2);
        } else if (tile === TILE_TYPES.DUNGEON_DOOR_CLOSED) {
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_DOOR_CLOSED];
            ctx.fillRect(px+5, py+5, size-10, size-10);
            ctx.strokeStyle = '#2d1810'; ctx.lineWidth = 1.5;
            ctx.strokeRect(px+5, py+5, size-10, size-10);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(cx - 1, cy - 2, 2, 4);
        } else if (tile === TILE_TYPES.DUNGEON_DOOR_OPEN) {
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_DOOR_CLOSED];
            ctx.fillRect(px+2, py+4, 4, size-8);
        } else if (tile === TILE_TYPES.DUNGEON_SECRET_DOOR && !this.isPlayerView) {
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_WALL];
            ctx.fillRect(px, py, size, size);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('S', cx, cy + 3);
        } else if (tile === TILE_TYPES.DUNGEON_TORCH || tile === TILE_TYPES.CAVERN_TORCH) {
            ctx.fillStyle = '#8a5832'; ctx.fillRect(cx-2, cy, 4, size*0.35);
            ctx.fillStyle = '#ff5500';
            ctx.beginPath(); ctx.arc(cx, cy-2, 3.5, 0, Math.PI*2); ctx.fill();
        } else if (tile === TILE_TYPES.SURFACE_BRIDGE) {
            ctx.fillStyle = colors[TILE_TYPES.SURFACE_BRIDGE];
            ctx.fillRect(px+2, py+6, size-4, size-12);
            ctx.strokeStyle = '#402213'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px+2, py+6); ctx.lineTo(px+size-2, py+6);
            ctx.moveTo(px+2, py+size-6); ctx.lineTo(px+size-2, py+size-6);
            ctx.stroke();
        } else if (tile === TILE_TYPES.SURFACE_ENTRANCE) {
            ctx.fillStyle = colors[tile] || '#763bc7';
            ctx.beginPath(); ctx.arc(cx, cy, R*0.7, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, R*0.7, 0, Math.PI*2); ctx.stroke();
        }
    }

    /* ─── Tile detail renderers (Hex) ──────────────────────────────── */

    drawHexTexture(ctx, cx, cy, R, tile, colors) {
        if (tile === TILE_TYPES.SURFACE_TREE) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.arc(cx, cy+3, R*0.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = this.currentBiome === 'volcanic' ? '#3d2521' : '#142a11';
            ctx.beginPath(); ctx.arc(cx, cy-2, R*0.45, 0, Math.PI*2); ctx.fill();
        } else if (tile === TILE_TYPES.SURFACE_ROCK || tile === TILE_TYPES.CAVERN_OBSTACLE) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath(); ctx.arc(cx, cy+2, R*0.4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = colors[tile];
            ctx.beginPath();
            ctx.moveTo(cx, cy-R*0.5); ctx.lineTo(cx+R*0.4, cy+R*0.3); ctx.lineTo(cx-R*0.4, cy+R*0.3);
            ctx.closePath(); ctx.fill();
        } else if (tile === TILE_TYPES.DUNGEON_OBSTACLE) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.arc(cx+2, cy+2, R*0.45, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_OBSTACLE];
            ctx.beginPath(); ctx.arc(cx, cy, R*0.4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, R*0.2, 0, Math.PI*2); ctx.stroke();
        } else if (tile === TILE_TYPES.DUNGEON_STAIRS_DOWN) {
            this.drawHexagonPolygon(ctx, cx, cy, R*0.8, 'rgba(0,0,0,0.6)', colors[TILE_TYPES.DUNGEON_STAIRS_DOWN], 2);
            ctx.strokeStyle = colors[TILE_TYPES.DUNGEON_STAIRS_DOWN];
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, R*(0.6-i*0.2), 0, Math.PI*2); ctx.stroke(); }
        } else if (tile === TILE_TYPES.CAVERN_STAIRS_UP) {
            this.drawHexagonPolygon(ctx, cx, cy, R*0.8, 'rgba(0,0,0,0.6)', colors[TILE_TYPES.CAVERN_STAIRS_UP], 2);
            ctx.strokeStyle = colors[TILE_TYPES.CAVERN_STAIRS_UP];
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, R*(0.1+i*0.2), 0, Math.PI*2); ctx.stroke(); }
        } else if (tile === TILE_TYPES.DUNGEON_DOOR_CLOSED) {
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_DOOR_CLOSED];
            ctx.fillRect(cx-3, cy-R*0.6, 6, R*1.2);
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
            ctx.strokeRect(cx-3, cy-R*0.6, 6, R*1.2);
        } else if (tile === TILE_TYPES.DUNGEON_DOOR_OPEN) {
            ctx.fillStyle = colors[TILE_TYPES.DUNGEON_DOOR_CLOSED];
            ctx.fillRect(cx-R*0.5, cy-2, R*1.0, 4);
        } else if (tile === TILE_TYPES.DUNGEON_SECRET_DOOR && !this.isPlayerView) {
            this.drawHexagonPolygon(ctx, cx, cy, R, colors[TILE_TYPES.DUNGEON_WALL]);
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('S', cx, cy+3);
        } else if (tile === TILE_TYPES.DUNGEON_TORCH || tile === TILE_TYPES.CAVERN_TORCH) {
            ctx.fillStyle = '#8a5832'; ctx.fillRect(cx-2, cy, 4, R*0.4);
            ctx.fillStyle = '#ff5500';
            ctx.beginPath(); ctx.arc(cx, cy-2, 3, 0, Math.PI*2); ctx.fill();
        } else if (tile === TILE_TYPES.SURFACE_BRIDGE) {
            ctx.fillStyle = colors[TILE_TYPES.SURFACE_BRIDGE];
            ctx.fillRect(cx-R*0.6, cy-R*0.3, R*1.2, R*0.6);
            ctx.strokeStyle = '#402213'; ctx.lineWidth = 1;
            ctx.strokeRect(cx-R*0.6, cy-R*0.3, R*1.2, R*0.6);
        }
    }

    /* ─── Wall shadows ─────────────────────────────────────────────── */

    drawSquareWallShadows(ctx) {
        const sz = this.tileSize;
        const isWall = (x, y) => {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return true;
            const t = this.currentLevelData[y][x];
            return t === TILE_TYPES.DUNGEON_WALL || t === TILE_TYPES.CAVERN_WALL;
        };
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (!isWall(x, y)) {
                    if (isWall(x, y-1)) ctx.fillRect(x*sz, y*sz, sz, 6);
                    if (isWall(x-1, y)) ctx.fillRect(x*sz, y*sz, 6, sz);
                }
            }
        }
    }

    /* ─── Ambient lights ───────────────────────────────────────────── */

    drawAmbientLights(ctx) {
        const isHex  = (this.gridShape === 'hex');
        const sz     = this.tileSize;
        const flicker = 1.0 + 0.05 * Math.sin(this.pulseAngle * 4);

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile      = this.currentLevelData[y][x];
                const isLight   = tile === TILE_TYPES.DUNGEON_TORCH || tile === TILE_TYPES.CAVERN_TORCH;
                const isMushroom = tile === TILE_TYPES.CAVERN_MUSHROOMS;
                if (!isLight && !isMushroom) continue;

                let cx, cy;
                if (isHex) { const c = this.getHexCoordinates(x, y); cx = c.x; cy = c.y; }
                else        { cx = x*sz + sz/2; cy = y*sz + sz/2; }

                const radius = (isLight ? 75 : 45) * flicker;
                const grad   = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
                if (isLight) {
                    const tc = this.currentTheme === 'temple' ? 'rgba(92,255,61' : 'rgba(255,170,0';
                    grad.addColorStop(0,   `${tc},0.35)`);
                    grad.addColorStop(0.3, `${tc},0.15)`);
                    grad.addColorStop(1,   `${tc},0)`);
                } else {
                    grad.addColorStop(0,   'rgba(138,68,199,0.3)');
                    grad.addColorStop(0.4, 'rgba(138,68,199,0.1)');
                    grad.addColorStop(1,   'rgba(138,68,199,0)');
                }
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
            }
        }
    }

    /* ─── Fog of War ───────────────────────────────────────────────── */

    drawFogOfWarMask(ctx) {
        const isHex = (this.gridShape === 'hex');
        const sz    = this.tileSize;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (!this.fogMask[y]?.[x]) continue;
                const fogColor = this.isPlayerView ? '#030406' : 'rgba(10,11,14,0.82)';
                if (isHex) {
                    const c = this.getHexCoordinates(x, y);
                    this.drawHexagonPolygon(ctx, c.x, c.y, c.R+0.5, fogColor,
                        this.isPlayerView ? null : 'rgba(255,255,255,0.05)', 1);
                } else {
                    const px = x*sz, py = y*sz;
                    ctx.fillStyle = fogColor;
                    ctx.fillRect(px, py, sz, sz);
                    if (!this.isPlayerView) {
                        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(px, py, sz, sz);
                    }
                }
            }
        }
    }

    /* ─── Room highlights ──────────────────────────────────────────── */

    drawHighlights(ctx) {
        if (!this.roomsData) return;
        const isHex  = (this.gridShape === 'hex');
        const sz     = this.tileSize;
        const pulse  = 0.22 + 0.12 * Math.sin(this.pulseAngle);

        for (const [id, r] of Object.entries(this.roomsData)) {
            let strokeColor = null, fillColor = null, lw = 1;
            if      (id === this.selectedRoomId) { strokeColor = 'rgba(168,85,247,0.95)'; fillColor = `rgba(168,85,247,${pulse+0.05})`; lw = 3; }
            else if (id === this.hoveredRoomId)  { strokeColor = 'rgba(168,85,247,0.6)';  fillColor = `rgba(168,85,247,${pulse})`;       lw = 2; }
            if (!strokeColor) continue;

            if (isHex) {
                for (let y = r.rect.y; y < r.rect.y + r.rect.h; y++) {
                    for (let x = r.rect.x; x < r.rect.x + r.rect.w; x++) {
                        if (!this.currentLevelData[y]) continue;
                        const t = this.currentLevelData[y][x];
                        if (t === TILE_TYPES.DUNGEON_ROOM || t === TILE_TYPES.CAVERN_FLOOR || t === TILE_TYPES.DUNGEON_OBSTACLE) {
                            const c = this.getHexCoordinates(x, y);
                            this.drawHexagonPolygon(ctx, c.x, c.y, c.R, fillColor, strokeColor, 1);
                        }
                    }
                }
                const mc = this.getHexCoordinates(r.rect.x + Math.floor(r.rect.w/2), r.rect.y + Math.floor(r.rect.h/2));
                ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
                ctx.fillText(r.name, mc.x, mc.y + 4); ctx.shadowBlur = 0;
            } else {
                const rx = r.rect.x*sz, ry = r.rect.y*sz, rw = r.rect.w*sz, rh = r.rect.h*sz;
                ctx.fillStyle = fillColor; ctx.fillRect(rx, ry, rw, rh);
                ctx.strokeStyle = strokeColor; ctx.lineWidth = lw;
                ctx.strokeRect(rx+1, ry+1, rw-2, rh-2);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
                ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
                ctx.fillText(r.name, rx+8, ry+18); ctx.shadowBlur = 0;
            }
        }
    }

    /* ─── Selection cursors ────────────────────────────────────────── */

    drawSelectionRings(ctx) {
        const isHex = (this.gridShape === 'hex');

        if (this.hoveredCell.x >= 0 && this.hoveredCell.y >= 0) {
            if (isHex) {
                const c = this.getHexCoordinates(this.hoveredCell.x, this.hoveredCell.y);
                this.drawHexagonPolygon(ctx, c.x, c.y, c.R+1, 'rgba(0,0,0,0)', 'rgba(255,255,255,0.4)', 2);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
                ctx.strokeRect(this.hoveredCell.x*this.tileSize+1, this.hoveredCell.y*this.tileSize+1, this.tileSize-2, this.tileSize-2);
            }
        }

        if (this.selectedCell.x >= 0 && this.selectedCell.y >= 0) {
            if (isHex) {
                const c = this.getHexCoordinates(this.selectedCell.x, this.selectedCell.y);
                this.drawHexagonPolygon(ctx, c.x, c.y, c.R+2, 'rgba(0,0,0,0)', 'hsl(262,85%,60%)', 2.5);
            } else {
                ctx.strokeStyle = 'hsl(262,85%,60%)'; ctx.lineWidth = 2.5;
                ctx.strokeRect(this.selectedCell.x*this.tileSize+1, this.selectedCell.y*this.tileSize+1, this.tileSize-2, this.tileSize-2);
            }
        }
    }
}
