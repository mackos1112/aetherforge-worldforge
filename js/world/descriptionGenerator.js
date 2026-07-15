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
    { name: "a suspicious human rogue", pronoun: "he", possession: "his poisoned daggers" },
    { name: "a mad tiefling alchemist", pronoun: "he", possession: "his bubbling vials" },
    { name: "a solemn dragonborn paladin", pronoun: "she", possession: "her glowing warhammer" },
    { name: "an eccentric gnome scholar", pronoun: "he", possession: "his brass astrolabe" },
    { name: "a scarred half-orc mercenary", pronoun: "he", possession: "his broad iron shield" },
    { name: "a blind human mystic", pronoun: "she", possession: "her staff of polished driftwood" },
    { name: "a deserter from the royal army", pronoun: "he", possession: "his bloodied uniform" },
    { name: "a stranded planar traveler", pronoun: "she", possession: "her humming crystal compass" },
    { name: "a gold-hungry halfling tomb robber", pronoun: "she", possession: "her mapping charcoal" },
    { name: "a disgraced high-elf academic", pronoun: "he", possession: "his forbidden grimoire" },
    { name: "a masked assassin on the run", pronoun: "he", possession: "his hidden wrist-blades" },
    { name: "a runaway dwarven apprentice", pronoun: "she", possession: "her heavy blacksmith hammer" },
    { name: "a foreign merchant diplomat", pronoun: "he", possession: "his chest of exotic spices" },
    { name: "a veteran captain of the border guard", pronoun: "she", possession: "her steel cavalry saber" },
    { name: "a retired goblin sapper", pronoun: "he", possession: "his pouch of volatile fire-powder" },
    { name: "a naive halfling cleric", pronoun: "she", possession: "her copper holy symbol" },
    { name: "a haunted human warlock", pronoun: "she", possession: "her eye-adorned ring" },
    { name: "a snobbish elven duelist", pronoun: "he", possession: "his gold-hilted rapier" },
    { name: "a mute minotaur blacksmith", pronoun: "he", possession: "his heavy iron tongs" },
    { name: "a tiefling spy in silk robes", pronoun: "she", possession: "her scroll of cyphers" },
    { name: "a nomadic desert scout", pronoun: "he", possession: "his leather water skin" },
    { name: "a scarred orc chieftain", pronoun: "he", possession: "his crown of boar tusks" },
    { name: "an ancient turtle-folk monk", pronoun: "he", possession: "his iron-rimmed wooden bowl" },
    { name: "a flamboyant bard in velvet", pronoun: "she", possession: "her ivory-inlaid lute" },
    { name: "a disgraced knight-errant", pronoun: "he", possession: "his rusted family crest" },
    { name: "a suspicious potion merchant", pronoun: "she", possession: "her suitcase of glowing liquids" },
    { name: "a star-watching astrologer", pronoun: "he", possession: "his copper spyglass" },
    { name: "a quiet crypt keeper", pronoun: "he", possession: "his heavy ring of iron keys" },
    { name: "a pirate first mate", pronoun: "she", possession: "her salt-rusted cutlass" },
    { name: "a gnomish clockmaker", pronoun: "she", possession: "her magnifying monocle" },
    { name: "a high-elf diplomat", pronoun: "he", possession: "his wax-sealed treaty scroll" },
    { name: "a wild half-orc druid", pronoun: "she", possession: "her cluster of mistletoe" },
    { name: "a cynical bounty hunter", pronoun: "he", possession: "his iron-weighted netting" },
    { name: "a solemn graveyard priest", pronoun: "he", possession: "his silver censer" },
    { name: "a street-smart orphan thief", pronoun: "she", possession: "her lockpicking hairpins" },
    { name: "a retired admiral", pronoun: "he", possession: "his ivory telescope" },
    { name: "a cursed werewolf hunter", pronoun: "she", possession: "her silver-coated crossbow bolts" },
    { name: "a swamp apothecary", pronoun: "she", possession: "her jar of leeches" },
    { name: "a deep-sea salvage diver", pronoun: "he", possession: "his heavy copper diving helmet" },
    { name: "an arcane library scribe", pronoun: "he", possession: "his ink-stained quill" },
    { name: "a royal executioner", pronoun: "he", possession: "his executioner's black hood" },
    { name: "a renegade inquisitor", pronoun: "she", possession: "her iron brand" },
    { name: "a traveling storyteller", pronoun: "she", possession: "her book of hand-drawn myths" },
    { name: "a clockwork automaton repairman", pronoun: "he", possession: "his set of miniature brass gears" },
    { name: "a drow poisoner", pronoun: "she", possession: "her vial of dark-elf venom" },
    { name: "a giant-slaying barbarian", pronoun: "he", possession: "his massive dragon-bone club" },
    { name: "a lost planar cartographer", pronoun: "he", possession: "his shifting ink map" },
    { name: "a mountain pathfinder", pronoun: "she", possession: "her climbing pitons" },
    { name: "a temple dancer", pronoun: "she", possession: "her silk finger-cymbals" },
    { name: "a blind fortune teller", pronoun: "she", possession: "her deck of bone cards" },
    { name: "a disgraced gladiator", pronoun: "he", possession: "his net and trident" },
    { name: "a spellsword mercenary", pronoun: "he", possession: "his rune-etched longsword" },
    { name: "a paranoid herbalist", pronoun: "she", possession: "her bag of dried nightshade" },
    { name: "a wealthy merchant guild lord", pronoun: "he", possession: "his signet ring" },
    { name: "a ruined manor keeper", pronoun: "he", possession: "his heavy brass candelabra" },
    { name: "a dragon-cult initiate", pronoun: "she", possession: "her red-scaled dagger" },
    { name: "a royal falconer", pronoun: "he", possession: "his leather falconry glove" },
    { name: "a quiet monk of silence", pronoun: "he", possession: "his vow-inscribed slate" },
    { name: "a deep-mine surveyor", pronoun: "he", possession: "his glowing crystal lantern" },
    { name: "a fey-touched child", pronoun: "she", possession: "her crown of woven bluebells" },
    { name: "a cynical court jester", pronoun: "he", possession: "his bells-capped staff" },
    { name: "a shadow-weaving sorcerer", pronoun: "he", possession: "his dark obsidian focus" },
    { name: "a shipwrecked sailor", pronoun: "he", possession: "his waterlogged logbook" },
    { name: "a goblin wolf-rider", pronoun: "she", possession: "her bone-tipped javelin" },
    { name: "a tomb-guard golem maker", pronoun: "she", possession: "her clay modeling tool" },
    { name: "a disgraced general", pronoun: "he", possession: "his tattered tactical map" },
    { name: "a hollow-eyed necromancer apprentice", pronoun: "she", possession: "her pouch of grave dust" },
    { name: "a foreign silk trader", pronoun: "he", possession: "his measuring rod" },
    { name: "a rat-catcher of the slums", pronoun: "he", possession: "his small wire cages" },
    { name: "a high-altitude sky-sailor", pronoun: "she", possession: "her brass anemometer" },
    { name: "a crystal-carving artisan", pronoun: "he", possession: "his diamond-tipped chisel" },
    { name: "a wandering pilgrim", pronoun: "she", possession: "her brass prayer wheel" },
    { name: "a veteran siege engineer", pronoun: "he", possession: "his slide-rule and charcoal" },
    { name: "a sewer guide", pronoun: "she", possession: "her tall leather waders" },
    { name: "a cursed noble heir", pronoun: "he", possession: "his silver pocket watch" },
    { name: "a retired champion archer", pronoun: "he", possession: "his thumb ring" },
    { name: "a traveling puppet master", pronoun: "she", possession: "her wooden marionette" },
    { name: "a blind harper", pronoun: "he", possession: "his small golden harp" },
    { name: "a fugitive rebel leader", pronoun: "she", possession: "her manifesto pamphlet" },
    { name: "a deep-vault locksmith", pronoun: "he", possession: "his set of master keys" },
    { name: "a desert nomad navigator", pronoun: "she", possession: "her astrolabe" },
    { name: "a half-elven diplomat", pronoun: "he", possession: "his sealed peace treaty" },
    { name: "a paranoid conspiracy theorist", pronoun: "he", possession: "his corkboard plans" },
    { name: "a swamp guide", pronoun: "she", possession: "her long bamboo pole" },
    { name: "a retired gladiator trainer", pronoun: "he", possession: "his leather whip" },
    { name: "a disgraced wizard guild chancellor", pronoun: "he", possession: "his broken staff" },
    { name: "a dragon hunter", weapon: "harpoon", pronoun: "she", possession: "her heavy harpoon gun" },
    { name: "a wandering sword-smith", pronoun: "he", possession: "his portable anvil" },
    { name: "a quiet graveyard landscaper", pronoun: "he", possession: "his iron spade" },
    { name: "a clockwork toy maker", pronoun: "she", possession: "her winding keys" },
    { name: "a retired treasure hunter", pronoun: "he", possession: "his old spyglass" },
    { name: "a mysterious masked executioner", pronoun: "he", possession: "his giant headsman's axe" },
    { name: "a forest ranger recruit", pronoun: "she", possession: "her green tracking cloak" },
    { name: "a suspicious fishmonger", pronoun: "he", possession: "his scaling knife" },
    { name: "a former pirate captain", pronoun: "she", possession: "her tattered pirate hat" },
    { name: "a temple high priestess", pronoun: "she", possession: "her gold ceremonial chalice" },
    { name: "a royal cartographer", pronoun: "he", possession: "his drafting compass" },
    { name: "a blind beggar spy", pronoun: "he", possession: "his tin cup" },
    { name: "a nomadic horse breeder", pronoun: "she", possession: "her braided horsehair lasso" },
    { name: "a master glassblower", pronoun: "he", possession: "his iron blowpipe" },
    { name: "a cursed portrait painter", pronoun: "he", possession: "his easel and dark paints" },
    { name: "a subterranean mushroom farmer", pronoun: "she", possession: "her spore bag" },
    { name: "a veteran standard-bearer", pronoun: "he", possession: "his heavy brass horn" },
    { name: "a renegade war-priest", pronoun: "she", possession: "her iron mace" },
    { name: "a disgraced banker", pronoun: "he", possession: "his ledger books" },
    { name: "a swamp witch", pronoun: "she", possession: "her cauldron stirrer" },
    { name: "a planar merchant", pronoun: "he", possession: "his dimensional bag" },
    { name: "a royal shield-bearer", pronoun: "he", possession: "his heraldic crest" },
    { name: "a tomb-robber turned monk", pronoun: "she", possession: "her prayer beads" },
    { name: "a legendary beast tamer", pronoun: "she", possession: "her spiked collar" },
    { name: "a retired lighthouse keeper", pronoun: "he", possession: "his brass oil can" },
    { name: "a wandering monk of the open road", pronoun: "she", possession: "her iron staff" },
    { name: "a disgraced bard turned thief", pronoun: "he", possession: "his lockpicks hidden in a flute" },
    { name: "a foreign spy posing as a cook", pronoun: "he", possession: "his iron ladle" },
    { name: "a desert raider scout", pronoun: "she", possession: "her curved scimitar" },
    { name: "a quiet herbal apothecary", pronoun: "she", possession: "her mortar and pestle" },
    { name: "a cursed clockwork knight", pronoun: "he", possession: "his wind-up key" },
    { name: "a deep-sea pearl diver", pronoun: "she", possession: "her net bag" },
    { name: "a scarred mercenary sergeant", pronoun: "he", possession: "his iron whistle" }
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
    "buoyant corkwood catamarans",
    "haunted plague clipper",
    "sunken turtle-ship",
    "renegade privateer corvette",
    "obsidian-plated dreadnought",
    "glowing ghost-cutter",
    "heavy dwarven ironclad",
    "shadow-plane drift-ship",
    "spectral whaling brig",
    "subterranean drillsloop",
    "ancient dragon-prowed longship",
    "fey-wild reed-raft",
    "rusting junk-boat",
    "armored treasure caravel",
    "runic sky-clipper",
    "aether-infused galleas",
    "barnacle-clad leviathan-hunter",
    "doomed arctic icebreaker",
    "undead skeletal junk",
    "cursed drow catamaran",
    "royal flag-galleon"
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
    "a rogue stone gargoyle",
    "an ancient red dragon",
    "a pair of mating owlbears",
    "a group of scavenging gnolls",
    "a territorial stone giant",
    "a lurking cave fisher",
    "a deep-sea kraken sprout",
    "a school of venomous reef-sharks",
    "a flight of blood-crazed stirges",
    "a pair of iron-scaled basilisks",
    "a lumbering forest ettin",
    "a wandering clockwork golem",
    "a pack of undead shadow-hounds",
    "a group of marsh goblins",
    "a swarm of necrotic carrion crawlers",
    "a lurking roper",
    "a pair of territorial chimeras",
    "a solitary desert wyvern",
    "a group of tomb skeletons",
    "a deep-chasm otyugh",
    "a pack of rabid winter wolves",
    "a territorial frost giant",
    "a herd of wild griffins",
    "a group of subterranean driders",
    "a flock of razor-feathered hippogriffs",
    "a swamp-dwelling green hag",
    "a pair of nesting perytons",
    "a swarm of toxic swamp-flies",
    "a group of desert dust devils",
    "a territorial mountain cyclops",
    "a pair of hungry hill giants",
    "a pack of undead ghouls",
    "a group of fire-dwelling salamanders",
    "a territorial copper dragon",
    "a deep-cave cloaker",
    "a pair of shadow-elves",
    "a swarm of stinging magma-wasps",
    "a pack of skeletal riders",
    "a group of cavern troglodytes",
    "a pair of phase-spiders",
    "a territorial forest treant",
    "a group of river merfolk",
    "a deep-sea giant octopus",
    "a pair of nesting rock-rocs",
    "a swarm of void-parasites",
    "a group of elemental mud-mephits",
    "a territorial ice devil",
    "a pair of hungry yeti",
    "a pack of feral gnolls",
    "a group of ash-wastes wights",
    "a territorial volcanic hydra",
    "a pair of deepwood dryads",
    "a school of razor-toothed piranhas",
    "a flock of spectral ravens",
    "a swarm of crystal-wasps",
    "a group of cave-dwelling grimlocks",
    "a territorial cloud giant",
    "a pair of swamp-dwelling hydras",
    "a pack of skeletal archers",
    "a group of flame-skulls",
    "a territorial stone chimera",
    "a pair of deep-sea sahuagin",
    "a flock of giant bats",
    "a swarm of shadow-rats",
    "a group of desert gnolls",
    "a territorial blue dragon",
    "a pair of forest centaurs",
    "a pack of phase-cats",
    "a group of cave ghouls",
    "a territorial glacier worm",
    "a pair of volcanic fire-drakes",
    "a school of giant sea-eels",
    "a flock of blood-harpies",
    "a swarm of necrotic locusts",
    "a group of marsh trolls",
    "a territorial shadow demon",
    "a pair of crystalline gargoyles",
    "a pack of plague-rats",
    "a group of mountain orcs",
    "a territorial black dragon",
    "a pair of forest satyrs",
    "a pack of blink dogs",
    "a group of sewer kobolds",
    "a territorial cave bear",
    "a pair of volcanic magma-golems",
    "a school of reef-sharks",
    "a flock of giant eagles",
    "a swarm of bone-beetles",
    "a group of desert bandits",
    "a territorial green dragon",
    "a pair of swamp lizardfolk",
    "a pack of shadow-hounds",
    "a group of tomb mummies",
    "a territorial storm giant",
    "a pair of forest owlbears",
    "a school of electric eels",
    "a flock of skeletal gargoyles",
    "a swarm of poison-spiders",
    "a group of mountain goblins",
    "a territorial red wyrmling",
    "a pair of cave trolls",
    "a pack of winter wolves",
    "a group of sea hags",
    "a territorial stone gargoyle",
    "a pair of volcanic drakes",
    "a school of giant squids",
    "a flock of wind-harpies",
    "a swarm of ash-wasps",
    "a group of marsh ghouls",
    "a territorial shadow-dragon",
    "a pair of crystalline chimeras",
    "a pack of blood-wolves",
    "a group of deep-sea merfolk",
    "a territorial cave hydra",
    "a pair of forest dryads",
    "a school of spectral fish",
    "a flock of giant ravens",
    "a swarm of mana-leeches",
    "a group of desert gargoyles",
    "a territorial brass dragon",
    "a pair of swamp trolls",
    "a pack of shadow-panthers",
    "a group of tomb wights",
    "a territorial frost wyrm",
    "a pair of forest griffins",
    "a school of toxic jellyfish",
    "a flock of skeletal ravens",
    "a swarm of clockwork locusts",
    "a group of mountain trolls",
    "a territorial black wyrmling",
    "a pair of cave dryads",
    "a pack of timber wolves",
    "a group of reef merfolk",
    "a territorial stone hydra",
    "a pair of volcanic gargoyles",
    "a school of hammerhead sharks",
    "a flock of sky-harpies",
    "a swarm of shadow-wasps",
    "a group of marsh wights",
    "a territorial copper wyrmling",
    "a pair of crystalline basilisks",
    "a pack of plague-hounds",
    "a group of deep-sea sahuagin",
    "a territorial cave gargoyle",
    "a pair of forest satyrs",
    "a school of ghost-fish",
    "a flock of giant owls",
    "a swarm of bone-wasps",
    "a group of desert wights",
    "a territorial bronze dragon",
    "a pair of swamp hags"
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
    "steal a relic from the central altar",
    "recover the lost crown of the dragon-king",
    "assassinate a high-ranking cult lieutenant",
    "sabotage the enemy's siege engine assembly",
    "transcribe the glyphs from an ancient obelisk",
    "escort a VIP to the safety of the main sanctuary",
    "disarm a ticking magical explosive device",
    "capture a live elemental wisp for research",
    "plant a tracking sigil inside the beast's lair",
    "secure a supply route through the hazardous pass",
    "decode the private journal of the mad baron",
    "retrieve the body of a fallen high paladin",
    "poison the rations of the occupying outpost",
    "negotiate a temporary truce between warring clans",
    "activate the beacon on top of the ruined spire",
    "steal the ledger of the corrupt merchant guild",
    "destroy a cursed mirror that traps souls",
    "forage for the glowing mushrooms needed for an antidote",
    "find a lost heir hiding under a false identity",
    "destroy the skeletal remains of the lich before it revives",
    "intercept a courier carrying troop movements",
    "dismantle a portal linking to the demonic abyss",
    "sabotage the dam to flood the canyon outpost",
    "protect the sacred seed-tree from corruption",
    "retrieve the heart-gem of a dormant colossus",
    "locate the wreckage of the royal skyship",
    "purify the corrupted town well using holy salt",
    "secure the signing of the charter treaty",
    "investigate a series of livestock disappearances",
    "destroy a crop of poisonous blood-roses",
    "steal the blueprints of the fortified dungeon",
    "rescue a group of trapped dwarf miners",
    "assassinate the phantom leader of the outlaws",
    "locate the hidden laboratory of the flesh-sculptor",
    "retrieve a bottled star from the wizard study",
    "deactivate the sentinel cannons guarding the bridge",
    "transcribe the final words of the oracle stele",
    "escort a caravan carrying winter food supplies",
    "capture the rogue war-golem intact",
    "recover the stolen chalice of the sun church",
    "destroy the focus crystal powering the portal",
    "gather information about a secret cult meeting",
    "find the tomb of the legendary general",
    "rescue a captured high-priestess",
    "dismantle a illegal smuggler ring",
    "sabotage the mining operation's blast powder cache",
    "retrieve the head of the alpha wyvern",
    "investigate the strange purple lights in the swamp",
    "secure the main harbor from sea raiders",
    "decode a series of letters between rebel leaders",
    "destroy a localized gravity-well mechanism",
    "retrieve a piece of the falling sky-meteor",
    "find a hidden oasis mentioned in ancient maps",
    "rescue a lost search party in the mountains",
    "investigate a sudden silence in the regional capital",
    "destroy a shrine dedicated to the shadow lord",
    "retrieve a legendary shield from a glacier crack",
    "escort an eccentric researcher to the rift",
    "capture the ringleader of a shadow-assassins guild",
    "sabotage the trade alliance treaty negotiations",
    "recover a load of stolen silver ore",
    "purify a corrupted graveyard that is spawning ghouls",
    "steal the master keys from the warden",
    "investigate a series of earthquakes near the volcano",
    "retrieve a flask of magma-water from the caldera",
    "dismantle a network of magical spying eyes",
    "rescue a druid trapped in a iron cage",
    "find the legendary sword embedded in the rock",
    "sabotage the enemy's war-beast stables",
    "retrieve a map showing hidden trade passages",
    "destroy a corrupted elemental focus crystal",
    "investigate reports of a phantom ship in the bay",
    "secure a peaceful trade agreement with centaur clans",
    "retrieve the diary of a missing archaeologist",
    "dismantle a localized anti-magic field generator",
    "rescue the kidnapped daughter of the magistrate",
    "steal the sacred standard of the enemy army",
    "sabotage a bridge to prevent army movements",
    "retrieve a legendary bow from a treetop nest",
    "investigate the sudden appearance of a crystal spire",
    "secure the mountain pass from frost giants",
    "decode the message scrolls of the enemy general",
    "destroy a cursed sword before it claims another owner",
    "retrieve a bag of ancient, glowing coins",
    "find a lost temple hidden in the dense jungle",
    "rescue an imprisoned rebel writer",
    "dismantle a gang of harbor thieves",
    "sabotage the war-horns of the enemy outpost",
    "retrieve the scale of a ancient blue dragon",
    "investigate the origin of a strange sleep-dust",
    "secure the ruins of a ancient spell-academy",
    "decode a spy's report before the king reads it",
    "destroy a nest of mutated cave crawlers",
    "retrieve a vial of blood from a demon-prince",
    "find a hidden path through the badlands",
    "rescue a caravan trapped in a sandstorm",
    "dismantle a cursed lighthouse before it wrecks more ships",
    "sabotage the cargo docks of the rival merchants",
    "retrieve a legendary shield from the volcano tomb",
    "investigate the haunting of the local orphanage",
    "secure the crown-jewels during a palace coup"
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
    "but the local wildlife has been driven into a blind frenzy",
    "but a thick magic-nullifying field prevents any spellcasting",
    "but the entrance is buried under a recent rockslide",
    "but the area is patrolled by royal air-skiffs",
    "but a heavy localized gravity well slows down all movements",
    "but the objective is trapped behind a riddle door",
    "but an infectious red rot has begun spreading through the walls",
    "but a sudden volcanic eruption has cut off the primary escape route",
    "but the keys were swallowed by a giant cave-crawler",
    "but the primary chambers are completely flooded with acidic water",
    "but the local flora has animated and is actively hostile",
    "but they must do it without setting off the ancient alarms",
    "but a temporal rift causes time to loop every ten minutes",
    "but they only have until midnight before the seals lock forever",
    "but the target is protected by a squad of iron-clad defenders",
    "but the area has been claimed as sacred ground by regional zealots",
    "but a thick sheet of glacial ice blocks the inner sanctum",
    "but the local ley-lines are melting the stone itself",
    "but the air is completely void of oxygen, requiring air tanks",
    "but they are pursued by a relentless bounty hunter team",
    "but a series of illusions makes it impossible to trust your eyes",
    "but the key mechanism requires a drop of royal blood",
    "but any loud noise will cause the ceiling to collapse",
    "but the area is cursed to make anyone who enters slowly lose their memory",
    "but the local faction has set up a massive military perimeter",
    "but the objective is protected by a sleeping ancient drake",
    "but the local well-water is laced with a slow-acting poison",
    "but a thick swamp-mist makes visibility near zero",
    "but the entrance is only accessible during a solar eclipse",
    "but a magical barrier drains magic items of their charges",
    "but the local ground is highly unstable and prone to sinkholes",
    "but they are being watched by invisible spectral eyes",
    "but a dense field of razor-sharp briars blocks the paths",
    "but the local inhabitants have been infected with madness",
    "but the objective is located in the middle of a war-zone",
    "but the keys are held by a high-ranking inquisitor",
    "but the local temperature is freezing enough to shatter steel",
    "but a series of pressure plates activates gas traps",
    "but the path is guarded by an army of stone gargoyles",
    "but the local water is boiling hot due to thermal vents",
    "but the entrance is warded to incinerate anyone who does not speak the password",
    "but a thick cloud of ash makes breathing impossible",
    "but the objective is locked inside a floating obsidian block",
    "but the local gravity shifts ninety degrees every few minutes",
    "but the area is surrounded by a dense field of explosive runes",
    "but any spell cast in the area triggers a wild magic surge",
    "but a phantom fog causes travelers to experience waking nightmares",
    "but the local fauna has been mutated by raw aether spills",
    "but the path requires crossing a decaying rope bridge over a chasm",
    "but the key is hidden inside the stomach of a giant serpent",
    "but the inner doors are sealed by a lock that requires three keys",
    "but the local structure is guarded by a sleeping golem",
    "but the air is filled with a sweet gas that causes deep sleep",
    "but the area is haunted by a banshee whose wails stun travelers",
    "but the local water has been turned to blood by a curse",
    "but the path is blocked by a massive, moving wall labyrinth",
    "but the objective is protected by a shield of cold-fire",
    "but a series of localized earthquakes is destroying the walls",
    "but the key is in the possession of a rival adventurer group",
    "but the entrance is only visible when viewed in a mirror",
    "but a magical ward prevents anyone from leaving once they enter",
    "but the local stone is highly magnetic, pulling iron weapons away",
    "but the area is infested with a swarm of rust monsters",
    "but the path is guarded by an army of spectral warriors",
    "but a sudden flash-flood has filled the lower tunnels",
    "but the local temperature is hot enough to melt lead",
    "but the entrance is hidden behind a waterfall of liquid silver",
    "but the local flora releases spores that cause blindness",
    "but the objective is protected by a sentinel that mirrors your moves",
    "but the area is cursed to reverse the effects of all healing spells",
    "but the path requires solving a musical puzzle using standing stones",
    "but a thick sheet of obsidian glass seals the vaults",
    "but the local ley-lines are sparking, causing lightning strikes",
    "but the keys have been scattered across the swamp",
    "but the entrance is guarded by a pack of phase-wolves",
    "but the local inhabitants are highly suspicious of outsiders",
    "but a magic circle drains the life-force of anyone who stands in it",
    "but the path is blocked by a massive pile of burning rubble",
    "but the objective is guarded by a giant, multi-eyed cave crawler",
    "but the local air contains a gaseous poison that corrodes armor",
    "but the entrance requires a password that has been forgotten for centuries"
];

function combine(arr1, arr2) {
    const res = [];
    for (const a of arr1) {
        for (const b of arr2) {
            res.push(`${a} ${b}`);
        }
    }
    return res;
}

const RAW_POI_TEMPLATES = {
    crypt: {
        adj1: ['ashen', 'sepulchral', 'tomb-cold', 'hallowed', 'defiled', 'silent', 'dust-choked', 'dread-filled', 'spectral', 'mummified'],
        adj2: ['necrotic', 'unconsecrated', 'decayed', 'shadowy', 'forgotten', 'cold', 'grim', 'dormant', 'forbidden', 'haunted'],
        noun1: ['ancestral', 'royal', 'plundered', 'ancient', 'forgotten', 'secret', 'lordly', 'shadowy', 'cursed', 'blighted'],
        noun2: ['mausoleum', 'ossuary', 'catacomb', 'sepulcher', 'charnel-house', 'tomb-vault', 'sarcophagus hall', 'crypt complex', 'burial shaft', 'tomb'],
        sight1: ['dust-covered stone sarcophagi', 'orderly walls of stacked skulls', 'cracked paving stones', 'flickering cold-blue candles', 'heavy iron chains', 'urns filled with silver ash'],
        sight2: ['carved with agonized effigies', 'looking out with empty sockets', 'stained with old embalming oils', 'burning without melting down', 'wrapped around stone coffins', 'lining the dark alcoves'],
        sound1: ['the dry scraping', 'faint rhythmic weeping', 'a low whistling draft', 'distant clicking', 'a soft rattling'],
        sound2: ['of stone on stone', 'echoing from the deepest vault', 'like a dying breath', 'of skeletal joints', 'of loose iron fittings'],
        smell1: ['dust and dry bone', 'musty earth', 'sharp metallic scent', 'stagnant air'],
        smell2: ['mixed with bitter myrrh', 'and centuries-old decay', 'of cold stone', 'of old damp burial soil'],
        secret1: ['a loose brick', 'a hidden lever', 'runes that glow', 'a pressure plate', 'a hollow stone', 'a fake skull', 'a weeping statue', 'a sliding slab'],
        secret2: ['hiding a copper key', 'shaped like a stone hand', 'radiating warm light', 'triggering an arrow trap', 'containing a family heirloom', 'unlocking a hidden compartment', 'revealing a chest of gold coins', 'masking an escape tunnel']
    },
    keep: {
        adj1: ['battle-scarred', 'fortified', 'crenellated', 'crumbling', 'defiant', 'imposing', 'forbidding', 'wind-swept', 'shattered', 'besieged'],
        adj2: ['iron-clad', 'moss-hung', 'abandoned', 'stout', 'ruined', 'weather-worn', 'grim', 'dilapidated', 'monumental', 'hollow'],
        noun1: ['military', 'imperial', 'royal', 'frontier', 'border', 'shattered', 'decayed', 'ancient', 'forgotten', 'lordly'],
        noun2: ['bastion', 'keep', 'citadel', 'outpost', 'fortress', 'garrison', 'stronghold', 'barracks', 'lookout', 'tower'],
        sight1: ['toppled stone battlements', 'rusted iron portcullises', 'narrow arrow slits', 'weather-worn coats of arms', 'cracked ballista frames', 'dreaded defensive trenches'],
        sight2: ['looking over the valleys', 'reinforced with iron bars', 'cluttered with broken spears', 'carved above the main gateway', 'positioned at the bastions', 'filled with thorny briars'],
        sound1: ['the structural groan', 'distant iron chains', 'the constant flapping', 'the metallic scraping'],
        sound2: ['of timber under wind', 'rattling in empty wells', 'of tattered war banners', 'of loose portcullis cogs'],
        smell1: ['rust and damp soot', 'old leather and oil', 'stagnant pool water', 'stale grease'],
        smell2: ['mixed with charcoal smoke', 'and dry wood rot', 'collected in stone basins', 'and damp hemp rope'],
        secret1: ['a subterranean tunnel', 'a hidden wall cache', 'a false floor stone', 'a hidden murder hole', 'a secret loose brick', 'a rotating torch holder', 'a hollow shield display', 'a loose stone slab'],
        secret2: ['leading to a nearby ravine', 'containing old military orders', 'concealing a hidden treasury', 'providing line-of-sight below', 'hiding a map of the region', 'unlocking a secret stairwell', 'revealing a chest of iron coins', 'opening a hidden escape hatch']
    },
    cave: {
        adj1: ['geothermal', 'sulfur-choked', 'dripping', 'subterranean', 'cavernous', 'echoing', 'stalactite-studded', 'lava-warmed', 'shadowy', 'abyssal'],
        adj2: ['slimy', 'crystal-encrusted', 'unmapped', 'damp', 'chilly', 'mineral-rich', 'ancient', 'pitch-black', 'hollow', 'vibrating'],
        noun1: ['subterranean', 'deep-chasm', 'unexplored', 'crystal', 'volcanic', 'ancient', 'flooded', 'echoing', 'wind-swept', 'shadowy'],
        noun2: ['cavern', 'grotto', 'fissure', 'abyss', 'sinkhole', 'cave', 'tunnel', 'chasm', 'lava tube', 'pocket'],
        sight1: ['crystalline sulfur deposits', 'steaming vapor vents', 'interlocking stalactite columns', 'deep thermal pools', 'glinting gemstone veins', 'glowing subterranean lichen'],
        sight2: ['glowing with a yellow sheen', 'throwing plumes into the air', 'meeting in the dark ceiling', 'bubbling with mineral mud', 'tracing the rocky walls', 'pulsing with a sickly light'],
        sound1: ['the deep bubbling', 'frequent water droplets', 'the low constant hiss', 'the sudden fluttering'],
        sound2: ['of boiling mineral mud', 'falling into deep pools', 'of high-pressure steam', 'of bat wings overhead'],
        smell1: ['rotten sulfur gas', 'damp wet clay', 'superheated basalt rock', 'stagnant cave mold'],
        smell2: ['and boiling steam vents', 'mixed with bat guano', 'and dry mineral dust', 'released from wet stone'],
        secret1: ['a narrow wall squeeze', 'a thermal gas pocket', 'a hidden pool', 'a fragile mineral crust', 'a loose boulder', 'a hollow stalagmite', 'a hidden rock crevice', 'a seismic fault line'],
        secret2: ['leading to a silver vein', 'venting hot air on a cycle', 'of cool drinkable water', 'concealing fossilized bones', 'hiding a cache of raw gems', 'containing ancient tools', 'revealing a lower tunnel', 'blocking a volcanic vent']
    },
    temple: {
        adj1: ['sunken', 'sacred', 'blasphemous', 'silt-smothered', 'monumental', 'algae-draped', 'revered', 'forgotten', 'hieroglyphic', 'consecrated'],
        adj2: ['heretical', 'monolithic', 'gilded', 'ancient', 'sacrosanct', 'hallowed', 'unearthly', 'ruined', 'vaulted', 'mystical'],
        noun1: ['divine', 'forgotten', 'sacred', 'ruined', 'lost', 'imperial', 'sunken', 'blighted', 'ancient', 'stellar'],
        noun2: ['sanctuary', 'ziggurat', 'cathedral', 'shrine', 'basilica', 'pantheon', 'temple', 'altar', 'chapel', 'dome'],
        sight1: ['monolithic stone statues', 'faded colored murals', 'smooth ceremonial altars', 'glowing magical glyphs', 'bronze offering bowls', 'shattered stained glass'],
        sight2: ['encrusted with river silt', 'depicting stellar alignments', 'worn by centuries of use', 'pulsing under wet moss', 'filled with petrified fruit', 'representing sky deities'],
        sound1: ['the distant drip', 'a strange hum', 'the quiet settling', 'a ghostly chorus'],
        sound2: ['through cracked ceilings', 'from the stone altars', 'of silt on flagstones', 'of low-frequency chords'],
        smell1: ['stagnant river weed', 'fossilized frankincense', 'old copper fixtures', 'heavy ceremonial oils'],
        smell2: ['and damp limestone rock', 'burning without smoke', 'tasting of metallic rust', 'scenting the humid air'],
        secret1: ['a stone pressure plate', 'a solar reflection mirror', 'a secret compartment', 'a sliding false wall', 'a hollow idol base', 'a loose altar stone', 'a hidden wall alcove', 'a rotating column'],
        secret2: ['beneath the offering basin', 'using light alignments', 'beneath the main altar', 'opened by a musical chord', 'containing ancient scriptures', 'revealing a ritual dagger', 'hiding a golden goblet', 'opening a passage below']
    },
    mine: {
        adj1: ['rickety', 'flooded', 'shored-up', 'collapsed', 'unstable', 'vein-rich', 'abyssal', 'deep-shaft', 'rust-eaten', 'unmapped'],
        adj2: ['abandoned', 'barren', 'dreaded', 'dark', 'stifling', 'dusty', 'hollow', 'unsafe', 'forgotten', 'rich'],
        noun1: ['underground', 'deep-earth', 'abandoned', 'collapsed', 'rich-ore', 'royal', 'forgotten', 'flooded', 'dwarven', 'unsafe'],
        noun2: ['excavation', 'shaft', 'quarry', 'delve', 'tunnel', 'works', 'grid', 'mine', 'pit', 'chamber'],
        sight1: ['rotting wooden struts', 'derailed ore carts', 'deep vertical shafts', 'glimmering pyrite veins', 'discarded iron picks', 'crude hoisting engines'],
        sight2: ['holding back loose stone', 'rusting on iron tracks', 'plunging into darkness', 'tracing the rocky walls', 'half-buried in scree piles', 'fitted with frayed ropes'],
        sound1: ['the terrifying groan', 'faint hollow echoes', 'the distant splash', 'the sudden rattle'],
        sound2: ['of settling heavy timbers', 'of picks hitting stone', 'of water in the depths', 'of loose falling pebbles'],
        smell1: ['damp coal dust', 'metallic iron rust', 'stagnant pool mold', 'bitter blasting powder'],
        smell2: ['and wet pine wood', 'clinging to the air', 'coating the rock walls', 'lingering in the shafts'],
        secret1: ['a hidden dynamite box', 'a stable side tunnel', 'an unmapped vein', 'a miner\'s diary cache', 'a loose rock face', 'a hollow support beam', 'a hidden floor grate', 'a steel lockbox'],
        secret2: ['containing blasting tools', 'bypassing the main collapse', 'of pure silver ore', 'detailing structural faults', 'concealing a dwarf skeleton', 'holding emergency rations', 'leading to a lower level', 'stuffed with gold nuggets']
    },
    tower: {
        adj1: ['shattered', 'sky-piercing', 'toppled', 'magical', 'arcane', 'astrological', 'warded', 'gilded', 'ruined', 'weather-beaten'],
        adj2: ['isolated', 'resonant', 'tilted', 'looming', 'ancient', 'forgotten', 'spectral', 'towering', 'glowing', 'silent'],
        noun1: ['wizard', 'arcane', 'astrological', 'imperial', 'forgotten', 'shattered', 'floating', 'royal', 'stellar', 'sigil-marked'],
        noun2: ['spire', 'turret', 'observatory', 'tower', 'column', 'monolith', 'minaret', 'keep', 'study', 'pinnacle'],
        sight1: ['spiral stone staircases', 'floating masonry pieces', 'shattered crystal alembics', 'runic summoning circles', 'shelves of spell scrolls', 'massive brass astrolabes'],
        sight2: ['ending in the open sky', 'suspended in static fields', 'littering the study floors', 'radiating a soft light', 'crumbling at a light touch', 'pointing at a blank ceiling'],
        sound1: ['the high-pitched hum', 'pages of spellbooks', 'the constant chime', 'the low rhythmic whine'],
        sound2: ['of magical static energy', 'fluttering in the wind', 'of invisible glass bells', 'of a gravity well'],
        smell1: ['burned ozone gas', 'sweet lavender water', 'metallic quicksilver', 'charred sulfur wax'],
        smell2: ['and chemical salts', 'clinging to old dust', 'spilled on the floorboards', 'hanging in the study'],
        secret1: ['a levitation circle', 'a hidden table drawer', 'a brass telescope', 'a command word scroll', 'a false book lever', 'a hidden wall safe', 'a loose floor tile', 'a hollow stone pillar'],
        secret2: ['activated by a command', 'hidden in a hollow leg', 'revealing invisible stars', 'tucked inside a grimoire', 'opening a revolving wall', 'containing spell scrolls', 'covering an arcane focus', 'housing a pocket dimension']
    },
    ruins: {
        adj1: ['ivy-strangled', 'overgrown', 'weathered', 'abandoned', 'hollowed-out', 'haunted', 'skeletal', 'scattered', 'moss-covered', 'ancient'],
        adj2: ['crumbling', 'forgotten', 'decayed', 'silent', 'desolate', 'ruined', 'tumbledown', 'shattered', 'dilapidated', 'wild'],
        noun1: ['abandoned', 'ruined', 'lost', 'overgrown', 'forgotten', 'colonial', 'ancient', 'manorial', 'spectral', 'shattered'],
        noun2: ['hamlet', 'manor', 'settlement', 'ruins', 'township', 'plaza', 'estate', 'village', 'hall', 'colony'],
        sight1: ['stone hearth chimneys', 'abandoned iron tools', 'cobbled streets', 'shattered water wells', 'split stone monuments', 'hollow window frames'],
        sight2: ['standing without houses', 'fossilized under dirt', 'split by massive roots', 'choked with wild weeds', 'dedicated to old victories', 'looking out like empty eyes'],
        sound1: ['the sigh of wind', 'the skittering noise', 'a faint echo', 'the constant rustle'],
        sound2: ['through empty doors', 'of nesting small animals', 'of playing children', 'of wild ivy leaves'],
        smell1: ['wet green moss', 'damp wood ash', 'sweet wild berries', 'decayed thatch grass'],
        smell2: ['and decaying leaves', 'and forest humus soil', 'growing over the stones', 'mixed with wet sod mud'],
        secret1: ['a bricked-up cellar', 'a buried iron chest', 'a traveler\'s diary', 'a hollow stone cavity', 'a false well bottom', 'a loose hearth stone', 'a hidden wall niche', 'a hollow tree trunk'],
        secret2: ['hidden beneath wild ivy', 'beneath the central hearth', 'detailing the final night', 'containing family gold', 'leading to a root cellar', 'opening a lockbox space', 'holding an old silver ring', 'housing a cache of arrows']
    },
    shrine: {
        adj1: ['sacred', 'pristine', 'elemental', 'revered', 'weather-worn', 'quiet', 'solitary', 'humming', 'blessed', 'isolated'],
        adj2: ['mystical', 'untouched', 'hallowed', 'glowing', 'silent', 'ancient', 'peaceful', 'forgotten', 'pristine', 'stellar'],
        noun1: ['elemental', 'divine', 'sacred', 'forgotten', 'shrine', 'altar', 'monument', 'sanctuary', 'stele', 'statuary'],
        noun2: ['altar', 'shrine', 'monument', 'stele', 'statuary', 'pillar', 'basin', 'alcove', 'niche', 'stone'],
        sight1: ['clean stone basins', 'thousands of bronze coins', 'glowing incense burners', 'polished opal statues', 'fresh flower wreaths', 'vibrant silk ribbons'],
        sight2: ['filled with fresh water', 'thrown around the stone', 'still warm to the touch', 'looking toward the sun', 'left by unknown travelers', 'tied to nearby branches'],
        sound1: ['the gentle crackle', 'a constant chime', 'absolute silent air', 'a soft resonance'],
        sound2: ['of eternal blue flames', 'like wind in glass', 'as if wind is banned', 'like struck crystal bowls'],
        smell1: ['pine and myrrh', 'sandalwood oil', 'sweet wildflowers', 'fresh ozone scent'],
        smell2: ['and clean mountain snow', 'burning on the altar', 'filling the quiet glade', 'rising from the spring'],
        secret1: ['a divine blessing', 'a hollow space', 'a purifying fountain', 'an alignment trigger', 'a hidden floor grate', 'a sliding stone step', 'a loose wall panel', 'a hollow bronze icon'],
        secret2: ['guarding against storms', 'containing old scriptures', 'cleansing all poisons', 'activated by sunbeams', 'holding a silver chalice', 'revealing a healing potion', 'hiding a scroll of protection', 'opening a path to a spring']
    },
    barrow: {
        adj1: ['earthen', 'ancestral', 'spectral', 'mist-wrapped', 'grassy', 'hallowed', 'megalithic', 'grim', 'ancient', 'forgotten'],
        adj2: ['tomb-like', 'barrow-cold', 'sacred', 'overgrown', 'silent', 'dread-filled', 'hollow', 'stony', 'weathered', 'grim'],
        noun1: ['tribal', 'warrior', 'royal', 'ancestral', 'forgotten', 'ancient', 'megalithic', 'earthen', 'spectral', 'grim'],
        noun2: ['barrow mound', 'burial mound', 'cairn', 'tumulus', 'stone circle', 'earthwork', 'tomb', 'slab', 'grave', 'cist'],
        sight1: ['massive standing stones', 'low stone lintels', 'rusted bronze swords', 'sleeping dragon earthworks', 'cracked clay jars', 'dark slate panels'],
        sight2: ['covered in spiral carvings', 'opening into the mound', 'laid across burial stones', 'viewed from high above', 'containing decayed grains', 'carved with tribal runes'],
        sound1: ['a deep hum', 'low whispers', 'the dry crunch', 'the high whistle'],
        sound2: ['vibrating in the ground', 'in an ancient dialect', 'of grass in the wind', 'of wind through stones'],
        smell1: ['rich wet soil', 'stagnant tomb air', 'old cold copper', 'musty peat moss'],
        smell2: ['and wild heather flowers', 'locked away for ages', 'and oxidized bronze', 'filling the stone room'],
        secret1: ['a ceremonial spear', 'a secondary chamber', 'a lightning curse', 'a key-stone map', 'a loose stone slab', 'a hollow cairn rock', 'a hidden earth vault', 'a bronze lockbox'],
        secret2: ['bypassing spectral armor', 'beneath the main slab', 'aimed at gold thieves', 'showing tomb locations', 'covering a gold crown', 'containing a runic ring', 'holding ancient jewelry', 'opening a weapon cache']
    },
    shipwreck: {
        adj1: ['barnacle-encrusted', 'wrecked', 'waterlogged', 'shattered', 'sunken', 'rusting', 'haunted', 'tangled', 'decayed', 'deep-sea'],
        adj2: ['reef-locked', 'salt-cured', 'forgotten', 'broken', 'ruined', 'barnacled', 'silent', 'briny', 'drowned', 'shattered'],
        noun1: ['merchant', 'pirate', 'royal', 'smuggler', 'sunken', 'shattered', 'ancient', 'naval', 'ruined', 'ghost'],
        noun2: ['hulk', 'wreckage', 'galleon', 'vessel', 'skeleton', 'brig', 'frigate', 'clipper', 'keel', 'ship'],
        sight1: ['ribs of oak timbers', 'rusted iron anchors', 'shattered cargo crates', 'bronze figureheads', 'ship bells', 'torn canvas flags'],
        sight2: ['protruding from the sand', 'draped in sheets of kelp', 'spilling old glass wares', 'looking up through water', 'encrusted with green coral', 'fluttering in the current'],
        sound1: ['the creak of wood', 'bubbles rising slowly', 'the metallic clink', 'the low tide hum'],
        sound2: ['in the ocean current', 'from rusted iron hulls', 'of chains in the surf', 'through open gunports'],
        smell1: ['brine and kelp', 'salt-cured tar', 'rust and wet sand', 'rotting sea weed'],
        smell2: ['and decaying fish scales', 'clinging to the timbers', 'released by the waves', 'filling the damp hold'],
        secret1: ['a captain\'s cabin box', 'a hidden hold cavity', 'an ancient sea chart', 'the final logbook', 'a hollow timber beam', 'a loose deck plank', 'a hidden copper key', 'a steel strongbox'],
        secret2: ['containing a gold spyglass', 'stuffed with exotic goods', 'showing mythical islands', 'detailing a final mutiny', 'holding a bag of pearls', 'opening a weapon stash', 'found in a shark skull', 'sealed with lead wax']
    },
    labyrinth: {
        adj1: ['impossible', 'geometric', 'minotaur-haunted', 'carved', 'confusing', 'endless', 'symmetrical', 'daedalian', 'labyrinthine', 'sterile'],
        adj2: ['dusty', 'complex', 'winding', 'shifting', 'puzzling', 'ancient', 'hollow', 'silent', 'monolithic', 'smooth'],
        noun1: ['architectural', 'stone-carved', 'monolithic', 'geometric', 'ancient', 'unmapped', 'labyrinthine', 'shifting', 'forgotten', 'daedalian'],
        noun2: ['maze', 'labyrinth', 'grid', 'puzzle', 'network', 'corridors', 'halls', 'paths', 'dead-ends', 'structure'],
        sight1: ['smooth granite walls', 'carved wall arrows', 'mysterious blood trails', 'overhead mirror plates', 'bones of past delvers', 'seamless stone joins'],
        sight2: ['rising fifteen feet high', 'pointing in circles', 'vanishing at dead ends', 'showing distorted layouts', 'clutching drawing tools', 'grown without any seams'],
        sound1: ['the delayed echo', 'heavy stone grinding', 'a low breathing', 'the metallic click'],
        sound2: ['of your own footsteps', 'of shifting wall blocks', 'around the dark corner', 'of pressure floor tiles'],
        smell1: ['clean limestone dust', 'wild thyme herbs', 'beast den mud', 'cold granite oil'],
        smell2: ['and stone grease lubricant', 'growing in wall cracks', 'clinging to the floor', 'hanging in the corridors'],
        secret1: ['a wall tile pattern', 'an architect\'s notes cache', 'a central pillar altar', 'a hidden ceiling hatch', 'a loose corner block', 'a rotating statue guide', 'a false wall panel', 'a pressure-plate map'],
        secret2: ['indicating the correct path', 'hidden in a wall pocket', 'requiring a blood drop', 'leading to the core rooms', 'revealing a map scrolls', 'pointing to the exit path', 'hiding a master crystal', 'showing the trap triggers']
    },
    outpost: {
        adj1: ['forgotten', 'barricaded', 'isolated', 'tactical', 'weather-beaten', 'strategic', 'abandoned', 'fortified', 'decayed', 'border-line'],
        adj2: ['lonely', 'rugged', 'crenellated', 'shabby', 'military', 'grim', 'silent', 'wind-swept', 'cold', 'stout'],
        noun1: ['frontier', 'border', 'military', 'abandoned', 'strategic', 'scout', 'watch', 'fortified', 'royal', 'desert'],
        noun2: ['watchpost', 'redoubt', 'blockhouse', 'outpost', 'palisade', 'rampart', 'garrison', 'fort', 'station', 'tower'],
        sight1: ['rotting wooden palisades', 'empty watch platforms', 'abandoned bedroll layouts', 'cold ash braziers', 'signal mirror tripods', 'military registry books'],
        sight2: ['reinforced with dry stone', 'looking over trade routes', 'littered with game dice', 'holding half-burnt wood', 'pointing to the horizon', 'showing missed shipments'],
        sound1: ['the whistling wind', 'a creaking gate', 'pebbles falling down', 'the rhythmic clinking'],
        sound2: ['through tower gaps', 'on rusted iron hinges', 'from crumbling walls', 'of a loose flagpole cable'],
        smell1: ['wood smoke and pork', 'musty blankets grease', 'wet horse hair', 'old oil lamp soot'],
        smell2: ['and dry pine timber', 'clinging to the barracks', 'filling the stables', 'lingering in the air'],
        secret1: ['a loose floorboard stash', 'a hidden maps cache', 'a signal mirror code', 'a training sword hilt', 'a hollow wall log', 'a false drawer bottom', 'a hidden wall stone', 'a steel ammunition case'],
        secret2: ['holding emergency rations', 'showing regional bandit camps', 'pointing to the capital', 'containing a cipher sheet', 'revealing a gold pouch', 'hiding patrol schedules', 'opening a key compartment', 'containing healing potions']
    },
    crystal_cave: {
        adj1: ['resonant', 'blazing', 'prismatic', 'humming', 'magical', 'geode-like', 'vitreous', 'luminous', 'mana-soaked', 'shimmering'],
        adj2: ['crystalline', 'vibrant', 'pulsing', 'glassy', 'charged', 'resonant', 'beautiful', 'magical', 'cold', 'glowing'],
        noun1: ['crystalline', 'geode', 'prismatic', 'mana-charged', 'resonant', 'elemental', 'glowing', 'magic', 'deep-earth', 'sparkling'],
        noun2: ['cavern', 'vault', 'grotto', 'hollow', 'rift', 'cave', 'chamber', 'pocket', 'vein', 'geode'],
        sight1: ['giant purple crystals', 'rainbow reflection walls', 'sparkling mineral dust', 'pink liquid magic pools', 'crystal clusters on wood', 'shifting matrix crystals'],
        sight2: ['jutting like giant pillars', 'reflecting light patterns', 'floating in the calm air', 'glowing with a soft light', 'growing over petrified log', 'mirroring your movements'],
        sound1: ['a musical vibration', 'the high-pitched hum', 'crystal shards breaking', 'a delicate chiming'],
        sound2: ['echoing through the vault', 'of raw mana static', 'underfoot with a glass ping', 'in the light drafts'],
        smell1: ['ozone and rosewater', 'fresh rain scent', 'cold mineral dust', 'charged static air'],
        smell2: ['and sweet chemical salts', 'after a lightning strike', 'clinging to the crystals', 'mixed with wild mint'],
        secret1: ['an energy-absorbing crystal', 'a ley-focus node', 'mutated mana shards', 'a sound crystal puzzle', 'a hollow geode stone', 'a loose crystal cluster', 'a glowing wall pocket', 'a hidden crystal key'],
        secret2: ['releasing light on command', 'recharging magic spell slots', 'exploding when struck hard', 'opening a hidden pathway', 'containing raw diamond dust', 'hiding a scroll of light', 'revealing a magical ring', 'unlocking a stone chest']
    },
    fey_circle: {
        adj1: ['sparkling', 'bewildering', 'fey-kissed', 'glowing', 'fungal', 'verdant', 'dreamlike', 'illusory', 'enchanted', 'moss-woven'],
        adj2: ['bewitching', 'fairy-like', 'verdant', 'misty', 'shimmering', 'dreamy', 'lush', 'wild', 'overgrown', 'beautiful'],
        noun1: ['fairy', 'druidic', 'fey-realm', 'mushroom', 'verdant', 'mystical', 'enchanted', 'whispering', 'glade', 'willow'],
        noun2: ['circle', 'ring', 'glade', 'grove', 'node', 'hollow', 'meadow', 'pool', 'circle', 'circle'],
        sight1: ['bioluminescent mushrooms', 'floating glowing spores', 'rapidly blooming flowers', 'rainbow-shimmering mist', 'natural root archways', 'dew-covered webs'],
        sight2: ['forming a perfect ring', 'moving like fireflies', 'closing when approached', 'clinging to the grass', 'made of ancient elder wood', 'trapping butterfly wings'],
        sound1: ['faint distant music', 'whispering leaf rustles', 'fairy dust hums', 'bluebell chimes'],
        sound2: ['of unseen stringed harps', 'sounding like voices', 'vibrating in the air', 'ringing in light drafts'],
        smell1: ['nectar and honeysuckle', 'earthy mushroom peat', 'fresh mint pine', 'wild clover cider'],
        smell2: ['and damp green forest moss', 'mixed with wet humus soil', 'scenting the warm glade', 'clinging to the air'],
        secret1: ['a twilight fey path', 'a levitation mushroom', 'a desire-reflecting pool', 'a fragile fey gift', 'a hidden tree hollow', 'a rotating flower step', 'a loose root panel', 'a hollow mushroom stem'],
        secret2: ['leading into the Feywild', 'granting temporary flight', 'showing your true dreams', 'turning to dry leaves outside', 'holding a silver lute', 'revealing fairy gold', 'hiding an elven ring', 'housing a friendly sprite']
    },
    astral_rift: {
        adj1: ['cosmic', 'shimmering', 'rifted', 'alien', 'temporal', 'void-touched', 'stellar', 'gravitational', 'extra-dimensional', 'abyssal'],
        adj2: ['void', 'cosmic', 'stellar', 'rifted', 'alien', 'weightless', 'cold', 'glowing', 'silent', 'unearthly'],
        noun1: ['astral', 'void', 'space-time', 'dimensional', 'cosmic', 'alien', 'stellar', 'gravitational', 'unearthly', 'rifted'],
        noun2: ['rift', 'tear', 'anchor', 'fold', 'portal', 'void', 'crack', 'breach', 'split', 'vacuum'],
        sight1: ['space-time tears', 'floating weightless stones', 'shattered void glass', 'multi-directional shadows', 'glowing stardust plumes', 'orbiting geometric rocks'],
        sight2: ['showing swirling nebulae', 'drifting in gravity pockets', 'orbiting in flat rings', 'cast from one light source', 'drifting like violet smoke', 'circling the central tear'],
        sound1: ['a deep vacuum roar', 'alien mind whispers', 'the crackle noise', 'a heavy cosmic pulse'],
        sound2: ['that doesn\'t move the air', 'bypassing the ears directly', 'of tearing space fabric', 'beating in a slow rhythm'],
        smell1: ['void dust metal', 'complete lack of scent', 'ozone static', 'stardust fire'],
        smell2: ['and burning cosmic gas', 'making you feel light-headed', 'tasting of metallic copper', 'hanging in the cold vacuum'],
        secret1: ['a time-viewing portal', 'an alien metal relic', 'a gravity-reversal zone', 'a telepathic rift node', 'a floating glass shard', 'a loose stellar block', 'a glowing void pocket', 'a hidden dimensional key'],
        secret2: ['looking briefly into the future', 'carved with star coordinates', 'where you can walk on walls', 'granting mind-sight temporarily', 'containing cosmic energy', 'hiding a void dagger', 'revealing a stellar map', 'unlocking a floating safe']
    }
};

const POI_DICTIONARIES = {};
for (const [key, t] of Object.entries(RAW_POI_TEMPLATES)) {
    POI_DICTIONARIES[key] = {
        adj: combine(t.adj1, t.adj2),
        nouns: combine(t.noun1, t.noun2),
        sights: combine(t.sight1, t.sight2),
        sounds: combine(t.sound1, t.sound2),
        smells: combine(t.smell1, t.smell2),
        secrets: combine(t.secret1, t.secret2)
    };
}

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
                `An underwater gate has begun pulsing; ${char1.name} believes it leads to a rift guarded by ${creature}.`,
                `An underwater volcano has active vents, and ${char1.name} thinks it's caused by ${creature}.`,
                `A glowing beacon was spotted deep underwater; ${char1.name} wants to use ${char1.possession} to reach it, ${complication}.`,
                `A massive whirlpool formed near the shipping lanes; ${char1.name} claims it is the nest of ${creature}.`,
                `A fleet of ${ship1} vessels has blockaded the harbor, and ${char1.name} wants to help bypass them to ${objective}.`,
                `A mysterious island rose from the sea; ${char1.name} is looking for a crew to explore it before it sinks, ${complication}.`,
                `The wreckage of a legendary ${ship1} was found; ${char1.name} wants to retrieve a chest from it, ${complication}.`,
                `Bizarre whale songs are driving sailors mad; ${char1.name} believes they are caused by ${creature}.`,
                `A smuggling crew led by ${char1.name} claims their underwater cave was stolen by ${creature}.`,
                `A tidal wave washed up a strange artifact; ${char1.name} wants to deliver it to a buyer to ${objective}, ${complication}.`,
                `A pod of friendly dolphins is guiding boats to a reef where ${char1.name} believes a treasure lies, ${complication}.`,
                `An ancient lighthouse has begun flashing red; ${char1.name} fears it is a signal to summon ${creature}.`,
                `A legendary navigator, ${char1.name}, claims to know the way to a sunken city but requires help to fight off ${creature}.`,
                `A ghost fleet of ${ship1} and ${ship2} has been seen sailing in circles; ${char1.name} wants to investigate.`,
                `Sea-elves led by ${char1.name} are recruiting mercenaries to protect their reef villages from ${creature}.`,
                `A merchant offering massive gold claims his cargo was plundered by ${char1.name} sailing a ${ship1}, ${complication}.`,
                `A cursed anchor has locked a royal ${ship1} in place; ${char1.name} needs help to break the curse before ${creature} arrives.`,
                `An underwater ley-line fissure is superheating the bay; ${char1.name} is hiring divers to seal it, ${complication}.`,
                `A rare, glowing coral reef is being destroyed; ${char1.name} blames the nesting behavior of ${creature}.`,
                `A floating tavern built on three hulls is looking for guards; ${char1.name} expects an attack by ${creature} tonight.`,
                `A local map collector is hiring guards to help ${char1.name} chart a deep ocean trench, ${complication}.`
            ],
            arid: [
                `A sudden sandstorm uncovered the tip of an obsidian obelisk; ${char1.name} wants to retrieve it to ${objective}, ${complication}.`,
                `A trade caravan led by ${char1.name} vanished; ${char2.name} suspects they were ambushed by ${creature}.`,
                `Nomads led by ${char1.name} warn that ${creature} is stalking travelers near the water holes.`,
                `An ancient sandstone temple has opened; ${char1.name} claims it is the only place to ${objective}, ${complication}.`,
                `Outlaws have set up camp in the mesas; ${char1.name} is offering their weapon if you help defeat them, ${complication}.`,
                `The central spring of the local oasis has turned pitch black; ${char1.name} believes ${creature} has poisoned it.`,
                `A desert nomad, ${char1.name}, discovered a hidden entrance to a tomb beneath the dunes, ${complication}.`,
                `The guardian of a desert oasis, ${char1.name}, is looking for heroes to help them hunt down ${creature}.`,
                `A massive glass dome was uncovered by the wind; ${char1.name} wants to go inside to ${objective}, ${complication}.`,
                `A sand-merchant claims his caravan was swallowed by a sinkhole, and ${char1.name} wants to salvage the cargo.`,
                `A strange cactus forest has begun growing rapidly; ${char1.name} believes it is controlled by ${creature}.`,
                `The desert winds have begun whispering names; ${char1.name} claims they belong to the victims of ${creature}.`,
                `An outlaw band led by ${char1.name} has stolen the town's water supply, and ${char2.name} wants help to recover it.`,
                `A legendary desert guide, ${char1.name}, was captured by bandits who want to force them to ${objective}.`,
                `A mysterious mirror-like structure in the dunes reflects a different world; ${char1.name} wants to investigate, ${complication}.`,
                `A giant sand-worm nest has blocked the main trade road; ${char1.name} is hiring hunters to clear it, ${complication}.`,
                `A local scholar, ${char1.name}, claims an ancient sandstone tablet holds the coordinates to a lost city.`,
                `A sulfurous steam vent has opened near a village; ${char1.name} believes it was dug by ${creature} underground.`,
                `A pack of ravenous desert predators is hunting cattle; ${char1.name} is offering a bounty for their pelts.`,
                `A glowing meteor crashed in the deep desert; ${char1.name} wants to retrieve it using ${char1.possession}, ${complication}.`,
                `A ruined canyon fort is being used as a base by ${creature}; ${char1.name} wants to clear it to ${objective}.`,
                `A merchant caravan led by ${char1.name} is looking for guards to protect them from dune-raiders.`,
                `A strange blue fire has begun burning in the canyons; ${char1.name} believes it is a ritual to summon ${creature}.`,
                `A lost traveler, ${char1.name}, claims to have survived a night inside a temple ruled by ${creature}.`,
                `A massive sandstone bridge has collapsed; ${char1.name} suspects it was sabotaged by agents of ${creature}.`,
                `A local mining camp has been abandoned; ${char1.name} wants to go back to retrieve their tools, ${complication}.`
            ],
            mountain: [
                `A group of miners led by ${char1.name} broke through into a cavern filled with ${creature}.`,
                `Howling winds passing through the ridges carry a melody; ${char1.name} believes it is the voice of ${creature}.`,
                `A local watchpost was crushed by a rockslide; ${char1.name} claims it was triggered by ${creature}.`,
                `A crystalline mineral vein has begun growing, which ${char1.name} wants to harvest to ${objective}, ${complication}.`,
                `High peak hermits report that stars are shifting; ${char1.name} believes ${creature} is being summoned.`,
                `A group of mountain climbers led by ${char1.name} has gone missing near the summit; ${char2.name} is organizing a rescue.`,
                `An ancient stone fortress on the peaks is glowing at night; ${char1.name} wants to investigate, ${complication}.`,
                `A massive avalanche has blocked the main pass; ${char1.name} suspects it was caused by ${creature}.`,
                `A legendary forge built inside a volcano is rumored to still work; ${char1.name} wants to use it to ${objective}.`,
                `A flock of flying predators has nested near the trade trails; ${char1.name} is looking for archers to clear them.`,
                `A quiet mountain village has been cut off by heavy storms; ${char1.name} is looking for a team to deliver supplies.`,
                `A strange crystal structure has grown on the highest peak; ${char1.name} believes it is a beacon for ${creature}.`,
                `A group of archaeologists led by ${char1.name} discovered a cavern system filled with ancient art, ${complication}.`,
                `A mountain hermit, ${char1.name}, warns that the spirits of the peak are angry because of ${creature}.`,
                `A ruined watchtower is being used as a nest by ${creature}; ${char1.name} wants to clear it, ${complication}.`,
                `A high-altitude sky-ship dock is looking for guards; ${char1.name} fears an attack by flying monsters.`,
                `A deep-shaft mine has breached a nest of ${creature}; ${char1.name} is hiring mercenaries to defend the miners.`,
                `A sacred mountain temple was plundered; ${char1.name} wants to recover the relics from ${creature}, ${complication}.`,
                `A mysterious traveler, ${char1.name}, is looking for a guide to help them reach a hidden valley.`,
                `A pack of wild gryphons is attacking mountain goats; ${char1.name} wants to capture a hatchling, ${complication}.`,
                `A local mapmaker is hiring surveyors to map a high ridge; ${char1.name} claims the area is haunted.`,
                `A sulfurous hot spring has begun boiling; ${char1.name} suspects a volcanic eruption is imminent.`,
                `A group of pilgrims led by ${char1.name} was trapped in a high-pass monastery by ${creature}.`,
                `A legendary sword was spotted embedded in a glacier; ${char1.name} wants to retrieve it using ${char1.possession}.`,
                `A rival adventuring party led by ${char1.name} is heading up the mountain to ${objective}, ${complication}.`
            ],
            woodland: [
                `The druids of the forest circle have gone missing; ${char1.name} warns they were taken by ${creature}.`,
                `A massive, hollow redwood tree is rumored to hide a pathway; ${char1.name} wants to map it to ${objective}, ${complication}.`,
                `A thick, greenish mist is creeping out of the fens, which ${char1.name} claims was released by ${creature}.`,
                `Tangled briars have grown overnight, enclosing the territory of ${creature}, ${complication}.`,
                `Outlaws led by ${char1.name} have fortified the woods; they are seeking recruits to help them fight off ${creature}.`,
                `A local hunter, ${char1.name}, found a cabin filled with strange, glowing cocoons created by ${creature}.`,
                `A forest ranger, ${char1.name}, reports that tree roots are wrapping around roads, and suspects ${creature} is behind it.`,
                `A hidden glade is said to contain a fountain of youth; ${char1.name} wants to find it to ${objective}, ${complication}.`,
                `A group of loggers led by ${char1.name} was attacked by animated trees, and suspects a druid curse.`,
                `A strange, colorful moss is spreading through the woods; ${char1.name} believes it is toxic to animals.`,
                `A local child has wandered into the deep forest; ${char1.name} is organizing a search party before nightfall.`,
                `A ruined druid shrine is glowing with green light; ${char1.name} wants to investigate, ${complication}.`,
                `A pack of mutated wolves is hunting near the forest edge; ${char1.name} is offering a bounty for their pelts.`,
                `A legendary archer, ${char1.name}, is looking for a partner to help them hunt down ${creature}.`,
                `A massive hollow oak tree contains a spiral staircase leading down; ${char1.name} wants to explore it, ${complication}.`,
                `A circle of standing stones is pulsing with magic; ${char1.name} fears it is being used to summon ${creature}.`,
                `A group of wood-elves led by ${char1.name} is protesting the logging operations, claiming it disturbs ${creature}.`,
                `A mysterious herbalist, ${char1.name}, requires rare nightshade mushrooms that only grow in the deep woods.`,
                `A local merchant caravan was ambushed in the forest; ${char1.name} suspects it was the work of outlaws.`,
                `A strange, sweet fog is putting forest animals to sleep; ${char1.name} wants to find the source to ${objective}.`,
                `A sacred grove is being cleared by a greedy builder; ${char1.name} wants to sabotage their equipment, ${complication}.`,
                `A nest of giant spiders has blocked the main road; ${char1.name} is hiring guards to clear it, ${complication}.`,
                `A forest guide, ${char1.name}, claims to have seen a white stag that leads to a hidden treasure.`,
                `A ruined hunter's lodge is occupied by a group of bandits; ${char1.name} wants to reclaim it.`,
                `A sudden forest fire has trapped a research expedition; ${char1.name} is looking for volunteers to rescue them.`
            ],
            cold: [
                `A hunter discovered a frozen expedition camp; ${char1.name} believes they were attacked by ${creature}.`,
                `Yeti tracks have been spotted near pastures; ${char1.name} wants to use ${char1.possession} to hunt the beast, ${complication}.`,
                `A massive glacier has cracked, revealing a perfectly preserved ${ship1}; ${char1.name} claims it contains a vault.`,
                `A frozen mammoth was found in the ice; ${char1.name} wants to recover the crystal frozen inside its tusk.`,
                `A local trapper, ${char1.name}, reports that winter wolves are being organized by a giant white beast.`,
                `A massive ice wall has cracked, revealing a tunnel; ${char1.name} wants to explore it to ${objective}, ${complication}.`,
                `A quiet fishing village on the frozen lake is being attacked by ice-dwellers; ${char1.name} is organizing defense.`,
                `A legendary thermal spring in the snow is rumored to heal all wounds; ${char1.name} wants to find it.`,
                `A group of frost giant scouts was spotted near the border; ${char1.name} is looking for scouts to track them.`,
                `A strange, blue aurora has begun burning at noon; ${char1.name} fears it is a ritual to summon ${creature}.`,
                `A frozen monastery contains library vaults; ${char1.name} wants to retrieve a book, ${complication}.`,
                `A pack of snow leopards has nested near a mountain pass; ${char1.name} is looking for hunters to clear them.`,
                `A ruined ice palace is said to hold the crown of the winter king; ${char1.name} wants to reclaim it.`,
                `A local explorer, ${char1.name}, was caught in a sudden blizzard and needs help to recover their gear.`,
                `A strange white mist is freezing everything it touches; ${char1.name} suspects it was released by ${creature}.`,
                `A group of miners led by ${char1.name} is trapped inside a collapsed coal mine under the glacier.`,
                `A legendary ice-skiff was stolen by bandits; ${char1.name} wants to retrieve it to travel across the tundra.`,
                `A sacred ice-sculpture has begun weeping blood; ${char1.name} believes it is a warning of ${creature}.`,
                `A local guide, ${char1.name}, claims an ancient map shows a warm valley hidden inside the glacier.`,
                `A pack of ravenous winter beasts is hunting sled dogs; ${char1.name} is offering a bounty for their pelts.`,
                `A merchant caravan carrying warm winter gear was lost in a drift; ${char1.name} wants to salvage it.`,
                `A mysterious frozen warrior has begun to thaw; ${char1.name} wants to translate their ancient language.`,
                `A rival group of hunters led by ${char1.name} is heading out to claim the bounty on ${creature}, ${complication}.`
            ],
            plains: [
                `A massive sinkhole opened in the plains; ${char1.name} believes it connects to a dungeon ruled by ${creature}.`,
                `Centaur clans led by ${char1.name} are migrating early to escape the hunting grounds of ${creature}.`,
                `Local farmers report crops growing in patterns; ${char1.name} claims it is the sigil of ${creature}.`,
                `A local farmer, ${char1.name}, reports that crop circles are appearing in the wheat fields, and suspects ${creature}.`,
                `A massive herd of bison has stampeded, and ${char1.name} believes they were spooked by ${creature} underground.`,
                `A ruined windmill is rumored to hold a secret treasure vault; ${char1.name} wants to explore it, ${complication}.`,
                `A group of nomads led by ${char1.name} was attacked by a swarm of giant insects, and needs help to clear them.`,
                `A strange, glowing obelisk in the middle of the plains is humming; ${char1.name} wants to investigate, ${complication}.`,
                `A local magistrate is hiring guards to protect the harvest caravans from plains-raiders.`,
                `A pack of wild horses is being hunted by ${creature}; ${char1.name} wants to save the herd, ${complication}.`,
                `A quiet plains village has been abandoned; ${char1.name} wants to find out what happened to the citizens.`,
                `A legendary scout, ${char1.name}, is looking for volunteers to map the unchartered grasslands.`,
                `A sudden grass-fire is threatening the local farms; ${char1.name} suspects it was started by agents of ${creature}.`,
                `A strange blue flower has begun blooming across the plains; ${char1.name} believes it has magical properties.`,
                `A group of archaeologists led by ${char1.name} discovered a buried barrow mound, ${complication}.`,
                `A giant sinkhole opened in the middle of a trade road; ${char1.name} wants to explore the cave underneath.`,
                `A local merchant caravan was plundered by outlaws; ${char1.name} is looking for tracks in the grass.` ,
                `A strange, sweet fog is rolling across the plains; ${char1.name} fears it is toxic to sheep and horses.`,
                `A sacred standing stone was knocked over; ${char1.name} wants to restore it to prevent a curse, ${complication}.`,
                `A nest of burrowing monsters has ruined the local fields; ${char1.name} is hiring hunters to clear them.`,
                `A local shepherd, ${char1.name}, claims a golden lamb was born, which leads to a hidden treasure.`,
                `A ruined watch-tower is occupied by a group of mercenaries; ${char1.name} wants to hire them to fight off ${creature}.`,
                `A sudden storm has scattered a caravan's horses; ${char1.name} is looking for volunteers to gather them.`
            ],
            magical: [
                `Raw mana surges are creating anti-gravity pockets; ${char1.name} warns it is a side effect of ${creature} awakening.`,
                `A tear in space-time has opened; ${char1.name} wants to use ${char1.possession} to close it before ${creature} enters.`,
                `Glowing crystal structures are rapidly growing, which ${char1.name} claims was planted by ${creature} to ${objective}.`,
                `A raw mana storm is raging; ${char1.name} wants to deploy protective anchors to save a nearby village, ${complication}.`,
                `A group of wizard apprentices led by ${char1.name} has gone missing after a summoning experiment went wrong.`,
                `A levitating island is slowly losing altitude; ${char1.name} wants to find the core crystal to save it.`,
                `A strange rift has begun leaking wild magic; ${char1.name} wants to use ${char1.possession} to seal it, ${complication}.`,
                `A forest of crystalline trees has begun growing; ${char1.name} believes they are draining the area's ley-lines.`,
                `A local scholar, ${char1.name}, claims an ancient sigil holds the key to opening a pocket dimension.`,
                `A pack of phase-hounds is hunting magic items; ${char1.name} wants to protect their vault from them.`,
                `A mysterious mirror matches your movements but shows a different room; ${char1.name} wants to investigate.`,
                `A sacred elemental node was corrupted; ${char1.name} wants to purify it to prevent a mana explosion, ${complication}.`,
                `A group of researchers led by ${char1.name} discovered a library of forbidden spells, ${complication}.`,
                `A strange blue fire has begun burning in the air; ${char1.name} suspects a planar portal is opening.`,
                `A local merchant is selling potions that cause wild magic surges; ${char1.name} wants to close their shop.`,
                `A ruined wizard academy is occupied by a group of constructs; ${char1.name} wants to deactivate them.`,
                `A magical beacon on top of a floating spire has begun flashing red; ${char1.name} fears it is a summon signal.`,
                `A legendary staff was spotted floating inside a gravity rift; ${char1.name} wants to retrieve it.`,
                `A local guide, ${char1.name}, claims to know a hidden path that bypasses the magical barrier.`,
                `A pack of mana-leeches is draining the local protective wards; ${char1.name} is looking for hunters.`,
                `A mysterious traveler, ${char1.name}, claims to be from another plane and needs help to return home.`,
                `A sacred spell-tree has begun to wither; ${char1.name} wants to find the source of the rot to ${objective}.`,
                `A rival guild led by ${char1.name} is trying to siphon energy from the rift; ${char2.name} wants to stop them.`
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
