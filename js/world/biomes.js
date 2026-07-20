import { RNG } from './utils.js';
import { generateSectorDescription, generateCityDescription, generateAdventureHooks } from './descriptionGenerator.js';

export const BIOME_KEYS = [
    'Deep Ocean', 'Ocean', 'Shallow Sea', 'Coral Reef', 'Kelp Forest',
    'Ice Cap', 'Tundra', 'Glacier', 'Alpine Meadow', 'Taiga',
    'Forest', 'Temperate Rainforest', 'Grassland', 'Steppe', 'Shrubland',
    'Swamp', 'Mangrove Swamp', 'Plateau', 'Valley', 'Canyon',
    'Mesa', 'Desert', 'Dune Sea', 'Oasis', 'Highland',
    'Ridge', 'Mountain', 'Snowcap', 'Volcano', 'Lava Field',
    'Ash Wastes', 'Trench', 'Lake', 'Alpine Lake', 'Crater Lake',
    // Magical Biomes
    'Crystal Fields', 'Mana Wastes', 'Skyward Pillars', 'Bioluminescent Jungle',
    'Astral Rift', 'Shadow Glade', 'Fey Wildwood', 'Obsidian Spireland'
];

export const BIOMES = {
    'Deep Ocean':     { col: [12, 24, 58],   soil: 'Abyssal Clay',        bedrock: 'Basalt' },
    'Ocean':          { col: [22, 54, 105],  soil: 'Marine Silicate Mud', bedrock: 'Basalt' },
    'Shallow Sea':    { col: [38, 92, 155],  soil: 'Fine Carbonate Sand',  bedrock: 'Limestone' },
    'Coral Reef':     { col: [15, 185, 177], soil: 'Coral Sand Sediment',  bedrock: 'Aragonite Reef' },
    'Kelp Forest':    { col: [18, 95, 110],  soil: 'Brackish Silt',        bedrock: 'Shale' },
    'Ice Cap':        { col: [230, 240, 255],soil: 'Frozen Regolith',     bedrock: 'Glacial Till' },
    'Tundra':         { col: [168, 196, 180],soil: 'Permafrost Peat',     bedrock: 'Granite' },
    'Glacier':        { col: [190, 220, 245],soil: 'Compacted Ice',       bedrock: 'Glacial Till' },
    'Alpine Meadow':  { col: [125, 155, 115],soil: 'Alpine Turf',          bedrock: 'Slate' },
    'Taiga':          { col: [60, 104, 88],  soil: 'Podzol Soil',         bedrock: 'Granite' },
    'Forest':         { col: [52, 112, 48],  soil: 'Podsol Loam',         bedrock: 'Granite' },
    'Temperate Rainforest': { col: [15, 95, 75], soil: 'Acidic Forest Floor', bedrock: 'Sandstone' },
    'Grassland':      { col: [86, 148, 52],  soil: 'Humus-Rich Loam',     bedrock: 'Limestone' },
    'Steppe':         { col: [158, 168, 112],soil: 'Chestnut Soil',        bedrock: 'Siltstone' },
    'Shrubland':      { col: [140, 168, 82], soil: 'Sandy Loam',          bedrock: 'Sandstone' },
    'Swamp':          { col: [48, 88, 58],   soil: 'Peat Bog Mire',       bedrock: 'Shale' },
    'Mangrove Swamp': { col: [35, 75, 50],   soil: 'Anoxic Organic Mud',  bedrock: 'Basalt' },
    'Plateau':        { col: [134, 148, 102],soil: 'Laterite Crust',      bedrock: 'Shale' },
    'Valley':         { col: [68, 128, 60],  soil: 'Alluvial Clay',       bedrock: 'Limestone' },
    'Canyon':         { col: [160, 110, 52], soil: 'Scree Sediment',      bedrock: 'Sandstone' },
    'Mesa':           { col: [195, 115, 65], soil: 'Stony Regolith',      bedrock: 'Shale Layers' },
    'Desert':         { col: [210, 170, 80], soil: 'Aeolian Sand',        bedrock: 'Sandstone' },
    'Dune Sea':       { col: [230, 188, 70], soil: 'Shifting Dune Crest', bedrock: 'Sandstone' },
    'Oasis':          { col: [40, 175, 115], soil: 'Riparian Humus',      bedrock: 'Sandstone' },
    'Highland':       { col: [122, 128, 112],soil: 'Coarse Soil',         bedrock: 'Schist' },
    'Ridge':          { col: [118, 118, 138],soil: 'Rocky Regolith',      bedrock: 'Quartzite' },
    'Mountain':       { col: [88, 88, 112],  soil: 'Alpine Scree',        bedrock: 'Granite' },
    'Snowcap':        { col: [215, 222, 234],soil: 'Glacial Moraine',     bedrock: 'Granite' },
    'Volcano':        { col: [96, 28, 18],   soil: 'Volcanic Ash',        bedrock: 'Obsidian' },
    'Lava Field':     { col: [200, 50, 10],  soil: 'Fresh Lava Crust',    bedrock: 'Obsidian' },
    'Ash Wastes':     { col: [100, 95, 95],  soil: 'Volcanic Ash Deposits',bedrock: 'Basaltic Tuff' },
    'Trench':         { col: [6, 12, 30],    soil: 'Hadal Ooze',          bedrock: 'Peridotite' },
    'Lake':           { col: [60, 120, 170], soil: 'Lacustrine Clay',     bedrock: 'Limestone' },
    'Alpine Lake':    { col: [75, 145, 195], soil: 'Glacial Meltwater Silt',bedrock: 'Granite' },
    'Crater Lake':    { col: [40, 100, 148], soil: 'Hydrothermal Crust',  bedrock: 'Obsidian' },
    // Magical Biomes
    'Crystal Fields': { col: [0, 245, 212],  soil: 'Pulverized Quartz Dust', bedrock: 'Resonant Crystal Shards' },
    'Mana Wastes':    { col: [155, 93, 229], soil: 'Aetheric Ash',        bedrock: 'Charged Ley-Rock' },
    'Skyward Pillars':{ col: [142, 202, 230],soil: 'Looming Floating Soil',bedrock: 'Gravitite Ore' },
    'Bioluminescent Jungle': { col: [0, 150, 199], soil: 'Phosphorescent Humus', bedrock: 'Slick Basalt' },
    'Astral Rift':    { col: [40, 50, 90],   soil: 'Cosmic Stardust',      bedrock: 'Void Glass' },
    'Shadow Glade':   { col: [60, 60, 70],   soil: 'Umbric Humus',        bedrock: 'Dark Slate' },
    'Fey Wildwood':   { col: [255, 0, 110],  soil: 'Sparkling Spore Loam',bedrock: 'Polished Alabaster' },
    'Obsidian Spireland': { col: [45, 0, 76],soil: 'Vitreous Sand',       bedrock: 'Tectonically Warped Obsidian' },
};

export const POI_TYPES = [
    { id:'crypt',   icon:'⚰️', name:'Ancient Tomb',         desc:'Sealed burial halls radiating necrotic energy. Undead guardians prowl forgotten corridors.',                       theme:'crypt',   biomes:['Highland','Mountain','Plateau','Canyon','Mesa','Shadow Glade'] },
    { id:'keep',    icon:'🏰', name:'Ruined Fortress',       desc:'Crumbling battlements of a long-fallen dynasty. Mercenaries and warlords now contest its walls.',               theme:'stone',   biomes:['Highland','Ridge','Mountain','Plateau','Steppe'] },
    { id:'cave',    icon:'🌋', name:'Sulfur Caverns',        desc:'Geothermal steam vents laced with crystallized sulfur. Fire drakes nest in the deepest chambers.',              theme:'cavern',  biomes:['Volcano','Lava Field','Canyon','Desert','Obsidian Spireland'] },
    { id:'temple',  icon:'🏛️', name:'Sunken Temple',         desc:'Silt-smothered sanctuaries built for ancient gods. Strange glyphs pulse in the brackish water.',              theme:'temple',  biomes:['Swamp','Rainforest','Valley','River','Mangrove Swamp'] },
    { id:'mine',    icon:'⛏️', name:'Abandoned Mine',        desc:'A collapsed shaft network. Rich ore veins draw desperate delvers into unstable tunnels.',                      theme:'stone',   biomes:['Mountain','Ridge','Highland','Plateau'] },
    { id:'tower',   icon:'🗼', name:'Arcane Spire',          desc:'A toppled wizard\'s tower. Its topmost chamber hums with unstable magical resonance.',                         theme:'arcane',  biomes:['Grassland','Forest','Plateau','Savanna','Mana Wastes','Skyward Pillars'] },
    { id:'ruins',   icon:'🏚️', name:'Lost Settlement',       desc:'Overgrown village ruins. The last inhabitants vanished overnight, leaving meals still on tables.',              theme:'crypt',   biomes:['Forest','Grassland','Rainforest','Swamp','Temperate Rainforest'] },
    { id:'shrine',  icon:'⛩️', name:'Elemental Shrine',      desc:'An ancient elemental node. Unpredictable magical surges reshape the environment around it.',                   theme:'arcane',  biomes:['Tundra','Mountain','Glacier','Snowcap','Crystal Fields'] },
    { id:'barrow',  icon:'🪨', name:'Ancient Barrow Mound',  desc:'A mass burial site for fallen warriors. Restless spirits demand tribute before permitting passage.',            theme:'crypt',   biomes:['Tundra','Grassland','Savanna','Highland','Steppe'] },
    { id:'shipwreck',icon:'⚓', name:'Sunken Wreck',         desc:'A fleet-killer reef that claimed countless ships. Waterlogged holds conceal treasure and drowned crew.',       theme:'temple',  biomes:['Shallow Sea','River','Lake','Crater Lake','Coral Reef','Kelp Forest'] },
    { id:'labyrinth',icon:'🌀', name:'Stone Labyrinth',      desc:'An impossible geometric maze carved into bedrock. Its architect has been dead for three thousand years.',       theme:'stone',   biomes:['Desert','Dune Sea','Canyon','Plateau','Badlands'] },
    { id:'outpost', icon:'🏕️', name:'Forgotten Outpost',     desc:'Military watchpost long since abandoned. Supply caches and old orders are still inside.',                      theme:'stone',   biomes:['Savanna','Shrubland','Taiga','Tundra','Steppe'] },
    // Magical POIs
    { id:'crystal_cave', icon:'💎', name:'Crystal Cavern',   desc:'A cavern filled with humming, light-refracting crystals that hold raw magic.',                                  theme:'cavern',  biomes:['Crystal Fields','Mana Wastes','Skyward Pillars'] },
    { id:'fey_circle',   icon:'🍄', name:'Fey Ring',         desc:'A circle of glowing mushrooms. The boundary between the material world and fey realm is thin here.',          theme:'temple',  biomes:['Fey Wildwood','Bioluminescent Jungle','Shadow Glade'] },
    { id:'astral_rift',  icon:'🌌', name:'Astral Rift',      desc:'A tear in space-time glowing with cosmic stardust. Strange creatures occasionally slip through.',              theme:'arcane',  biomes:['Astral Rift','Mana Wastes'] },
];

// ── Procedural Description & Hook Generator ──────────────────────────────────
export function getProceduralHooks(x, y, biome, faction, city, poi, temp, height, seedString) {
    const rng = new RNG(seedString + `_hooks_${x}_${y}`);
    let desc = "";
    let hooks = [];

    // Sensory descriptions by category
    const sensorySights = {
        aquatic: [
            "shimmering turquoise waters refracting the sunlight",
            "dark, deep currents carrying kelp and remnants of sea life",
            "cresting white waves crashing against half-submerged reef peaks",
            "a quiet, glass-like water surface reflecting the vast sky above"
        ],
        arid: [
            "blistering heat waves dancing along the edge of orange dunes",
            "rugged red sandstone cliffs stratified with ages of dry dust",
            "bleached bones of a desert beast half-buried in dry sand",
            "wind-swept dust devils swirling across the barren mesa plains"
        ],
        mountain: [
            "jagged granite peaks rising aggressively into the thin clouds",
            "steep rocky scree slopes that shift precariously underfoot",
            "sheer obsidian cliffs shaped by ancient volcanic eruptions",
            "cliffs of solid granite offering a panoramic view of the lower lands"
        ],
        woodland: [
            "sunlight filtering in shafts through a dense canopy of ancient oaks",
            "damp green moss blanketing tree trunks and decaying logs",
            "thick curtains of hanging vines dripping with morning dew",
            "dense shrouds of silver mist hanging low in the dark pine valleys"
        ],
        cold: [
            "brilliant sheets of packed snow and glittering blue glacial ice",
            "howling freezing winds carving frozen patterns into the regolith",
            "stubborn patches of frosty moss protruding from the frozen peat",
            "pristine, untouched snowfields masking deep, dangerous crevasses"
        ],
        plains: [
            "endless fields of tall wind-swept grass rippling like waves",
            "rolling green hills stretching to the horizon under a bright sky",
            "patches of thorny shrubbery scattered along dry silt valleys",
            "fertile loam plains cut by small, clear streams"
        ],
        magical: [
            "humming, light-refracting crystal growths sprouting from the earth",
            "thin wisps of purple arcane energy crackling along the ground",
            "boulders and tree roots floating suspended inches above the ground",
            "phosphorescent flora glowing in hues of neon cyan, violet, and hot pink"
        ]
    };

    // Determine category
    let category = 'plains';
    if (biome.includes('Ocean') || biome.includes('Sea') || biome.includes('Reef') || biome.includes('Kelp') || biome.includes('Lake') || biome.includes('Trench')) {
        category = 'aquatic';
    } else if (biome === 'Desert' || biome === 'Dune Sea' || biome === 'Mesa' || biome === 'Canyon' || biome === 'Oasis' || biome === 'Badlands') {
        category = 'arid';
    } else if (biome === 'Mountain' || biome === 'Volcano' || biome === 'Lava Field' || biome === 'Ridge' || biome === 'Ash Wastes' || biome === 'Highland') {
        category = 'mountain';
    } else if (biome === 'Ice Cap' || biome === 'Glacier' || biome === 'Snowcap' || biome === 'Tundra' || biome === 'Alpine Meadow') {
        category = 'cold';
    } else if (biome === 'Crystal Fields' || biome === 'Mana Wastes' || biome === 'Skyward Pillars' || biome === 'Bioluminescent Jungle' || biome === 'Astral Rift' || biome === 'Shadow Glade' || biome === 'Fey Wildwood' || biome === 'Obsidian Spireland') {
        category = 'magical';
    } else if (biome === 'Forest' || biome === 'Temperate Rainforest' || biome === 'Swamp' || biome === 'Mangrove Swamp' || biome === 'Taiga') {
        category = 'woodland';
    }

    const sights = sensorySights[category];
    const sight = rng.pick(sights);

    if (city) {
        desc = generateCityDescription(rng, city.name, city.isCapital, faction);
        hooks = generateAdventureHooks(rng, 'city', category, faction, biome);
    } else if (poi) {
        desc = `${poi.name}. ${poi.desc}`;
        hooks = generateAdventureHooks(rng, poi.type, category, faction, biome);
    } else {
        desc = generateSectorDescription(rng, biome, sight, faction);
        hooks = generateAdventureHooks(rng, 'wilderness', category, faction, biome);
    }

    return { desc, hooks };
}
