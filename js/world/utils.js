// ── Seeded LCG Random ────────────────────────────────────────────────────────
export class RNG {
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

// ── Gradient Noise 2D ────────────────────────────────────────────────────────
export class GradientNoise2D {
    constructor(rng, tableSize = 512) {
        this.T = tableSize;
        this.perm  = new Uint16Array(tableSize * 2);
        const base = new Uint16Array(tableSize);
        for (let i = 0; i < tableSize; i++) base[i] = i;
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
        return v / maxV;
    }
    warpedFbm(x, y, oct = 5) {
        const qx = this.fbm(x, y, oct);
        const qy = this.fbm(x + 5.2, y + 1.3, oct);
        return this.fbm(x + 4.0 * qx, y + 4.0 * qy, oct);
    }
}

// ── Massive Name Generator ───────────────────────────────────────────────────
export class NameGen {
    constructor(rng) {
        this.rng = rng;
        this.vowels = ['a','e','i','o','u','ae','ai','au','ei','ou','ia','io','oa','uu','ee','ua','ue','ui','uo','y','ya','ye','yi','yo','yu'];
        this.cons1  = ['Br','Cr','Dr','Fr','Gr','Pr','Str','Thr','Vr','Wh','Bl','Fl','Sl','Sp','St',
                       'Al','El','Er','Ul','Ar','Or','Ir','An','En','Un','Val','Mor','Eld','Aer','Ith',
                       'Zal','Xar','Tho','Kael','Vael','Sari','Syl','Odi','Morg','Gorg','Bael','Rha',
                       'Mal','Khor','Vex','Tze','Nur','Slaa','Cth','Yog','Shub','Ny','Hast','Dagon',
                       'Crom','Koth','Styg','Zing','Zam','Hybor','Acher','Aquil','Neme','Bryth','Hyper'];
        this.cons2  = ['nt','nd','th','sh','ch','gh','rk','rm','rd','nk','ld','lt','nn','ss','ng',
                       'dar','hold','mere','ford','wick','ton','holm','fell','mire','wyn','dor','ath',
                       'crest','ridge','glen','wood','dale','haven','keep','spire','forge','crag','port',
                       'barrow','cliff','cove','deep','dune','fen','field','gard','head','hill','horn',
                       'marsh','mill','mouth','peak','rock','run','scar','shore','spring','vale','water'];
        this.suffN  = ['ia','is','ar','or','im','el','or','in','an','on','yl','um','us','ath','ara','onia','oria',
                       'eth','ith','oth','uth','yth','en','el','on','os','us','es','as','is','ys','ix','ox'];
        this.suffC  = ['land','heim','vale','keep','feld','reach','march','watch','stone','hold','gate','spire',
                       'fort','port','glen','wood','dale','crossing','bridge','coast','bay','hollow',
                       'cliff','crag','dun','garrison','grotto','haven','heath','highlands','island','junction',
                       'lagoon','lighthouse','meadow','moor','mount','oasis','observatory','overlook','pass',
                       'sanctuary','shield','tomb','tower','valley','wall','waterfall','wharf','wilderness'];
        
        this.adjectives = [
            'Eldorian', 'Valenian', 'Ashen', 'Sylvan', 'Frostbound', 'Iron', 'Golden', 'Silver',
            'Crimson', 'Azure', 'Verdant', 'Shadow', 'Storm', 'Ember', 'Voidborn', 'Arcane',
            'Sunlit', 'Moonforged', 'Tidewrought', 'Stonebound', 'Crystalline', 'Obsidian',
            'Nether', 'Astral', 'Fey', 'Abyssal', 'Aurelian', 'Dread', 'Whispering', 'Echoing',
            'Celestial', 'Ruined', 'Sunken', 'Glacial', 'Sulfur', 'Wild', 'Oasis', 'Shattered',
            'Barren', 'Haunted', 'Bioluminescent', 'Gilded', 'Copper', 'Steel', 'Frost', 'Fire',
            'Dusk', 'Dawn', 'Twilight', 'Midnight', 'Ancient', 'Forgotten', 'Lost', 'Hidden'
        ];
        
        this.nouns = [
            'Realm', 'Empire', 'Domain', 'Alliance', 'League', 'Confederacy', 'Union',
            'Dominion', 'Sovereignty', 'Compact', 'Covenant', 'Hold', 'Territories', 'Expanse',
            'Dynasty', 'Kingdom', 'Sultanate', 'Principality', 'Barony', 'Consortium', 'Conclave',
            'Hegemony', 'Sect', 'Order', 'Tribes', 'Clans', 'Commonwealth', 'Freestate', 'Enclave'
        ];
    }
    city() {
        const r = this.rng;
        const pre = r.pick(this.cons1);
        const mid = r.pick(this.vowels);
        const suf = r.pick(this.cons2);
        return pre + mid + suf;
    }
    nation() {
        const r = this.rng;
        const adj = r.pick(this.adjectives);
        const noun = r.pick(this.nouns);
        return `The ${adj} ${noun}`;
    }
    capital() {
        const r = this.rng;
        const syl = r.pick(this.cons1) + r.pick(this.vowels);
        const suf = r.pick(this.suffC);
        return syl + suf;
    }
    factionName() {
        const r = this.rng;
        const types = [
            () => `The ${r.pick(this.adjectives)} Guard`,
            () => `Order of the ${r.pick(this.adjectives)} ${r.pick(['Sword', 'Shield', 'Sun', 'Moon', 'Star', 'Dragon', 'Gryphon', 'Lion', 'Wolf', 'Serpent', 'Eagle', 'Crown', 'Hammer'])}`,
            () => `The ${r.pick(this.adjectives)} Circle`,
            () => `The ${r.pick(this.adjectives)} Syndicate`,
            () => `Guild of ${r.pick(['Crafters', 'Shadows', 'Mages', 'Navigators', 'Alchemists', 'Pathfinders', 'Inquisitors', 'Gladiators', 'Archaeologists'])}`,
            () => `The ${r.pick(['Red', 'Black', 'Grey', 'Pale', 'Golden', 'Silver', 'White', 'Blue', 'Green'])} ${r.pick(['Fangs', 'Claws', 'Brood', 'Shields', 'Knights', 'Outlaws', 'Ravagers', 'Wardens', 'Sentinels', 'Templars'])}`
        ];
        return r.pick(types)();
    }
}

// ── Optimized Binary Search Array Inserter ──────────────────────────────────
export function binaryInsert(array, item) {
    let low = 0;
    let high = array.length;
    while (low < high) {
        let mid = (low + high) >>> 1;
        if (array[mid].cost < item.cost) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    array.splice(low, 0, item);
}
