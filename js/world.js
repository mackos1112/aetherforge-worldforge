// Seeded Random Number Generator (LCG)
class SeededRandom {
    constructor(seed) {
        this.seed = this.hashString(seed || Math.random().toString());
    }

    hashString(str) {
        let hash = 1789;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // Returns float between 0 and 1
    next() {
        const a = 1103515245;
        const c = 12345;
        const m = 2147483648;
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }

    nextRange(min, max) {
        return min + this.next() * (max - min);
    }

    nextChoice(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

// 2D Noise Generator (Fractional Brownian Motion approximation via Hash functions)
class ValueNoise2D {
    constructor(rng) {
        this.rng = rng;
        this.grid = {};
    }

    getHash(x, y) {
        const key = `${x},${y}`;
        if (this.grid[key] === undefined) {
            this.grid[key] = this.rng.next();
        }
        return this.grid[key];
    }

    // Bilinear interpolation
    lerp(a, b, t) {
        return a + (b - a) * (3 * t * t - 2 * t * t * t);
    }

    noise(x, y) {
        const xf = Math.floor(x);
        const yf = Math.floor(y);
        const xt = x - xf;
        const yt = y - yf;

        const n00 = this.getHash(xf, yf);
        const n10 = this.getHash(xf + 1, yf);
        const n01 = this.getHash(xf, yf + 1);
        const n11 = this.getHash(xf + 1, yf + 1);

        const x1 = this.lerp(n00, n10, xt);
        const x2 = this.lerp(n01, n11, xt);

        return this.lerp(x1, x2, yt);
    }

    fbm(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
        }

        return value / maxValue;
    }
}

// World Engine Class
class WorldEngine {
    constructor(seed, sizeMode, coreType, tectonics, atmosphere, climate) {
        this.rng = new SeededRandom(seed);
        this.sizeMode = sizeMode;
        this.coreType = coreType;
        this.tectonics = tectonics;
        this.atmosphere = atmosphere;
        this.climate = climate;

        this.width = sizeMode === 'small' ? 32 : (sizeMode === 'large' ? 64 : 48);
        this.height = this.width;

        this.grid = [];
        this.nations = [];
        this.cities = [];
        this.pois = [];

        this.atmosphereLayers = [
            { name: "Troposphere", alt: "0-12 km", desc: "Weather layer. 75% of atmosphere mass.", temp: "15°C to -50°C", pressure: "1.0 to 0.2 atm" },
            { name: "Stratosphere", alt: "12-50 km", desc: "Dry layer. Contains protective Ozone layer.", temp: "-50°C to -3°C", pressure: "0.2 to 0.001 atm" },
            { name: "Mesosphere", alt: "50-85 km", desc: "Coldest layer. Meteors burn up here.", temp: "-3°C to -90°C", pressure: "0.001 to 0.00001 atm" },
            { name: "Thermosphere", alt: "85-600 km", desc: "Contains Ionosphere. Auroras generate here.", temp: "-90°C to 1500°C", pressure: "Trace" },
            { name: "Exosphere", alt: "600-10,000 km", desc: "Sparsely populated upper limit blending into space.", temp: "1500°C (molecular)", pressure: "Vacuum" },
            { name: "Magnetosphere", alt: "10,000-60,000 km", desc: "Magnetic force field deflecting stellar winds.", temp: "Stellar temp", pressure: "Vacuum" }
        ];

        this.coreLayers = [
            { name: "Crust", thickness: "5-70 km", composition: "Silicate Rocks (Basalt & Granite)", state: "Solid", temp: "Surface to 900°C" },
            { name: "Lithosphere", thickness: "80-150 km", composition: "Brittle crust & upper mantle", state: "Rigid Solid", temp: "900°C to 1200°C" },
            { name: "Asthenosphere", thickness: "180-250 km", composition: "Highly viscous ductile silicate rock", state: "Semi-fluid / Plastic", temp: "1200°C to 1400°C" },
            { name: "Mantle", thickness: "2,890 km", composition: "Magnesium-Iron Silicates (Peridotite)", state: "Viscous Solid / Convecting", temp: "1400°C to 3700°C" },
            { name: "Core", thickness: "3,480 km radius", composition: this.getCoreCompositionName(), state: "Metallic Liquid & Crystalline Solid Core", temp: "3700°C to 6000°C" }
        ];

        this.generate();
    }

    getCoreCompositionName() {
        if (this.coreType === 'iron-nickel') return "Iron-Nickel Alloy";
        if (this.coreType === 'silicate') return "Silicate Rock & Oxide Compounds";
        if (this.coreType === 'gold-molten') return "Molten Heavy Metals (Gold, Platinum, Uranium)";
        return "Volatile Crystalline Core (Energy Matrix)";
    }

    generate() {
        const noiseGen = new ValueNoise2D(this.rng);
        this.grid = [];

        // 1. Generate geographical maps
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Coordinate normalized latitude (-90 to 90) and longitude (-180 to 180)
                const lat = (0.5 - y / this.height) * 180;
                const lon = (x / this.width - 0.5) * 360;

                // Base height noise
                let h = noiseGen.fbm(x * 0.08, y * 0.08, 4);

                // Modify heights based on plate tectonics selection
                if (this.tectonics === 'active') {
                    // Create more dramatic mountains/ridges/trenches
                    if (h > 0.6) h = 0.6 + (h - 0.6) * 1.5;
                    if (h < 0.4) h = 0.4 - (0.4 - h) * 1.4;
                } else {
                    // Flatten height range
                    h = 0.35 + (h - 0.35) * 0.7;
                }

                // Climate modifier adjustments for temperature
                // Polar cold caps top/bottom
                let baseTemp = 28 - Math.abs(lat) * 0.7; // equator is hot, poles are cold
                if (this.climate === 'frozen') baseTemp -= 15;
                if (this.climate === 'volcanic') baseTemp += 20;
                if (this.climate === 'desolate') baseTemp += 10;

                // Height cooling
                const temp = baseTemp - (h > 0.5 ? (h - 0.5) * 45 : 0);

                // Moisture
                let moisture = noiseGen.fbm(x * 0.12 + 10, y * 0.12 + 10, 3);
                if (this.climate === 'desolate') moisture *= 0.4;
                if (this.climate === 'frozen') moisture *= 0.6; // dry ice regions

                // Hydrology: aquifer level is base moisture * depth
                const aquifer = Math.max(5, Math.floor(moisture * 150 - (h > 0.65 ? 40 : 0)));

                row.push({
                    x, y,
                    lat: lat.toFixed(1),
                    lon: lon.toFixed(1),
                    height: h,
                    temperature: Math.round(temp),
                    moisture: Math.round(moisture * 100),
                    aquifer,
                    landform: 'Plain',
                    liquid: 'None',
                    soil: 'Sandy Regolith',
                    bedrock: 'Granite',
                    magmaPct: Math.min(100, Math.max(5, Math.round((h * 70) + (this.climate === 'volcanic' ? 40 : 0)))),
                    nationId: -1,
                    city: null,
                    poi: null
                });
            }
            this.grid.push(row);
        }

        // 2. Classify Landforms and Liquids
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const s = this.grid[y][x];

                // Heights classifications
                if (s.height < 0.28) {
                    s.landform = 'Trench';
                    s.liquid = 'Ocean';
                    s.bedrock = 'Basalt';
                    s.soil = 'Silty Mud';
                } else if (s.height < 0.44) {
                    s.landform = 'Plain';
                    s.liquid = 'Ocean';
                    s.bedrock = 'Basalt';
                    s.soil = 'Silty Mud';
                } else if (s.height < 0.48) {
                    s.landform = 'Plain';
                    s.liquid = 'Sea';
                    s.bedrock = 'Basalt';
                    s.soil = 'Fine Sand';
                } else if (s.height < 0.54) {
                    // Check local dryness
                    if (s.moisture < 20) {
                        s.landform = 'Desert';
                        s.soil = 'Regolith Dust';
                        if (this.rng.next() > 0.5) s.landform = 'Dune';
                    } else {
                        s.landform = 'Plain';
                        s.soil = 'Loam Soil';
                    }
                    s.bedrock = 'Sandstone';
                } else if (s.height < 0.62) {
                    s.landform = 'Valley';
                    s.soil = 'Clay Soil';
                    s.bedrock = 'Limestone';
                } else if (s.height < 0.70) {
                    s.landform = 'Plateau';
                    s.soil = 'Coarse Soil';
                    s.bedrock = 'Shale';
                } else if (s.height < 0.82) {
                    s.landform = 'Mountain';
                    s.soil = 'Rocky Regolith';
                    s.bedrock = 'Granite';
                } else {
                    s.landform = 'Volcano';
                    s.soil = 'Volcanic Ash';
                    s.bedrock = 'Obsidian';
                    s.liquid = this.climate === 'volcanic' || this.rng.next() > 0.5 ? 'Lava' : 'None';
                }

                // Ice adjustments based on temperature
                if (s.temperature < -5) {
                    s.liquid = 'Glacier';
                    if (s.temperature < -15) {
                        s.landform = 'Ice cap';
                        s.liquid = 'None';
                    }
                    s.soil = 'Frozen Regolith (Permafrost)';
                    s.bedrock = 'Glacial Till';
                }

                // Natural canyon formations based on sharp height slope
                if (s.landform === 'Valley' && this.rng.next() > 0.8) {
                    s.landform = 'Canyon';
                    s.soil = 'Scree Sediment';
                }
                
                // Cliff formation
                if (s.landform === 'Mountain' && this.rng.next() > 0.85) {
                    s.landform = 'Cliff';
                    s.soil = 'Exposed Bedrock';
                }
            }
        }

        // 3. Hydrology Simulation (Rivers & Lakes)
        const riverOrigins = Math.floor(this.width * 0.15);
        for (let i = 0; i < riverOrigins; i++) {
            // Find a high elevation point (mountain/ridge)
            let rx = Math.floor(this.rng.next() * this.width);
            let ry = Math.floor(this.rng.next() * this.height);
            let steps = 0;

            while (steps < 40) {
                const s = this.grid[ry][rx];
                if (s.height < 0.48) {
                    break; // reached sea
                }
                
                s.liquid = 'River';
                
                // Find lowest neighbor
                let lowestNeighbor = null;
                let minHeight = s.height;
                const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
                
                for (const [dx, dy] of dirs) {
                    const nx = (rx + dx + this.width) % this.width;
                    const ny = Math.max(0, Math.min(this.height - 1, ry + dy));
                    const neighbor = this.grid[ny][nx];
                    if (neighbor.height < minHeight) {
                        minHeight = neighbor.height;
                        lowestNeighbor = { x: nx, y: ny };
                    }
                }
                
                if (lowestNeighbor) {
                    rx = lowestNeighbor.x;
                    ry = lowestNeighbor.y;
                } else {
                    // Stagnant, form a lake!
                    s.liquid = 'Lake';
                    break;
                }
                steps++;
            }
        }

        // 4. Generate Political Capitals and Borders
        const numNations = 5;
        this.nations = [
            { name: "The Eldorian Realm", color: "#66bb66", capital: "Eldoria" },
            { name: "Empire of Valenhold", color: "#66aacc", capital: "Valenhold" },
            { name: "The Ashen Domain", color: "#e07a5f", capital: "Ashenspire" },
            { name: "Sylvan Alliance", color: "#f2cc8f", capital: "Sylvan Grove" },
            { name: "Frostbound League", color: "#95d5b2", capital: "Frostkeep" }
        ];

        this.cities = [];
        const openQueue = [];

        // Plant nation capitals on plains/valleys near water
        for (let i = 0; i < numNations; i++) {
            let cx = 0;
            let cy = 0;
            let found = false;

            for (let attempts = 0; attempts < 300; attempts++) {
                cx = Math.floor(this.rng.next() * this.width);
                cy = Math.floor(this.rng.next() * this.height);
                const s = this.grid[cy][cx];

                // Capitals grow on flat fertile land near water
                if (s.height >= 0.48 && s.height < 0.58 && s.liquid === 'None' && s.landform !== 'Desert') {
                    // Check if close to water
                    let nearWater = false;
                    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
                    for (const [dx, dy] of dirs) {
                        const nx = (cx + dx + this.width) % this.width;
                        const ny = Math.max(0, Math.min(this.height - 1, cy + dy));
                        if (this.grid[ny][nx].height < 0.48 || this.grid[ny][nx].liquid === 'River') {
                            nearWater = true;
                        }
                    }

                    if (nearWater) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                // Fallback
                cx = Math.floor(this.rng.next() * this.width);
                cy = Math.floor(this.rng.next() * this.height);
            }

            const nation = this.nations[i];
            const s = this.grid[cy][cx];
            s.nationId = i;
            s.city = { name: nation.capital, isCapital: true, nationId: i };
            this.cities.push({ name: nation.capital, x: cx, y: cy, nationId: i, isCapital: true });

            openQueue.push({ x: cx, y: cy, nationId: i });
        }

        // BFS flood-fill to claim land territories
        while (openQueue.length > 0) {
            const curr = openQueue.shift();
            const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

            for (const [dx, dy] of dirs) {
                const nx = (curr.x + dx + this.width) % this.width;
                const ny = Math.max(0, Math.min(this.height - 1, curr.y + dy));
                const s = this.grid[ny][nx];

                // Claim land sectors that haven't been claimed yet
                if (s.height >= 0.48 && s.nationId === -1 && s.landform !== 'Ice cap') {
                    s.nationId = curr.nationId;
                    openQueue.push({ x: nx, y: ny, nationId: curr.nationId });
                }
            }
        }

        // Plant additional regular cities
        const totalCities = 15;
        const cityNames = [
            "Oasis Prime", "Seaside", "Riverbend", "Granite Keep", "Volcania", 
            "Highpoint", "Ironwood", "Dune Gate", "Frost Peak", "Deepwell"
        ];

        for (let i = 0; i < totalCities; i++) {
            const rx = Math.floor(this.rng.next() * this.width);
            const ry = Math.floor(this.rng.next() * this.height);
            const s = this.grid[ry][rx];

            if (s.height >= 0.48 && !s.city && s.landform !== 'Ice cap' && s.landform !== 'Volcano') {
                const name = this.rng.nextChoice(cityNames) + " " + (i + 1);
                s.city = { name, isCapital: false, nationId: s.nationId };
                this.cities.push({ name, x: rx, y: ry, nationId: s.nationId, isCapital: false });
            }
        }

        // 5. Scatter Dungeon Points of Interest (POIs)
        this.pois = [];
        const poiTypes = [
            { type: "crypt", name: "Ancient Tomb", desc: "A forgotten resting place containing ancient curses.", theme: "crypt" },
            { type: "stone", name: "Highland Keep", desc: "Ruined stone fortifications now crawling with goblins.", theme: "stone" },
            { type: "cavern", name: "Sulfur Caves", desc: "Subterranean steam vents filled with sulfur and drakes.", theme: "cavern" },
            { type: "temple", name: "Sunken Temple", desc: "Silt-covered corridors built to worship old swamp gods.", theme: "temple" }
        ];

        const numPois = 8;
        for (let i = 0; i < numPois; i++) {
            let px, py, s;
            let attempts = 0;
            
            while (attempts < 100) {
                px = Math.floor(this.rng.next() * this.width);
                py = Math.floor(this.rng.next() * this.height);
                s = this.grid[py][px];
                if (s.height >= 0.48 && !s.city && !s.poi && s.landform !== 'Ice cap') {
                    break;
                }
                attempts++;
            }

            // Pick a matching theme based on landform
            let t = poiTypes[0];
            if (s.landform === 'Volcano' || s.landform === 'Canyon') {
                t = poiTypes[2]; // sulfur cavern
            } else if (s.landform === 'Mountain' || s.landform === 'Cliff') {
                t = poiTypes[1]; // highland keep
            } else if (s.landform === 'Valley' && s.moisture > 60) {
                t = poiTypes[3]; // temple
            } else {
                t = this.rng.nextChoice(poiTypes);
            }

            const name = t.name + " " + (i + 1);
            s.poi = {
                type: t.type,
                name: name,
                desc: t.desc,
                theme: t.theme,
                seed: `world_${px}_${py}_${this.rng.nextChoice(['ab','xy','zk'])}`
            };
            this.pois.push({ name: name, x: px, y: py, poi: s.poi });
        }
    }
}

// Visualizer UI Controller
class WorldVisualizer {
    constructor() {
        this.canvas = document.getElementById('worldCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('worldCanvasContainer');
        this.inspector = document.getElementById('worldInspectorContent');

        this.viewMode = 'surface'; // surface, slice, profile
        this.selectedTile = null;

        // Viewport camera properties for Global Map
        this.scale = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;

        // Overlay states
        this.politicalView = false;
        this.showCities = true;
        this.showPOIs = true;

        this.initializeUI();
        this.regenerateWorld();
        this.setupEvents();
    }

    initializeUI() {
        this.seedInput = document.getElementById('inputWorldSeed');
        this.btnRandomSeed = document.getElementById('btnRandomWorldSeed');
        this.selectSize = document.getElementById('selectPlanetSize');
        this.selectCore = document.getElementById('selectCoreType');
        this.selectTectonics = document.getElementById('selectTectonics');
        this.selectAtmosphere = document.getElementById('selectAtmosphere');
        this.selectClimate = document.getElementById('selectClimate');
        this.btnForge = document.getElementById('btnForgeWorld');

        this.btnZoomIn = document.getElementById('btnWorldZoomIn');
        this.btnZoomOut = document.getElementById('btnWorldZoomOut');
        this.btnZoomReset = document.getElementById('btnWorldZoomReset');

        // Checkbox overlays
        this.chkPolitical = document.getElementById('chkPoliticalView');
        this.chkCities = document.getElementById('chkShowCities');
        this.chkPOIs = document.getElementById('chkShowPOIs');

        // Set random seed initially
        this.seedInput.value = Math.floor(Math.random() * 99999).toString();
    }

    regenerateWorld() {
        const seed = this.seedInput.value;
        const size = this.selectSize.value;
        const core = this.selectCore.value;
        const tect = this.selectTectonics.value;
        const atmos = this.selectAtmosphere.value;
        const clim = this.selectClimate.value;

        this.world = new WorldEngine(seed, size, core, tect, atmos, clim);
        this.selectedTile = this.world.grid[Math.floor(this.world.height/2)][Math.floor(this.world.width/2)];
        
        this.resetCamera();
        this.resizeCanvas();
        this.draw();
        this.updateInspector();
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }

    resetCamera() {
        this.scale = 1.0;
        this.panX = 0;
        this.panY = 0;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());

        this.btnRandomSeed.addEventListener('click', () => {
            this.seedInput.value = Math.floor(Math.random() * 999999).toString();
        });

        this.btnForge.addEventListener('click', () => this.regenerateWorld());

        // Overlay checkbox triggers
        this.chkPolitical.addEventListener('change', () => {
            this.politicalView = this.chkPolitical.checked;
            this.draw();
        });
        this.chkCities.addEventListener('change', () => {
            this.showCities = this.chkCities.checked;
            this.draw();
        });
        this.chkPOIs.addEventListener('change', () => {
            this.showPOIs = this.chkPOIs.checked;
            this.draw();
        });

        // Tab switches
        const tabs = document.querySelectorAll('#worldViewTabs .level-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.viewMode = tab.getAttribute('data-view');
                
                // Show/hide political toggles
                const controls = document.getElementById('worldMapControls');
                if (this.viewMode === 'surface') {
                    controls.style.display = 'flex';
                    document.getElementById('txtWorldViewTitle').textContent = 'Global Surface Map';
                } else {
                    controls.style.display = 'none';
                    document.getElementById('txtWorldViewTitle').textContent = this.viewMode === 'slice' ? 'Planetary Concentric Slice' : 'Drill Geological Profile';
                }

                this.resetCamera();
                this.draw();
                this.updateInspector();
            });
        });

        // Zoom controls
        this.btnZoomIn.addEventListener('click', () => {
            this.scale = Math.min(4.0, this.scale * 1.2);
            this.draw();
        });
        this.btnZoomOut.addEventListener('click', () => {
            this.scale = Math.max(0.5, this.scale / 1.2);
            this.draw();
        });
        this.btnZoomReset.addEventListener('click', () => {
            this.resetCamera();
            this.draw();
        });

        // Mouse interactions
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.startX = e.clientX - this.panX;
            this.startY = e.clientY - this.panY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanning) {
                this.panX = e.clientX - this.startX;
                this.panY = e.clientY - this.startY;
                this.draw();
            } else {
                // Highlight tiles/sectors on hover
                if (this.viewMode === 'surface') {
                    const sector = this.getSectorFromCoords(mouseX, mouseY);
                    if (sector) {
                        document.getElementById('txtWorldCoords').textContent = `Lat: ${sector.lat}°, Lon: ${sector.lon}°`;
                        document.getElementById('txtWorldSector').textContent = `Hovered Sector: ${sector.landform} (${sector.liquid === 'None' ? 'Dry' : sector.liquid})`;
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isPanning = false;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Click interaction to select tile/layers
            if (this.viewMode === 'surface') {
                const sector = this.getSectorFromCoords(mouseX, mouseY);
                if (sector) {
                    this.selectedTile = sector;
                    this.updateInspector();
                }
            } else if (this.viewMode === 'slice') {
                const layer = this.getInternalLayerFromCoords(mouseX, mouseY);
                if (layer) {
                    this.selectedLayer = layer;
                    this.updateInspector();
                }
            } else if (this.viewMode === 'profile') {
                const material = this.getGeologicalMaterialFromCoords(mouseX, mouseY);
                if (material) {
                    this.selectedMaterial = material;
                    this.updateInspector();
                }
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            if (e.deltaY < 0) {
                this.scale = Math.min(4.0, this.scale * zoomFactor);
            } else {
                this.scale = Math.max(0.5, this.scale / zoomFactor);
            }
            this.draw();
        });
    }

    getSectorFromCoords(mx, my) {
        // Calculate centered offset
        const totalMapWidth = this.world.width * 14 * this.scale;
        const totalMapHeight = this.world.height * 14 * this.scale;
        const originX = (this.canvas.width - totalMapWidth) / 2 + this.panX;
        const originY = (this.canvas.height - totalMapHeight) / 2 + this.panY;

        const tileX = Math.floor((mx - originX) / (14 * this.scale));
        const tileY = Math.floor((my - originY) / (14 * this.scale));

        if (tileX >= 0 && tileX < this.world.width && tileY >= 0 && tileY < this.world.height) {
            return this.world.grid[tileY][tileX];
        }
        return null;
    }

    getInternalLayerFromCoords(mx, my) {
        const cx = this.canvas.width / 2 + this.panX;
        const cy = this.canvas.height / 2 + this.panY;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx*dx + dy*dy) / this.scale;

        // Radius ranges (drawn outwards)
        // Core: 0-60, Mantle: 60-140, Asthenosphere: 140-165, Lithosphere: 165-185, Crust: 185-195
        // Atmospheres: Troposphere: 195-208, Stratosphere: 208-220, Mesosphere: 220-232, Thermosphere: 232-248, Exosphere: 248-265, Magnetosphere: 265-290
        if (dist <= 60) return { type: 'core', layer: this.world.coreLayers[4] };
        if (dist <= 140) return { type: 'mantle', layer: this.world.coreLayers[3] };
        if (dist <= 165) return { type: 'asthenosphere', layer: this.world.coreLayers[2] };
        if (dist <= 185) return { type: 'lithosphere', layer: this.world.coreLayers[1] };
        if (dist <= 195) return { type: 'crust', layer: this.world.coreLayers[0] };
        
        // Atmosphere indices
        if (dist <= 208) return { type: 'atmos', layer: this.world.atmosphereLayers[0] };
        if (dist <= 220) return { type: 'atmos', layer: this.world.atmosphereLayers[1] };
        if (dist <= 232) return { type: 'atmos', layer: this.world.atmosphereLayers[2] };
        if (dist <= 248) return { type: 'atmos', layer: this.world.atmosphereLayers[3] };
        if (dist <= 265) return { type: 'atmos', layer: this.world.atmosphereLayers[4] };
        if (dist <= 290) return { type: 'atmos', layer: this.world.atmosphereLayers[5] };

        return null;
    }

    getGeologicalMaterialFromCoords(mx, my) {
        const topY = 80 * this.scale + this.panY;
        const colWidth = 240 * this.scale;
        const colLeft = (this.canvas.width - colWidth) / 2 + this.panX;

        if (mx >= colLeft && mx <= colLeft + colWidth) {
            const dy = (my - topY) / this.scale;
            if (dy >= 0 && dy <= 450) {
                // 0-80: Troposphere gas
                // 80-140: Soil/Sediment
                // 140-230: Regolith
                // 230-360: Bedrock
                // 360-450: Magma Reservoir
                if (dy <= 80) return { type: 'material', name: 'Troposphere Air / Atmosphere', desc: 'Lower atmospheric gases interacting with the soil.', items: ['Nitrogen', 'Oxygen', 'Argon', 'Carbon Dioxide'] };
                if (dy <= 140) return { type: 'material', name: 'Soil & Sediment Layers', desc: 'Loose topsoil containing organic decomposition and mineral sediments.', items: ['Humus', 'Lilt clay', 'Organic sediments'] };
                if (dy <= 230) return { type: 'material', name: 'Regolith Zone', desc: 'A layer of loose, heterogeneous rocky debris sitting directly above solid bedrock.', items: ['Fragmented bedrock', 'Crushed stone dust', 'Weathered minerals'] };
                if (dy <= 360) return { type: 'material', name: 'Solid Bedrock Layer', desc: 'Impermeable, lithified solid rock forming the foundation of the local crust.', items: ['Feldspar', 'Quartz', 'Local igneous/metamorphic matrix'] };
                return { type: 'material', name: 'Magma & Lava Reservoir', desc: 'Deep geothermal chambers containing molten rock under extreme crustal pressure.', items: ['Liquid Basalt', 'Dissolved Volatile Gases', 'Felsic Magma'] };
            }
        }
        return null;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.viewMode === 'surface') {
            this.drawSurfaceMap();
        } else if (this.viewMode === 'slice') {
            this.drawConcentricSlice();
        } else if (this.viewMode === 'profile') {
            this.drawGeologicalProfile();
        }
    }

    drawSurfaceMap() {
        const tileSize = 14 * this.scale;
        const totalMapWidth = this.world.width * tileSize;
        const totalMapHeight = this.world.height * tileSize;
        
        // Origin coordinates centered in canvas
        const originX = (this.canvas.width - totalMapWidth) / 2 + this.panX;
        const originY = (this.canvas.height - totalMapHeight) / 2 + this.panY;

        // Draw sector grid
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const s = this.world.grid[y][x];
                let color = '#2e4c27'; // Default plain green

                if (this.politicalView && s.nationId !== -1) {
                    color = this.world.nations[s.nationId].color;
                } else {
                    // Geographical colors
                    if (s.liquid === 'Ocean') {
                        color = '#1b2c4c';
                    } else if (s.liquid === 'Sea') {
                        color = '#263d68';
                    } else if (s.liquid === 'Lake') {
                        color = '#386694';
                    } else if (s.liquid === 'River') {
                        color = '#52b788';
                    } else if (s.liquid === 'Glacier') {
                        color = '#a2d2ff';
                    } else if (s.landform === 'Ice cap') {
                        color = '#e9ecef';
                    } else if (s.landform === 'Mountain') {
                        color = '#4a4e69';
                    } else if (s.landform === 'Ridge' || s.landform === 'Plateau') {
                        color = '#8d99ae';
                    } else if (s.landform === 'Desert' || s.landform === 'Dune') {
                        color = '#e9c46a';
                    } else if (s.landform === 'Volcano') {
                        color = s.liquid === 'Lava' ? '#ff3f3f' : '#6f1d1b';
                    } else if (s.landform === 'Trench') {
                        color = '#0b0f19';
                    } else if (s.landform === 'Canyon') {
                        color = '#aa7c11';
                    } else if (s.landform === 'Valley') {
                        color = '#38b000';
                    }
                }

                this.ctx.fillStyle = color;
                this.ctx.fillRect(originX + x * tileSize, originY + y * tileSize, tileSize - 0.5, tileSize - 0.5);

                // Highlight selected tile
                if (this.selectedTile && this.selectedTile.x === x && this.selectedTile.y === y) {
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = Math.max(1.5, 2 * this.scale);
                    this.ctx.strokeRect(originX + x * tileSize, originY + y * tileSize, tileSize - 0.5, tileSize - 0.5);
                }
            }
        }

        // Draw cities and capitals overlay
        if (this.showCities) {
            for (const c of this.world.cities) {
                const px = originX + c.x * tileSize + tileSize / 2;
                const py = originY + c.y * tileSize + tileSize / 2;
                const radius = c.isCapital ? 6 * this.scale : 4 * this.scale;

                this.ctx.fillStyle = c.isCapital ? '#ffd166' : '#ffffff';
                this.ctx.strokeStyle = '#222222';
                this.ctx.lineWidth = 1.5 * this.scale;

                // Draw circle
                this.ctx.beginPath();
                this.ctx.arc(px, py, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                if (this.scale >= 1.0) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `bold ${10 * this.scale}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = 'black';
                    this.ctx.shadowBlur = 3;
                    this.ctx.fillText(c.name, px, py - radius - 3);
                    this.ctx.shadowBlur = 0; // reset
                }
            }
        }

        // Draw Dungeon Points of Interest overlay
        if (this.showPOIs) {
            for (const p of this.world.pois) {
                const px = originX + p.x * tileSize + tileSize / 2;
                const py = originY + p.y * tileSize + tileSize / 2;

                this.ctx.fillStyle = '#ff4d6d';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1 * this.scale;

                // Draw diamond for POIs
                this.ctx.beginPath();
                this.ctx.moveTo(px, py - 5 * this.scale);
                this.ctx.lineTo(px + 5 * this.scale, py);
                this.ctx.lineTo(px, py + 5 * this.scale);
                this.ctx.lineTo(px - 5 * this.scale, py);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                if (this.scale >= 0.8) {
                    this.ctx.fillStyle = '#ffd166';
                    this.ctx.font = `${9 * this.scale}px 'Share', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowColor = 'black';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillText(p.name, px, py + 12 * this.scale);
                    this.ctx.shadowBlur = 0; // reset
                }
            }
        }
    }

    drawConcentricSlice() {
        const cx = this.canvas.width / 2 + this.panX;
        const cy = this.canvas.height / 2 + this.panY;
        const baseRadius = this.scale;

        // Radii values
        const rCore = 60 * baseRadius;
        const rMantle = 140 * baseRadius;
        const rAstheno = 165 * baseRadius;
        const rLitho = 185 * baseRadius;
        const rCrust = 195 * baseRadius;
        
        // Atmosphere bands
        const rTropo = 208 * baseRadius;
        const rStrato = 220 * baseRadius;
        const rMeso = 232 * baseRadius;
        const rThermo = 248 * baseRadius;
        const rExo = 265 * baseRadius;
        const rMagneto = 290 * baseRadius;

        // Draw Magnetosphere (Outer blue halo shield)
        const glow = this.ctx.createRadialGradient(cx, cy, rExo, cx, cy, rMagneto);
        glow.addColorStop(0, 'rgba(102, 136, 170, 0.4)');
        glow.addColorStop(0.5, 'rgba(102, 136, 170, 0.15)');
        glow.addColorStop(1, 'rgba(102, 136, 170, 0.0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rMagneto, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw atmosphere rings
        const atmosColors = [
            { r: rExo, color: 'rgba(255, 255, 255, 0.04)' },
            { r: rThermo, color: 'rgba(255, 200, 100, 0.08)' }, // ionosphere warm hue
            { r: rMeso, color: 'rgba(100, 200, 255, 0.08)' },
            { r: rStrato, color: 'rgba(120, 230, 255, 0.15)' },
            { r: rTropo, color: 'rgba(200, 240, 255, 0.3)' }
        ];

        for (const layer of atmosColors) {
            this.ctx.fillStyle = layer.color;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, layer.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Draw solid layers
        // Crust (Basalt/Granite grey shell)
        this.ctx.fillStyle = '#6d5959';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rCrust, 0, Math.PI * 2);
        this.ctx.fill();

        // Lithosphere (Brittle grey-black)
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rLitho, 0, Math.PI * 2);
        this.ctx.fill();

        // Asthenosphere (Ductile reddish-brown magma-rock blend)
        this.ctx.fillStyle = '#5c1d1d';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rAstheno, 0, Math.PI * 2);
        this.ctx.fill();

        // Mantle (Deep molten viscous red-orange)
        this.ctx.fillStyle = '#8f2500';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rMantle, 0, Math.PI * 2);
        this.ctx.fill();

        // Core (Liquid heavy glowing center)
        let coreColor = '#ffd166'; // Default iron-nickel yellow
        if (this.world.coreType === 'silicate') coreColor = '#4a4e69';
        if (this.world.coreType === 'gold-molten') coreColor = '#ffb703';
        if (this.world.coreType === 'crystal') coreColor = '#00f5d4';

        const coreGlow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, rCore);
        coreGlow.addColorStop(0, '#ffffff');
        coreGlow.addColorStop(0.4, coreColor);
        coreGlow.addColorStop(1, '#8f2500'); // blend into mantle
        
        this.ctx.fillStyle = coreGlow;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, rCore, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw boundary rings for clean separation
        this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        this.ctx.lineWidth = 1;
        const boundaries = [rCore, rMantle, rAstheno, rLitho, rCrust];
        for (const b of boundaries) {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, b, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw radial labels if scale is large enough
        if (this.scale >= 0.8) {
            this.ctx.fillStyle = '#e5e0c3';
            this.ctx.font = `${11 * this.scale}px 'Share', sans-serif`;
            this.ctx.textAlign = 'left';

            this.ctx.fillText("Exosphere Layer", cx + rExo + 5, cy - 5);
            this.ctx.fillText("Thermosphere (Auroras)", cx + rThermo + 5, cy + 12);
            this.ctx.fillText("Crust (Granite & Basalt)", cx + rCrust - 40, cy + rCrust - 20);
            this.ctx.fillText("Molten Core Boundary", cx + 15, cy - rCore + 15);
        }
    }

    drawGeologicalProfile() {
        const topY = 80 * this.scale + this.panY;
        const colWidth = 240 * this.scale;
        const colLeft = (this.canvas.width - colWidth) / 2 + this.panX;

        // We draw 5 layers in a column format
        // 1. Atmosphere gases (0-80px)
        // 2. Soil & Sediments (80-140px)
        // 3. Regolith (140-230px)
        // 4. Bedrock (230-360px)
        // 5. Magma reservoir (360-450px)
        const layers = [
            { h: 80, name: "Troposphere Atmosphere", color: 'rgba(200, 240, 255, 0.15)' },
            { h: 60, name: `Topsoil / Sediments (${this.selectedTile.soil})`, color: '#6f523b' },
            { h: 90, name: 'Weathered Regolith Layer', color: '#8b8070' },
            { h: 130, name: `Solid Bedrock (${this.selectedTile.bedrock})`, color: '#4a4e5a' },
            { h: 90, name: `Geothermal Magma Zone (${this.selectedTile.magmaPct}% heat)`, color: '#8f2500' }
        ];

        let currentY = topY;
        for (let i = 0; i < layers.length; i++) {
            const l = layers[i];
            const height = l.h * this.scale;

            this.ctx.fillStyle = l.color;
            this.ctx.fillRect(colLeft, currentY, colWidth, height);
            
            // Draw border
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(colLeft, currentY, colWidth, height);

            // Text labels
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `bold ${12 * this.scale}px 'Share', sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(l.name, colLeft + colWidth/2, currentY + height/2 + 4);

            currentY += height;
        }

        // Add soil horizon labels on the left of the column
        this.ctx.fillStyle = '#ffd166';
        this.ctx.font = `${11 * this.scale}px 'Share', sans-serif`;
        this.ctx.textAlign = 'right';
        
        let labelY = topY;
        this.ctx.fillText("O-Horizon (Air) —", colLeft - 10, labelY + 40 * this.scale);
        labelY += 80 * this.scale;
        this.ctx.fillText("A-Horizon (Organic Soil) —", colLeft - 10, labelY + 30 * this.scale);
        labelY += 60 * this.scale;
        this.ctx.fillText("C-Horizon (Fragmented Rock) —", colLeft - 10, labelY + 45 * this.scale);
        labelY += 90 * this.scale;
        this.ctx.fillText("R-Horizon (Bedrock) —", colLeft - 10, labelY + 65 * this.scale);
        labelY += 130 * this.scale;
        this.ctx.fillText("Geothermal Chamber —", colLeft - 10, labelY + 45 * this.scale);
    }

    updateInspector() {
        if (!this.selectedTile) return;

        let md = '';

        if (this.viewMode === 'surface') {
            const tile = this.selectedTile;
            const nationName = tile.nationId !== -1 ? this.world.nations[tile.nationId].name : "No Claims (Neutral Wilderness)";
            
            md += `<div class="inspector-section">`;
            md += `<h3>Sector Coordinate [${tile.x}, ${tile.y}]</h3>`;
            md += `<p><strong>Latitude</strong>: ${tile.lat}° | <strong>Longitude</strong>: ${tile.lon}°</p>`;
            md += `</div>`;

            md += `<div class="inspector-section">`;
            md += `<h4>Geographical Status</h4>`;
            md += `<p><strong>Landform</strong>: ${tile.landform}</p>`;
            md += `<p><strong>Hydrological Presence</strong>: ${tile.liquid === 'None' ? 'None (Dry Land)' : tile.liquid}</p>`;
            md += `<p><strong>Local Climate</strong>: Temp: ${tile.temperature}°C | Moisture: ${tile.moisture}%</p>`;
            md += `</div>`;

            md += `<div class="inspector-section">`;
            md += `<h4>Territorial Sovereignty</h4>`;
            md += `<p><strong>Political Jurisdiction</strong>: ${nationName}</p>`;
            if (tile.city) {
                md += `<p><strong>Settlement</strong>: 🏙️ <strong>${tile.city.name}</strong> ${tile.city.isCapital ? '(Capital City)' : '(Regional Town)'}</p>`;
            }
            md += `</div>`;

            md += `<div class="inspector-section">`;
            md += `<h4>Points of Interest</h4>`;
            if (tile.poi) {
                md += `<div class="poi-box" style="border: 1px solid var(--watabou-accent); padding: 8px; border-radius: 4px; background: rgba(102,136,170,0.1); margin-bottom: 8px;">`;
                md += `<p><strong>🏛️ ${tile.poi.name}</strong></p>`;
                md += `<p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">${tile.poi.desc}</p>`;
                md += `<p style="font-size: 11px; font-family: monospace; color: var(--watabou-highlight);">POI Seed: ${tile.poi.seed}</p>`;
                md += `</div>`;
                md += `<a href="dungeon.html?seed=${tile.poi.seed}&theme=${tile.poi.theme}" target="_blank" class="btn btn-primary btn-icon" style="width: 100%; font-size:12px;">Explore Location (Forge Dungeon)</a>`;
            } else {
                md += `<p style="font-size: 12px; color: var(--text-secondary);">No historical ruins or dungeon points discovered in this sector.</p>`;
            }
            md += `</div>`;
            
        } else if (this.viewMode === 'slice') {
            const sel = this.selectedLayer;
            if (sel) {
                md += `<div class="inspector-section">`;
                md += `<h3>Selected Layer: ${sel.layer.name}</h3>`;
                md += `<p><strong>Altitude / Thickness</strong>: ${sel.layer.alt || sel.layer.thickness}</p>`;
                md += `</div>`;

                md += `<div class="inspector-section">`;
                md += `<h4>Scientific Readings</h4>`;
                if (sel.layer.pressure) md += `<p><strong>Pressure Profile</strong>: ${sel.layer.pressure}</p>`;
                if (sel.layer.temp) md += `<p><strong>Average Temperature</strong>: ${sel.layer.temp}</p>`;
                if (sel.layer.state) md += `<p><strong>Physical State</strong>: ${sel.layer.state}</p>`;
                if (sel.layer.composition) md += `<p><strong>Chemical Composition</strong>: ${sel.layer.composition}</p>`;
                md += `</div>`;

                md += `<div class="inspector-section">`;
                md += `<h4>Geological Summary</h4>`;
                md += `<p style="font-size:13px; color: var(--text-secondary); line-height:1.4;">${sel.layer.desc}</p>`;
                md += `</div>`;
            } else {
                md += `<p>Click on any of the core circles or outer atmospheric rings to view physical layer analysis.</p>`;
            }
        } else if (this.viewMode === 'profile') {
            const m = this.selectedMaterial;
            if (m) {
                md += `<div class="inspector-section">`;
                md += `<h3>Geological Unit: ${m.name}</h3>`;
                md += `<p>${m.desc}</p>`;
                md += `</div>`;

                md += `<div class="inspector-section">`;
                md += `<h4>Common Components</h4>`;
                md += `<ul>`;
                for (const item of m.items) {
                    md += `<li>${item}</li>`;
                }
                md += `</ul>`;
                md += `</div>`;
            } else {
                md += `<p>Click on any horizontal segment of the drill column to analyze material density and composition.</p>`;
            }
        }

        this.inspector.innerHTML = md;
    }
}

// Initial initialization on load
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new WorldVisualizer();
});
