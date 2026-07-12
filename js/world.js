// ─────────────────────────────────────────────────────────────────────────────
// AETHERFORGE WORLDFORGE — world.js
// Complete procedural planet generator with terrain, hydrology, politics & POIs
// ─────────────────────────────────────────────────────────────────────────────

// ── Seeded LCG Random ────────────────────────────────────────────────────────
class RNG {
    constructor(seed) {
        this.seed = this._hash(String(seed || Math.random()));
        this._orig = this.seed;
    }
    _hash(s) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h || 1;
    }
    next() {
        // xorshift32
        let x = this.seed;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.seed = x >>> 0;
        return (this.seed >>> 0) / 4294967296;
    }
    range(lo, hi) { return lo + this.next() * (hi - lo); }
    int(lo, hi)   { return Math.floor(this.range(lo, hi + 1)); }
    pick(arr)     { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(a)    { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
}

// ── Gradient Noise (faster than value noise, smooth results) ─────────────────
class GradientNoise2D {
    constructor(rng, tableSize = 512) {
        this.T = tableSize;
        this.perm  = new Uint16Array(tableSize * 2);
        const base = new Uint16Array(tableSize);
        for (let i = 0; i < tableSize; i++) base[i] = i;
        // Fisher-Yates
        for (let i = tableSize - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [base[i], base[j]] = [base[j], base[i]];
        }
        for (let i = 0; i < tableSize * 2; i++) this.perm[i] = base[i % tableSize];

        this.gx = new Float32Array(tableSize);
        this.gy = new Float32Array(tableSize);
        for (let i = 0; i < tableSize; i++) {
            const a = rng.next() * Math.PI * 2;
            this.gx[i] = Math.cos(a);
            this.gy[i] = Math.sin(a);
        }
    }
    _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    _lerp(a, b, t) { return a + t * (b - a); }
    _grad(hash, x, y) {
        const h = hash & (this.T - 1);
        return this.gx[h] * x + this.gy[h] * y;
    }
    noise(x, y) {
        const xi = Math.floor(x) & (this.T - 1);
        const yi = Math.floor(y) & (this.T - 1);
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = this._fade(xf), v = this._fade(yf);
        const aa = this.perm[this.perm[xi] + yi];
        const ab = this.perm[this.perm[xi] + yi + 1];
        const ba = this.perm[this.perm[xi + 1] + yi];
        const bb = this.perm[this.perm[xi + 1] + yi + 1];
        return this._lerp(
            this._lerp(this._grad(aa, xf, yf),     this._grad(ba, xf - 1, yf),     u),
            this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u),
            v
        );
    }
    fbm(x, y, oct = 6, lac = 2.0, gain = 0.5) {
        let v = 0, amp = 0.5, freq = 1, maxV = 0;
        for (let i = 0; i < oct; i++) {
            v    += this.noise(x * freq, y * freq) * amp;
            maxV += amp;
            amp  *= gain;
            freq *= lac;
        }
        return v / maxV; // -1..1
    }
    // Domain-warped fbm — gives very organic continent shapes
    warpedFbm(x, y, oct = 5) {
        const qx = this.fbm(x, y, oct);
        const qy = this.fbm(x + 5.2, y + 1.3, oct);
        return this.fbm(x + 4.0 * qx, y + 4.0 * qy, oct);
    }
}

// ── Procedural Name Generator ─────────────────────────────────────────────────
class NameGen {
    constructor(rng) {
        this.rng = rng;
        this.vowels = ['a','e','i','o','u','ae','ai','au','ei','ou','ia','io'];
        this.cons1  = ['Br','Cr','Dr','Fr','Gr','Pr','Str','Thr','Vr','Wh','Bl','Fl','Sl','Sp','St',
                       'Al','El','Er','Ul','Ar','Or','Ir','An','En','Un','Val','Mor','Eld','Aer','Ith'];
        this.cons2  = ['nt','nd','th','sh','ch','gh','rk','rm','rd','nk','ld','lt','nn','ss','ng',
                       'dar','hold','mere','ford','wick','ton','holm','fell','mire','wyn','dor','ath'];
        this.suffN  = ['ia','is','ar','or','im','el','or','in','an','on','yl','um','us'];
        this.suffC  = ['land','heim','vale','keep','feld','reach','march','watch','stone','hold','gate','spire'];
    }
    city() {
        const r = this.rng;
        const pre = r.pick([...this.cons1]);
        const mid = r.pick([...this.vowels]);
        const suf = r.pick([...this.cons2]);
        return pre + mid + suf;
    }
    nation() {
        const r = this.rng;
        const adj = r.pick(['Eldorian','Valenian','Ashen','Sylvan','Frostbound','Iron','Golden','Silver',
                             'Crimson','Azure','Verdant','Shadow','Storm','Ember','Voidborn','Arcane',
                             'Sunlit','Moonforged','Tidewrought','Stonebound']);
        const noun = r.pick(['Realm','Empire','Domain','Alliance','League','Confederacy','Union',
                              'Dominion','Sovereignty','Compact','Covenant','Hold','Territories','Expanse']);
        return `The ${adj} ${noun}`;
    }
    capital() {
        const r = this.rng;
        const syl = r.pick(this.cons1) + r.pick(this.vowels);
        const suf = r.pick(this.suffC);
        return syl + suf;
    }
}

// ── Biome Table ───────────────────────────────────────────────────────────────
const BIOMES = {
    // Key: { label, col, soilHint, bedrockHint }
    'Deep Ocean':     { col: [12, 24, 58],   soil: 'Abyssal Clay',        bedrock: 'Basalt' },
    'Ocean':          { col: [22, 54, 105],  soil: 'Marine Silicate Mud', bedrock: 'Basalt' },
    'Shallow Sea':    { col: [38, 92, 155],  soil: 'Fine Carbonate Sand',  bedrock: 'Limestone' },
    'Ice Cap':        { col: [230, 240, 255],soil: 'Frozen Regolith',     bedrock: 'Glacial Till' },
    'Tundra':         { col: [168, 196, 180],soil: 'Permafrost Peat',     bedrock: 'Granite' },
    'Glacier':        { col: [190, 220, 245],soil: 'Compacted Ice',       bedrock: 'Glacial Till' },
    'Desert':         { col: [210, 170, 80], soil: 'Aeolian Sand',        bedrock: 'Sandstone' },
    'Dune Sea':       { col: [230, 188, 70], soil: 'Shifting Dune Crest', bedrock: 'Sandstone' },
    'Savanna':        { col: [182, 196, 90], soil: 'Laterite Loam',       bedrock: 'Schist' },
    'Grassland':      { col: [86, 148, 52],  soil: 'Humus-Rich Loam',     bedrock: 'Limestone' },
    'Shrubland':      { col: [140, 168, 82], soil: 'Sandy Loam',          bedrock: 'Sandstone' },
    'Forest':         { col: [52, 112, 48],  soil: 'Podsol Loam',         bedrock: 'Granite' },
    'Rainforest':     { col: [24, 90, 40],   soil: 'Laterite Clay',       bedrock: 'Basalt' },
    'Swamp':          { col: [48, 88, 58],   soil: 'Peat Bog Mire',       bedrock: 'Shale' },
    'Taiga':          { col: [60, 104, 88],  soil: 'Podzol Soil',         bedrock: 'Granite' },
    'Valley':         { col: [68, 128, 60],  soil: 'Alluvial Clay',       bedrock: 'Limestone' },
    'Plateau':        { col: [134, 148, 102],soil: 'Laterite Crust',      bedrock: 'Shale' },
    'Canyon':         { col: [160, 110, 52], soil: 'Scree Sediment',      bedrock: 'Sandstone' },
    'Ridge':          { col: [118, 118, 138],soil: 'Rocky Regolith',      bedrock: 'Quartzite' },
    'Highland':       { col: [122, 128, 112],soil: 'Coarse Soil',         bedrock: 'Schist' },
    'Mountain':       { col: [88, 88, 112],  soil: 'Alpine Scree',        bedrock: 'Granite' },
    'Snowcap':        { col: [215, 222, 234],soil: 'Glacial Moraine',     bedrock: 'Granite' },
    'Volcano':        { col: [96, 28, 18],   soil: 'Volcanic Ash',        bedrock: 'Obsidian' },
    'Lava Field':     { col: [200, 50, 10],  soil: 'Fresh Lava Crust',    bedrock: 'Obsidian' },
    'Trench':         { col: [6, 12, 30],    soil: 'Hadal Ooze',          bedrock: 'Peridotite' },
    'River':          { col: [58, 148, 180], soil: 'Riparian Silt',       bedrock: 'Limestone' },
    'Lake':           { col: [60, 120, 170], soil: 'Lacustrine Clay',     bedrock: 'Limestone' },
    'Crater Lake':    { col: [40, 100, 148], soil: 'Hydrothermal Crust',  bedrock: 'Obsidian' },
};

// ── POI Types ─────────────────────────────────────────────────────────────────
const POI_TYPES = [
    { id:'crypt',   icon:'⚰️', name:'Ancient Tomb',         desc:'Sealed burial halls radiating necrotic energy. Undead guardians prowl forgotten corridors.',                       theme:'crypt',   biomes:['Highland','Mountain','Plateau','Canyon'] },
    { id:'keep',    icon:'🏰', name:'Ruined Fortress',       desc:'Crumbling battlements of a long-fallen dynasty. Mercenaries and warlords now contest its walls.',               theme:'stone',   biomes:['Highland','Ridge','Mountain','Plateau'] },
    { id:'cave',    icon:'🌋', name:'Sulfur Caverns',        desc:'Geothermal steam vents laced with crystallized sulfur. Fire drakes nest in the deepest chambers.',              theme:'cavern',  biomes:['Volcano','Lava Field','Canyon','Desert'] },
    { id:'temple',  icon:'🏛️', name:'Sunken Temple',         desc:'Silt-smothered sanctuaries built for ancient gods. Strange glyphs pulse in the brackish water.',              theme:'temple',  biomes:['Swamp','Rainforest','Valley','River'] },
    { id:'mine',    icon:'⛏️', name:'Abandoned Mine',        desc:'A collapsed shaft network. Rich ore veins draw desperate delvers into unstable tunnels.',                      theme:'stone',   biomes:['Mountain','Ridge','Highland','Plateau'] },
    { id:'tower',   icon:'🗼', name:'Arcane Spire',          desc:'A toppled wizard\'s tower. Its topmost chamber hums with unstable magical resonance.',                         theme:'arcane',  biomes:['Grassland','Forest','Plateau','Savanna'] },
    { id:'ruins',   icon:'🏚️', name:'Lost Settlement',       desc:'Overgrown village ruins. The last inhabitants vanished overnight, leaving meals still on tables.',              theme:'crypt',   biomes:['Forest','Grassland','Rainforest','Swamp'] },
    { id:'shrine',  icon:'⛩️', name:'Elemental Shrine',      desc:'An ancient elemental node. Unpredictable magical surges reshape the environment around it.',                   theme:'arcane',  biomes:['Tundra','Mountain','Glacier','Snowcap'] },
    { id:'barrow',  icon:'🪨', name:'Ancient Barrow Mound',  desc:'A mass burial site for fallen warriors. Restless spirits demand tribute before permitting passage.',            theme:'crypt',   biomes:['Tundra','Grassland','Savanna','Highland'] },
    { id:'shipwreck',icon:'⚓', name:'Sunken Wreck',         desc:'A fleet-killer reef that claimed countless ships. Waterlogged holds conceal treasure and drowned crew.',       theme:'temple',  biomes:['Shallow Sea','River','Lake','Crater Lake'] },
    { id:'labyrinth',icon:'🌀', name:'Stone Labyrinth',      desc:'An impossible geometric maze carved into bedrock. Its architect has been dead for three thousand years.',       theme:'stone',   biomes:['Desert','Dune Sea','Canyon','Plateau'] },
    { id:'outpost', icon:'🏕️', name:'Forgotten Outpost',     desc:'Military watchpost long since abandoned. Supply caches and old orders are still inside.',                      theme:'stone',   biomes:['Savanna','Shrubland','Taiga','Tundra'] },
];

// ── World Engine ─────────────────────────────────────────────────────────────
class WorldEngine {
    constructor(seed, sizeMode, coreType, tectonics, atmosphere, climate) {
        this.seed       = seed;
        this.rng        = new RNG(seed);
        this.sizeMode   = sizeMode;
        this.coreType   = coreType;
        this.tectonics  = tectonics;
        this.atmosphere = atmosphere;
        this.climate    = climate;

        const W = sizeMode === 'small' ? 96 : sizeMode === 'large' ? 192 : 128;
        this.width  = W;
        this.height = Math.floor(W * 0.5);  // 2:1 equirectangular ratio

        this.nameGen = new NameGen(new RNG(seed + '_names'));
        this.grid    = [];
        this.nations = [];
        this.cities  = [];
        this.pois    = [];

        this.atmosphereLayers = [
            { name:'Troposphere',   alt:'0–12 km',        desc:'The weather layer. Contains 75% of atmospheric mass. All weather phenomena occur here.',             temp:'+15°C to −57°C',  pressure:'1.0–0.1 atm' },
            { name:'Stratosphere',  alt:'12–50 km',       desc:'Dry and stable. The ozone layer shields the surface from ultraviolet radiation.',                   temp:'−57°C to −3°C',   pressure:'0.1–0.001 atm' },
            { name:'Mesosphere',    alt:'50–85 km',       desc:'The coldest atmospheric layer. Incoming meteors incandesce and burn up here.',                      temp:'−3°C to −90°C',   pressure:'0.001–0.00001 atm' },
            { name:'Thermosphere',  alt:'85–600 km',      desc:'Ionosphere sub-layer. Solar radiation excites gas particles, creating polar auroras.',              temp:'−90°C to +2500°C',pressure:'Trace' },
            { name:'Exosphere',     alt:'600–10,000 km',  desc:'The outermost atmospheric boundary. Gas molecules escape into interplanetary space here.',          temp:'2500°C (molecular)',pressure:'Near-vacuum' },
            { name:'Magnetosphere', alt:'10,000–60,000 km',desc:'Magnetic field generated by the planetary core. Deflects solar wind and cosmic radiation.',       temp:'Stellar ambient', pressure:'Vacuum' },
        ];

        this.coreLayers = [
            { name:'Crust',          thickness:'5–70 km',        composition:'Silicate rocks (Basalt, Granite, Andesite)',                      state:'Solid',                    temp:'Surface to 900°C' },
            { name:'Lithosphere',    thickness:'80–150 km',      composition:'Brittle crust and rigid upper mantle fused together',              state:'Rigid Solid',              temp:'900–1,200°C' },
            { name:'Asthenosphere',  thickness:'180–250 km',     composition:'Partially molten ductile silicate rock enabling plate motion',     state:'Plastic / Semi-fluid',     temp:'1,200–1,400°C' },
            { name:'Mantle',         thickness:'2,890 km',       composition:'Magnesium-iron silicates (Peridotite, Pyroxenite)',                state:'Viscous Solid / Convecting',temp:'1,400–3,700°C' },
            { name:'Outer Core',     thickness:'2,200 km',       composition:this._coreCompositionName() + ' (liquid)',                          state:'Molten Liquid (Dynamo)',   temp:'3,700–5,000°C' },
            { name:'Inner Core',     thickness:'1,280 km radius',composition:this._coreCompositionName() + ' (crystalline)',                     state:'Crystalline Solid',        temp:'5,000–6,000°C' },
        ];

        this.generate();
    }

    _coreCompositionName() {
        const m = { 'iron-nickel':'Iron-Nickel Alloy', 'silicate':'Silicate Oxide Matrix',
                    'gold-molten':'Molten Heavy Metals (Au, Pt, U)', 'crystal':'Volatile Energy Crystal' };
        return m[this.coreType] || 'Iron-Nickel Alloy';
    }

    // ── Main Generation Pipeline ─────────────────────────────────────────────
    generate() {
        const noiseA = new GradientNoise2D(new RNG(this.seed + '_A'));
        const noiseB = new GradientNoise2D(new RNG(this.seed + '_B'));
        const noiseM = new GradientNoise2D(new RNG(this.seed + '_M'));
        const noiseT = new GradientNoise2D(new RNG(this.seed + '_T'));

        const W = this.width, H = this.height;

        // ── 1. Heightmap with domain-warped FBM ────────────────────────────
        const rawH = new Float32Array(W * H);
        let hMin = Infinity, hMax = -Infinity;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const nx = x / W * 3;
                const ny = y / H * 1.5;
                let h = noiseA.warpedFbm(nx, ny, 6);
                // Push towards poles for icecap bias
                const latFrac = Math.abs((y / H) - 0.5) * 2;  // 0 at equator, 1 at pole
                h -= latFrac * latFrac * 0.25;
                rawH[y * W + x] = h;
                if (h < hMin) hMin = h;
                if (h > hMax) hMax = h;
            }
        }
        // Normalize to 0..1
        const hRange = hMax - hMin;
        const heightMap = new Float32Array(W * H);
        for (let i = 0; i < W * H; i++) heightMap[i] = (rawH[i] - hMin) / hRange;

        // Tectonic enhancement
        if (this.tectonics === 'active') {
            for (let i = 0; i < W * H; i++) {
                const h = heightMap[i];
                // Sharpen midpoints — creates steeper mountains and deeper trenches
                if (h > 0.55) heightMap[i] = Math.min(1, 0.55 + (h - 0.55) * 1.8);
                if (h < 0.4)  heightMap[i] = Math.max(0, 0.4 - (0.4 - h) * 1.6);
            }
        }

        // ── 2. Climate Maps ───────────────────────────────────────────────
        const climateOffset = { balanced: 0, frozen: -12, desolate: 8, volcanic: 18 };
        const moistureScale = { balanced: 1, frozen: 0.55, desolate: 0.35, volcanic: 0.7 };
        const dT = climateOffset[this.climate] || 0;
        const dM = moistureScale[this.climate] || 1;

        // ── 3. Build Grid Cells ────────────────────────────────────────────
        this.grid = [];
        for (let y = 0; y < H; y++) {
            const row = [];
            for (let x = 0; x < W; x++) {
                const h = heightMap[y * W + x];
                const latDeg = ((H / 2 - y) / (H / 2)) * 90;   // +90 N → -90 S
                const lonDeg = ((x / W) - 0.5) * 360;

                const latAbs = Math.abs(latDeg);

                // Temperature: equator warm, poles cold, altitude cools
                const altCool  = h > 0.5 ? (h - 0.5) * 55 : 0;
                const baseTemp = 30 - latAbs * 0.72 + dT - altCool;

                // Moisture from noise, modified by climate
                const rawMoist = (noiseM.fbm(x / W * 5, y / H * 5, 4) + 1) / 2;
                // Hadley cells: wet at equator and ~60°, dry at ~30° (trade wind deserts)
                const hadley   = Math.sin((latAbs / 90) * Math.PI * 3) * 0.15;
                let moisture   = Math.max(0, Math.min(1, rawMoist + hadley)) * dM;

                // Wind shadow: high terrain blocks moisture
                if (h > 0.65) moisture *= 0.6;

                const aquifer = Math.max(5, Math.floor(moisture * 180 - (h > 0.65 ? 50 : 0)));

                row.push({
                    x, y,
                    lat: latDeg.toFixed(1),
                    lon: lonDeg.toFixed(1),
                    height: h,
                    temp: Math.round(baseTemp),
                    moisture: Math.round(moisture * 100),
                    aquifer,
                    biome: 'Ocean',
                    liquid: 'None',
                    soil: 'Silicate Mud',
                    bedrock: 'Basalt',
                    magmaPct: Math.round(h * 60 + (this.climate === 'volcanic' ? 35 : 0)),
                    nationId: -1,
                    city: null,
                    poi: null,
                    isRiver: false,
                    isLake: false,
                });
            }
            this.grid.push(row);
        }

        // ── 4. Biome Classification ──────────────────────────────────────
        this._classifyBiomes();

        // ── 5. Hydrology (Rivers & Lakes) ────────────────────────────────
        this._runHydrology();

        // ── 6. Nations & Cities ───────────────────────────────────────────
        this._buildPolitics();

        // ── 7. Points of Interest ─────────────────────────────────────────
        this._scatterPOIs();
    }

    _classifyBiomes() {
        const W = this.width, H = this.height;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const s = this.grid[y][x];
                const { height: h, temp, moisture: m } = s;
                let biome;

                // ── Ocean / Sea ──
                if (h < 0.36) { biome = 'Deep Ocean'; }
                else if (h < 0.45) { biome = 'Ocean'; }
                else if (h < 0.49) { biome = 'Shallow Sea'; }
                else {
                    // ── Land ──
                    if (temp < -20) {
                        biome = (h > 0.7) ? 'Glacier' : 'Ice Cap';
                    } else if (temp < -5) {
                        biome = (m > 45) ? 'Tundra' : 'Glacier';
                    } else if (h > 0.88) {
                        biome = (this.climate === 'volcanic' || temp > 15) ? 'Lava Field' : 'Snowcap';
                    } else if (h > 0.80) {
                        biome = (temp < 2) ? 'Snowcap' : 'Volcano';
                    } else if (h > 0.72) {
                        biome = (temp < 4) ? 'Snowcap' : 'Mountain';
                    } else if (h > 0.63) {
                        biome = 'Highland';
                    } else if (h > 0.58) {
                        if (m < 18) biome = 'Canyon';
                        else biome = 'Plateau';
                    } else if (h > 0.52) {
                        if (m < 15) biome = (this.rng.next() > 0.4) ? 'Dune Sea' : 'Desert';
                        else if (m < 30) biome = 'Shrubland';
                        else if (temp < 2) biome = 'Taiga';
                        else if (temp < 10) biome = 'Highland';
                        else biome = 'Valley';
                    } else {
                        // Low-lying land 0.49..0.52
                        if (m < 12) biome = 'Desert';
                        else if (m < 20) biome = (temp > 24) ? 'Savanna' : 'Shrubland';
                        else if (m < 35) biome = (temp > 22) ? 'Savanna' : 'Grassland';
                        else if (temp > 24 && m > 70) biome = 'Rainforest';
                        else if (temp > 18 && m > 55) biome = (this.rng.next() > 0.6) ? 'Swamp' : 'Rainforest';
                        else if (temp < 4 && m > 50) biome = 'Taiga';
                        else if (m > 50) biome = 'Forest';
                        else biome = 'Grassland';
                    }
                }

                s.biome = biome;
                const info = BIOMES[biome] || BIOMES['Ocean'];
                s.soil    = info.soil;
                s.bedrock = info.bedrock;
                s.liquid  = biome.includes('Ocean') || biome.includes('Sea') ? biome : 'None';
            }
        }
    }

    _isLand(s) {
        return s.height >= 0.49 && !['Deep Ocean','Ocean','Shallow Sea'].includes(s.biome);
    }

    _runHydrology() {
        const W = this.width, H = this.height;
        const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

        // Rivers originate from mountains/highlands and flow to sea
        const numRivers = Math.floor(W * 0.08);
        for (let i = 0; i < numRivers; i++) {
            let rx = this.rng.int(0, W - 1);
            let ry = this.rng.int(0, H - 1);
            // Try to start from higher elevation
            for (let t = 0; t < 10; t++) {
                const tx = this.rng.int(0, W - 1), ty = this.rng.int(0, H - 1);
                if (this.grid[ty][tx].height > this.grid[ry][rx].height) { rx = tx; ry = ty; }
            }
            let steps = 0, stagnant = 0;
            while (steps < 120 && stagnant < 4) {
                const s = this.grid[ry][rx];
                if (!this._isLand(s)) break;
                s.isRiver = true;
                s.liquid  = 'River';

                let best = null, bestH = s.height;
                for (const [dx, dy] of dirs) {
                    const nx = (rx + dx + W) % W;
                    const ny = Math.max(0, Math.min(H - 1, ry + dy));
                    if (this.grid[ny][nx].height < bestH) {
                        bestH = this.grid[ny][nx].height;
                        best  = [nx, ny];
                    }
                }
                if (best) { [rx, ry] = best; stagnant = 0; }
                else { s.isLake = true; s.liquid = 'Lake'; s.biome = (s.biome === 'Crater Lake') ? 'Crater Lake' : 'Lake'; stagnant++; }
                steps++;
            }
        }
    }

    _buildPolitics() {
        const W = this.width, H = this.height;
        const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
        const numNations = this.rng.int(5, 9);
        const palettes = [
            '#66bb66','#6699cc','#e07a5f','#f2cc8f','#95d5b2',
            '#c77dff','#f4a261','#48cae4','#e63946','#2dc653',
        ];
        this.rng.shuffle(palettes);

        // Generate nations
        for (let i = 0; i < numNations; i++) {
            const capName = this.nameGen.capital();
            this.nations.push({
                name: this.nameGen.nation(),
                color: palettes[i % palettes.length],
                capital: capName,
                id: i,
            });
        }

        // Plant capitals
        const queue = [];
        for (let i = 0; i < numNations; i++) {
            let cx = 0, cy = 0, found = false;
            for (let att = 0; att < 500; att++) {
                cx = this.rng.int(0, W - 1);
                cy = this.rng.int(0, H - 1);
                const s = this.grid[cy][cx];
                if (!this._isLand(s)) continue;
                if (['Mountain','Snowcap','Ice Cap','Glacier','Volcano','Lava Field','Deep Ocean','Ocean','Shallow Sea'].includes(s.biome)) continue;
                // Not already claimed
                if (s.nationId !== -1) continue;
                // Prefer near water
                let nearWater = false;
                for (const [dx, dy] of dirs) {
                    const nx = (cx + dx + W) % W;
                    const ny = Math.max(0, Math.min(H - 1, cy + dy));
                    const nb = this.grid[ny][nx];
                    if (!this._isLand(nb) || nb.isRiver) nearWater = true;
                }
                if (nearWater || att > 300) { found = true; break; }
            }
            const s = this.grid[cy][cx];
            s.nationId = i;
            s.city = { name: this.nations[i].capital, isCapital: true, nationId: i, pop: this.rng.int(30000, 500000) };
            this.cities.push({ name: this.nations[i].capital, x: cx, y: cy, nationId: i, isCapital: true, pop: s.city.pop });
            queue.push({ x: cx, y: cy, nationId: i, cost: 0 });
        }

        // Priority-queue BFS (Voronoi-like with terrain cost)
        queue.sort((a, b) => a.cost - b.cost);
        while (queue.length > 0) {
            const curr = queue.shift();
            for (const [dx, dy] of dirs) {
                const nx = (curr.x + dx + W) % W;
                const ny = Math.max(0, Math.min(H - 1, curr.y + dy));
                const s  = this.grid[ny][nx];
                if (!this._isLand(s) || s.nationId !== -1) continue;
                // Mountains are harder to cross
                const cost = curr.cost + 1 + (s.height > 0.72 ? 8 : 0) + (s.isRiver ? 0.5 : 0);
                s.nationId = curr.nationId;
                queue.push({ x: nx, y: ny, nationId: curr.nationId, cost });
                queue.sort((a, b) => a.cost - b.cost);
            }
        }

        // Scatter regional towns
        const numTowns = Math.floor(W * 0.12);
        for (let i = 0; i < numTowns; i++) {
            const cx = this.rng.int(0, W - 1);
            const cy = this.rng.int(0, H - 1);
            const s  = this.grid[cy][cx];
            if (!this._isLand(s) || s.city || ['Mountain','Snowcap','Ice Cap','Glacier','Volcano','Lava Field'].includes(s.biome)) continue;
            const name = this.nameGen.city();
            const pop  = this.rng.int(500, 40000);
            s.city = { name, isCapital: false, nationId: s.nationId, pop };
            this.cities.push({ name, x: cx, y: cy, nationId: s.nationId, isCapital: false, pop });
        }
    }

    _scatterPOIs() {
        const W = this.width, H = this.height;
        const numPOIs = Math.floor(W * 0.06);
        this.pois = [];

        for (let i = 0; i < numPOIs; i++) {
            let px = 0, py = 0, s, att = 0;
            while (att < 200) {
                px = this.rng.int(0, W - 1);
                py = this.rng.int(0, H - 1);
                s  = this.grid[py][px];
                if (this._isLand(s) && !s.city && !s.poi) break;
                att++;
            }
            if (!s || !this._isLand(s)) continue;

            // Find best matching POI type for this biome
            const candidates = POI_TYPES.filter(p => p.biomes.includes(s.biome));
            const poiType = candidates.length > 0 ? this.rng.pick(candidates) : this.rng.pick(POI_TYPES);
            const poiName = poiType.icon + ' ' + poiType.name;

            s.poi = {
                type:  poiType.id,
                icon:  poiType.icon,
                label: poiType.name,
                name:  poiName,
                desc:  poiType.desc,
                theme: poiType.theme,
                seed:  `world_${this.seed}_${px}_${py}`,
            };
            this.pois.push({ ...s.poi, x: px, y: py });
        }
    }
}

// ── Renderer ─────────────────────────────────────────────────────────────────
class WorldVisualizer {
    constructor() {
        this.canvas    = document.getElementById('worldCanvas');
        this.ctx       = this.canvas.getContext('2d');
        this.container = document.getElementById('worldCanvasContainer');
        this.inspector = document.getElementById('worldInspectorContent');

        this.viewMode    = 'surface';
        this.selectedTile= null;
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
        this.showPolitical = false;
        this.showCities    = true;
        this.showPOIs      = true;

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

        this.inp_seed.value = Math.floor(Math.random() * 999999).toString();
    }

    _regenerate() {
        const seed = this.inp_seed.value || String(Math.random());
        this.world = new WorldEngine(
            seed,
            this.sel_size.value,
            this.sel_core.value,
            this.sel_tect.value,
            this.sel_atm.value,
            this.sel_clim.value,
        );
        this._surfaceCache = null;  // invalidate cache
        this.selectedTile  = this.world.grid[Math.floor(this.world.height / 2)][Math.floor(this.world.width / 2)];
        this._resetCamera();
        this._resizeCanvas();
        this._updateInspector();
        this._showToast('🌍 World forged — seed: ' + seed);
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
        this.btn_forge.addEventListener('click', () => this._regenerate());
        this.chk_pol.addEventListener('change',  () => { this.showPolitical = this.chk_pol.checked; this._surfaceCache = null; this._draw(); });
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

        // Political overlay
        if (this.showPolitical) {
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const s = this.world.grid[y][x];
                    if (s.nationId !== -1) {
                        const col = this.world.nations[s.nationId].color;
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
                for (let x = 0; x < W; x++) {
                    const s = this.world.grid[y][x];
                    for (const [dx, dy] of dirs) {
                        const nx = (x + dx + W) % W, ny = Math.min(H - 1, y + dy);
                        const nb = this.world.grid[ny][nx];
                        if (s.nationId !== nb.nationId && (s.nationId !== -1 || nb.nationId !== -1)) {
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
                // Diamond
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
        for (let iy = 0; iy < ph; iy++) {
            const ty = Math.floor(iy / ph * H);
            for (let ix = 0; ix < pw; ix++) {
                const tx = Math.floor(ix / pw * W);
                const s  = this.world.grid[ty][tx];
                const info = BIOMES[s.biome] || BIOMES['Ocean'];
                let [r, g, b] = info.col;

                // Height-based shading (hillshade)
                const shade = 0.75 + s.height * 0.5;
                r = Math.min(255, Math.round(r * shade));
                g = Math.min(255, Math.round(g * shade));
                b = Math.min(255, Math.round(b * shade));

                // River tint override
                if (s.isRiver) { r = 58; g = 148; b = 180; }

                const idx = (iy * pw + ix) * 4;
                data[idx]   = r;
                data[idx+1] = g;
                data[idx+2] = b;
                data[idx+3] = 255;
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
        const x0 = 14, y0 = this.canvas.height - 14 - items.length * 16;
        ctx.fillStyle = 'rgba(10,11,14,0.72)';
        ctx.fillRect(x0 - 6, y0 - 10, 130, items.length * 16 + 14);
        ctx.font = '10px Share, sans-serif';
        items.forEach((it, i) => {
            const y = y0 + i * 16;
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

        // Radii
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

        // Atmosphere rings (outer to inner)
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

        // Surface ring (shows actual surface biome colors as a thin ring with texture)
        const N = this.world.width;
        for (let i = 0; i < N; i++) {
            const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
            const tx = Math.floor(i);
            const ty = Math.floor(this.world.height / 2);  // equatorial strip
            const s  = this.world.grid[ty][tx];
            const info = BIOMES[s.biome] || BIOMES['Ocean'];
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

        // Crust (silicate grey)
        ctx.fillStyle = '#7a6a6a';
        ctx.beginPath(); ctx.arc(cx, cy, R.crust, 0, Math.PI*2); ctx.fill();

        // Lithosphere (dark grey)
        ctx.fillStyle = '#4a4040';
        ctx.beginPath(); ctx.arc(cx, cy, R.litho, 0, Math.PI*2); ctx.fill();

        // Asthenosphere (dark red ductile)
        const asGrad = ctx.createRadialGradient(cx, cy, R.astheno * 0.9, cx, cy, R.astheno);
        asGrad.addColorStop(0, '#6e1a1a'); asGrad.addColorStop(1, '#3a0f0f');
        ctx.fillStyle = asGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.astheno, 0, Math.PI*2); ctx.fill();

        // Mantle (molten orange-red gradient)
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

        // Inner core (bright solid crystalline)
        const icGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R.innerCore);
        icGrad.addColorStop(0, '#ffffff');
        icGrad.addColorStop(0.4, cCore);
        icGrad.addColorStop(1, this._adjustBrightness(cCore, -40));
        ctx.fillStyle = icGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R.innerCore, 0, Math.PI*2); ctx.fill();

        // Layer separation lines
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        for (const r of Object.values(R)) {
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        }

        // Labels
        ctx.fillStyle = '#e5e0c3';
        ctx.font = `${Math.max(9, 11 * S)}px 'Share', sans-serif`;
        ctx.textAlign = 'left';
        const lx = cx + R.magneto * 0.72;
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

            // Gradient fill
            const grad = ctx.createLinearGradient(colX, curY, colX + colW, curY + lh);
            grad.addColorStop(0,   `rgba(${r+15},${g+10},${b+10},${a})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
            grad.addColorStop(1,   `rgba(${Math.max(0,r-20)},${Math.max(0,g-15)},${Math.max(0,b-15)},${a})`);
            ctx.fillStyle = grad;
            ctx.fillRect(colX, curY, colW, lh);

            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
            ctx.strokeRect(colX, curY, colW, lh);

            // Layer text
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(9, 11 * Math.min(this.scale, 1.5))}px 'Share', sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
            ctx.fillText(lyr.label, colX + colW / 2, curY + lh / 2 + 4);
            ctx.shadowBlur = 0;

            // Left horizon label
            ctx.fillStyle = '#ffd166';
            ctx.font = `${Math.max(8, 10 * Math.min(this.scale, 1.5))}px 'Share', sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(`⟵ ${lyr.soil}`, colX - 6, curY + lh / 2 + 4);

            this._profileLayers.push({ y1: curY, y2: curY + lh, x1: colX, x2: colX + colW,
                name: lyr.label, desc: lyr.soil });
            curY += lh;
        }

        // Depth ruler on right side
        let depthM = 0;
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
            const biomeInfo = BIOMES[tile.biome] || BIOMES['Ocean'];
            const isOcean = ['Deep Ocean','Ocean','Shallow Sea'].includes(tile.biome);

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

            if (!isOcean) {
                html += `<div class="inspector-section">
                    <h4>Political Territory</h4>`;
                if (nation) {
                    const [nr, ng, nb] = this._hexToRgbArr(nation.color);
                    html += `<p>🏴 <strong>${nation.name}</strong></p>
                    <div style="width:100%;height:4px;border-radius:2px;background:${nation.color};margin:4px 0;opacity:0.85;"></div>`;
                } else {
                    html += `<p style="color:var(--text-secondary)">🌿 Unclaimed Wilderness</p>`;
                }
                if (tile.city) {
                    html += `<p>${tile.city.isCapital ? '🏛️' : '🏘️'} <strong>${tile.city.name}</strong> ${tile.city.isCapital ? '(Capital)' : '(Town)'}`;
                    if (tile.city.pop) html += ` — pop. ${tile.city.pop.toLocaleString()}`;
                    html += `</p>`;
                }
                html += `</div>`;
            }

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

    // ── Toast ─────────────────────────────────────────────────────────────────
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new WorldVisualizer();
});
