# 🌍 Aetherforge Worldforge

**A procedural TTRPG map & dungeon generator for tabletop role-playing games and worldbuilding.**

Aetherforge Worldforge is a browser-based collection of free procedural generators that simulate entire worlds — from planetary cores to atmospheric layers — and lets you drill down into political nations, cities, and dungeon-linked Points of Interest.

---

## 🗺️ Generators

| Generator | File | Description |
|---|---|---|
| **Portal Landing Page** | `index.html` | Card-grid homepage listing all generators |
| **Planetary Worldforge** | `world.html` | Full procedural planet: surface maps, political borders, cities, POIs, internal layers, and geological profiles |
| **Aetherforge Dungeon** | `dungeon.html` | Multi-level procedural dungeon builder with canvas editing, room inspector, fog-of-war, and VTT export |
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
- **Cities** — Procedurally placed settlements near rivers, coasts, and fertile land
- **Dungeon POIs** — Scattered crypts, keeps, caverns, and temples that deep-link directly into the Dungeon Generator

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

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge)
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

## 🎮 Usage Guide

### Step 1: Open the Portal
Navigate to `http://127.0.0.1:8080/` to see the card-grid landing page.

### Step 2: Generate a Planet
Click **Planetary Worldforge** to open `world.html`.

1. Optionally set a **World Seed** (or click 🔄 for a random seed)
2. Configure parameters: Planet Size, Core Composition, Tectonic Activity, Atmosphere Density, Climate Mode
3. Click **Forge Planet** to generate
4. Explore the three view tabs: **Global Surface Map**, **Concentric Slice**, **Geological Profile**
5. Use the **overlay toggles** to show/hide Political Borders, Cities, and Dungeon POIs

### Step 3: Inspect a Sector
Click any tile on the Global Surface Map to inspect its details in the right sidebar:
- Geographical readings (landform, temperature, moisture, aquifer depth)
- Political territory info
- City/settlement info if present
- **Dungeon POI** — if a Point of Interest is present, you'll see its description and a **"Explore Location (Forge Dungeon)"** button

### Step 4: Launch a Linked Dungeon
Clicking **"Explore Location (Forge Dungeon)"** opens `dungeon.html` in a new tab, automatically seeded and themed to match the POI you clicked (e.g. a volcanic vent zone opens a Volcanic Caves dungeon, a crypt ruins opens a Forgotten Crypt layout).

### Step 5: Generate & Edit the Dungeon
On the dungeon page:
1. Click **Forge Map** to generate the dungeon
2. Use the floating **paint toolbar** to edit tiles manually
3. Switch between **Surface**, **Level -1 (Dungeon)**, and **Level -2 (Caverns)** tabs
4. Click rooms/corridors to inspect them in the **Room Inspector** on the right
5. Export the map as a **PNG**, **JSON**, or **Universal VTT** format

---

## 📁 Project Structure

```
aetherforge-worldforge/
├── index.html          # Landing page portal (card grid)
├── dungeon.html        # Dungeon generator (full-screen)
├── world.html          # Planetary worldforge (full-screen)
├── player.html         # Synchronized player window
├── style.css           # Global styling (Watabou-inspired + Aetherforge theme)
└── js/
    ├── config.js       # Theme configs, tile type constants
    ├── generator.js    # Core dungeon/wilderness procedural generation engine
    ├── renderer.js     # Canvas tile map renderer with pan/zoom
    ├── main.js         # Dungeon UI controller, event handlers, URL deep-linking
    └── world.js        # Planetary worldforge generator & canvas visualizer
```

---

## 🎨 Design

The interface is inspired by the minimalist portal aesthetic of [Watabou's Procgen Arcana](https://watabou.github.io), using:
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
