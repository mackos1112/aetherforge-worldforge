import { RNG } from '../world/utils.js';
import { WorldNameGenerator } from '../names/names.js';
import { splitPolygon, pointInPolygon, insetPolygon, subdivideBlock } from './geometry.js';

export class CityModel {
    constructor(seed, config) {
        this.seed = seed;
        this.rng = new RNG(seed);
        this.nameGen = new WorldNameGenerator(this.rng);

        this.size = config.size || 'medium';
        this.gridType = config.gridType || 'voronoi';
        this.hasWalls = config.hasWalls !== false;
        this.hasCastle = config.hasCastle !== false;
        this.hasRiver = config.hasRiver !== false;
        this.hasCoast = config.hasCoast !== false;
        this.hasFields = config.hasFields !== false;

        this.districts = [];
        this.walls = [];
        this.towers = [];
        this.bridges = [];
        this.river = null;
        this.coast = null;
        this.outskirtsTrees = [];
        this.outskirtsHouses = [];

        this.generate();
    }

    generate() {
        let radius = 260;
        let districtCount = 24;

        if (this.size === 'small') {
            radius = 150;
            districtCount = 8;
        } else if (this.size === 'medium') {
            radius = 260;
            districtCount = 24;
        } else if (this.size === 'large') {
            radius = 380;
            districtCount = 45;
        } else if (this.size === 'metropolis') {
            radius = 500;
            districtCount = 80;
        }

        this.radius = radius;

        // 1. Coastline
        if (this.hasCoast) {
            const angle = this.rng.range(-Math.PI / 4, Math.PI / 4);
            const distToCenter = radius * 0.7;
            this.coast = {
                y: distToCenter,
                angle: angle
            };
        }

        // 2. River
        if (this.hasRiver) {
            const startX = -4000;
            const startY = this.rng.range(-radius * 0.3, radius * 0.3);
            const endX = 4000;
            const endY = this.rng.range(-radius * 0.3, radius * 0.3);

            const cp1x = -radius * 0.6;
            const cp1y = startY + this.rng.range(-radius * 0.4, radius * 0.4);
            const cp2x = radius * 0.6;
            const cp2y = endY + this.rng.range(-radius * 0.4, radius * 0.4);

            this.river = {
                start: { x: startX, y: startY },
                cp1: { x: cp1x, y: cp1y },
                cp2: { x: cp2x, y: cp2y },
                end: { x: endX, y: endY }
            };
        }

        // 3. Grid
        this.generateDistricts(districtCount);

        // 4. Populate
        this.populateWards();

        // 5. Walls
        if (this.hasWalls && this.size !== 'small') {
            this.generateWalls();
        }

        // 6. Outskirts
        this.generateOutskirtsAssets();

        // 7. Pre-bake building geometry (must be last — after all rng is consumed)
        this._bakeBuildings();
    }

    isPointWater(x, y) {
        if (this.coast) {
            const projY = x * Math.sin(this.coast.angle) + y * Math.cos(this.coast.angle);
            if (projY > this.coast.y) return true;
        }
        return false;
    }

    generateDistricts(count) {
        if (this.gridType === 'voronoi') {
            this.generateVoronoiRadial(count);
        } else if (this.gridType === 'hex') {
            this.generateHexGrid();
        } else if (this.gridType === 'square') {
            this.generateSquareGrid();
        } else if (this.gridType === 'concentric') {
            this.generateConcentricRings();
        }
    }

    generateVoronoiRadial(count) {
        const points = [];
        points.push({ x: 0, y: 0 });

        for (let i = 1; i < count; i++) {
            const r = this.radius * Math.sqrt(this.rng.range(0.12, 0.96));
            const theta = this.rng.range(0, Math.PI * 2);
            points.push({
                x: Math.cos(theta) * r,
                y: Math.sin(theta) * r
            });
        }

        const computeCells = (pts) => {
            const cells = [];
            pts.forEach((p, idx) => {
                let cellPoly = [
                    { x: -this.radius * 1.6, y: -this.radius * 1.6 },
                    { x: this.radius * 1.6, y: -this.radius * 1.6 },
                    { x: this.radius * 1.6, y: this.radius * 1.6 },
                    { x: -this.radius * 1.6, y: this.radius * 1.6 }
                ];

                for (let j = 0; j < pts.length; j++) {
                    if (idx === j) continue;
                    const pj = pts[j];
                    const mx = (p.x + pj.x) / 2;
                    const my = (p.y + pj.y) / 2;
                    const sDx = -(pj.y - p.y);
                    const sDy = pj.x - p.x;

                    const [left, right] = splitPolygon(cellPoly, mx, my, sDx, sDy);
                    const dTarget = (p.x - mx) * sDy - (p.y - my) * sDx;

                    if (dTarget >= 0) {
                        cellPoly = left;
                    } else {
                        cellPoly = right;
                    }

                    if (cellPoly.length < 3) break;
                }

                if (cellPoly.length >= 3) {
                    cells.push({
                        center: p,
                        polygon: cellPoly
                    });
                }
            });
            return cells;
        };

        let cells = computeCells(points);

        const relaxedPoints = [];
        relaxedPoints.push({ x: 0, y: 0 });

        for (let i = 1; i < cells.length; i++) {
            const poly = cells[i].polygon;
            let cx = 0, cy = 0, area = 0;
            
            for (let j = 0; j < poly.length; j++) {
                const p1 = poly[j];
                const p2 = poly[(j + 1) % poly.length];
                const factor = (p1.x * p2.y - p2.x * p1.y);
                cx += (p1.x + p2.x) * factor;
                cy += (p1.y + p2.y) * factor;
                area += factor;
            }
            area = area * 0.5;

            if (Math.abs(area) > 1e-3) {
                cx = cx / (6 * area);
                cy = cy / (6 * area);
                cx += this.rng.range(-3, 3);
                cy += this.rng.range(-3, 3);

                const d = Math.sqrt(cx*cx + cy*cy);
                if (d > this.radius) {
                    cx = (cx / d) * this.radius;
                    cy = (cy / d) * this.radius;
                }
                relaxedPoints.push({ x: cx, y: cy });
            } else {
                relaxedPoints.push(cells[i].center);
            }
        }

        cells = computeCells(relaxedPoints);

        cells.forEach(cell => {
            const d = Math.sqrt(cell.center.x*cell.center.x + cell.center.y*cell.center.y);
            if (d < this.radius && !this.isPointWater(cell.center.x, cell.center.y)) {
                cell.polygon = cell.polygon.map(pt => {
                    const pd = Math.sqrt(pt.x*pt.x + pt.y*pt.y);
                    if (pd > this.radius) {
                        return { x: (pt.x / pd) * this.radius, y: (pt.y / pd) * this.radius };
                    }
                    return pt;
                });
                this.districts.push(cell);
            }
        });
    }

    generateHexGrid() {
        const hexSize = this.radius * 0.20;
        const hexWidth = hexSize * Math.sqrt(3);
        const hexHeight = hexSize * 1.5;

        const cols = Math.ceil((this.radius * 2) / hexWidth);
        const rows = Math.ceil((this.radius * 2) / hexHeight);

        for (let r = -rows; r <= rows; r++) {
            for (let c = -cols; c <= cols; c++) {
                const x = c * hexWidth + (Math.abs(r) % 2 === 1 ? hexWidth / 2 : 0);
                const y = r * hexHeight;

                if (x * x + y * y > this.radius * this.radius) continue;
                if (this.isPointWater(x, y)) continue;

                const poly = [];
                for (let i = 0; i < 6; i++) {
                    const a = (i * Math.PI) / 3;
                    poly.push({
                        x: x + hexSize * Math.sin(a),
                        y: y + hexSize * Math.cos(a)
                    });
                }

                this.districts.push({
                    center: { x: x, y: y },
                    polygon: poly
                });
            }
        }
    }

    generateSquareGrid() {
        const size = this.radius * 0.22;
        const count = Math.ceil(this.radius / size);

        for (let r = -count; r <= count; r++) {
            for (let c = -count; c <= count; c++) {
                const x = c * size;
                const y = r * size;

                if (x * x + y * y > this.radius * this.radius) continue;
                if (this.isPointWater(x, y)) continue;

                const poly = [
                    { x: x - size * 0.47, y: y - size * 0.47 },
                    { x: x + size * 0.47, y: y - size * 0.47 },
                    { x: x + size * 0.47, y: y + size * 0.47 },
                    { x: x - size * 0.47, y: y + size * 0.47 }
                ];

                this.districts.push({
                    center: { x: x, y: y },
                    polygon: poly
                });
            }
        }
    }

    generateConcentricRings() {
        const rings = 3;
        const width = this.radius / rings;

        if (!this.isPointWater(0, 0)) {
            const centralRad = width * 0.65;
            const cPoly = [];
            for (let a = 0; a < 8; a++) {
                const angle = (a / 8) * Math.PI * 2;
                cPoly.push({ x: Math.cos(angle) * centralRad, y: Math.sin(angle) * centralRad });
            }
            this.districts.push({
                center: { x: 0, y: 0 },
                polygon: cPoly
            });
        }

        for (let r = 1; r < rings; r++) {
            const innerR = r * width;
            const outerR = (r + 1) * width;
            const segments = r * 6;

            for (let s = 0; s < segments; s++) {
                const angleA = (s / segments) * Math.PI * 2;
                const angleB = ((s + 1) / segments) * Math.PI * 2;

                const mx = Math.cos((angleA + angleB)/2) * (innerR + outerR)/2;
                const my = Math.sin((angleA + angleB)/2) * (innerR + outerR)/2;

                if (this.isPointWater(mx, my)) continue;

                const poly = [
                    { x: Math.cos(angleA) * innerR, y: Math.sin(angleA) * innerR },
                    { x: Math.cos(angleB) * innerR, y: Math.sin(angleB) * innerR },
                    { x: Math.cos(angleB) * outerR, y: Math.sin(angleB) * outerR },
                    { x: Math.cos(angleA) * outerR, y: Math.sin(angleA) * outerR }
                ];

                this.districts.push({
                    center: { x: mx, y: my },
                    polygon: poly
                });
            }
        }
    }

    populateWards() {
        const styles = ['elven', 'dwarven', 'norse', 'roman', 'gothic'];
        const cityStyle = this.rng.pick(styles);

        this.districts.sort((a, b) => {
            const d1 = a.center.x*a.center.x + a.center.y*a.center.y;
            const d2 = b.center.x*b.center.x + b.center.y*b.center.y;
            return d1 - d2;
        });

        const totalDistricts = this.districts.length;
        const urbanCoreCount = Math.ceil(totalDistricts * 0.65);

        let castleIdx = -1;
        if (this.hasCastle && totalDistricts > 0) {
            const options = [0, 1, 2, 3].filter(i => i < urbanCoreCount && i < totalDistricts);
            castleIdx = this.rng.pick(options);
            
            const castleDist = this.districts[castleIdx];
            castleDist.name = this.nameGen.generate(cityStyle, 'city') + ' Citadel';
            castleDist.type = 'Citadel Ward';
            castleDist.population = this.rng.int(80, 220);
            castleDist.desc = 'Fortified castle complex housing the local lord, royal treasury, and central military watchtowers.';
            castleDist.color = 'castle';
        }

        this.districts.forEach((dist, idx) => {
            if (idx === castleIdx) return;

            const baseName = this.nameGen.generate(cityStyle, 'city');

            if (this.hasFields && idx >= urbanCoreCount) {
                dist.name = baseName + ' Fields';
                dist.type = 'Outskirts Farmlands';
                dist.population = this.rng.int(15, 60);
                dist.desc = 'Lush rural crop fields, windmills, and granaries feeding the inner city population.';
                dist.color = 'fields';
            } else if (idx < Math.ceil(urbanCoreCount * 0.30)) {
                const types = [
                    { t: 'Noble Quarter', d: 'Stately manors, stone-paved plazas, and fine estates of the wealthy class.' },
                    { t: 'Temple District', d: 'Sacred grounds featuring grand cathedrals, bell towers, and silent cloisters.' }
                ];
                const choice = this.rng.pick(types);
                dist.name = baseName + ' ' + choice.t.split(' ')[0];
                dist.type = choice.t;
                dist.population = this.rng.int(220, 480);
                dist.desc = choice.d;
                dist.color = 'temple';
            } else if (idx < Math.ceil(urbanCoreCount * 0.65)) {
                const types = [
                    { t: 'Market Square', d: 'Bustling commercial plazas, bakeries, inns, and merchant merchant trade houses.' },
                    { t: 'Guild Artisan Quarter', d: 'Blacksmiths, metalworkers, weavers, and craft houses forging local goods.' }
                ];
                const choice = this.rng.pick(types);
                dist.name = baseName + ' ' + choice.t.split(' ')[0];
                dist.type = choice.t;
                dist.population = this.rng.int(450, 850);
                dist.desc = choice.d;
                dist.color = 'market';
            } else {
                dist.name = baseName + ' Ward';
                dist.type = 'Common Ward';
                dist.population = this.rng.int(550, 1100);
                dist.desc = 'Dense urban residential area housing craftsmen, soldiers, and common laborers.';
                dist.color = 'housing';
            }
        });

        // Bridges
        if (this.river) {
            this.districts.forEach((dist) => {
                const distDist = Math.sqrt(dist.center.x*dist.center.x + dist.center.y*dist.center.y);
                if (distDist < this.radius * 0.5 && this.bridges.length < 3) {
                    const t = 0.5 + (dist.center.x / (this.radius * 3));
                    const pY = this.getBezierY(t);
                    if (Math.abs(dist.center.y - pY) < 50) {
                        this.bridges.push({
                            x: dist.center.x,
                            y: pY + (dist.center.y - pY) * 0.35,
                            angle: Math.atan2(this.getBezierY(t+0.05) - this.getBezierY(t), 10) + Math.PI/2
                        });
                    }
                }
            });
        }
    }

    _bakeBuildings() {
        for (const dist of this.districts) {
            if (dist.color === 'fields' || dist.color === 'castle') {
                dist.buildingPlots = null;  // handled specially in draw
                continue;
            }

            const inset = insetPolygon(dist.polygon, 7);
            if (inset.length < 3) { dist.buildingPlots = []; continue; }

            const plots = subdivideBlock(inset, 160, this.rng);
            dist.buildingPlots = [];

            for (const plot of plots) {
                const skipCourtyard = this.rng.next() < 0.10;  // 10% courtyard
                if (skipCourtyard) continue;

                const footprint = insetPolygon(plot, 1.5);
                if (footprint.length < 3) continue;

                const roofColorIdx = this.rng.int(0, 3);  // index into roofColors array
                dist.buildingPlots.push({ footprint, roofColorIdx });
            }
        }
    }

    getBezierY(t) {
        if (!this.river) return 0;
        const start = this.river.start.y;
        const cp1 = this.river.cp1.y;
        const cp2 = this.river.cp2.y;
        const end = this.river.end.y;

        const mt = 1 - t;
        return mt * mt * mt * start + 3 * mt * mt * t * cp1 + 3 * mt * t * t * cp2 + t * t * t * end;
    }

    generateWalls() {
        this.walls = [];
        this.towers = [];

        const edgeCounts = new Map();
        const edgeMap = new Map();

        const urbanWards = this.districts.filter(d => d.color !== 'fields' && d.color !== 'water');

        urbanWards.forEach((dist) => {
            const poly = dist.polygon;
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];

                const x1 = Math.round(p1.x);
                const y1 = Math.round(p1.y);
                const x2 = Math.round(p2.x);
                const y2 = Math.round(p2.y);

                const key = x1 < x2 || (x1 === x2 && y1 < y2) 
                    ? `${x1},${y1}->${x2},${y2}` 
                    : `${x2},${y2}->${x1},${y1}`;

                edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
                edgeMap.set(key, { p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p2.y } });
            }
        });

        const placedTowers = new Set();
        let wallCount = 0;

        edgeCounts.forEach((count, key) => {
            if (count === 1) {
                const edge = edgeMap.get(key);
                this.walls.push({
                    x1: edge.p1.x, y1: edge.p1.y,
                    x2: edge.p2.x, y2: edge.p2.y
                });

                if (wallCount % 2 === 0) {
                    const tKey = `${Math.round(edge.p1.x)},${Math.round(edge.p1.y)}`;
                    if (!placedTowers.has(tKey)) {
                        placedTowers.add(tKey);
                        this.towers.push({ x: edge.p1.x, y: edge.p1.y });
                    }
                }
                wallCount++;
            }
        });
    }

    generateOutskirtsAssets() {
        this.outskirtsTrees = [];
        this.outskirtsHouses = [];

        const numClusters = this.rng.int(12, 22);
        for (let c = 0; c < numClusters; c++) {
            const angle = this.rng.range(0, Math.PI * 2);
            const dist = this.radius * this.rng.range(0.85, 1.55);
            const cx = Math.cos(angle) * dist;
            const cy = Math.sin(angle) * dist;

            if (this.isPointWater(cx, cy)) continue;

            const treesInCluster = this.rng.int(4, 9);
            for (let t = 0; t < treesInCluster; t++) {
                const tx = cx + this.rng.range(-28, 28);
                const ty = cy + this.rng.range(-28, 28);

                if (!this.isPointWater(tx, ty)) {
                    this.outskirtsTrees.push({
                        x: tx,
                        y: ty,
                        size: this.rng.range(4, 7)
                    });
                }
            }
        }

        const numHouses = this.rng.int(12, 24);
        for (let h = 0; h < numHouses; h++) {
            const angle = this.rng.range(0, Math.PI * 2);
            const dist = this.radius * this.rng.range(0.82, 1.35);
            const hx = Math.cos(angle) * dist;
            const hy = Math.sin(angle) * dist;

            if (this.isPointWater(hx, hy)) continue;

            let tooClose = false;
            for (const dist of this.districts) {
                if (dist.color !== 'fields' && pointInPolygon(hx, hy, dist.polygon)) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                this.outskirtsHouses.push({
                    x: hx,
                    y: hy,
                    w: this.rng.range(6, 10),
                    h: this.rng.range(5, 8),
                    angle: this.rng.range(0, Math.PI * 2)
                });
            }
        }
    }
}
