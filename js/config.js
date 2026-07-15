// Theme details and accent colors
export const THEMES = {
    // Dungeon themes
    crypt: { hue: 262, name: "Forgotten Crypt" },
    stone: { hue: 210, name: "Underground Keep" },
    cavern: { hue: 25, name: "Volcanic Caves" },
    temple: { hue: 142, name: "Sunken Temple" },
    // Wilderness biomes
    forest: { hue: 142, name: "Sylvan Forest" },
    desert: { hue: 45, name: "Dune Sea" },
    swamp: { hue: 175, name: "Fey Swamp" },
    volcanic: { hue: 0, name: "Ashen Wastes" },
    crystal_depths: { hue: 195, name: "Crystal Depths" },
    mana_wastes: { hue: 275, name: "Mana Wastes" },
    whispering_fens: { hue: 120, name: "Whispering Fens" },
    badlands: { hue: 15, name: "Badlands" },
    oasis: { hue: 150, name: "Oasis Oasis" },
    coral_reef: { hue: 180, name: "Coral Reef" }
};

// Tile Types configuration
export const TILE_TYPES = {
    // General
    VOID: 0,
    
    // Wilderness (Surface)
    SURFACE_GRASS: 10,
    SURFACE_DIRT: 11,
    SURFACE_WATER: 12,
    SURFACE_SHALLOW_WATER: 13,
    SURFACE_TREE: 14,
    SURFACE_ROCK: 15,
    SURFACE_RUIN_WALL: 16,
    SURFACE_PATH: 17,
    SURFACE_ENTRANCE: 18,
    SURFACE_BRIDGE: 19,
    
    // Dungeon (Upper level)
    DUNGEON_WALL: 20,
    DUNGEON_FLOOR: 21,
    DUNGEON_ROOM: 22,
    DUNGEON_CORRIDOR: 23,
    DUNGEON_DOOR_CLOSED: 24,
    DUNGEON_DOOR_OPEN: 25,
    DUNGEON_STAIRS_DOWN: 26,
    DUNGEON_SECRET_DOOR: 27,
    DUNGEON_OBSTACLE: 28,
    DUNGEON_TORCH: 29,
    
    // Caverns (Lower level)
    CAVERN_WALL: 30,
    CAVERN_FLOOR: 31,
    CAVERN_STAIRS_UP: 32,
    CAVERN_WATER: 33,
    CAVERN_MUSHROOMS: 34,
    CAVERN_OBSTACLE: 35,
    CAVERN_TORCH: 36
};

// Colors for Canvas Renderer
export const TILE_COLORS = {
    [TILE_TYPES.VOID]: "#050608",
    
    // Surface Forest
    surface_forest: {
        [TILE_TYPES.SURFACE_GRASS]:         "#3a6b30",  // medium green
        [TILE_TYPES.SURFACE_DIRT]:          "#7a6045",  // warm brown
        [TILE_TYPES.SURFACE_WATER]:         "#1e5c82",  // deep blue
        [TILE_TYPES.SURFACE_SHALLOW_WATER]: "#3a8aad",  // bright teal
        [TILE_TYPES.SURFACE_TREE]:          "#1f4a18",  // dark forest
        [TILE_TYPES.SURFACE_ROCK]:          "#606870",  // mid grey
        [TILE_TYPES.SURFACE_RUIN_WALL]:     "#4a4d54",
        [TILE_TYPES.SURFACE_PATH]:          "#a08860",  // warm sand path
        [TILE_TYPES.SURFACE_ENTRANCE]:      "#9b4de0",  // vivid purple
        [TILE_TYPES.SURFACE_BRIDGE]:        "#7d5a38"
    },
    // Surface Desert
    surface_desert: {
        [TILE_TYPES.SURFACE_GRASS]:         "#b5a870",
        [TILE_TYPES.SURFACE_DIRT]:          "#d4c48a",
        [TILE_TYPES.SURFACE_WATER]:         "#2e7fa0",
        [TILE_TYPES.SURFACE_SHALLOW_WATER]: "#58aac8",
        [TILE_TYPES.SURFACE_TREE]:          "#6b7a50",
        [TILE_TYPES.SURFACE_ROCK]:          "#c49060",
        [TILE_TYPES.SURFACE_RUIN_WALL]:     "#a08a72",
        [TILE_TYPES.SURFACE_PATH]:          "#e8d8a8",
        [TILE_TYPES.SURFACE_ENTRANCE]:      "#e06025",
        [TILE_TYPES.SURFACE_BRIDGE]:        "#9a6a40"
    },
    // Surface Swamp
    surface_swamp: {
        [TILE_TYPES.SURFACE_GRASS]:         "#354832",
        [TILE_TYPES.SURFACE_DIRT]:          "#4a3e2c",
        [TILE_TYPES.SURFACE_WATER]:         "#1e3d30",
        [TILE_TYPES.SURFACE_SHALLOW_WATER]: "#2a6048",
        [TILE_TYPES.SURFACE_TREE]:          "#1a2e22",
        [TILE_TYPES.SURFACE_ROCK]:          "#3a4840",
        [TILE_TYPES.SURFACE_RUIN_WALL]:     "#3e4840",
        [TILE_TYPES.SURFACE_PATH]:          "#605040",
        [TILE_TYPES.SURFACE_ENTRANCE]:      "#10c88a",
        [TILE_TYPES.SURFACE_BRIDGE]:        "#503820"
    },
    // Surface Volcanic
    surface_volcanic: {
        [TILE_TYPES.SURFACE_GRASS]:         "#282224",
        [TILE_TYPES.SURFACE_DIRT]:          "#342b2b",
        [TILE_TYPES.SURFACE_WATER]:         "#c2280a",  // lava
        [TILE_TYPES.SURFACE_SHALLOW_WATER]: "#e05215",  // lava glow
        [TILE_TYPES.SURFACE_TREE]:          "#1c1818",
        [TILE_TYPES.SURFACE_ROCK]:          "#504040",
        [TILE_TYPES.SURFACE_RUIN_WALL]:     "#3a3030",
        [TILE_TYPES.SURFACE_PATH]:          "#6a5855",
        [TILE_TYPES.SURFACE_ENTRANCE]:      "#e8250a",
        [TILE_TYPES.SURFACE_BRIDGE]:        "#4a2518"
    },

    // Upper Dungeon Levels
    dungeon_crypt: {
        [TILE_TYPES.DUNGEON_WALL]:       "#1a1025",  // dark void-purple
        [TILE_TYPES.DUNGEON_FLOOR]:      "#130c1c",
        [TILE_TYPES.DUNGEON_ROOM]:       "#2d1f42",  // lighter purple room
        [TILE_TYPES.DUNGEON_CORRIDOR]:   "#1e1530",  // mid corridor
        [TILE_TYPES.DUNGEON_DOOR_CLOSED]:"#8c6038",
        [TILE_TYPES.DUNGEON_DOOR_OPEN]:  "#553820",
        [TILE_TYPES.DUNGEON_STAIRS_DOWN]:"#a060ff",
        [TILE_TYPES.DUNGEON_SECRET_DOOR]:"#2a1c38",
        [TILE_TYPES.DUNGEON_OBSTACLE]:   "#5a3f78",
        [TILE_TYPES.DUNGEON_TORCH]:      "#ffcc00"
    },
    dungeon_stone: {
        [TILE_TYPES.DUNGEON_WALL]:       "#252830",
        [TILE_TYPES.DUNGEON_FLOOR]:      "#141619",
        [TILE_TYPES.DUNGEON_ROOM]:       "#30363f",  // clearly lighter
        [TILE_TYPES.DUNGEON_CORRIDOR]:   "#22262e",
        [TILE_TYPES.DUNGEON_DOOR_CLOSED]:"#9a6840",
        [TILE_TYPES.DUNGEON_DOOR_OPEN]:  "#604028",
        [TILE_TYPES.DUNGEON_STAIRS_DOWN]:"#4090e8",
        [TILE_TYPES.DUNGEON_SECRET_DOOR]:"#3a3f4a",
        [TILE_TYPES.DUNGEON_OBSTACLE]:   "#7a5838",
        [TILE_TYPES.DUNGEON_TORCH]:      "#ffaa22"
    },
    dungeon_cavern: {
        [TILE_TYPES.DUNGEON_WALL]:       "#301a14",
        [TILE_TYPES.DUNGEON_FLOOR]:      "#1a0e08",
        [TILE_TYPES.DUNGEON_ROOM]:       "#3e2215",  // warm amber room
        [TILE_TYPES.DUNGEON_CORRIDOR]:   "#281610",
        [TILE_TYPES.DUNGEON_DOOR_CLOSED]:"#9a5a28",
        [TILE_TYPES.DUNGEON_DOOR_OPEN]:  "#603818",
        [TILE_TYPES.DUNGEON_STAIRS_DOWN]:"#ff6e00",
        [TILE_TYPES.DUNGEON_SECRET_DOOR]:"#4a2a1f",
        [TILE_TYPES.DUNGEON_OBSTACLE]:   "#703c28",
        [TILE_TYPES.DUNGEON_TORCH]:      "#ffaa00"
    },
    dungeon_temple: {
        [TILE_TYPES.DUNGEON_WALL]:       "#0e2018",
        [TILE_TYPES.DUNGEON_FLOOR]:      "#081510",
        [TILE_TYPES.DUNGEON_ROOM]:       "#183228",  // deep green room
        [TILE_TYPES.DUNGEON_CORRIDOR]:   "#101c16",
        [TILE_TYPES.DUNGEON_DOOR_CLOSED]:"#7a8a58",
        [TILE_TYPES.DUNGEON_DOOR_OPEN]:  "#506040",
        [TILE_TYPES.DUNGEON_STAIRS_DOWN]:"#00e882",
        [TILE_TYPES.DUNGEON_SECRET_DOOR]:"#1e3e30",
        [TILE_TYPES.DUNGEON_OBSTACLE]:   "#3a6040",
        [TILE_TYPES.DUNGEON_TORCH]:      "#5cff3d"
    },

    // Lower Caverns
    caverns: {
        [TILE_TYPES.CAVERN_WALL]:       "#181a1d",
        [TILE_TYPES.CAVERN_FLOOR]:      "#0e1012",
        [TILE_TYPES.CAVERN_STAIRS_UP]:  "#42cc8c",
        [TILE_TYPES.CAVERN_WATER]:      "#0e2030",
        [TILE_TYPES.CAVERN_MUSHROOMS]:  "#7a28a0",
        [TILE_TYPES.CAVERN_OBSTACLE]:   "#303540",
        [TILE_TYPES.CAVERN_TORCH]:      "#12d880"
    }
};

// Rooms Naming & Theme Matrices
export const ROOM_TEMPLATES = {
    crypt: {
        names: ["Sepulcher of Whispers", "The Ashen Mausoleum", "Bone King's Throneroom", "Gravekeeper's Sanctum", "Catacomb of the Penitent", "Mourning Chapel", "Plague Ossuary", "Embalming Chamber"],
        descriptions: [
            "Dust layers cover everything, and skulls line the walls like bricks in neat, morbid rows.",
            "Rows of stone sarcophagi dominate this chamber, their carved faces frozen in silent screams.",
            "A decaying velvet carpet leads to an iron throne composed of interlinked rib cages.",
            "The walls are pocketed with burial niches containing ancient wrappings and skeletal remnants.",
            "A cold chill clings to the damp air here; frost patterns snake slowly across the stone columns."
        ]
    },
    stone: {
        names: ["Iron Garrison", "The Great Barracks", "Dungeon Guardhouse", "Torture Dungeon", "Lord Marshal's Quarter", "Subterranean Armory", "The Dread Keep", "Watchtower Basement"],
        descriptions: [
            "Heavy chains and shackles hang rusted from the solid masonry walls.",
            "A large wooden table stands broken in the center, flanked by rotting oak chairs.",
            "Iron bars divide this room into cells, some containing ancient chains and iron maidens.",
            "Racks of weapon stands lie empty, covered in cobwebs and rust flakes.",
            "Crates of spoiled rations, moldy grain, and shattered barrels are stacked in the corners."
        ]
    },
    cavern: {
        names: ["Obsidian Grotto", "Magma Reservoir", "Smuggler's Crevice", "Dripping Abyss", "Fungal Chasm", "Echoing Gallery", "Cinder Hearth", "Crystal Hollow"],
        descriptions: [
            "Glistening crystals protrude from organic rock walls, casting a dim, ambient light.",
            "Water drips steadily from ceiling stalactites, pooling into a clean underground basin.",
            "A geothermal vent glows faintly orange, puffing puffs of sulfurous gas into the air.",
            "Luminescent mushrooms sprout along cracks, glowing with a soft, neon purple light.",
            "The ground is uneven and slick with mineral deposits and damp mud layers."
        ]
    },
    temple: {
        names: ["Sacred Naos", "Altar of the Leviathan", "Abyssal Baptistry", "Priest's Vestry", "Chamber of the Serpent", "Sacrificial Pit", "Fey Vault", "Drowned Shrine"],
        descriptions: [
            "A massive stone altar sculpted like a writhing serpent sits at the center of a shallow pool.",
            "Murals of strange, multi-eyed deities line the damp tiles, their colors faded but legible.",
            "An empty font holds dark, brackish liquid that smells of sea water and rot.",
            "Incense burners hang from bronze chains, producing cold, stale herbal smoke.",
            "Gilded pillars rise to a dome ceiling carved with star patterns and alien constellations."
        ]
    }
};

// Descriptive Sensory Matrices
export const SENSORY_MATRICES = {
    sights: [
        "Flickering green wisps of torchlight reflected in wet stone",
        "Thin threads of cobwebs drifting in drafty currents",
        "Deep gashes and scratch marks scored into the solid stone blocks",
        "Dust motes suspended in narrow shafts of light from ceiling cracks",
        "A thick carpet of gray mold coating half-submerged debris",
        "Soot stains coloring the stonework near ancient sconces"
    ],
    sounds: [
        "The slow, rhythmic dripping of water in the far distance",
        "A faint, high-pitched scratching behind the masonry",
        "An eerie whistling of wind passing through unseen wall crevices",
        "The metallic clink of chains swaying without visible cause",
        "The dull echo of dirt shifting and settling overhead",
        "A distant, deep rumble that vibrates through the soles of your boots"
    ],
    smells: [
        "The sharp, metallic tang of copper and old rust",
        "A heavy scent of damp soil, rotting wood, and thick mold",
        "A sweet, sickly odor of ancient decay and dead leaves",
        "A clean smell of cold, dry air and limestone dust",
        "A faint trace of burnt resin and sulfurous residue",
        "A suffocating smell of stagnant water and thick slime"
    ]
};

// D&D 5e Combat Encounter Balancing Tables
// Maps Party Level -> Difficulty Thresholds (XP per Player: Easy, Medium, Hard, Deadly)
export const XP_THRESHOLDS = {
    1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 }
};

// Monsters Database by CR and Biome Category
export const MONSTERS = {
    // Wilderness Biomes
    forest: [
        { name: "Giant Badger", cr: "1/4", xp: 50 },
        { name: "Goblin", cr: "1/4", xp: 50 },
        { name: "Blink Dog", cr: "1/4", xp: 50 },
        { name: "Wolf", cr: "1/4", xp: 50 },
        { name: "Satyr", cr: "1/2", xp: 100 },
        { name: "Worg", cr: "1", xp: 200 },
        { name: "Dryad", cr: "1", xp: 200 },
        { name: "Dire Wolf", cr: "1", xp: 200 },
        { name: "Giant Boar", cr: "2", xp: 450 },
        { name: "Owlbear", cr: "3", xp: 700 },
        { name: "Werewolf", cr: "3", xp: 700 },
        { name: "Green Hag", cr: "3", xp: 700 },
        { name: "Unicorn", cr: "5", xp: 1800 },
        { name: "Treant", cr: "9", xp: 5000 }
    ],
    desert: [
        { name: "Jackalwere", cr: "1/2", xp: 100 },
        { name: "Giant Beetle", cr: "1/4", xp: 50 },
        { name: "Giant Scorpion", cr: "3", xp: 700 },
        { name: "Dust Mephit", cr: "1/2", xp: 100 },
        { name: "Gnoll", cr: "1/2", xp: 100 },
        { name: "Brass Dragon Wyrmling", cr: "1", xp: 200 },
        { name: "Thri-kreen", cr: "1", xp: 200 },
        { name: "Yuan-ti Pureblood", cr: "1", xp: 200 },
        { name: "Lamia", cr: "4", xp: 1100 },
        { name: "Mummy", cr: "3", xp: 700 },
        { name: "Air Elemental", cr: "5", xp: 1800 },
        { name: "Guardian Naga", cr: "10", xp: 5900 }
    ],
    swamp: [
        { name: "Bullywug", cr: "1/4", xp: 50 },
        { name: "Mud Mephit", cr: "1/4", xp: 50 },
        { name: "Giant Frog", cr: "1/4", xp: 50 },
        { name: "Crocodile", cr: "1/2", xp: 100 },
        { name: "Lizardfolk", cr: "1/2", xp: 100 },
        { name: "Ghoul", cr: "1", xp: 200 },
        { name: "Specter", cr: "1", xp: 200 },
        { name: "Giant Constrictor Snake", cr: "2", xp: 450 },
        { name: "Will-o'-Wisp", cr: "2", xp: 450 },
        { name: "Black Pudding", cr: "4", xp: 1100 },
        { name: "Shambling Mound", cr: "5", xp: 1800 },
        { name: "Young Black Dragon", cr: "7", xp: 2900 }
    ],
    volcanic: [
        { name: "Fire Snake", cr: "1", xp: 200 },
        { name: "Magma Mephit", cr: "1/2", xp: 100 },
        { name: "Azer", cr: "2", xp: 450 },
        { name: "Fire Giant", cr: "9", xp: 5000 },
        { name: "Salamander", cr: "5", xp: 1800 },
        { name: "Hell Hound", cr: "3", xp: 700 },
        { name: "Chimera", cr: "6", xp: 2300 },
        { name: "Efreeti", cr: "11", xp: 7200 }
    ],
    
    // Dungeon Themes
    crypt: [
        { name: "Skeleton", cr: "1/4", xp: 50 },
        { name: "Zombie", cr: "1/4", xp: 50 },
        { name: "Shadow", cr: "1/2", xp: 100 },
        { name: "Specter", cr: "1", xp: 200 },
        { name: "Ghoul", cr: "1", xp: 200 },
        { name: "Ghast", cr: "2", xp: 450 },
        { name: "Wight", cr: "3", xp: 700 },
        { name: "Mummy", cr: "3", xp: 700 },
        { name: "Wraith", cr: "5", xp: 1800 },
        { name: "Vampire Spawn", cr: "5", xp: 1800 },
        { name: "Bone Claw", cr: "12", xp: 8400 }
    ],
    stone: [
        { name: "Goblin", cr: "1/4", xp: 50 },
        { name: "Orc", cr: "1/2", xp: 100 },
        { name: "Hobgoblin", cr: "1/2", xp: 100 },
        { name: "Bugbear", cr: "1", xp: 200 },
        { name: "Animated Armor", cr: "1", xp: 200 },
        { name: "Thug", cr: "1/2", xp: 100 },
        { name: "Bandit Captain", cr: "2", xp: 450 },
        { name: "Knight", cr: "3", xp: 700 },
        { name: "Gladiator", cr: "5", xp: 1800 },
        { name: "Stone Golem", cr: "10", xp: 5900 }
    ],
    cavern: [
        { name: "Giant Wolf Spider", cr: "1/4", xp: 50 },
        { name: "Stirge", cr: "1/8", xp: 25 },
        { name: "Troglodyte", cr: "1/4", xp: 50 },
        { name: "Darkmantle", cr: "1/2", xp: 100 },
        { name: "Rust Monster", cr: "1", xp: 200 },
        { name: "Grick", cr: "2", xp: 450 },
        { name: "Carrion Crawler", cr: "2", xp: 450 },
        { name: "Hook Horror", cr: "3", xp: 700 },
        { name: "Umber Hulk", cr: "5", xp: 1800 },
        { name: "Roper", cr: "5", xp: 1800 },
        { name: "Cloaker", cr: "8", xp: 3900 }
    ],
    temple: [
        { name: "Cultist", cr: "1/8", xp: 25 },
        { name: "Giant Poisonous Snake", cr: "1/4", xp: 50 },
        { name: "Yuan-ti Pureblood", cr: "1", xp: 200 },
        { name: "Cult Fanatic", cr: "2", xp: 450 },
        { name: "Mimic", cr: "2", xp: 450 },
        { name: "Gibbering Mouther", cr: "2", xp: 450 },
        { name: "Yuan-ti Malison", cr: "3", xp: 700 },
        { name: "Chuul", cr: "4", xp: 1100 },
        { name: "Water Elemental", cr: "5", xp: 1800 },
        { name: "Mind Flayer", cr: "7", xp: 2900 },
        { name: "Spirit Naga", cr: "8", xp: 3900 }
    ]
};

// Non-combat Hazards & Traps
export const HAZARDS = [
    {
        name: "Poison Needle Trap",
        type: "trap",
        description: "A spring-loaded needle concealed inside a keyhole or latch mechanism.",
        trigger: "Attempting to open the lock without the correct key, or failing a lockpick check.",
        effect: "DC 14 Dexterity save to dodge. On a fail, 1d10 piercing damage and DC 13 Constitution save or be Poisoned for 1 hour and take 2d6 poison damage."
    },
    {
        name: "Collapsing Ceiling Pit",
        type: "trap",
        description: "Unstable masonry overhead rigged with a pressure plate on the floor.",
        trigger: "Stepping on a slightly raised flagstone.",
        effect: "DC 13 Wisdom (Perception) to spot. DC 15 Dexterity save. On a fail, 3d6 bludgeoning damage from heavy rocks and the area becomes difficult terrain."
    },
    {
        name: "Glyph of Warding (Explosive)",
        type: "trap",
        description: "A faintly glowing arcane rune painted on the floor, hidden under dust.",
        trigger: "Stepping over the rune, or touching the chest it protects.",
        effect: "DC 14 Intelligence (Investigation) to find. DC 14 Dexterity save. On a fail, 5d8 Fire or Cold damage (half on success) in a 20-foot radius."
    },
    {
        name: "Spiked Pit Trap",
        type: "trap",
        description: "A 10-foot-deep pit hidden by a hinged canvas lid painted to match the stone floor.",
        trigger: "Walking across the canvas lid.",
        effect: "DC 15 Passive Perception to notice the seams. DC 14 Dexterity save to catch the ledge. On fail, fall 10 ft (1d6 bludgeoning) onto iron spikes (2d10 piercing)."
    },
    {
        name: "Green Slime Mold",
        type: "hazard",
        description: "An acidic, green jelly-like hazard clinging to the ceiling or walls.",
        trigger: "Vibrations or heat beneath it causes it to drop from above.",
        effect: "DC 12 Dexterity save. On fail, the slime lands. Deals 1d10 acid damage per round to skin and corrodes metal armor/weapons (-1 penalty) until scraped off or destroyed with fire/cold."
    }
];

// Chest Loot items by rarity/level
export const LOOT_TEMPLATES = {
    currency: [
        { roll: 20, text: "{gp} gold coins" },
        { roll: 50, text: "{gp} gold coins and {sp} silver pieces" },
        { roll: 80, text: "{gp} gold, {sp} silver, and {pp} platinum coins" },
        { roll: 100, text: "A heavy velvet pouch filled with {gp} gold, {sp} silver, and {gems} worth 50 gp each" }
    ],
    items: {
        common: [
            "Potion of Healing (2d4+2)",
            "Scroll of Spell (1st Level)",
            "Vial of Acid (2d6)",
            "Alchemist's Fire vial",
            "A beautifully engraved silver ring (worth 25 gp)",
            "A silk pouch with 5 small garnets (10 gp each)"
        ],
        uncommon: [
            "Potion of Greater Healing (4d4+4)",
            "Scroll of Spell (2nd Level)",
            "+1 Ammunition (bundle of 5 arrows)",
            "Bag of Holding",
            "Immovable Rod",
            "Goggles of Night",
            "An ornate silver goblet inlaid with jade (150 gp)"
        ],
        rare: [
            "Potion of Superior Healing (8d4+8)",
            "Scroll of Spell (3rd Level)",
            "+1 Shield / Weapon",
            "Cloak of Protection",
            "Boots of Elvenkind",
            "Ring of Mind Shielding",
            "A golden crown embedded with small rubies (750 gp)"
        ]
    }
};
