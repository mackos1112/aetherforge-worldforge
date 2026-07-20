# 🌍 Aetherforge Worldforge

**A procedural TTRPG map, city, name & dungeon generator for tabletop role-playing games and worldbuilding.**

Aetherforge Worldforge is a browser-based suite of procedural generators that simulate entire worlds — from planetary cores to atmospheric layers — and lets you drill down into political nations, procedural cities, dungeon-linked Points of Interest, and customized local maps.

---

## 🗺️ Generators

| Generator | File | Description |
|---|---|---|
| **Portal Landing Page** | `index.html` | Card-grid homepage listing all available tools |
| **Planetary Worldforge** | `world.html` | Full procedural planet: surface maps, political borders, cities, POIs, internal layers, and geological profiles |
| **Procedural City Generator** | `city.html` | Interactive medieval/fantasy city layouts with custom street patterns, castle keeps, rivers, districts, and population metrics |
| **Aetherforge Dungeon** | `dungeon.html` | Multi-level procedural dungeon builder with canvas editing, room inspector, fog-of-war, and VTT export |
| **Name Generator** | `names.html` | Markov chain and syllable-based fantasy naming engine for characters, factions, and landmarks |
| **Player Window** | `player.html` | Synchronized player-facing map view (real-time fog of war reveal) |

---

## ✨ Features

### 🌍 Planetary Worldforge (`world.html`)
- **Three Interactive Views**:
  - 🪐 **Global Surface Map** — Procedural 2D top-down planet projection with geographical biomes
  - ☄️ **Concentric Planetary Slice** — Radial cross-section from the molten core to the magnetosphere
  - 🌋 **Geological Drill Profile** — Vertical soil horizon profile from atmosphere to geothermal magma chambers
- **Landforms Generated**: Mountains, Volcanoes, Valleys, Canyons, Plains, Plateaus, Ridges, Deserts, Dunes, Cliffs, Trenches
- **Water Bodies**: Oceans, Seas, Lakes, Rivers, Glaciers, Ice Caps
- **Internal Layers**: Core, Mantle, Asthenosphere, Lithosphere, Crust
- **Atmospheric Layers**: Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere, Magnetosphere
- **Geological Materials**: Bedrock, Regolith, Soil, Magma, Lava, Sediment
- **Political Divisions** — Voronoi territory expansion generating nations with capital cities and contested borders
- **Cities & Settlements** — Procedurally placed settlements near rivers, coasts, and fertile land
- **Dungeon POIs** — Scattered crypts, keeps, caverns, and temples that deep-link directly into the Dungeon Generator

### 🏙️ Procedural City Generator (`city.html`)
- **Street Layout Algorithms**: Generate street grids using Hexagonal, Square, or Voronoi-based expansion patterns
- **City Features**: Customize the inclusion of City Walls, Central Castles/keeps, Rivers, Coastlines, surrounding Farmlands, and labels
- **Interactive Districts**: Hover over or click districts (e.g., Temple District, Slums, Merchants, Castle, Craftsmen) to view name, population density, and description
- **Visual Styling**: Choose between multiple themes including Parchment, Slate (Dark Mode), Blueprint, and Colorized Parchment
- **Seed Integration**: Auto-loads a specific layout when linked from a world map city or using a custom URL seed
- **Exporting**: Download high-quality city maps as PNGs for print or digital play

### 🏰 Aetherforge Dungeon Generator (`dungeon.html`)
- Procedural **multi-level dungeon** generation (Wilderness Surface + Underground + Cavern levels)
- Dungeon archetypes: **Forgotten Crypt**, **Underground Keep**, **Volcanic Caves**, **Sunken Temple**
- Wilderness biomes: **Sylvan Forest**, **Dune Sea**, **Fey Swamp**, **Ashen Wastes**
- Canvas **tile painting tools** (Wall, Floor, Door, Torch, Chest, Obstacle, Erase)
- **Fog of War** play mode — reveal tiles/rooms in real-time during sessions
- **Room Inspector** — hover/click rooms to view encounter stats, loot tables, hazards, and sensory descriptions
- **Export formats**: PNG, JSON snapshot, Universal VTT (Foundry/Universal VTT-compatible)
- **Import** previously saved JSON maps
- **Image-to-Map Forge** — upload a scanned or drawn map image, auto-converts it to a live tile grid
- Synchronized **Player Window** tab via BroadcastChannel API
- **URL Deep-linking** from the World Generator — a dungeon is auto-seeded and themed based on the POI clicked on the world map

### ✍️ Name Generator (`names.html`)
- **Hybrid Naming Engine**: Employs Markov Chain models trained on distinct language corpora alongside syllable construction algorithms
- **Ethnic & Cultural Presets**: Includes generator options for Human, Elven, Dwarven, Norse, Orcish, Halfling, and Draconic structures
- **Category Support**: Instantly generate names for characters, settlements, geographical landmarks, and military factions
- **Customization Controls**: Tune min/max lengths, syllable configurations, and random variation parameters

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES Module loading — see below)

### ⚠️ Important: Local Server Required
The generators use ES6 JavaScript Modules (`type="module"`), which browsers **block** when opened directly as `file://` local files due to CORS security policy.

You must serve the project from a local web server. Three easy options:

#### Option 1 — Python (No install required if Python 3 is present)
```bash
cd path/to/aetherforge-worldforge
python -m http.server 8080 --bind 127.0.0.1
```
Then open: [http://127.0.0.1:8080](http://127.0.0.1:8080)

#### Option 2 — VS Code Live Server Extension
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Open the project folder in VS Code
3. Right-click `index.html` → **Open with Live Server**

#### Option 3 — Node.js `npx serve`
```bash
npx serve .
```

---

## 🎮 Usage & Integration

All generators in the Aetherforge Worldforge ecosystem are interconnected through URL parameters and shared seed values:

1. **Start with the World**: Forge a planet at `world.html`. Zoom and pan around to find interesting nations, settlements, and dungeons.
2. **Explore a City**: Click a settlement on the world map and select the option to explore the city. This opens `city.html` passing the seed and name via URL, generating a detailed, customized layout for that specific city.
3. **Explore a Dungeon**: Click any Dungeon POI on the world map to open `dungeon.html`. The dungeon archetype (e.g. Volcanic Caves, Sunken Temple) is automatically selected to match the world biome at that coordinate, and the random seed is synchronized.

---

## 📁 Project Structure

```
aetherforge-worldforge/
├── index.html            # Landing page portal (card grid)
├── world.html            # Planetary worldforge (full-screen)
├── city.html             # Procedural city generator (full-screen)
├── dungeon.html          # Dungeon generator (full-screen)
├── names.html            # Procedural name generator interface
├── player.html           # Synchronized player window for dungeon FOW
├── style.css             # Global styling & custom themes
└── js/
    ├── config.js         # Theme configs, tile type constants
    ├── generator.js      # Core dungeon/wilderness procedural generation engine
    ├── renderer.js       # Canvas tile map renderer with pan/zoom
    ├── main.js           # Dungeon UI controller, event handlers, URL deep-linking
    ├── city.js           # City UI controller & event handlers
    ├── city/
    │   ├── generator.js  # Procedural city layout engine
    │   └── geometry.js   # Geometric utility helpers (polygon insets, point containment)
    ├── names/
    │   └── names.js      # Markov chain & syllable-based naming engine
    └── world/
        ├── utils.js      # Random number generator & helpers
        ├── biomes.js     # Biome definition matrices & colors
        ├── engine.js     # Planetary terrain generation & Voronoi nation engine
        └── visualizer.js # Canvas visualizers for planet maps, slices, & drill cores
```

---

## 🎨 Design

The interface is inspired by the minimalist portal aesthetic of [Watabou's Procgen Arcana](https://watabou.github.io), styled with:
- Fonts: **Merriweather** (serif headings) and **Share** (sans body text) via Google Fonts
- Dark slate body (`#2e3033`) with warm parchment cards (`#d9d3ce`)
- Steel-blue accent colors (`#6688aa`) with yellow hover highlights (`#ffee99`)

---

## 🔗 Credits & Inspiration

- Procedural generation techniques: value noise, fractional brownian motion, BFS territory expansion
- Interface style inspired by [Oleg Dolya / Watabou](https://watabou.github.io) — all code and branding is original
- TTRPG encounter tables and room descriptions use a seeded random system for reproducibility

---

## 📄 License

MIT License — free to use, modify, and distribute.
