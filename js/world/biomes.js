import { RNG } from './utils.js';

export const BIOME_KEYS = [
    'Deep Ocean', 'Ocean', 'Shallow Sea', 'Coral Reef', 'Kelp Forest',
    'Ice Cap', 'Tundra', 'Glacier', 'Alpine Meadow', 'Taiga',
    'Forest', 'Temperate Rainforest', 'Grassland', 'Steppe', 'Shrubland',
    'Swamp', 'Mangrove Swamp', 'Plateau', 'Valley', 'Canyon',
    'Mesa', 'Desert', 'Dune Sea', 'Oasis', 'Highland',
    'Ridge', 'Mountain', 'Snowcap', 'Volcano', 'Lava Field',
    'Ash Wastes', 'Trench', 'Lake', 'Crater Lake',
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

// ── Terrain-Relatable Hook Library ───────────────────────────────────────────
const AQUATIC_HOOKS = [
    "A ghost ship was spotted sailing under full sail with no crew visible on deck.",
    "A legendary pearl of giant size is said to rest in the maw of a giant clam at the bottom of the reef.",
    "Deep-sea thermal vents have begun boiling the surrounding waters, driving aggressive marine beasts shoreward.",
    "Local fishermen report their nets are being slashed from below by organized, weapon-wielding creatures.",
    "A cargo ship carrying royal gold foundered on a reef. The salvage rights are being sold cheaply.",
    "Bizarre, glowing lights have begun rising from the deep ocean trenches at midnight.",
    "An underwater gate containing glyphs of the deep sea has begun pulsing with cyan energy.",
    "Brackish currents carry warning notes inside sealed bottles, written by a drowned captain.",
    "Merfolk are offering a wealth of coral gems to land adventurers who can rid their reef of a nesting hydra.",
    "An ancient tidal wave monument has cracked, and local sea levels are beginning to rise abnormally."
];

const ARID_HOOKS = [
    "A sudden sandstorm uncovered the tip of an obsidian obelisk that has been buried for ages.",
    "A wealthy merchant's trade caravan vanished completely between two oases, leaving only footprints.",
    "Nomads warn of a shifting mirage that mimics a traveler's deepest desires to lure them into the deep desert.",
    "An ancient sandstone temple has opened, but it is guarded by mechanical soldiers powered by sun-gems.",
    "Outlaws are using the rugged mesas and canyons to stage raids on travelers before retreating to hidden caves.",
    "The central spring of the local oasis has turned pitch black and tastes of ash and sulfur.",
    "A skeleton wearing royal armor was found clutching a map to the legendary Lost City of Brass.",
    "Giants are reported to be rolling huge boulders down canyon passes to ambush treasure delvers.",
    "Nomads speak of the Dust Lord, an elemental spirit demanding tributes of gold to keep sandstorms calm.",
    "Vast deposits of fire-clay have been discovered in the badlands, drawing corporate miners and mercenaries."
];

const MOUNTAIN_HOOKS = [
    "A group of dwarf miners broke through into a volcanic cavern filled with sleeping drakes.",
    "Howling winds passing through the mountain ridges are carrying a melody that puts travelers to sleep.",
    "A local watchpost was crushed by a massive rockslide, and something large is heard digging in the rubble.",
    "A crystalline mineral vein has begun growing out of the stone face, humming with static electricity.",
    "High peak hermits report that the constellations are shifting only when viewed from the highest summit.",
    "Slumbering lava tubes have begun venting toxic sulfur gas, poisoning the alpine valleys below.",
    "A ruined stone fortress perched on a sheer cliffside is rumored to contain a working sky-ship dock.",
    "Frost giants have established a tribute checkpoint at the main mountain pass, blocking all trade.",
    "A griffin nest holds a stolen royal signet ring, and the king is offering a knighthood for its recovery.",
    "Ancient tectonic shrines are shifting, causing localized earthquakes and opening deep fissures in the bedrock."
];

const WOODLAND_HOOKS = [
    "The druids of the ancient forest circle have gone missing, leaving behind half-completed warding circles.",
    "A massive, hollow redwood tree is rumored to hide the entrance to a forgotten subterranean library.",
    "A thick, greenish mist is creeping out of the fens, causing local wildlife to grow aggressive.",
    "Tangled briars have grown overnight, completely blocking the logging roads and cutting off the village.",
    "Outlaws have established a hidden treehouse village, using bows and traps to keep guards out.",
    "Bizarre blue mushrooms have sprouted, glowing softly and releasing spores that cause vivid hallucinations.",
    "A dryad is pleading with travelers to stop a corrupting blight eating away at the forest's heart-tree.",
    "Deepwood rangers report discovering giant cocoons hanging from the canopy of the pine valley.",
    "The scent of ozone and burning wood fills the air as local trees appear to bleed glowing golden sap.",
    "An ancient burial mound in the forest has been cracked open, and spectral riders are patrolling the paths."
];

const COLD_HOOKS = [
    "A hunter discovered a frozen expedition camp where the explorers were turned into solid ice statues.",
    "Yeti tracks have been spotted near the alpine sheep pastures, larger than any seen before.",
    "A massive glacier has cracked, revealing a perfectly preserved ancient warship embedded in the ice.",
    " Freezing blizzards have begun carrying whispers that call out the names of those lost in the snow.",
    "Ice spires that glow with a cold blue light are slowly rising from the tundra, draining warmth.",
    "A group of researchers went missing while studying anti-magic ice crystals in the polar caps.",
    "A frozen cave contains a warm spring that has kept a tiny, tropical valley alive amidst the tundra.",
    "A frost wolf pack led by a giant multi-tailed beast is hunting along the borders of the civilized lands.",
    "Fading runes on a frozen monolith warn of a trapped elemental entity that weakens as the ice melts.",
    "An ancient frozen barrow mound has begun thawing, releasing spirits of long-forgotten northern kings."
];

const PLAINS_HOOKS = [
    "A massive sinkhole opened in the middle of the grassland, revealing brick archways.",
    "Centaur clans are migrating early, claiming they are fleeing a shadow creeping from the valleys.",
    "Local farmers report their crops are growing in bizarre, swirling geometric patterns overnight.",
    "An ancient battlefield monument has begun weeping blood, attracting cultists and scavengers.",
    "A traveling wizard\'s wagon broke down, scattering magical scrolls that have animated local scarecrows.",
    "Nomadic herders report their cattle are being abducted by strange lights that descend from the night sky.",
    "A ruined guard tower contains a basement vault that can only be opened when the sun hits a certain angle.",
    "A local regional guild is hiring mercenaries to clear out giant burrowing beetles that are destroying pastures.",
    "Ancient standing stones are humming, causing horses and draft beasts to refuse to cross the plain.",
    "A massive flock of migratory birds has settled in the valley, refusing to move and attacking anyone who approaches."
];

const MAGICAL_HOOKS = [
    "Raw mana surges are creating anti-gravity pockets, causing boulders and trees to float.",
    "A tear in space-time has opened, showing a sky filled with unfamiliar stars and alien mountains.",
    "Glowing crystal structures are rapidly growing and encasing the landscape in resonant pink glass.",
    "Fey spirits are playing dangerous pranks on travelers, trapping them in loops of endless dancing.",
    "Shadows in this sector are detaching from their owners and acting with malicious intent.",
    "Bioluminescent vines have begun crawling over everything, draining magic from items and spells.",
    "A massive arcane tower fell from the sky, landing perfectly intact but locked from the inside.",
    "Charged ley-lines are sparking, turning normal rain into showers of sparkling, warm purple sparks.",
    "Resonant crystalline dust in the air is causing spellcasters to experience wild magic surges.",
    "Obsidian spires have erupted from the ground, crackling with raw dimensional energy."
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

    // Pick hooks based on category
    let hookLibrary = PLAINS_HOOKS;
    if (category === 'aquatic') hookLibrary = AQUATIC_HOOKS;
    else if (category === 'arid') hookLibrary = ARID_HOOKS;
    else if (category === 'mountain') hookLibrary = MOUNTAIN_HOOKS;
    else if (category === 'cold') hookLibrary = COLD_HOOKS;
    else if (category === 'magical') hookLibrary = MAGICAL_HOOKS;
    else if (category === 'woodland') hookLibrary = WOODLAND_HOOKS;

    if (city) {
        desc = `You enter the outskirts of ${city.name}, a bustling ${city.isCapital ? 'capital city' : 'regional settlement'} showing high activity. Patrols keep the main roads safe, though whispers of local friction are common.`;
        hooks = [
            `A merchant representative is hiring guards for a high-value cargo run through hazardous territory.`,
            `Rumors circulate in the local tavern that key officials are secretly allied with ${faction !== "None" ? faction : 'a covert guild of outlaws'}.`
        ];
    } else if (poi) {
        desc = `${poi.name}. ${poi.desc}. The surrounding environment is quiet, almost hushed with anticipation.`;
        hooks = [
            `A half-mad hermit warns that opening the inner chambers will trigger an ancient seal affecting the entire region.`,
            `Two rival groups are currently camped nearby, each planning an expedition to claim the secrets inside.`
        ];
    } else {
        desc = `A stretch of ${biome} terrain. Your senses register ${sight}. ${faction !== "None" ? `The territory is frequented by ${faction}.` : 'The area is quiet, seemingly untouched by civilization.'}`;
        
        hooks = [rng.pick(hookLibrary), rng.pick(hookLibrary)];
        while (hooks[0] === hooks[1]) {
            hooks[1] = rng.pick(hookLibrary);
        }
    }

    return { desc, hooks };
}
