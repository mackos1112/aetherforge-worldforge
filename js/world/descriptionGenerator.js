import { RNG } from './utils.js';

// Dictionaries of rich adjectives and nouns to make descriptions feel authentic and TTRPG-ready.
const ADJECTIVES = {
    general: [
        'weathered', 'crumbling', 'looming', 'ancient', 'shadowy', 'haunted', 'forgotten', 'decaying', 'ominous', 'mysterious', 
        'forbidding', 'desolate', 'hallowed', 'unearthly', 'forsaken', 'dreaded', 'forgotten', 'legendary', 'sinister', 'veiled', 
        'obscured', 'timeless', 'bleak', 'spectral', 'haunting', 'sacrosanct', 'blighted', 'doomed', 'pristine', 'dormant'
    ],
    architectural: [
        'cyclopean', 'monolithic', 'gothic', 'baroque', 'archaic', 'dilapidated', 'monumental', 'grotesque', 'ruined', 'imposing', 
        'half-buried', 'sprawling', 'concentric', 'labyrinthine', 'fortified', 'defiant', 'weather-beaten', 'shattered', 'dilapidated', 
        'overgrown', 'vaulted', 'brutalist', 'ornate', 'symmetrical', 'tumbledown', 'colossal', 'subterranean', 'elevated', 'cantilevered'
    ],
    sensory: [
        'damp', 'musty', 'chilly', 'silent', 'stagnant', 'shadow-draped', 'mist-shrouded', 'fog-laden', 'echoing', 'claustrophobic',
        'frigid', 'humid', 'stifling', 'wind-swept', 'cavernous', 'hushed', 'vibrating', 'heavy', 'suffocating', 'breezy', 'drafty', 
        'gelid', 'rank', 'aromatic', 'stygian'
    ],
    magic: [
        'humming', 'crackling', 'glowing', 'pulsing', 'resonant', 'unstable', 'eldritch', 'aetheric', 'spectral', 'warded',
        'spell-bound', 'ley-charged', 'void-touched', 'chronally-dilated', 'nullified', 'prismatic', 'runic', 'sigil-engraved', 
        'necromantic', 'evanescent', 'volatile', 'abyssal', 'celestial', 'entropy-laced', 'planar'
    ]
};

const BUILDERS = [
    "an ancient, long-forgotten empire during the Age of Ash",
    "a cabal of pre-human titans trying to anchor the region's magic",
    "a circle of renegade mages fleeing imperial inquisitors",
    "a paranoid king who feared a celestial doom",
    "a vanished sect of stellar druids who tracked outer worlds",
    "a mad noble who bartered with planar entities for power",
    "a legion of iron-dwarves before their sudden underground collapse",
    "worshippers of a sleeping void-deity who demanded silent tribute",
    "an advanced guild of prehistoric engineers whose tools were made of glass",
    "a cooperative of extra-planar refugees seeking asylum from a dying cosmos",
    "a highly structured dynasty of dragon-lords who ruled from cloud castles",
    "a tragic alliance of elven artisans who locked themselves away from the world",
    "a prehistoric collective of giant-kin before the great glacial shifts",
    "a forgotten order of paladins who stood watch against a deep underground threat",
    "a secretive faction of high-elf astronomers who predicted the falling stars",
    "a collective of hive-minded subterranean builders who vanished overnight"
];

const HISTORIES = [
    "to serve as a secret vaults and laboratory",
    "as a sacred temple of astronomical observation",
    "to act as a defensive redoubt during the great planar wars",
    "to seal away an entity too powerful to destroy",
    "to harvest raw elemental energy from the planet's core",
    "to serve as a sanctuary for forbidden scholars",
    "to protect a gateway leading to the deeper Underdark",
    "as a grand repository of historical archives and relics",
    "to serve as a primary crossroads for regional ley-line travel",
    "as a containment facility for volatile magical anomalies",
    "to serve as a hidden training ground for elite shadow agents",
    "as a vault to preserve royal lineage treasures during a siege"
];

const OCCUPANTS = [
    "a pack of territorial, magic-warped beasts",
    "a band of desperate outlaws and deserters",
    "crystalline anomalies that feed on ambient mana",
    "restless, hollow echoes of the original builders",
    "aggressive, spore-infected creatures",
    "a group of tight-lipped mercenaries guarding a secret",
    "a nest of venomous, giant cave crawlers",
    "a tribe of savage reptilian humanoids",
    "a cabal of rogue necromancers conducting experiments",
    "sentient plant humanoids defending their seed-tree",
    "constructs that continue to perform their obsolete commands",
    "a flock of territorial harpies nesting in the upper eaves",
    "a small expedition of scholars who have run out of supplies",
    "a cell of fanatical cultists chanting to an unseen master"
];

const OCCUPANT_ACTIVITIES = [
    "huddled around a makeshift fire in the main hall",
    "fortifying the structural weaknesses with salvaged timbers",
    "patrolling the perimeter with loaded crossbows and snarling hounds",
    "carefully harvesting glowing moss from the walls",
    "ritually chanting around a crackling magic node",
    "sleeping in shifts while watching the entrances",
    "sorting through a pile of rusted armor and broken weapons",
    "painting strange, runic symbols on the floors and pillars",
    "shouting at one another in a guttural, ancient dialect",
    "desperately trying to repair a collapsed doorway",
    "staring blankly into the shadows, seemingly hypnotized by the walls",
    "counting gold coins and drawing crude territory maps"
];

const ANOMALIES = [
    "a thick, unnaturally cold mist that dampens all sound",
    "static electricity that causes metal to hum and hair to stand on end",
    "a noticeable sulfurous heat radiating from stone cracks",
    "a low-frequency hum that vibrates in the soles of your boots",
    "pockets of low gravity causing dust and pebbles to float",
    "shadows that stretch toward the nearest heat source instead of away from light",
    "time stuttering, causing water droplets to suspend briefly in the air",
    "a soft, shimmering chromatic aberration edging every vertical surface",
    "whispers that seem to follow you, always sounding just behind your shoulder",
    "a faint scent of ozone and the taste of copper on your tongue",
    "objects slowly sliding uphill when left on smooth surfaces",
    "mirror-like surfaces reflecting the room as it was a century ago"
];

const WEATHER_STATES = [
    "under a blood-red sky that signals a coming storm",
    "shrouded in a heavy, green-tinted damp fog",
    "basking in a sudden, unnaturally warm drizzle",
    "swept by howling winds that carry the smell of ozone",
    "chilled by a biting frost that rapidly crystallizes on any surface",
    "bathed in the eerie, purple light of a localized auroral rift",
    "illuminated by the twin moons shining through heavy cloud cover",
    "drenched in a constant, rhythmic sheet of grey mountain rain",
    "scorched by a dry, stifling heat wave that creates local mirages",
    "blanketed under a silent snowfall that falls even in warm biomes"
];

const WILDERNESS_LANDSCAPES = [
    "a series of craggy, split stone ridges",
    "rolling mounds of shifting, pale sediment",
    "scattered sinkholes revealing dark water basins",
    "irregular patches of low, thorny undergrowth",
    "a grid of petrified logs half-sunk into the clay",
    "steep terraces carved by ancient, long-dried channels",
    "smooth volcanic basalt flats cracked in hexagonal patterns",
    "dense thickets of pale, skeletal birch trees",
    "a labyrinth of dry gullies and sandstone arches",
    "bubbling mud pools rimmed with colorful mineral crusts"
];

const WILDERNESS_ACTIVITY = [
    "you spot fresh, massive footprints pressed deeply into the ground",
    "scattered claw marks score the nearby rocks",
    "the remains of an abandoned traveler's campfire sit nearby",
    "an unusual abundance of rare, fragrant herbs grows in the crevices",
    "bizarre, geometric patterns have been carved into the trees or stones",
    "a discarded leather pack, torn and empty, lies partially buried",
    "flocks of black-feathered ravens watch you silently from high branches",
    "broken supply crates and torn banners indicate a skirmish took place here",
    "a series of small cairns have been built along the ridge, marking something unseen",
    "the grass in this specific area has been flattened in a massive circle"
];

const CITY_RUMORS = [
    "tensions are high due to a recent outbreak of a strange dream-sickness",
    "rumors are spreading of a massive subterranean horde moving through the deep tunnels",
    "a strict curfew is currently enforced by the local guard after sunset",
    "a series of mysterious burglaries targeting noble libraries has the magistrate on edge",
    "widespread whispers speak of secret meetings between key council officials and rogue guilds",
    "local clerics warn that the city's ancient protective wards are beginning to flicker",
    "a strange merchant has been selling maps that show streets that do not exist",
    "docks are buzzing with reports of an enormous sea beast spotted in the bay",
    "several prominent citizens have reported their shadows leaving them at night",
    "the local well-water has begun tasting sweet, causing minor hallucinations"
];

const CHARACTERS = [
    { name: "a grizzled dwarven warrior", pronoun: "he", possession: "his notched battleaxe" },
    { name: "a young elven ranger", pronoun: "she", possession: "her silver-wood bow" },
    { name: "a suspicious human rogue", pronoun: "they", possession: "their poisoned daggers" },
    { name: "a mad tiefling alchemist", pronoun: "he", possession: "his bubbling vials" },
    { name: "a solemn dragonborn paladin", pronoun: "she", possession: "her glowing warhammer" },
    { name: "an eccentric gnome scholar", pronoun: "they", possession: "their brass astrolabe" },
    { name: "a scarred half-orc mercenary", pronoun: "he", possession: "his broad iron shield" },
    { name: "a blind human mystic", pronoun: "she", possession: "her staff of polished driftwood" },
    { name: "a deserter from the royal army", pronoun: "they", possession: "their bloodied uniform" },
    { name: "a stranded planar traveler", pronoun: "she", possession: "her humming crystal compass" },
    { name: "a gold-hungry halfling tomb robber", pronoun: "they", possession: "their mapping charcoal" },
    { name: "a disgraced high-elf academic", pronoun: "he", possession: "his forbidden grimoire" },
    { name: "a masked assassin on the run", pronoun: "they", possession: "their hidden wrist-blades" },
    { name: "a runaway dwarven apprentice", pronoun: "she", possession: "her heavy blacksmith hammer" },
    { name: "a foreign merchant diplomat", pronoun: "he", possession: "his chest of exotic spices" },
    { name: "a veteran captain of the border guard", pronoun: "she", possession: "her steel cavalry saber" }
];

const VESSEL_TYPES = [
    "ghost ship",
    "royal warship",
    "bloodthirsty pirate vessel",
    "plundered merchant galleon",
    "elven runic skiff",
    "decayed smuggling brig",
    "ironclad steam frigate",
    "hollowed kraken-shell barge",
    "gilded pleasure yacht of a dead prince",
    "buoyant corkwood catamarans"
];

const CREATURES = [
    "a pack of phase-wolves",
    "a sleeping granite golem",
    "a swarm of bioluminescent fire-beetles",
    "the spectral shade of a dead king",
    "a territorial nesting manticore",
    "a flock of shadow-harpies",
    "a spore-infested shambling mound",
    "a giant, multi-eyed cave crawler",
    "a rogue iron defender",
    "a weeping banshee",
    "a territorial hydra",
    "a swarm of rust monsters",
    "a pair of nesting griffins",
    "a lingering, hungry ghost",
    "a rogue stone gargoyle"
];

const OBJECTIVES = [
    "retrieve a glowing sun-crystal",
    "rescue a kidnapped cartographer",
    "seal a dangerous crack in the local ley-lines",
    "map the unreached vaults",
    "harvest rare, magical flora",
    "find the source of a local water blight",
    "claim a legendary bounty on a rogue knight",
    "recover a cache of ancient royal documents",
    "deliver a sealed message to a hidden contact",
    "deactivate a malfunctioning defense ward",
    "excavate a buried planetary anchor",
    "investigate a series of structural tremors",
    "purify a desecrated elemental node",
    "steal a relic from the central altar"
];

const COMPLICATIONS = [
    "but the structure shifts its layout every sunrise",
    "but the surrounding ground is sinking into a deep bog",
    "but a rival band of mercenaries has set up a blockade",
    "but the magic in the air causes unpredictable spell surges",
    "but their maps have proved to be completely false",
    "but they are secretly being hunted by a phantom assassin",
    "but the entrance requires a key held by a local lord",
    "but toxic spores make breathing hazardous without masks",
    "but the area is prone to sudden, violent tectonic shifts",
    "but a curse causes all light sources to slowly burn out",
    "but the location is surrounded by a dense field of landmines",
    "but the local wildlife has been driven into a blind frenzy"
];

const POI_DICTIONARIES = {
    crypt: {
        adj: [
            'necrotic', 'ashen', 'sepulchral', 'tomb-cold', 'hallowed', 'defiled', 'silent', 'dust-choked', 'dread-filled', 'spectral',
            'mummified', 'embalmed', 'unconsecrated', 'plundered', 'ancient'
        ],
        nouns: ['mausoleum', 'ossuary', 'catacomb', 'sepulcher', 'charnel-house', 'tomb-vault', 'sarcophagus hall', 'crypt complex', 'burial shaft'],
        sights: [
            'dust-covered stone sarcophagi carved with agonized effigies',
            'orderly walls of stacked skulls looking out with empty sockets',
            'cracked paving stones stained with old, dried embalming oils',
            'flickering, cold-blue candles that burn without melting down',
            'heavy chains wrapped around stone coffins to keep them shut',
            'urns filled with silver ash lining the alcoves'
        ],
        sounds: [
            'the dry scraping of stone on stone', 'faint, rhythmic weeping echoing from the deepest vault', 
            'a low, whistling draft like a dying breath', 'distant clicking of skeletal joints'
        ],
        smells: ['dust, dry bone, and centuries-old decay', 'musty earth mixed with bitter myrrh and incense', 'the sharp, metallic scent of cold stone', 'old damp burial soil'],
        secrets: [
            'a loose brick hiding a copper key', 'a hidden lever shaped like a stone hand', 
            'runes that glow crimson when living blood is near', 'a pressure plate that triggers an arrow trap behind a fake skull'
        ]
    },
    keep: {
        adj: [
            'battle-scarred', 'fortified', 'crenellated', 'crumbling', 'defiant', 'imposing', 'forbidding', 'wind-swept', 'shattered',
            'besieged', 'iron-clad', 'moss-hung', 'abandoned', 'stout'
        ],
        nouns: ['bastion', 'keep', 'citadel', 'outpost', 'fortress', 'garrison', 'stronghold', 'barracks', 'lookout'],
        sights: [
            'toppled battlements and iron-reinforced portcullises rusted shut',
            'shattered arrow slits looking over the surrounding valleys',
            'defensive trenches filled with rusted chainmail and broken spears',
            'a weather-worn coat of arms carved above the main gateway',
            'cracked ballista frames positioned at the corner bastions',
            'a dried-up moat filled with thorny briars'
        ],
        sounds: [
            'the structural groan of timber under heavy wind', 'distant iron chains rattling in empty wells', 
            'the flap of tattered war banners', 'the metallic scraping of a loose portcullis cog'
        ],
        smells: ['rust, damp soot, and dry rot', 'old leather, horse stables, and charcoal smoke', 'stagnant rainwater collected in stone basins', 'stale grease and damp hemp'],
        secrets: [
            'a subterranean escape tunnel leading to a nearby ravine', 'a wall cache containing old military orders', 
            'a false stone concealing a hidden treasury', 'a murder hole that provides line-of-sight to the main gate corridor'
        ]
    },
    cave: {
        adj: [
            'geothermal', 'sulfur-choked', 'dripping', 'subterranean', 'cavernous', 'echoing', 'stalactite-studded', 'lava-warmed', 'shadowy',
            'abyssal', 'slimy', 'crystal-encrusted', 'unmapped', 'damp'
        ],
        nouns: ['chasm', 'cavern system', 'lava tube', 'grotto', 'fissure', 'abyss', 'subterranean sinkhole', 'tunnel network'],
        sights: [
            'crystalline sulfur deposits glowing with a dull yellow sheen',
            'steaming vents throwing thick plumes of vapor into the air',
            'columns of interlocking stalactites and stalagmites meeting in the dark',
            'deep thermal pools bubbling with boiling, mineral-rich mud',
            'veins of raw gemstone glinting when exposed to light',
            'subterranean lichen that pulses with a slow, sickly yellow light'
        ],
        sounds: [
            'the deep, rhythmic bubbling of boiling mud', 'water droplets falling with a sharp ping into deep pools', 
            'the low hiss of escaping high-pressure steam', 'the fluttering of thousands of bat wings overhead'
        ],
        smells: ['rotten eggs and sulfurous steam', 'damp rock, wet clay, and subterranean bat guano', 'the dry scent of superheated basalt', 'stagnant pool mold'],
        secrets: [
            'a narrow squeeze that leads to an untouched mineral vein', 'a thermal pocket that vents hot air on a cycle', 
            'a pool of cool, drinkable water hidden behind steam vents', 'a mineral crust that can be broken to reveal fossilized skeletons'
        ]
    },
    temple: {
        adj: [
            'sunken', 'sacred', 'blasphemous', 'silt-smothered', 'monumental', 'algae-draped', 'revered', 'forgotten', 'hieroglyphic',
            'consecrated', 'heretical', 'monolithic', 'gilded', 'ancient'
        ],
        nouns: ['sanctuary', 'ziggurat', 'cathedral', 'shrine', 'basilica', 'pantheon', 'temple hall', 'altar room'],
        sights: [
            'monolithic statues of forgotten deities encrusted with river silt',
            'faded murals depicting stellar alignments and grand sacrifices',
            'ceremonial altars worn smooth by centuries of offerings',
            'strange, glowing glyphs pulsing slowly under layers of wet moss',
            'bronze bowls filled with ancient, petrified offerings of fruit',
            'shattered stained-glass windows representing sky deities'
        ],
        sounds: [
            'the distant drip of water through cracked ceilings', 'a strange, vibrating hum from the stone altars', 
            'the rustle of river silt settling on the flagstones', 'a ghostly chorus of low-frequency chords'
        ],
        smells: ['stagnant water, river weed, and damp limestone', 'ancient, fossilized frankincense resin', 'the metallic tang of old copper fixtures', 'sweet, heavy ceremonial oils'],
        secrets: [
            'a pressure plate beneath the offering basin', 'a reflection puzzle using the sun or moon alignments', 
            'a secret compartment beneath the main altar containing relics', 'a false wall that slides open when a specific hymn is played'
        ]
    },
    mine: {
        adj: [
            'rickety', 'flooded', 'shored-up', 'collapsed', 'unstable', 'vein-rich', 'abyssal', 'deep-shaft', 'rust-eaten',
            'unmapped', 'abandoned', 'barren', 'dreaded'
        ],
        nouns: ['excavation site', 'mine shaft', 'quarry', 'delve', 'tunnel network', 'ore-works', 'shaft-grid'],
        sights: [
            'rotting wooden struts holding back tons of loose granite',
            'abandoned ore carts derailed and rusting on iron tracks',
            'deep, vertical shafts plunging into absolute darkness',
            'glimmering veins of pyrite or copper tracing the rocky walls',
            'discarded iron picks and leather helmets half-buried in scree',
            'a crude hoisting engine with frayed ropes and rusted pulleys'
        ],
        sounds: [
            'the terrifying groan of settling timbers', 'faint, echoes of picking in the distance', 
            'the splash of water deep in a flooded shaft', 'the rattle of loose pebbles down a vertical drop'
        ],
        smells: ['damp coal, wet earth, and moldy pine timbers', 'the metallic bite of iron ore and rust', 'stagnant pool water', 'the bitter smell of blasting dust'],
        secrets: [
            'a hidden stash of dynamite or mining tools', 'a stable side-tunnel bypassed by the main shaft', 
            'an unmapped vein of silver behind a loose rockface', 'a miner\'s hidden diary details structural faults'
        ]
    },
    tower: {
        adj: [
            'shattered', 'sky-piercing', 'toppled', 'magical', 'arcane', 'astrological', 'warded', 'gilded', 'ruined',
            'weather-beaten', 'isolated', 'resonant', 'tilted'
        ],
        nouns: ['spire', 'turret', 'observatory', 'wizard tower', 'arcane column', 'monolith', 'minaret'],
        sights: [
            'a spiral staircase hugging the outer wall, ending in open sky',
            'floating pieces of masonry suspended in static arcane fields',
            'shattered alembics and crystal glass littering the study floors',
            'runic circles burned into the floor tiles, still radiating soft light',
            'shelves of calcified spell scrolls that crumble at a touch',
            'a massive brass astrolabe pointing at a blank spot in the ceiling'
        ],
        sounds: [
            'the high-pitched hum of magical static', 'pages of old spellbooks fluttering in the wind', 
            'the chime of invisible glass bells', 'the low whine of a localized gravity well'
        ],
        smells: ['burned ozone, dry parchment, and chemical salts', 'sweet lavender water and old dust', 'the metallic smell of quicksilver', 'charred sulfur and wax'],
        secrets: [
            'a levitation circle activated by speaking the right word', 'a hidden compartment in a hollow table leg', 
            'a telescope that reveals constellations not present in the sky', 'a scroll containing an ancient word of command'
        ]
    },
    ruins: {
        adj: [
            'ivy-strangled', 'overgrown', 'weathered', 'abandoned', 'hollowed-out', 'haunted', 'skeletal', 'scattered',
            'moss-covered', 'ancient', 'crumbling', 'forgotten'
        ],
        nouns: ['hamlet', 'manor', 'settlement', 'colony ruins', 'township', 'plaza', 'estate'],
        sights: [
            'stone hearths standing solitary without their wooden houses',
            'abandoned tools and half-eaten meals fossilized under dirt',
            'streets paved with cobbles, now split by massive tree roots',
            'shattered wells choked with weeds and old pottery fragments',
            'a stone monument dedicated to a forgotten victory, split in two',
            'hollow window frames looking out like empty eyes'
        ],
        sounds: [
            'the sigh of wind through empty door frames', 'the skittering of small animals nesting in the masonry', 
            'a faint echo of children playing, gone in a flash', 'the rustle of wild vines against stone'
        ],
        smells: ['wet moss, wild ivy, and decaying leaves', 'damp wood ash and forest humus', 'sweet wild berries growing over ruins', 'decayed thatch and wet sod'],
        secrets: [
            'a bricked-up cellar door hidden under ivy', 'a cache of gold coins buried beneath the central hearth', 
            'a diary detailing the final night before everyone fled', 'a hollow stone in the wall containing a family heirloom'
        ]
    },
    shrine: {
        adj: [
            'sacred', 'pristine', 'elemental', 'revered', 'weather-worn', 'quiet', 'solitary', 'humming',
            'blessed', 'isolated', 'mystical', 'untouched'
        ],
        nouns: ['sanctuary', 'shrine', 'altar', 'monument', 'stele', 'statuary', 'pillar'],
        sights: [
            'an alcove containing a clean stone basin filled with fresh water',
            'thousands of small bronze coins thrown around an elemental stone',
            'glowing incense burners still warm despite decades of abandonment',
            'a statue with eyes of polished opal looking toward the rising sun',
            'fresh wreaths of mountain flowers replaced by an unknown traveler',
            'vibrant silk ribbons tied to nearby branches, snapping in the wind'
        ],
        sounds: [
            'the gentle crackle of eternal blue flame', 'a constant, musical wind chime effect', 
            'absolute silence, as if the wind itself refuses to blow', 'a soft resonance like a crystal bowl being struck'
        ],
        smells: ['myrrh, pine needles, and fresh ozone', 'sandalwood and mountain snow', 'the sweet smell of wildflowers', 'pure fresh spring water'],
        secrets: [
            'a blessing that guards travelers from harsh weather', 'a hollow space behind the icon containing ancient scriptures', 
            'a fountain that cleanses poison when activated with a coin', 'an alignment trigger that activates when a sunbeam hits the opal eyes'
        ]
    },
    barrow: {
        adj: [
            'earthen', 'ancestral', 'spectral', 'mist-wrapped', 'grassy', 'hallowed', 'megalithic', 'grim',
            'ancient', 'forgotten', 'tomb-like'
        ],
        nouns: ['barrow mound', 'burial mound', 'cairn', 'tumulus', 'stone circle', 'earthwork'],
        sights: [
            'massive standing stones covered in crude, swirling spiral carvings',
            'a low stone lintel opening into an earthen mound',
            'rusted bronze swords laid neatly across flat burial stones',
            'earthworks that form the shape of a sleeping dragon from above',
            'cracked clay jars containing decayed grains and weapons',
            'a slab of dark slate carved with runes representing lineage'
        ],
        sounds: [
            'a deep, resonant hum when standing on the mound', 'low, guttural whispers in an old dialect', 
            'the crunch of dry grass in the wind', 'the whistling of wind through the megaliths'
        ],
        smells: ['rich soil, wet sod, and wild heather', 'stagnant, earth-locked air', 'old cold copper', 'musty turf'],
        secrets: [
            'a ceremonial spear that can bypass spectral armor', 'a secondary tomb chamber hidden beneath the main slab', 
            'a curse that draws lightning to anyone who steals the gold', 'a key-stone carved with the history of the interred warrior'
        ]
    },
    shipwreck: {
        adj: [
            'barnacle-encrusted', 'wrecked', 'waterlogged', 'shattered', 'sunken', 'rusting', 'haunted', 'tangled',
            'decayed', 'deep-sea', 'reef-locked'
        ],
        nouns: ['hulk', 'wreckage', 'galleon', 'ruined vessel', 'keel skeleton', 'smuggler brig'],
        sights: [
            'ribs of oak timbers protruding from the sand like a sea monster skeleton',
            'rusted iron anchors draped in thick sheets of kelp',
            'shattered cargo crates spilling decayed porcelain and glass',
            'a bronze figurehead looking upward through the green water',
            'the ship\'s bell partially buried in sand, encrusted with coral',
            'torn canvases fluttering in the underwater currents'
        ],
        sounds: [
            'the creak of waterlogged timbers in the current', 'bubbles rising from iron cavities', 
            'the metallic clink of chains in the surf', 'the low hum of tides passing through the hull'
        ],
        smells: ['brine, kelp, and rotting fish', 'salt-cured wood and tar', 'rust and wet sand', 'decayed fish scales'],
        secrets: [
            'a lockbox in the captain\'s cabin with a secret drawer', 'a hidden compartment in the dry hold', 
            'an ancient navigation chart showing a mythical continent', 'the ship log detailing the crew\'s final, mad hours'
        ]
    },
    labyrinth: {
        adj: [
            'impossible', 'geometric', 'minotaur-haunted', 'carved', 'confusing', 'endless', 'symmetrical', 'daedalian',
            'labyrinthine', 'sterile', 'dusty'
        ],
        nouns: ['maze', 'labyrinth', 'corridor grid', 'stone puzzle', 'maze hall'],
        sights: [
            'perfectly smooth granite walls rising fifteen feet high',
            'carved arrows pointing in confusing directions on the walls',
            'mysterious blood trails that suddenly vanish at dead ends',
            'overhead mirrors showing the maze layout but distorted',
            'bones of previous adventurers clutching drawing utensils',
            'walls that show zero seams or tooling marks, as if grown'
        ],
        sounds: [
            'the echo of your own footsteps returning at an odd delay', 'a heavy grinding noise as walls shift in the distance', 
            'a low, rhythmic breathing around the corner', 'the click of shifting floor tiles'
        ],
        smells: ['clean limestone dust and stone grease', 'the scent of wild thyme growing in wall cracks', 'the distinct smell of beast den mud', 'cold granite and damp grease'],
        secrets: [
            'a pattern of tiles that indicates the correct path', 'a hidden alcove where the architect left their notes', 
            'a central pillar that opens when a blood offering is made', 'a trapdoor that leads directly to the core machinery'
        ]
    },
    outpost: {
        adj: [
            'forgotten', 'barricaded', 'isolated', 'tactical', 'weather-beaten', 'strategic', 'abandoned',
            'fortified', 'decayed', 'border-line'
        ],
        nouns: ['watchpost', 'redoubt', 'blockhouse', 'outpost', 'palisade', 'rampart'],
        sights: [
            'a rotting wooden palisade reinforced with dry-stone walls',
            'an empty watch platform looking out over the trade route',
            'abandoned bedrolls and tables with dice left on them',
            'iron braziers containing cold ash and half-burnt wood',
            'rusted signal mirrors mounted on pivoting tripods',
            'a supply registry book showing shipments that never arrived'
        ],
        sounds: [
            'the whistling of wind through the watchtower gaps', 'the creak of a swinging gate on a rusted hinge', 
            'small pebbles falling from crumbling walls', 'the rhythmic clink of a loose flagpole cable'
        ],
        smells: ['smoke, dry pine, and old salt pork', 'musty blankets and grease', 'the smell of wet horse hair', 'old oil and charred wood'],
        secrets: [
            'a floorboard containing emergency rations and gold', 'a map of local bandit camps hidden in a hollow log', 
            'a signal mirror setup pointing to the distant capital', 'a cipher key hidden inside the hollow hilt of a training sword'
        ]
    },
    crystal_cave: {
        adj: [
            'resonant', 'blazing', 'prismatic', 'humming', 'magical', 'geode-like', 'vitreous', 'luminous',
            'mana-soaked', 'shimmering'
        ],
        nouns: ['geode cavern', 'crystal vault', 'prismatic rift', 'shard cavern', 'crystal hollow'],
        sights: [
            'giant, purple crystals jutting from the floor like columns',
            'walls that reflect light in thousands of rainbow patterns',
            'fine dust that sparkles like stars when disturbed',
            'pools of liquid magic glowing with a soft, pink light',
            'clusters of raw crystal shards growing over petrified wood',
            'a crystal matrix that mirrors your movements with a slight delay'
        ],
        sounds: [
            'a musical, chime-like vibration echoing constantly', 'the high-pitched hum of raw mana charging the air', 
            'crystalline shards breaking underfoot with a glass ping', 'a delicate chiming like wind in glass rods'
        ],
        smells: ['burning ozone, sweet rosewater, and mineral dust', 'the smell of fresh rain after lightning', 'clean ice', 'charged static and mint'],
        secrets: [
            'a crystal that absorbs and releases magical light', 'a focal node that can recharge spell slots', 
            'a cluster of explosive mana shards', 'a sound puzzle where striking crystals in sequence opens a path'
        ]
    },
    fey_circle: {
        adj: [
            'sparkling', 'bewildering', 'fey-kissed', 'glowing', 'fungal', 'verdant', 'dreamlike', 'illusory',
            'enchanted', 'moss-woven'
        ],
        nouns: ['fey ring', 'fairy circle', 'mushroom node', 'druidic glade', 'willow grove'],
        sights: [
            'a perfect circle of towering, bioluminescent purple mushrooms',
            'sparkling spores floating like fireflies in the dim light',
            'flowers that bloom and close in seconds when approached',
            'a mist that shimmers with rainbow colors on the grass',
            'an ancient elder tree with roots forming a natural archway',
            'butterfly wings caught in glowing dew webs'
        ],
        sounds: [
            'faint, distant laughter and stringed music', 'the rustle of leaves that sound like whispers', 
            'the hum of glowing fairy dust', 'the chiming of bluebells in a light draft'
        ],
        smells: ['sweet nectar, damp moss, and magical honeysuckle', 'earthy mushrooms and wet soil', 'fresh mint and pine', 'wild cider and clover'],
        secrets: [
            'a path that leads straight into the Feywild at twilight', 'mushrooms that grant temporary levitation if eaten', 
            'a pool that reflects a person\'s true desires', 'a fairy gift that turns to dry leaves if taken out of the glade'
        ]
    },
    astral_rift: {
        adj: [
            'cosmic', 'shimmering', 'rifted', 'alien', 'temporal', 'void-touched', 'stellar', 'gravitational',
            'extra-dimensional', 'abyssal'
        ],
        nouns: ['astral tear', 'void rift', 'space-time tear', 'cosmic anchor', 'dimension fold'],
        sights: [
            'a tear in the air showing stars and swirling nebulae',
            'objects that slowly drift upward in low gravity pockets',
            'shattered void glass floating in concentric rings',
            'shadows that cast in multiple directions from a single light',
            'glowing stardust drifting like smoke through vertical splits',
            'floating geometric stones orbiting the central tear'
        ],
        sounds: [
            'a deep, roaring vacuum noise that doesn\'t move the air', 'whispers in an alien tongue that bypass the ears', 
            'the crackle of raw dimensional fabric tearing', 'the heavy, slow beat of a cosmic pulse'
        ],
        smells: ['cold metal, void dust, and burning stardust', 'nothing at all—a complete absence of scent', 'ozone', 'cosmic static and ozone'],
        secrets: [
            'a portal that allows looking brief distances into the future', 'a relic of an alien civilization buried nearby', 
            'a patch of ground where gravity is completely reversed', 'an astral node that grants temporary telepathic sight'
        ]
    }
};

// Generates a sector (wilderness) description with multiple layers of randomness (at least 3 RNG moments)
export function generateSectorDescription(rng, biome, sight, faction) {
    const adj1 = rng.pick(ADJECTIVES.general);                 // RNG Moment 1
    const adj2 = rng.pick(ADJECTIVES.sensory);                 // RNG Moment 2
    const landscape = rng.pick(WILDERNESS_LANDSCAPES);         // RNG Moment 3
    const weather = rng.pick(WEATHER_STATES);                  // RNG Moment 4
    const activity = rng.pick(WILDERNESS_ACTIVITY);            // RNG Moment 5
    const anomaly = rng.pick(ANOMALIES);                      // RNG Moment 6
    
    let text = `A stretch of ${biome} landscape, defined by ${landscape} ${weather}. `;
    text += `The environment feels ${adj1} and ${adj2}. `;
    text += `Your senses register ${sight}. ${activity}. `;
    text += `You also observe ${anomaly}. `;
    
    if (faction && faction !== "None") {
        text += `Signs indicate this area is frequented by the ${faction}.`;
    } else {
        text += `The territory is quiet, seemingly untouched by any localized factions.`;
    }
    
    return text;
}

// Generates a city/settlement description with multiple layers of randomness (at least 3 RNG moments)
export function generateCityDescription(rng, cityName, isCapital, factionName) {
    const adj = rng.pick(ADJECTIVES.architectural);            // RNG Moment 1
    const mood = rng.pick(['bustling', 'tense', 'vigilant', 'somber', 'prosperous', 'decaying']); // RNG Moment 2
    const rumor = rng.pick(CITY_RUMORS);                      // RNG Moment 3
    const char = rng.pick(CHARACTERS);                        // RNG Moment 4
    
    let text = `${cityName} is a ${mood} ${isCapital ? 'provincial capital' : 'regional hub'} characterized by ${adj} stone architecture. `;
    
    const activity = [
        `Guards dressed in the livery of local lords patrol the high walls, keeping a watchful eye on incoming travelers.`,
        `The marketplace is a cacophony of merchants shouting prices, smiths hammering iron, and bards singing tales.`,
        `A tense silence hangs over the plazas, where citizens speak in whispers and keep their eyes low.`,
        `Steam and coal smoke rise from local workshops, filling the air with the smell of industry and hot metal.`
    ];
    text += rng.pick(activity) + ` ${rumor}. `;                // RNG Moment 5
    text += `Near the gates, you notice ${char.name} adjusting ${char.possession}. `;
    
    if (factionName && factionName !== "None") {
        text += `The city is known to be under the heavy influence of the ${factionName}.`;
    }
    
    return text;
}

// Generates a dynamic POI description using the dictionary with multiple layers of randomness (at least 3 RNG moments)
export function generatePoiDescription(poiType, seedString, customName) {
    const rng = new RNG(seedString);
    const dict = POI_DICTIONARIES[poiType] || POI_DICTIONARIES['ruins'];
    
    const adj1 = rng.pick(dict.adj);                          // RNG Moment 1
    const adj2 = rng.pick(ADJECTIVES.architectural);            // RNG Moment 2
    const noun = rng.pick(dict.nouns);                        // RNG Moment 3
    
    const sight = rng.pick(dict.sights);                      // RNG Moment 4
    const sound = rng.pick(dict.sounds);                      // RNG Moment 5
    const smell = rng.pick(dict.smells);                      // RNG Moment 6
    const secret = rng.pick(dict.secrets);                    // RNG Moment 7
    
    const builder = rng.pick(BUILDERS);                      // RNG Moment 8
    const history = rng.pick(HISTORIES);                      // RNG Moment 9
    const occupant = rng.pick(OCCUPANTS);                    // RNG Moment 10
    const activity = rng.pick(OCCUPANT_ACTIVITIES);            // RNG Moment 11
    const anomaly = rng.pick(ANOMALIES);                      // RNG Moment 12
    
    let text = `Before you stands the ${customName || 'structure'}: a ${adj1}, ${adj2} ${noun}. `;
    text += `It was built by ${builder} ${history}. `;
    text += `Currently, it is occupied by ${occupant}, who are ${activity}. `;
    text += `Upon inspection, you notice ${sight}. `;
    text += `The atmosphere is defined by ${sound}, the unmistakable smell of ${smell}, and ${anomaly}. `;
    text += `A perceptive adventurer might notice ${secret}.`;
    
    return text;
}

// Generates adventure hooks with multiple layers of randomness (at least 3 RNG moments)
export function generateAdventureHooks(rng, type, category, faction, biome) {
    const hooks = [];
    
    // Choose characters, objectives, creatures, and complications
    const char1 = rng.pick(CHARACTERS);                        // RNG Moment 1
    let char2 = rng.pick(CHARACTERS);                        // RNG Moment 2
    while (char2.name === char1.name) {
        char2 = rng.pick(CHARACTERS);
    }
    const ship1 = rng.pick(VESSEL_TYPES);                      // RNG Moment 3
    const ship2 = rng.pick(VESSEL_TYPES);                      // RNG Moment 4
    const creature = rng.pick(CREATURES);                      // RNG Moment 5
    const objective = rng.pick(OBJECTIVES);                    // RNG Moment 6
    const complication = rng.pick(COMPLICATIONS);              // RNG Moment 7
    
    if (type === 'city') {
        const cityPool = [
            `A merchant representative is hiring guards to help ${char1.name} ${objective} outside the walls, ${complication}.`,
            `Rumors circulate that ${char1.name} has discovered a cache of relics, but ${complication}.`,
            `You meet ${char1.name} in a smoky tavern, who claims ${char2.name} is seeking mercenaries to ${objective}.`,
            `${char1.name} is looking for recruits to recover ${char1.possession}, which is guarded by ${creature} nearby.`,
            `The local magistrate is seeking volunteers to investigate why ${char1.name} fled the city to ${objective}, ${complication}.`
        ];
        hooks.push(rng.pick(cityPool));                        // RNG Moment 8
        let second = rng.pick(cityPool);
        while (second === hooks[0]) {
            second = rng.pick(cityPool);
        }
        hooks.push(second);
    } else if (POI_DICTIONARIES[type]) {
        const dict = POI_DICTIONARIES[type];
        const structures = dict.nouns;
        const struct = rng.pick(structures);                  // RNG Moment 8
        
        const hooksPool = [
            `${char1.name} offers gold to anyone who will enter the ${struct} and help them ${objective}, ${complication}.`,
            `${char1.name} warns that the ${struct} has been overrun by ${creature}, who are trying to ${objective}.`,
            `Two rival groups, one led by ${char1.name} armed with ${char1.possession} and another by ${char2.name}, are in a race to ${objective} inside the ${struct}.`,
            `A dying messenger was found by ${char1.name}, revealing that ${creature} is guarding the entrance to the ${struct}, ${complication}.`,
            `Strange magical anomalies have started spreading from this ${struct}, which ${char1.name} claims is a barrier created by ${creature}.`
        ];
        
        hooks.push(rng.pick(hooksPool));                        // RNG Moment 9
        let second = rng.pick(hooksPool);
        while (second === hooks[0]) {
            second = rng.pick(hooksPool);
        }
        hooks.push(second);
    } else {
        // Biome/Wilderness hook
        const hooksPool = {
            aquatic: [
                `An abandoned ${ship1} was spotted drifting near the coast; ${char1.name} claims it was attacked by ${creature}.`,
                `A legendary pearl is said to rest nearby; ${char1.name} wants to use ${char1.possession} to retrieve it, ${complication}.`,
                `Deep-sea thermal vents have begun boiling, and ${char1.name} believes ${creature} is nesting inside them.`,
                `Local fishermen report their nets are being slashed; ${char1.name} is looking for adventurers to hunt down ${creature}.`,
                `A cargo ship carrying gold foundered on a reef; ${char1.name} is organizing a dive to retrieve it, ${complication}.`,
                `Bizarre, glowing lights have begun rising from deep ocean trenches, which ${char1.name} claims is an omen of ${creature}.`,
                `An underwater gate has begun pulsing; ${char1.name} believes it leads to a rift guarded by ${creature}.`
            ],
            arid: [
                `A sudden sandstorm uncovered the tip of an obsidian obelisk; ${char1.name} wants to retrieve it to ${objective}, ${complication}.`,
                `A trade caravan led by ${char1.name} vanished; ${char2.name} suspects they were ambushed by ${creature}.`,
                `Nomads led by ${char1.name} warn that ${creature} is stalking travelers near the water holes.`,
                `An ancient sandstone temple has opened; ${char1.name} claims it is the only place to ${objective}, ${complication}.`,
                `Outlaws have set up camp in the mesas; ${char1.name} is offering their weapon if you help defeat them, ${complication}.`,
                `The central spring of the local oasis has turned pitch black; ${char1.name} believes ${creature} has poisoned it.`
            ],
            mountain: [
                `A group of miners led by ${char1.name} broke through into a cavern filled with ${creature}.`,
                `Howling winds passing through the ridges carry a melody; ${char1.name} believes it is the voice of ${creature}.`,
                `A local watchpost was crushed by a rockslide; ${char1.name} claims it was triggered by ${creature}.`,
                `A crystalline mineral vein has begun growing, which ${char1.name} wants to harvest to ${objective}, ${complication}.`,
                `High peak hermits report that stars are shifting; ${char1.name} believes ${creature} is being summoned.`
            ],
            woodland: [
                `The druids of the forest circle have gone missing; ${char1.name} warns they were taken by ${creature}.`,
                `A massive, hollow redwood tree is rumored to hide a pathway; ${char1.name} wants to map it to ${objective}, ${complication}.`,
                `A thick, greenish mist is creeping out of the fens, which ${char1.name} claims was released by ${creature}.`,
                `Tangled briars have grown overnight, enclosing the territory of ${creature}, ${complication}.`,
                `Outlaws led by ${char1.name} have fortified the woods; they are seeking recruits to help them fight off ${creature}.`
            ],
            cold: [
                `A hunter discovered a frozen expedition camp; ${char1.name} believes they were attacked by ${creature}.`,
                `Yeti tracks have been spotted near pastures; ${char1.name} wants to use ${char1.possession} to hunt the beast, ${complication}.`,
                `A massive glacier has cracked, revealing a perfectly preserved ${ship1}; ${char1.name} claims it contains a vault.`
            ],
            plains: [
                `A massive sinkhole opened in the plains; ${char1.name} believes it connects to a dungeon ruled by ${creature}.`,
                `Centaur clans led by ${char1.name} are migrating early to escape the hunting grounds of ${creature}.`,
                `Local farmers report crops growing in patterns; ${char1.name} claims it is the sigil of ${creature}.`
            ],
            magical: [
                `Raw mana surges are creating anti-gravity pockets; ${char1.name} warns it is a side effect of ${creature} awakening.`,
                `A tear in space-time has opened; ${char1.name} wants to use ${char1.possession} to close it before ${creature} enters.`,
                `Glowing crystal structures are rapidly growing, which ${char1.name} claims was planted by ${creature} to ${objective}.`
            ]
        };
        
        const pool = hooksPool[category] || hooksPool.plains;
        hooks.push(rng.pick(pool));                            // RNG Moment 8
        let second = rng.pick(pool);
        while (second === hooks[0]) {
            second = rng.pick(pool);
        }
        hooks.push(second);
    }
    
    return hooks;
}
