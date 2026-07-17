// Procedural Name Generator Engine (Markov Chains & Syllables)

// Helper to check if a character is a vowel
function isVowel(c) {
    return 'aeiouyAEIOUY'.includes(c);
}

// Helper to count syllables based on vowel groups
function countSyllables(word) {
    let count = 0;
    let prevVowel = false;
    for (let i = 0; i < word.length; i++) {
        const c = word[i];
        const v = isVowel(c);
        if (v && !prevVowel) {
            count++;
        }
        prevVowel = v;
    }
    // Cap at minimum 1 syllable
    return Math.max(1, count);
}

// ── 1. Markov Chain Generator (Order 2) ──────────────────────────────────────
export class MarkovNameGen {
    constructor(trainingWords, rng) {
        this.rng = rng;
        this.starts = [];
        this.chains = {};
        this.train(trainingWords);
    }

    train(words) {
        for (const w of words) {
            if (w.length < 2) continue;
            // Record starting pairs
            const startPair = w.substring(0, 2);
            this.starts.push(startPair);

            // Populate transitions
            for (let i = 0; i < w.length - 2; i++) {
                const key = w.substring(i, i + 2);
                const nextChar = w[i + 2];
                if (!this.chains[key]) {
                    this.chains[key] = [];
                }
                this.chains[key].push(nextChar);
            }
            // End marker transition
            const endKey = w.substring(w.length - 2);
            if (!this.chains[endKey]) {
                this.chains[endKey] = [];
            }
            this.chains[endKey].push(''); // End marker
        }
    }

    generate(minSyllables = 2, maxSyllables = 3) {
        let attempts = 0;
        const targetSyllables = this.rng.int(minSyllables, maxSyllables);

        while (attempts < 100) {
            attempts++;
            let name = this.rng.pick(this.starts);
            let char1 = name[0];
            let char2 = name[1];

            let length = 2;
            let ended = false;

            while (length < 15 && !ended) {
                const key = char1 + char2;
                const choices = this.chains[key];
                if (!choices || choices.length === 0) break;

                const next = this.rng.pick(choices);
                if (next === '') {
                    ended = true;
                } else {
                    name += next;
                    char1 = char2;
                    char2 = next;
                    length++;
                }
            }

            // Clean name formatting
            name = name.trim();
            if (name.length < 3) continue;
            // Capitalize first letter
            name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

            // Enforce syllable constraints
            const sylCount = countSyllables(name);
            if (sylCount >= minSyllables && sylCount <= maxSyllables) {
                return name;
            }
        }

        // Fallback: simple default syllable chain
        return "Alun";
    }
}

// ── 2. Syllable Structure Generator ──────────────────────────────────────────
export class SyllableNameGen {
    constructor(config, rng) {
        this.rng = rng;
        this.onsets = config.onsets || ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z'];
        this.nuclei = config.nuclei || ['a', 'e', 'i', 'o', 'u', 'y'];
        this.codas = config.codas || ['d', 'g', 'l', 'm', 'n', 'r', 's', 't', 'x', 'z', 'th', 'sh', 'nd', 'nt'];
        this.codaChance = config.codaChance !== undefined ? config.codaChance : 0.6;
    }

    generate(minSyllables = 2, maxSyllables = 3) {
        const sylCount = this.rng.int(minSyllables, maxSyllables);
        let name = '';

        for (let i = 0; i < sylCount; i++) {
            // Syllable structure: Onset? Nucleus Coda?
            let onset = '';
            if (i === 0 || this.rng.next() < 0.8) {
                onset = this.rng.pick(this.onsets);
            }
            const nucleus = this.rng.pick(this.nuclei);
            let coda = '';
            if (this.rng.next() < this.codaChance) {
                coda = this.rng.pick(this.codas);
            }
            name += onset + nucleus + coda;
        }

        // Clean up double letters and formatting
        name = name.replace(/(.)\1{2,}/g, '$1$1'); // Cap triple letters to double
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return name;
    }
}

// ── 3. Preset Datasets & Configurations ──────────────────────────────────────
export const PRESETS = {
    elven: {
        method: 'markov',
        words: [
            "Aelion", "Elendil", "Legolas", "Galadriel", "Thranduil", "Celeborn", "Arwen", "Lothlorien",
            "Imladris", "Valinor", "Lindon", "Eressëa", "Aerith", "Sylas", "Faelar", "Kaelen", "Valera",
            "Sariel", "Elandorr", "Malandiel", "Oropher", "Gil-galad", "Elrond", "Celebrimbor", "Finrod",
            "Fëanor", "Maedhros", "Fingolfin", "Turgon", "Aredhel", "Idril", "Tuor", "Lúthien", "Beren",
            "Thingol", "Melian", "Daeron", "Beleg", "Turin", "Nienor", "Morwen", "Hurin", "Huor", "Eärendil"
        ]
    },
    dwarven: {
        method: 'markov',
        words: [
            "Gimli", "Thorin", "Balin", "Dwalin", "Oin", "Gloin", "Fili", "Kili", "Dain", "Thrain",
            "Thror", "Durin", "Borin", "Fundin", "Dumathoin", "Moradin", "Khazad", "Gundabad", "Ironfoot",
            "Dargon", "Thok", "Brak", "Korg", "Grom", "Gurn", "Hendor", "Vorn", "Bulin", "Dvalin",
            "Nori", "Dori", "Ori", "Bofur", "Bombur", "Bifur", "Thorin", "Thrain", "Thror", "Gamil",
            "Telchar", "Azaghâl", "Naugladur", "Fangluin", "Mîm", "Ibûn", "Khim"
        ]
    },
    norse: {
        method: 'markov',
        words: [
            "Ragnar", "Lagertha", "Bjorn", "Ivar", "Sigurd", "Floki", "Odin", "Thor", "Freya", "Asgard",
            "Midgard", "Valhalla", "Kattegat", "Uppsala", "Harald", "Rollo", "Erik", "Leif", "Gorm",
            "Thyra", "Sven", "Knut", "Sigrid", "Astrid", "Birger", "Ingeborg", "Magnus", "Hakon",
            "Snorri", "Egill", "Njall", "Gunnar", "Hallgerd", "Gisli", "Grettir", "Skallagrim", "Kveldulf"
        ]
    },
    roman: {
        method: 'markov',
        words: [
            "Julius", "Augustus", "Tiberius", "Claudius", "Marcus", "Aurelius", "Decimus", "Lucius",
            "Hadrian", "Trajan", "Romulus", "Remus", "Valerius", "Octavian", "Pompey", "Cicero", "Seneca",
            "Brutus", "Cassius", "Antony", "Lepidus", "Scipio", "Hannibal", "Cato", "Gracchus", "Marius",
            "Sulla", "Crassus", "Caesar", "Augustus", "Tiberius", "Caligula", "Nero", "Galba", "Otho",
            "Vitellius", "Vespasian", "Titus", "Domitian", "Nerva", "Trajan", "Hadrian", "Antoninus"
        ]
    },
    eldritch: {
        method: 'markov',
        words: [
            "Cthulhu", "Yog-Sothoth", "Shub-Niggurath", "Azathoth", "Nyarlathotep", "Hastur", "Dagon",
            "R'lyeh", "Yuggoth", "Kadath", "Tsathoggua", "Ghatanothoa", "Atlach-Nacha", "Chaugnar",
            "Cthugha", "Ithaqua", "Yig", "Nug", "Yeb", "Glaaki", "Daoloth", "Eihort", "Byatis", "Y'golonac"
        ]
    },
    gothic: {
        method: 'markov',
        words: [
            "Alaric", "Theodoric", "Odoacer", "Genseric", "Valamir", "Athalaric", "Amalasuntha", "Witiges",
            "Totila", "Teia", "Belisarius", "Justin", "Gundobad", "Sigismund", "Chlothar", "Charibert",
            "Guntram", "Sigebert", "Childebert", "Dagobert", "Clovis", "Theudebert", "Theuderic", "Brunhilda"
        ]
    },
    // Syllable Generator presets
    sylElven: {
        method: 'syllable',
        config: {
            onsets: ['l', 's', 'th', 'f', 'r', 'v', 'ae', 'y', 'm', 'n', 'd'],
            nuclei: ['ia', 'ae', 'ei', 'io', 'a', 'e', 'i', 'o'],
            codas: ['lh', 'nth', 's', 'l', 'n', 'r', 'th', 'd'],
            codaChance: 0.5
        }
    },
    sylDwarven: {
        method: 'syllable',
        config: {
            onsets: ['br', 'gr', 'th', 'kr', 'kh', 'd', 'k', 'g', 'r', 'v'],
            nuclei: ['u', 'o', 'ur', 'or', 'a'],
            codas: ['k', 'g', 'd', 'th', 'r', 'rn', 'nd', 'm'],
            codaChance: 0.8
        }
    }
};

// ── 4. Main Multi-Style Naming Interface ─────────────────────────────────────
export class WorldNameGenerator {
    constructor(rng) {
        this.rng = rng;
        this.generators = {};

        // Instantiate Markov chains for all presets
        for (const [key, preset] of Object.entries(PRESETS)) {
            if (preset.method === 'markov') {
                this.generators[key] = new MarkovNameGen(preset.words, this.rng);
            } else {
                this.generators[key] = new SyllableNameGen(preset.config, this.rng);
            }
        }
    }

    // Generate a single name with custom style, category, and variable syllable lengths
    generate(style = 'elven', category = 'city') {
        const gen = this.generators[style] || this.generators['elven'];
        
        // Define syllable length constraints depending on category to maintain logic
        // "Names should have few syllables not always same amount"
        let minSyl = 2;
        let maxSyl = 3;

        if (category === 'mountain') {
            minSyl = 2;
            maxSyl = 4;
        } else if (category === 'forest') {
            minSyl = 2;
            maxSyl = 3;
        } else if (category === 'water') {
            minSyl = 2;
            maxSyl = 3;
        } else if (category === 'faction') {
            minSyl = 2;
            maxSyl = 4;
        }

        let baseName = gen.generate(minSyl, maxSyl);

        // Add semantic suffixes/prefixes depending on category
        switch (category) {
            case 'mountain':
                const mountainSuffixes = this.rng.pick([
                    ' Ridge', ' Peaks', ' Mountains', ' Crag', ' Horn', ' Spire', ' Range'
                ]);
                return baseName + mountainSuffixes;
            case 'forest':
                const forestSuffixes = this.rng.pick([
                    ' Wood', ' Forest', ' Grove', ' Wilds', ' Glade', ' Copse'
                ]);
                return baseName + forestSuffixes;
            case 'water':
                const waterSuffixes = this.rng.pick([
                    ' Sea', ' Lake', ' Shallow', ' Sound', ' Reach', ' Deep', ' Gulf'
                ]);
                return baseName + waterSuffixes;
            case 'faction':
                const factionFormats = [
                    () => `The ${baseName} Alliance`,
                    () => `Order of ${baseName}`,
                    () => `The House of ${baseName}`,
                    () => `The ${baseName} Brotherhood`
                ];
                return this.rng.pick(factionFormats)();
            case 'nation':
                const nationSuffixes = this.rng.pick([
                    ' Kingdom', ' Empire', ' Hegemony', ' Realm', ' Dominion', ' Union'
                ]);
                return 'The ' + baseName + nationSuffixes;
            case 'city':
            default:
                return baseName;
    }

    // Backward compatibility helpers for WorldEngine
    city() {
        const styles = ['elven', 'dwarven', 'norse', 'roman', 'gothic'];
        const style = this.rng.pick(styles);
        return this.generate(style, 'city');
    }
    capital() {
        const styles = ['elven', 'dwarven', 'norse', 'roman', 'gothic'];
        const style = this.rng.pick(styles);
        return this.generate(style, 'city');
    }
    nation() {
        const styles = ['elven', 'dwarven', 'norse', 'roman', 'gothic'];
        const style = this.rng.pick(styles);
        return this.generate(style, 'nation');
    }
    factionName() {
        const styles = ['elven', 'dwarven', 'norse', 'roman', 'gothic'];
        const style = this.rng.pick(styles);
        return this.generate(style, 'faction');
    }
}
