import { RNG } from './world/utils.js';
import { CityModel } from './city/generator.js';
import { pointInPolygon, insetPolygon } from './city/geometry.js';

class CityController {
    constructor() {
        this.canvas = document.getElementById('cityCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI Controls
        this.txtSeed = document.getElementById('txtSeed');
        this.btnRandSeed = document.getElementById('btnRandSeed');
        this.selSize = document.getElementById('selSize');
        this.selGrid = document.getElementById('selGrid');
        this.selTheme = document.getElementById('selTheme');
        
        this.chkWalls = document.getElementById('chkWalls');
        this.chkCastle = document.getElementById('chkCastle');
        this.chkRiver = document.getElementById('chkRiver');
        this.chkCoast = document.getElementById('chkCoast');
        this.chkFields = document.getElementById('chkFields');
        this.chkLabels = document.getElementById('chkLabels');
        
        this.btnGenerate = document.getElementById('btnGenerate');
        this.btnExport = document.getElementById('btnExport');
        
        this.infoPanel = document.getElementById('infoPanel');
        this.lblDistrictName = document.getElementById('lblDistrictName');
        this.lblDistrictType = document.getElementById('lblDistrictType');
        this.lblDistrictPop = document.getElementById('lblDistrictPop');
        this.lblDistrictDesc = document.getElementById('lblDistrictDesc');

        // Interaction State
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.hoveredDistrict = null;
        
        // Active City Model
        this.city = null;
        this.seed = '';
        
        this.initEventListeners();
        this.randomizeSeed();
        this.parseUrlParams();
        this.resizeCanvas();
        this.generateCity();
    }

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        const seed = params.get('seed');
        if (seed) {
            this.seed = seed;
            this.txtSeed.value = seed;
        }
        
        const size = params.get('size');
        if (size && ['small', 'medium', 'large', 'metropolis'].includes(size)) {
            this.selSize.value = size;
        }
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });

        this.btnRandSeed.addEventListener('click', () => {
            this.randomizeSeed();
            this.generateCity();
        });

        this.btnGenerate.addEventListener('click', () => {
            this.generateCity();
        });

        this.btnExport.addEventListener('click', () => {
            this.exportPng();
        });

        this.selTheme.addEventListener('change', () => this.draw());
        this.chkLabels.addEventListener('change', () => this.draw());

        // Drag pan events
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.clientX - this.panX;
            this.startY = e.clientY - this.panY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                this.panX = e.clientX - this.startX;
                this.panY = e.clientY - this.startY;
                this.draw();
            } else {
                this.handleHover(mouseX, mouseY);
            }
        });

        // Zoom wheel event
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.panX) / this.zoom;
            const worldY = (mouseY - this.panY) / this.zoom;

            const zoomFactor = 1.1;
            if (e.deltaY < 0) {
                this.zoom = Math.min(this.zoom * zoomFactor, 4.0);
            } else {
                this.zoom = Math.max(this.zoom / zoomFactor, 0.5); // Min zoom lock
            }

            this.panX = mouseX - worldX * this.zoom;
            this.panY = mouseY - worldY * this.zoom;
            
            this.draw();
        });
    }

    randomizeSeed() {
        this.seed = Math.floor(Math.random() * 2000000000).toString();
        this.txtSeed.value = this.seed;
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    handleHover(mouseX, mouseY) {
        if (!this.city) return;
        const worldX = (mouseX - this.panX) / this.zoom;
        const worldY = (mouseY - this.panY) / this.zoom;

        let found = null;
        for (const dist of this.city.districts) {
            // Ignore fields in hover
            if (dist.color !== 'fields' && dist.type !== 'Water' && pointInPolygon(worldX, worldY, dist.polygon)) {
                found = dist;
                break;
            }
        }

        if (found !== this.hoveredDistrict) {
            this.hoveredDistrict = found;
            if (found) {
                this.lblDistrictName.textContent = found.name;
                this.lblDistrictType.textContent = found.type;
                this.lblDistrictPop.textContent = found.population.toLocaleString();
                this.lblDistrictDesc.textContent = found.desc;
                this.infoPanel.classList.add('visible');
            } else {
                this.infoPanel.classList.remove('visible');
            }
            this.draw();
        }
    }

    generateCity() {
        const seedVal = this.txtSeed.value || this.seed;
        
        // Reset viewport offsets
        this.zoom = 1.0;
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
        this.hoveredDistrict = null;
        this.infoPanel.classList.remove('visible');

        // Build City Model
        this.city = new CityModel(seedVal, {
            size: this.selSize.value,
            gridType: this.selGrid.value,
            hasWalls: this.chkWalls.checked,
            hasCastle: this.chkCastle.checked,
            hasRiver: this.chkRiver.checked,
            hasCoast: this.chkCoast.checked,
            hasFields: this.chkFields.checked
        });

        this.draw();
    }

    draw() {
        if (!this.city) return;

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const theme = this.selTheme.value;
        let cBg = '#f5ecd6';
        let cInk = '#2c251d';
        let cLand = '#f9f6ef';
        let cWater = '#c9dfec';
        let cWaterLines = 'rgba(120, 160, 185, 0.4)';
        let cWall = '#7f8c8d';
        let cFields = '#e5dca5';
        let cFieldsHatches = 'rgba(44, 37, 29, 0.25)';

        let roofColors = ['#cca285', '#d49a7b', '#ab8671', '#c7c2ac'];

        if (theme === 'blueprint') {
            cBg = '#16233b';
            cInk = '#ffffff';
            cLand = '#1f304e';
            cWater = '#0e1726';
            cWaterLines = 'rgba(255, 255, 255, 0.2)';
            cWall = '#ffffff';
            cFields = '#1f304e';
            cFieldsHatches = 'rgba(255, 255, 255, 0.15)';
            roofColors = ['#1f304e'];
        } else if (theme === 'dark') {
            cBg = '#0b0c10';
            cInk = '#66fcf1';
            cLand = '#0b0c10';
            cWater = '#1f2833';
            cWaterLines = 'rgba(102, 252, 241, 0.3)';
            cWall = '#66fcf1';
            cFields = '#0b0c10';
            cFieldsHatches = 'rgba(102, 252, 241, 0.15)';
            roofColors = ['#45a29e'];
        } else if (theme === 'contrast') {
            cBg = '#ffffff';
            cInk = '#000000';
            cLand = '#ffffff';
            cWater = '#ffffff';
            cWaterLines = '#000000';
            cWall = '#000000';
            cFields = '#ffffff';
            cFieldsHatches = 'rgba(0, 0, 0, 0.2)';
            roofColors = ['#ffffff'];
        }

        this.canvas.style.background = cBg;

        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // 1. Coast Shoreline
        if (this.city.coast) {
            this.ctx.fillStyle = cWater;
            this.ctx.beginPath();
            const wR = 2500;
            const ca = this.city.coast.angle;
            const dx = Math.sin(ca) * this.city.coast.y;
            const dy = Math.cos(ca) * this.city.coast.y;
            const px = Math.cos(ca) * wR;
            const py = -Math.sin(ca) * wR;

            this.ctx.moveTo(dx - px, dy - py);
            this.ctx.lineTo(dx + px, dy + py);
            this.ctx.lineTo(dx + px + Math.sin(ca)*wR, dy + py + Math.cos(ca)*wR);
            this.ctx.lineTo(dx - px + Math.sin(ca)*wR, dy - py + Math.cos(ca)*wR);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.strokeStyle = cWaterLines;
            for (let w = 5; w < 40; w += 10) {
                this.ctx.lineWidth = Math.max(0.5, 2 - w/20) / this.zoom;
                this.ctx.beginPath();
                this.ctx.moveTo(dx - px + Math.sin(ca)*w, dy - py + Math.cos(ca)*w);
                this.ctx.lineTo(dx + px + Math.sin(ca)*w, dy + py + Math.cos(ca)*w);
                this.ctx.stroke();
            }
        }

        // 2. River Flow
        if (this.city.river) {
            this.ctx.strokeStyle = cWater;
            this.ctx.lineWidth = 26 / this.zoom;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.city.river.start.x, this.city.river.start.y);
            this.ctx.bezierCurveTo(
                this.city.river.cp1.x, this.city.river.cp1.y,
                this.city.river.cp2.x, this.city.river.cp2.y,
                this.city.river.end.x, this.city.river.end.y
            );
            this.ctx.stroke();

            this.ctx.strokeStyle = cWaterLines;
            this.ctx.lineWidth = 1 / this.zoom;
            this.ctx.stroke();
        }

        // 3. Wards Land Fill & Outskirts Farmlands
        this.city.districts.forEach((dist) => {
            const isHovered = dist === this.hoveredDistrict;

            this.ctx.beginPath();
            dist.polygon.forEach((p, idx) => {
                if (idx === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            });
            this.ctx.closePath();

            this.ctx.fillStyle = dist.color === 'fields' ? cFields : cLand;
            this.ctx.fill();

            if (dist.color === 'fields') {
                this.drawFarmlandCrops(dist, cFieldsHatches, theme);
            }

            // Draw boundaries only on urban core to blend outer fields organically
            if (dist.color !== 'fields') {
                this.ctx.strokeStyle = isHovered ? (theme === 'dark' ? '#00ffff' : '#e74c3c') : cInk;
                this.ctx.lineWidth = (isHovered ? 2.5 : 1) / this.zoom;
                this.ctx.stroke();
            } else if (isHovered) {
                this.ctx.strokeStyle = 'rgba(231, 76, 60, 0.45)';
                this.ctx.lineWidth = 1.5 / this.zoom;
                this.ctx.stroke();
            }
        });

        // 4. Jigsaw Buildings
        this.city.districts.forEach((dist) => {
            if (dist.color !== 'fields') {
                this.drawPackedBuildings(dist, cInk, roofColors, theme);
            }
        });

        // 5. Walls & Towers
        if (this.city.walls.length > 0) {
            this.ctx.strokeStyle = cInk;
            this.ctx.lineWidth = 4 / this.zoom;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.city.walls.forEach((seg) => {
                this.ctx.moveTo(seg.x1, seg.y1);
                this.ctx.lineTo(seg.x2, seg.y2);
            });
            this.ctx.stroke();

            this.ctx.strokeStyle = theme === 'contrast' ? '#ffffff' : '#bdc3c7';
            this.ctx.lineWidth = 2 / this.zoom;
            this.ctx.stroke();

            this.city.towers.forEach((tower) => {
                const cx = tower.x;
                const cy = tower.y;
                const towerRad = 6;

                this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : '#95a5a6';
                this.ctx.strokeStyle = cInk;
                this.ctx.lineWidth = 1.5 / this.zoom;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, towerRad, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.arc(cx, cy, towerRad * 0.5, 0, Math.PI * 2);
                this.ctx.stroke();
            });
        }

        // 6. Bridges
        if (this.city.bridges.length > 0) {
            this.city.bridges.forEach((bridge) => {
                this.ctx.save();
                this.ctx.translate(bridge.x, bridge.y);
                this.ctx.rotate(bridge.angle);
                
                this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : '#bdc3c7';
                this.ctx.strokeStyle = cInk;
                this.ctx.lineWidth = 1.5 / this.zoom;
                
                const bW = 34 / this.zoom;
                const bH = 12 / this.zoom;
                
                this.ctx.fillRect(-bW/2, -bH/2, bW, bH);
                this.ctx.strokeRect(-bW/2, -bH/2, bW, bH);
                
                this.ctx.beginPath();
                this.ctx.moveTo(-bW/4, -bH/2);
                this.ctx.lineTo(-bW/4, bH/2);
                this.ctx.moveTo(bW/4, -bH/2);
                this.ctx.lineTo(bW/4, bH/2);
                this.ctx.stroke();
                
                this.ctx.restore();
            });
        }

        // 7. Outskirts Elements (Shacks and Trees)
        if (this.city.outskirtsHouses) {
            this.city.outskirtsHouses.forEach(h => {
                this.ctx.save();
                this.ctx.translate(h.x, h.y);
                this.ctx.rotate(h.angle);
                
                this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : this.city.rng.pick(roofColors);
                this.ctx.strokeStyle = cInk;
                this.ctx.lineWidth = 1 / this.zoom;
                
                this.ctx.fillRect(-h.w/2, -h.h/2, h.w, h.h);
                this.ctx.strokeRect(-h.w/2, -h.h/2, h.w, h.h);
                
                this.ctx.beginPath();
                this.ctx.moveTo(-h.w/2, 0);
                this.ctx.lineTo(h.w/2, 0);
                this.ctx.stroke();
                
                this.ctx.restore();
            });
        }

        if (this.city.outskirtsTrees) {
            this.ctx.strokeStyle = cInk;
            this.ctx.lineWidth = 0.8 / this.zoom;
            this.city.outskirtsTrees.forEach(t => {
                this.ctx.fillStyle = theme === 'blueprint' ? '#1f304e' : (theme === 'dark' ? '#103f3a' : (theme === 'contrast' ? '#ffffff' : '#c3d7a4'));
                
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - 2, t.size * 0.7, 0, Math.PI * 2);
                this.ctx.arc(t.x - 3, t.y + 1, t.size * 0.6, 0, Math.PI * 2);
                this.ctx.arc(t.x + 3, t.y + 1, t.size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            });
        }

        // 8. Labels
        if (this.chkLabels.checked) {
            this.ctx.fillStyle = cInk;
            this.ctx.font = `bold ${Math.max(10, 11 / this.zoom)}px var(--font-heading)`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.city.districts.forEach((dist) => {
                if (dist.color === 'fields') return;

                const textWidth = this.ctx.measureText(dist.name).width;
                this.ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255, 255, 255, 0.8)';
                this.ctx.fillRect(dist.center.x - textWidth/2 - 4, dist.center.y - 7, textWidth + 8, 14);

                this.ctx.fillStyle = cInk;
                this.ctx.fillText(dist.name, dist.center.x, dist.center.y);
            });
        }

        // 9. Radial vignette edge framing
        if (theme === 'parchment') {
            const grad = this.ctx.createRadialGradient(0, 0, 200, 0, 0, 800);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(64,48,32,0.12)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(-3000, -3000, 6000, 6000);
        }

        this.ctx.restore();
    }

    drawFarmlandCrops(dist, cFieldsHatches, theme) {
        this.ctx.save();
        
        this.ctx.beginPath();
        dist.polygon.forEach((p, idx) => {
            if (idx === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        });
        this.ctx.closePath();
        this.ctx.clip();

        const minX = Math.min(...dist.polygon.map(p => p.x));
        const maxX = Math.max(...dist.polygon.map(p => p.x));
        const minY = Math.min(...dist.polygon.map(p => p.y));
        const maxY = Math.max(...dist.polygon.map(p => p.y));

        const w = maxX - minX;
        const h = maxY - minY;

        const fRng = new RNG(Math.round(dist.center.x) + "" + Math.round(dist.center.y));

        const isHorizontal = w > h;
        const numStrips = fRng.int(3, 5);
        const stripSize = isHorizontal ? w / numStrips : h / numStrips;

        for (let s = 0; s < numStrips; s++) {
            this.ctx.save();
            
            let sx, sy, sw, sh;
            if (isHorizontal) {
                sx = minX + s * stripSize;
                sy = minY;
                sw = stripSize;
                sh = h;
            } else {
                sx = minX;
                sy = minY + s * stripSize;
                sw = w;
                sh = stripSize;
            }

            this.ctx.beginPath();
            this.ctx.rect(sx, sy, sw, sh);
            this.ctx.clip();

            let fillCol = '#e5dca5';
            let lineCol = cFieldsHatches;

            if (theme === 'parchment') {
                fillCol = fRng.pick(['#e8dec5', '#e2dbaf', '#dcd8a2', '#d5ddbd']);
            } else if (theme === 'blueprint') {
                fillCol = fRng.pick(['#20314f', '#1d2c47', '#1a273f']);
                lineCol = 'rgba(255, 255, 255, 0.12)';
            } else if (theme === 'dark') {
                fillCol = fRng.pick(['#0b0c10', '#0f111a', '#06070a']);
                lineCol = 'rgba(102, 252, 241, 0.1)';
            } else {
                fillCol = '#ffffff';
                lineCol = 'rgba(0, 0, 0, 0.15)';
            }

            this.ctx.fillStyle = fillCol;
            this.ctx.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);

            const angle = fRng.pick([0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2]);
            const spacing = fRng.range(5, 8);
            
            this.ctx.strokeStyle = lineCol;
            this.ctx.lineWidth = 0.5 / this.zoom;

            const diag = Math.sqrt(sw * sw + sh * sh);
            const scx = sx + sw / 2;
            const scy = sy + sh / 2;

            this.ctx.translate(scx, scy);
            this.ctx.rotate(angle);

            this.ctx.beginPath();
            for (let offset = -diag; offset < diag; offset += spacing) {
                this.ctx.moveTo(offset, -diag);
                this.ctx.lineTo(offset, diag);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawPackedBuildings(dist, cInk, roofColors, theme) {
        const poly = dist.polygon;
        if (poly.length < 3) return;

        const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;

        this.ctx.save();
        this.ctx.strokeStyle = cInk;
        this.ctx.lineWidth = 1 / this.zoom;

        if (dist.color === 'castle') {
            const inset = insetPolygon(poly, 7);
            this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : '#e0dbcd';
            this.ctx.beginPath();
            inset.forEach((p, idx) => {
                if (idx === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            });
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : '#bcaba0';
            const kSz = 24;
            this.ctx.fillRect(cx - kSz/2, cy - kSz/2, kSz, kSz);
            this.ctx.strokeRect(cx - kSz/2, cy - kSz/2, kSz, kSz);
            this.ctx.strokeRect(cx - kSz/4, cy - kSz/4, kSz/2, kSz/2);

            inset.forEach(p => {
                this.ctx.fillStyle = theme === 'contrast' ? '#ffffff' : '#ab7967';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            });
        } else {
            // Read pre-baked building plots — NO rng calls here
            const plots = dist.buildingPlots;
            if (!plots || plots.length === 0) { this.ctx.restore(); return; }

            for (const { footprint, roofColorIdx } of plots) {
                this.ctx.fillStyle = roofColors[roofColorIdx % roofColors.length];
                this.ctx.beginPath();
                footprint.forEach((pt, idx) => {
                    if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
                    else this.ctx.lineTo(pt.x, pt.y);
                });
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Ridge line decoration
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                footprint.forEach(pt => {
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                });
                const bcx = (minX + maxX) / 2;
                const bcy = (minY + maxY) / 2;
                this.ctx.beginPath();
                if ((maxX - minX) > (maxY - minY)) {
                    const w = (maxX - minX) * 0.35;
                    this.ctx.moveTo(bcx - w, bcy);
                    this.ctx.lineTo(bcx + w, bcy);
                } else {
                    const h = (maxY - minY) * 0.35;
                    this.ctx.moveTo(bcx, bcy - h);
                    this.ctx.lineTo(bcx, bcy + h);
                }
                this.ctx.strokeStyle = 'rgba(0,0,0,0.18)';
                this.ctx.lineWidth = 0.6 / this.zoom;
                this.ctx.stroke();
                // restore stroke for next building
                this.ctx.strokeStyle = cInk;
                this.ctx.lineWidth = 1 / this.zoom;
            }
        }
        this.ctx.restore();
    }

    exportPng() {
        const url = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `city_${this.txtSeed.value || this.seed}.png`;
        link.href = url;
        link.click();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new CityController();
});
