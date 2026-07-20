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
    return Math.max(1, count);
}

class BaseNameGenerator {
    constructor(source, rng) {
        this.rng = rng;
        this.starts = [];
        this.chains = {};
        this.history = new Set();
        this.allVowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        this.allConsonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'z'];

        let trainingWords = [];
        if (Array.isArray(source)) {
            trainingWords = source;
        } else {
            // Syllable config: generate synthetic words to train Markov
            for (let i = 0; i < 400; i++) {
                trainingWords.push(this.rawSyllable(source));
            }
        }
        this.train(trainingWords);
    }

    rawSyllable(config) {
        const onsets = config.onsets || this.allConsonants;
        const nuclei = config.nuclei || this.allVowels;
        const codas = config.codas || ['d', 'g', 'l', 'm', 'n', 'r', 's', 't', 'z'];
        const codaChance = config.codaChance !== undefined ? config.codaChance : 0.6;
        
        const count = this.rng.int(2, 4);
        let result = '';
        for (let i = 0; i < count; i++) {
            let onset = '';
            if (i === 0 || this.rng.next() < 0.8) {
                onset = this.rng.pick(onsets);
            }
            const nucleus = this.rng.pick(nuclei);
            let coda = '';
            if (this.rng.next() < codaChance) {
                coda = this.rng.pick(codas);
            }
            result += onset + nucleus + coda;
        }
        return result;
    }

    train(words) {
        for (const w of words) {
            const lw = w.trim().toLowerCase();
            if (lw.length < 2) continue;
            this.starts.push(lw.substring(0, 2));
            
            for (let i = 0; i < lw.length - 1; i++) {
                // Order 1 transitions
                const key1 = lw[i];
                const nextChar1 = lw[i + 1];
                if (!this.chains[key1]) {
                    this.chains[key1] = [];
                }
                this.chains[key1].push(nextChar1);

                // Order 2 transitions
                if (i < lw.length - 2) {
                    const key2 = lw.substring(i, i + 2);
                    const nextChar2 = lw[i + 2];
                    if (!this.chains[key2]) {
                        this.chains[key2] = [];
                    }
                    this.chains[key2].push(nextChar2);
                }
            }

            // End markers
            const endKey1 = lw.substring(lw.length - 1);
            if (!this.chains[endKey1]) {
                this.chains[endKey1] = [];
            }
            this.chains[endKey1].push('');

            const endKey2 = lw.substring(lw.length - 2);
            if (!this.chains[endKey2]) {
                this.chains[endKey2] = [];
            }
            this.chains[endKey2].push('');
        }
    }

    generate(minSyllables = 2, maxSyllables = 3) {
        let attempts = 0;
        while (attempts < 100) {
            attempts++;
            let name = this.rng.pick(this.starts);
            let ended = false;
            let consecutiveConsonants = 0;
            let consecutiveVowels = 0;

            for (let i = 0; i < name.length; i++) {
                if (isVowel(name[i])) {
                    consecutiveVowels++;
                    consecutiveConsonants = 0;
                } else {
                    consecutiveConsonants++;
                    consecutiveVowels = 0;
                }
            }

            while (name.length < 12 && !ended) {
                const last2 = name.slice(-2).toLowerCase();
                const last1 = name.slice(-1).toLowerCase();
                
                // Backoff Markov selection
                let choices = [];
                if (this.rng.next() > 0.15) { // 15% mutation chance for higher variety
                    choices = this.chains[last2] || this.chains[last1] || [];
                }

                let filtered = choices;
                if (consecutiveConsonants >= 2) {
                    filtered = choices.filter(c => isVowel(c) && c !== '');
                    if (filtered.length === 0) {
                        filtered = this.allVowels;
                    }
                } else if (consecutiveVowels >= 2) {
                    filtered = choices.filter(c => !isVowel(c) && c !== '');
                    if (filtered.length === 0) {
                        filtered = this.allConsonants;
                    }
                }

                const next = this.rng.pick(filtered.length > 0 ? filtered : (choices.length > 0 ? choices : (isVowel(name[name.length - 1]) ? this.allConsonants : this.allVowels)));
                if (next === '') {
                    // Enforce minimum 5 characters, and a 50% chance to continue if under 6 to ensure complexity
                    if (name.length >= 5 && isVowel(name[name.length - 1]) && (name.length >= 6 || this.rng.next() < 0.5)) {
                        ended = true;
                    } else {
                        const backup = this.rng.pick(isVowel(name[name.length - 1]) ? this.allConsonants : this.allVowels);
                        name += backup;
                        if (isVowel(backup)) {
                            consecutiveVowels++;
                            consecutiveConsonants = 0;
                        } else {
                            consecutiveConsonants++;
                            consecutiveVowels = 0;
                        }
                    }
                } else {
                    name += next;
                    if (isVowel(next)) {
                        consecutiveVowels++;
                        consecutiveConsonants = 0;
                    } else {
                        consecutiveConsonants++;
                        consecutiveVowels = 0;
                    }
                }
            }

            name = name.replace(/(.)\1{2,}/g, '$1$1');
            name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

            // Deduplicate against history
            if (this.history.has(name)) {
                continue;
            }

            const count = countSyllables(name);
            if (count >= minSyllables && count <= maxSyllables) {
                this.history.add(name);
                if (this.history.size > 100) {
                    const first = this.history.values().next().value;
                    this.history.delete(first);
                }
                return name;
            }
        }

        const fallback = this.rng.pick(this.starts) + "an";
        return fallback.charAt(0).toUpperCase() + fallback.slice(1).toLowerCase();
    }
}

export class MarkovNameGen extends BaseNameGenerator {
    constructor(trainingWords, rng) {
        super(trainingWords, rng);
    }
}

export class SyllableNameGen extends BaseNameGenerator {
    constructor(config, rng) {
        super(config, rng);
    }
}

// ── 3. Preset Datasets & Configurations ──────────────────────────────────────
export const PRESETS = {
    elven: {
        method: 'markov',
        words: [
            "Aelion", "Elendil", "Legolas", "Galadriel", "Thranduil", "Celeborn", "Arwen", "Lothlorien", "Imladris", "Valinor", 
            "Lindon", "Eressëa", "Aerith", "Sylas", "Faelar", "Kaelen", "Valera", "Sariel", "Elandorr", "Malandiel", 
            "Oropher", "Gil-galad", "Elrond", "Celebrimbor", "Finrod", "Fëanor", "Maedhros", "Fingolfin", "Turgon", "Aredhel", 
            "Idril", "Tuor", "Lúthien", "Beren", "Thingol", "Melian", "Daeron", "Beleg", "Turin", "Nienor", 
            "Morwen", "Hurin", "Huor", "Eärendil", "Círdan", "Elwing", "Finduilas", "Glorfindel", "Nimrodel", "Aegnor", 
            "Amras", "Amrod", "Angrod", "Caranthir", "Celegorm", "Curufin", "Finarfin", "Guildor", "Haldir", "Lindir", 
            "Mablung", "Oromë", "Saeros", "Ereinion", "Elladan", "Elrohir", "Erestor", "Galdor", "Gildor", "Guilin", 
            "Gwindor", "Aerandir", "Aelrindel", "Aerendyl", "Aego", "Aldaron", "Aldon", "Aramil", "Arod", "Enialis", 
            "Ingwë", "Ivellios", "Laucian", "Quarion", "Aelasar", "Aelorothi", "Adanell", "Aerondil", "Caelith", "Faelan", 
            "Amarië", "Arien", "Emeldir", "Erendis", "Haleth", "Irildë", "Írimë", "Írissë", "Isilmë", "Istarnië", 
            "Itarillë", "Lalwendë", "Aelene", "Aelinor", "Aemma", "Aerin", "Elara", "Luthien", "Míriel", "Mithrellas", 
            "Nellas", "Nessa", "Elanor", "Esmerelda", "Mirabella", "Adaldrida", "Amaranth", "Asphodel", "Belba", "Belladonna", 
            "Berylla", "Celandine", "Donnamira", "Eglantine", "Lobelia", "Melilot", "Rosamunda", "Pervinca", "Primula", "Salvia", 
            "Ancalagon", "Ecthelion", "Dior", "Eluréd", "Elurín", "Elros", "Eldarion", "Valandil", "Amandil", "Elendur", 
            "Arantar", "Tarcil", "Tarondor", "Valandur", "Isildur", "Anárion", "Meneldil", "Cemendur", "Eärendur", "Eärcil", 
            "Faramir", "Boromir", "Denethor", "Imrahil", "Adrahil", "Theoden", "Theodred", "Eomer", "Eowyn", "Elfwine", 
            "Erkenbrand", "Elfhelm", "Grimbold", "Halbarad", "Aragorn", "Arathorn", "Arador", "Argonui", "Arathryon", "Eldar", 
            "Finarfin", "Finwe", "Ingold", "Lindon", "Lothíriel", "Mithrandir", "Orophin", "Rúmil", "Saelbeth", "Voronwë", 
            "Amroth", "Nimrodel", "Barahir", "Bregolas", "Belegund", "Baragund", "Galdor", "Gundor", "Hador", "Glóredhel", 
            "Halmir", "Haldir", "Hareth", "Handir", "Brandir", "Hardang", "Beril", "Arachon", "Eledhwen", "Aredhel", 
            "Celegorm", "Curufin", "Amrod", "Amras", "Caranthir", "Maedhros", "Fëanor", "Nerdanel", "Anairë", "Eärwen"
        ]
    },
    dwarven: {
        method: 'markov',
        words: [
            "Gimli", "Thorin", "Balin", "Dwalin", "Oin", "Gloin", "Fili", "Kili", "Dain", "Thrain", 
            "Thror", "Durin", "Borin", "Fundin", "Dumathoin", "Moradin", "Khazad", "Gundabad", "Ironfoot", "Dargon", 
            "Thok", "Brak", "Korg", "Grom", "Gurn", "Hendor", "Vorn", "Bulin", "Dvalin", "Nori", 
            "Dori", "Ori", "Bofur", "Bombur", "Bifur", "Gamil", "Telchar", "Azaghâl", "Naugladur", "Fangluin", 
            "Mîm", "Ibûn", "Khim", "Flói", "Frerin", "Frór", "Gróin", "Gror", "Lóni", "Náin", 
            "Náli", "Nár", "Narvi", "Thrym", "Gundahar", "Hadhod", "Khâzad", "Baruk", "Bundushathur", "Zirakzigil", 
            "Gabilgathol", "Adrik", "Alberich", "Baern", "Barendd", "Beloril", "Brottor", "Dalgal", "Darrak", "Delg", 
            "Duergath", "Bruenor", "Drongar", "Dranli", "Ragiol", "Bogol", "Glovion", "Dravan", "Alvil", "Bagrin", 
            "Dalgion", "Durgion", "Andor", "Ranur", "Mavon", "Gavin", "Girgiol", "Rurgor", "Madion", "Darton", 
            "Dithil", "Bogriol", "Airtin", "Mavir", "Ginin", "Girgon", "Gamli", "Thondor", "Dundor", "Martur", 
            "Daril", "Gargion", "Tholir", "Duvor", "Margon", "Bavol", "Bolgur", "Dugur", "Bondil", "Dargur", 
            "Glogil", "Rumli", "Drartir", "Dulgir", "Bolion", "Gilvur", "Bondol", "Anir", "Glorin", "Agrli", 
            "Glogion", "Digrli", "Glothin", "Tholil", "Banir", "Glothir", "Dalvur", "Girtol", "Bartor", "Dralvir", 
            "Thothli", "Dravor", "Glogrur", "Ungver", "Thorvall", "Khazin", "Orvin", "Nondur", "Anbera", "Artin", 
            "Audhild", "Balifra", "Barbena", "Bardryn", "Bolhild", "Dagnal", "Dafifi", "Delre", "Diesa", "Eldeth", 
            "Hlin", "Ilde", "Jarana", "Kathra", "Kilia", "Kristryd", "Liftrasa", "Marastyr", "Mardred", "Morana", 
            "Nalaed", "Nora", "Nurkara", "Orifi", "Ovina", "Riswynn", "Sannl", "Therlin", "Thodris", "Torbera", 
            "Tordrid", "Torgga", "Urshar", "Valida", "Vistra", "Vonana", "Werydd", "Whurdred", "Yurgunn", "Aigna", 
            "Glovina", "Gina", "Dravana", "Dravona", "Barga", "Dirthora", "Ruthura", "Divura", "Ralgura", "Draga"
        ]
    },
    norse: {
        method: 'markov',
        words: [
            "Ragnar", "Lagertha", "Bjorn", "Ivar", "Sigurd", "Floki", "Odin", "Thor", "Freya", "Asgard", 
            "Midgard", "Valhalla", "Kattegat", "Uppsala", "Harald", "Rollo", "Erik", "Leif", "Gorm", "Thyra", 
            "Sven", "Knut", "Sigrid", "Astrid", "Birger", "Ingeborg", "Magnus", "Hakon", "Snorri", "Egill", 
            "Njall", "Gunnar", "Hallgerd", "Gisli", "Grettir", "Skallagrim", "Kveldulf", "Alfhild", "Aslaug", "Bodil", 
            "Dagmar", "Egil", "Einar", "Freydis", "Frida", "Geir", "Halvar", "Hilda", "Ingrid", "Kari", 
            "Liv", "Ranveig", "Rune", "Siri", "Solveig", "Torstein", "Trygve", "Agnar", "Alf", "Alrik", 
            "Amund", "Anders", "Anlaf", "Anvind", "Arn", "Arne", "Arnfinn", "Arnvid", "Asbjorn", "Asgeir", 
            "Askel", "Asmund", "Authgrim", "Authketill", "Axel", "Bard", "Beigarth", "Beinir", "Bjornulf", "Bodie", 
            "Bothvar", "Bram", "Brondulf", "Dane", "Diarf", "Englir", "Ernmund", "Finn", "Gamal", "Gest", 
            "Gizur", "Gran", "Grith", "Griotgard", "Gudleif", "Gudrod", "Gunnbjorn", "Gunnulf", "Gufi", "Haakon", 
            "Haflidi", "Halldor", "Hallfred", "Hamund", "Hans", "Harald", "Hauk", "Hedin", "Hemming", "Hermund", "Hjorleif", 
            "Holmstein", "Hran", "Hreida", "Hromund", "Jarlebanke", "Kadal", "Ketill", "Kolbein", "Kotkell", "Leiknir", 
            "Lopt", "Manni", "Olaf", "Orli", "Orri", "Orgumleidi", "Rolf", "Sæbbi", "Sigfast", "Sigfus", 
            "Sighadd", "Skamkel", "Skjold", "Skopti", "Spjut", "Steinkel", "Steinunn", "Styr", "Styrmir", "Sune", 
            "Sveni", "Thord", "Thorgils", "Thormod", "Thorstein", "Thorvald", "Vidar", "Alva", "Amalia", "Annalise", 
            "Annika", "Anna", "Åsa", "Brynja", "Dahlia", "Elesa", "Embla", "Eydis", "Gunhild", "Idonea", 
            "Inga", "Kaia", "Maren", "Saga", "Signe", "Siv", "Skade", "Tyra", "Ylva", "Asta"
        ]
    },
    roman: {
        method: 'markov',
        words: [
            "Julius", "Augustus", "Tiberius", "Claudius", "Marcus", "Aurelius", "Decimus", "Lucius", "Hadrian", "Trajan", 
            "Romulus", "Remus", "Valerius", "Octavian", "Pompey", "Cicero", "Seneca", "Brutus", "Cassius", "Antony", 
            "Lepidus", "Scipio", "Hannibal", "Cato", "Gracchus", "Marius", "Sulla", "Crassus", "Caesar", "Caligula", 
            "Nero", "Galba", "Otho", "Vitellius", "Vespasian", "Titus", "Domitian", "Nerva", "Antoninus", "Aetius", 
            "Agrippa", "Albinus", "Antonius", "Appius", "Aquila", "Balbus", "Caecilius", "Camillus", "Corvinus", "Drusus", 
            "Fabius", "Faustus", "Flavius", "Germanicus", "Horatius", "Juvenalis", "Licinius", "Livius", "Lucan", "Marcellus", 
            "Pertinax", "Plinius", "Pompeius", "Pontius", "Aelius", "Aemilius", "Amantius", "Apronianus", "Attilius", "Atticus", 
            "Avitus", "Bassus", "Caelus", "Caius", "Catullus", "Celer", "Censorinus", "Clemens", "Commodus", "Constantius", 
            "Cornelius", "Crispinus", "Crixus", "Domitius", "Favonius", "Felix", "Festus", "Flavianus", "Florus", "Frontinus", 
            "Gaius", "Gallus", "Hadrianus", "Hortensius", "Janus", "Julianus", "Junius", "Justus", "Laelius", "Lentulus", 
            "Leo", "Linus", "Lucilius", "Lucullus", "Magnus", "Manlius", "Martialis", "Maximus", "Octavius", "Ovidius", 
            "Paulus", "Piso", "Postumus", "Primus", "Quintus", "Regulus", "Rufus", "Sabinus", "Sallustius", "Saturninus", 
            "Severus", "Tacitus", "Terentius", "Aelia", "Aemilia", "Agrippina", "Albina", "Antonia", "Antonilla", "Aprulla", 
            "Aula", "Aurelia", "Aurora", "Caecilia", "Caelia", "Camilla", "Cassia", "Claudia", "Cornelia", "Domitia", 
            "Drusilla", "Fabia", "Fabiola", "Faustina", "Flavia", "Flora", "Gaia", "Gnaea", "Gratiana", "Hadriana", 
            "Hortensia", "Julia", "Juliana", "Junia", "Justina", "Laelia", "Lavinia", "Lepida", "Livia", "Livilla", 
            "Lucilla", "Lucina", "Lucia", "Lucretia", "Marcia", "Marcella", "Marina", "Martia", "Maximilla", "Minerva"
        ]
    },
    eldritch: {
        method: 'markov',
        words: [
            "Cthulhu", "Yog-Sothoth", "Shub-Niggurath", "Azathoth", "Nyarlathotep", "Hastur", "Dagon", "R'lyeh", "Yuggoth", "Kadath", 
            "Tsathoggua", "Ghatanothoa", "Atlach-Nacha", "Chaugnar", "Cthugha", "Ithaqua", "Yig", "Nug", "Yeb", "Glaaki", 
            "Daoloth", "Eihort", "Byatis", "Y'golonac", "Hydra", "Innsmouth", "Dunwich", "Arkham", "Miskatonic", "Carcosa", 
            "Alhazred", "N'kai", "Yoth", "Abhoth", "Aforgomon", "Aletheia", "Azhorra", "B'ar-Zok", "Ialdagoth", "Nodens", 
            "Hypnos", "Lobon", "Oukranos", "Tamash", "Zo-Kalar", "Hagarg", "Karakal", "Nasht", "Kaman-Thah", "Shoggoth", 
            "Byakhee", "Tindalos", "Ghouls", "Flying", "Polyps", "Xoth", "Zoth-Ommog", "Ythogtha", "Cthylla", "Bokrug", 
            "Lloigor", "Y'ha-nthlei", "Rhan-Tegoth", "Chaugnar-Faugn", "Gharne", "Shudde-M'ell", "C'thalpa", "Ktynga", "M'nagalah", "Nyogtha", 
            "Vulthoom", "Ygolonac", "Zvilpogghua", "Nctosa", "Nctolhu", "Quachil-Uttaus", "Zoth", "Thasaidon", "Basatan", "Apophis", 
            "Koth", "Yarnak", "G'harne", "S'ngac", "K'n-yan", "N'gran-k", "R'luh", "Ph'nglui", "Mglw'nafh", "Wgah'nagl", 
            "Fhtagn", "Cthlla", "Ghroth", "Oorn", "Tru'nembra", "Hziulquoigmnzhah", "Cxaxukluth", "Gisguth", "Ycnagnnisssz", "Zstylzhemghi", 
            "Yhoundeh", "Nyhar", "Shonhi", "Tulu", "G'll-Hoo", "Mnomquah", "Othuum", "Uvhash", "Zo-Kalar", "K'y-luth", 
            "Sathlat", "Ubbo-Sathla", "K'naa-th", "Gry'ulla", "H'chtelegoth", "Yorith", "Zhar", "Lloigor", "Zoth-Ommog", "Cyæegha", 
            "Yidhra", "Bugg-Shash", "C'thalpa", "Eihort", "Glaaki", "Hastur", "Ithaqua", "Judgement", "Kurpan", "Lythik", 
            "M'nagalah", "Nikkurath", "Ob'mbu", "P'al-thiel", "Q'yth-az", "R'lim-Shaikorth", "Shaurash-Ho", "T'yog", "Utonoth", "Vthyaril"
        ]
    },
    gothic: {
        method: 'markov',
        words: [
            "Alaric", "Theodoric", "Odoacer", "Genseric", "Valamir", "Athalaric", "Amalasuntha", "Witiges", "Totila", "Teia", 
            "Belisarius", "Justin", "Gundobad", "Sigismund", "Chlothar", "Charibert", "Guntram", "Sigebert", "Childebert", "Dagobert", 
            "Clovis", "Theudebert", "Theuderic", "Brunhilda", "Amalric", "Athanaric", "Euric", "Fritigern", "Gisalic", "Gunther", 
            "Hermeric", "Hilderith", "Radagaisus", "Reccared", "Roderic", "Sigeric", "Theodemir", "Theodosius", "Wallia", "Godever", 
            "Hilderic", "Gelimer", "Thrasamund", "Gunthamund", "Huneric", "Gaiseric", "Hermenegild", "Chindasuinth", "Recceswinth", "Wamba", 
            "Erwig", "Egica", "Wittiza", "Pelagius", "Favila", "Alfonso", "Bermudo", "Aurelius", "Silo", "Mauregatus", 
            "Adosinda", "Eudoxia", "Placidia", "Galla", "Honoria", "Arcadius", "Honorius", "Stilicho", "Ricimer", "Orestes", 
            "Romulus", "Augustulus", "Majorian", "Anthemius", "Nepos", "Gundahar", "Giselher", "Gunther", "Hagen", "Gernot", 
            "Ute", "Kriemhild", "Siegfried", "Etzel", "Dietrich", "Hildebrand", "Hadubrand", "Alboin", "Cleph", "Authari", 
            "Agilulf", "Adaloald", "Arioald", "Rothari", "Rodoald", "Aripert", "Grimoald", "Garibald", "Perctarit", "Cunipert", 
            "Liutpert", "Raginpert", "Aripert", "Ansprand", "Liutprand", "Hildeprand", "Ratchis", "Aistulf", "Desiderius", "Adelchis", 
            "Gisela", "Rotrude", "Bertha", "Charlemagne", "Pippin", "Carloman", "Louis", "Lothair", "Charles", "Arnulf"
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
                const mSuffix = this.rng.pick(['Ridge', 'Peaks', 'Mountains', 'Crag', 'Horn', 'Spire', 'Range']);
                if (this.rng.next() < 0.3) {
                    return baseName + '-' + mSuffix.toLowerCase();
                }
                return baseName + ' ' + mSuffix;
            case 'forest':
                const fSuffix = this.rng.pick(['Wood', 'Forest', 'Grove', 'Wilds', 'Glade', 'Copse']);
                if (this.rng.next() < 0.3) {
                    return baseName + '-' + fSuffix.toLowerCase();
                }
                return baseName + ' ' + fSuffix;
            case 'water':
                const wSuffix = this.rng.pick(['Sea', 'Lake', 'Shallow', 'Sound', 'Reach', 'Deep', 'Gulf']);
                if (this.rng.next() < 0.3) {
                    return baseName + '-' + wSuffix.toLowerCase();
                }
                return baseName + ' ' + wSuffix;
            case 'faction':
                const factionFormats = [
                    () => `The ${baseName} Alliance`,
                    () => `Order of ${baseName}`,
                    () => `The House of ${baseName}`,
                    () => `The ${baseName} Brotherhood`
                ];
                return this.rng.pick(factionFormats)();
            case 'nation':
                const nSuffix = this.rng.pick(['Kingdom', 'Empire', 'Hegemony', 'Realm', 'Dominion', 'Union']);
                if (this.rng.next() < 0.25) {
                    return 'The ' + baseName + '-' + nSuffix.toLowerCase();
                }
                return 'The ' + baseName + ' ' + nSuffix;
            case 'city':
            default:
                // 15% chance to generate compound/hyphenated city names (e.g. Aelion-lindon)
                if (this.rng.next() < 0.15) {
                    const secondName = gen.generate(minSyl, maxSyl);
                    return baseName + '-' + secondName.toLowerCase();
                }
                return baseName;
        }
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
