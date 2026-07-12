import { TILE_TYPES, ROOM_TEMPLATES, SENSORY_MATRICES, XP_THRESHOLDS, MONSTERS, HAZARDS, LOOT_TEMPLATES } from './config.js';

// Randomness helper utilities
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

function create2DArray(width, height, fillValue) {
    return Array.from({ length: height }, () => Array(width).fill(fillValue));
}

/**
 * Procedural Map Generator - Advanced Elevation, Rivers, Winding Corridors, Shapes, and FOW Sync
 */
export class MapGenerator {
    constructor() {
        this.width = 48;
        this.height = 48;
        this.structureMode = 'multilevel'; 
        this.gridShape = 'square'; 
        this.wildernessBiome = 'forest';
        this.dungeonTheme = 'crypt';
        this.wildernessDensity = 48;
        this.targetRoomCount = 8;
        this.connectivity = 20; 
        this.partySize = 4;
        this.partyLevel = 1;
        this.difficulty = 'balanced';

        // Phase 3 new config parameters
        this.winding = 25; // 0 to 100 path wiggle factor
        this.shapeRect = 50; // Room shape relative ratios
        this.shapeCircle = 20;
        this.shapeHex = 10;
        this.shapeIrreg = 20;
        this.riversCount = 1; // Number of rivers
        this.mountainsDensity = 25; // Mountain ridgelines coverage percent

        // Grids data
        this.levels = { surface: null, upper: null, lower: null };
        this.roomsData = { surface: {}, upper: {}, lower: {} };
        this.customDetails = { surface: {}, upper: {}, lower: {} };

        // Fog of war masks (true = fogged, false = revealed)
        this.fogMasks = { surface: null, upper: null, lower: null };
        this.playModeActive = false;

        // Heights and Moisture maps
        this.elevationGrid = null;
        this.moistureGrid = null;
    }

    // Set configuration from UI
    updateConfig(config) {
        if (config.width) this.width = config.width;
        if (config.height) this.height = config.height;
        if (config.structureMode) this.structureMode = config.structureMode;
        if (config.gridShape) this.gridShape = config.gridShape;
        if (config.wildernessBiome) this.wildernessBiome = config.wildernessBiome;
        if (config.dungeonTheme) this.dungeonTheme = config.dungeonTheme;
        if (config.wildernessDensity !== undefined) this.wildernessDensity = config.wildernessDensity;
        if (config.targetRoomCount !== undefined) this.targetRoomCount = config.targetRoomCount;
        if (config.connectivity !== undefined) this.connectivity = config.connectivity;
        if (config.partySize !== undefined) this.partySize = config.partySize;
        if (config.partyLevel !== undefined) this.partyLevel = config.partyLevel;
        if (config.difficulty) this.difficulty = config.difficulty;
        
        // Phase 3 new properties
        if (config.winding !== undefined) this.winding = config.winding;
        if (config.shapeRect !== undefined) this.shapeRect = config.shapeRect;
        if (config.shapeCircle !== undefined) this.shapeCircle = config.shapeCircle;
        if (config.shapeHex !== undefined) this.shapeHex = config.shapeHex;
        if (config.shapeIrreg !== undefined) this.shapeIrreg = config.shapeIrreg;
        if (config.riversCount !== undefined) this.riversCount = config.riversCount;
        if (config.mountainsDensity !== undefined) this.mountainsDensity = config.mountainsDensity;
    }

    getNeighbors(x, y) {
        const isHex = (this.gridShape === 'hex');
        const width = this.width;
        const height = this.height;
        
        if (isHex) {
            const isOddRow = (y % 2 === 1);
            const offsets = isOddRow ? [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 1, dy: -1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: 1 }, { dx: 0, dy: 1 }
            ] : [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: -1 }, { dx: -1, dy: -1 },
                { dx: 0, dy: 1 }, { dx: -1, dy: 1 }
            ];
            
            const results = [];
            for (const o of offsets) {
                const tx = x + o.dx;
                const ty = y + o.dy;
                if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                    results.push({ x: tx, y: ty });
                }
            }
            return results;
        } else {
            const offsets = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            const results = [];
            for (const o of offsets) {
                const tx = x + o.dx;
                const ty = y + o.dy;
                if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                    results.push({ x: tx, y: ty });
                }
            }
            return results;
        }
    }

    // Calculates axial hexagon coordinate distances
    getHexDistance(q1, r1, q2, r2) {
        const x1 = q1 - (r1 - (r1 & 1)) / 2;
        const z1 = r1;
        const y1 = -x1 - z1;

        const x2 = q2 - (r2 - (r2 & 1)) / 2;
        const z2 = r2;
        const y2 = -x2 - z2;

        return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
    }

    // Initialize/reset fog masks
    initFogMasks() {
        this.fogMasks = {
            surface: create2DArray(this.width, this.height, true),
            upper: create2DArray(this.width, this.height, true),
            lower: create2DArray(this.width, this.height, true)
        };
    }

    /**
     * Main Generate Trigger
     */
    generateAll() {
        this.levels = { surface: null, upper: null, lower: null };
        this.roomsData = { surface: {}, upper: {}, lower: {} };
        this.customDetails = { surface: {}, upper: {}, lower: {} };
        this.initFogMasks();

        if (this.structureMode === 'multilevel') {
            this.generateSurfaceLevel();
            this.generateUpperLevel();
            this.generateLowerLevel();
            this.linkMultilevels();
        } else if (this.structureMode === 'single-wilderness') {
            this.generateSurfaceLevel();
        } else if (this.structureMode === 'single-dungeon') {
            this.generateUpperLevel();
        } else if (this.structureMode === 'single-cavern') {
            this.generateLowerLevel();
        }
        
        return {
            levels: this.levels,
            roomsData: this.roomsData
        };
    }

    /**
     * 1. WILDERNESS TERRAIN BIOME ENGINE (Elevation + Moisture + Hydraulic Rivers)
     */
    generateSurfaceLevel() {
        const grid = create2DArray(this.width, this.height, TILE_TYPES.SURFACE_GRASS);
        const wData = {};
        
        // 1.1 Generate heightmap and moisture grids
        this.elevationGrid = this.generateValueNoise(this.width, this.height, 4);
        this.moistureGrid = this.generateValueNoise(this.width, this.height, 3);
        
        // Apply mountains threshold
        const mountainCutoff = 1.0 - (this.mountainsDensity / 100); 
        const hillsCutoff = mountainCutoff - 0.16;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const el = this.elevationGrid[y][x];
                const moist = this.moistureGrid[y][x];
                
                if (el < 0.22) {
                    grid[y][x] = TILE_TYPES.SURFACE_WATER; // deep lake basin
                } else if (el < 0.28) {
                    grid[y][x] = TILE_TYPES.SURFACE_SHALLOW_WATER; // lake shores
                } else if (el > mountainCutoff) {
                    grid[y][x] = TILE_TYPES.SURFACE_ROCK; // high ridges
                } else if (el > hillsCutoff) {
                    grid[y][x] = Math.random() < 0.3 ? TILE_TYPES.SURFACE_ROCK : TILE_TYPES.SURFACE_DIRT; // hills
                } else {
                    // plains biomes mapped based on moisture
                    if (moist < 0.3) {
                        grid[y][x] = TILE_TYPES.SURFACE_DIRT; // sand / dry plains
                    } else if (moist > 0.68) {
                        grid[y][x] = TILE_TYPES.SURFACE_SHALLOW_WATER; // swampy pockets
                    } else {
                        grid[y][x] = TILE_TYPES.SURFACE_GRASS;
                    }
                }
            }
        }

        // 1.2 Downslope Hydraulic River carving agents
        this.carveHydraulicRivers(grid);

        // 1.3 Grow trees based on adjusted moisture (thicker along rivers)
        const densityVal = this.wildernessDensity / 100;
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (grid[y][x] === TILE_TYPES.SURFACE_GRASS) {
                    const moist = this.moistureGrid[y][x];
                    // high moisture increases tree rates
                    const spawnChance = densityVal * (moist * 0.45);
                    if (Math.random() < spawnChance) {
                        grid[y][x] = TILE_TYPES.SURFACE_TREE;
                    }
                }
            }
        }

        // 1.4 Place ruins (POI nodes)
        const ruins = this.carveRuinStructures(grid, wData);

        // 1.5 Place Dungeon Entrance near highest elevation or a ruin
        let entrancePlaced = false;
        let entX = Math.floor(this.width / 2);
        let entY = Math.floor(this.height / 2);
        
        if (ruins.length > 0) {
            entX = ruins[0].center.x;
            entY = ruins[0].center.y;
            grid[entY][entX] = TILE_TYPES.SURFACE_ENTRANCE;
            entrancePlaced = true;
        } else {
            // Find highest elevation coordinate that is walkable (hills/grass)
            let maxEl = 0;
            for (let y = 3; y < this.height - 3; y++) {
                for (let x = 3; x < this.width - 3; x++) {
                    const tile = grid[y][x];
                    if (tile === TILE_TYPES.SURFACE_DIRT || tile === TILE_TYPES.SURFACE_GRASS) {
                        if (this.elevationGrid[y][x] > maxEl) {
                            maxEl = this.elevationGrid[y][x];
                            entX = x;
                            entY = y;
                        }
                    }
                }
            }
            grid[entY][entX] = TILE_TYPES.SURFACE_ENTRANCE;
        }

        // 1.6 Carve a road network with crossroads connecting ruins and entrance
        this.carveWildernessRoadNetwork(grid, ruins, { x: entX, y: entY });

        // 1.7 Add lore descriptions to Wilderness POIs
        this.generateWildernessPOIKeys(wData);

        this.levels.surface = grid;
        this.roomsData.surface = wData;
    }

    carveHydraulicRivers(grid) {
        let spawnedRivers = 0;
        let attempts = 0;
        
        while (spawnedRivers < this.riversCount && attempts < 150) {
            // Pick a source tile at high elevation (mountain/hill)
            const rx = randomRange(4, this.width - 5);
            const ry = randomRange(4, this.height - 5);
            const el = this.elevationGrid[ry][rx];
            
            if (el > 0.6) { // hills/ridges
                let cx = rx;
                let cy = ry;
                let riverLength = 0;
                let riverPoints = [];
                let safety = 0;
                
                while (safety < 300) {
                    riverPoints.push({ x: cx, y: cy });
                    
                    // Steer agent downhill: find adjacent tile with lowest height
                    const neighbors = this.getNeighbors(cx, cy);
                    let lowestNeighbor = null;
                    let minNeighborHeight = Infinity;
                    
                    neighbors.forEach(n => {
                        const h = this.elevationGrid[n.y][n.x];
                        if (h < minNeighborHeight) {
                            minNeighborHeight = h;
                            lowestNeighbor = n;
                        }
                    });
                    
                    if (!lowestNeighbor) break;
                    
                    // Break loop if we reach sea/lake level or border bounds
                    if (grid[lowestNeighbor.y][lowestNeighbor.x] === TILE_TYPES.SURFACE_WATER || 
                        minNeighborHeight < 0.22 || 
                        lowestNeighbor.x <= 1 || lowestNeighbor.x >= this.width - 2 ||
                        lowestNeighbor.y <= 1 || lowestNeighbor.y >= this.height - 2) {
                        
                        riverPoints.push(lowestNeighbor);
                        break;
                    }
                    
                    cx = lowestNeighbor.x;
                    cy = lowestNeighbor.y;
                    safety++;
                }

                if (riverPoints.length > 5) {
                    // Carve river path
                    riverPoints.forEach(pt => {
                        grid[pt.y][pt.x] = TILE_TYPES.SURFACE_WATER;
                        
                        // Boost moisture in adjacent cells
                        const neighbors = this.getNeighbors(pt.x, pt.y);
                        neighbors.forEach(n => {
                            this.moistureGrid[n.y][n.x] = Math.min(1.0, this.moistureGrid[n.y][n.x] + 0.45);
                        });
                    });
                    spawnedRivers++;
                }
            }
            attempts++;
        }
    }

    carveWildernessRoadNetwork(grid, ruins, entrance) {
        const points = [];
        points.push({ x: 1, y: randomRange(10, this.height - 11) });
        ruins.forEach(r => points.push(r.center));
        points.push(entrance);
        points.push({ x: this.width - 2, y: randomRange(10, this.height - 11) });

        // Add a crossroads intersection hub right in the middle
        const crossroads = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
        
        // Connect each point to the nearest road or central crossroads hub
        const connectPoints = (p1, p2) => {
            const path = this.findAStarPath(grid, p1.x, p1.y, p2.x, p2.y, (tile) => {
                if (tile === TILE_TYPES.SURFACE_WATER || tile === TILE_TYPES.SURFACE_SHALLOW_WATER) return 100;
                if (tile === TILE_TYPES.SURFACE_ROCK || tile === TILE_TYPES.SURFACE_RUIN_WALL) return 40;
                if (tile === TILE_TYPES.SURFACE_TREE) return 5;
                if (tile === TILE_TYPES.SURFACE_PATH) return 1;
                return 3;
            });

            if (path) {
                path.forEach(pt => {
                    const currentTile = grid[pt.y][pt.x];
                    
                    // If crossing water, place a Bridge, otherwise paint path
                    if (currentTile === TILE_TYPES.SURFACE_WATER || currentTile === TILE_TYPES.SURFACE_SHALLOW_WATER) {
                        grid[pt.y][pt.x] = TILE_TYPES.SURFACE_BRIDGE;
                    } else if (currentTile !== TILE_TYPES.SURFACE_ENTRANCE && 
                               currentTile !== TILE_TYPES.SURFACE_RUIN_WALL) {
                        grid[pt.y][pt.x] = TILE_TYPES.SURFACE_PATH;
                    }
                });
            }
        };

        // Route roads to meet at crossroads hub
        points.forEach(p => {
            connectPoints(p, crossroads);
        });

        // Mark crossroads in grid
        if (grid[crossroads.y][crossroads.x] === TILE_TYPES.SURFACE_PATH) {
            grid[crossroads.y][crossroads.x] = TILE_TYPES.SURFACE_PATH; 
        }
    }

    generateWildernessPOIKeys(wData) {
        // Add descriptions for ruins and checkpoints
        Object.keys(wData).forEach(key => {
            const poi = wData[key];
            const heights = this.elevationGrid[poi.center.y][poi.center.x];
            
            if (heights > 0.65) {
                poi.name = "Mountain Fortress Ruins";
                poi.description = "Perched on a windy cliff, these stone blocks form the skeleton of an ancient fortress watchtower.";
            } else {
                poi.name = "Sunken Forest Chapel";
                poi.description = "Crumbling stone pillars overtaken by creeping ivy and damp moss clearings.";
            }
        });
    }

    carveRuinStructures(grid, wData) {
        // Place 2-4 small ruin footprints on walkable wilderness tiles
        const ruinCount = randomRange(2, 4);
        const placed = [];
        let attempts = 0;

        while (placed.length < ruinCount && attempts < 200) {
            attempts++;
            const rw = randomRange(4, 8);
            const rh = randomRange(4, 8);
            const rx = randomRange(5, this.width  - rw - 5);
            const ry = randomRange(5, this.height - rh - 5);

            // Only place on flat/grass terrain (not water, rock, tree)
            const center = grid[ry + Math.floor(rh/2)]?.[rx + Math.floor(rw/2)];
            if (center !== TILE_TYPES.SURFACE_GRASS && center !== TILE_TYPES.SURFACE_DIRT) continue;

            // Check no overlap with existing ruins
            const tooClose = placed.some(r =>
                Math.abs(r.center.x - (rx + Math.floor(rw/2))) < 12 &&
                Math.abs(r.center.y - (ry + Math.floor(rh/2))) < 12
            );
            if (tooClose) continue;

            // Carve L-shaped or rectangular ruin outline (walls only, interior open)
            for (let dy = 0; dy < rh; dy++) {
                for (let dx = 0; dx < rw; dx++) {
                    const isEdge = (dx === 0 || dx === rw-1 || dy === 0 || dy === rh-1);
                    if (isEdge) {
                        // Occasional gap in walls (collapsed section)
                        if (Math.random() > 0.25) {
                            grid[ry+dy][rx+dx] = TILE_TYPES.SURFACE_ROCK;
                        }
                    } else {
                        // Interior remains walkable (dirt)
                        grid[ry+dy][rx+dx] = TILE_TYPES.SURFACE_DIRT;
                    }
                }
            }

            const ruinCenter = { x: rx + Math.floor(rw/2), y: ry + Math.floor(rh/2) };
            const rId = `ruin_${placed.length + 1}`;
            wData[rId] = {
                name: 'Ancient Ruins',
                center: ruinCenter,
                rect: { x: rx, y: ry, w: rw, h: rh },
                description: 'Crumbling stone walls half-swallowed by the earth.',
                sights: ['Broken pillars', 'Carved runes on fallen stones'],
                sounds: ['Wind through empty archways'],
                smells: ['Damp moss and old ash'],
                encounter: this.generateEncounter('wilderness'),
                loot: Math.random() < 0.5 ? this.generateLoot() : null,
                hazard: null,
                stairs: false
            };
            placed.push({ center: ruinCenter });
        }
        return placed;
    }

    splitBSP(node, leaves, depth, maxDepth) {
        const MIN_SIZE = 10;
        if (depth >= maxDepth || node.w < MIN_SIZE * 2 || node.h < MIN_SIZE * 2) {
            if (node.w >= MIN_SIZE && node.h >= MIN_SIZE) leaves.push(node);
            return;
        }
        // Prefer to split the longer axis, with some randomness
        const splitH = node.w > node.h
            ? Math.random() < 0.7
            : Math.random() < 0.3;

        if (splitH) {
            const splitX = randomRange(MIN_SIZE, node.w - MIN_SIZE);
            this.splitBSP({ x: node.x,           y: node.y, w: splitX,          h: node.h }, leaves, depth+1, maxDepth);
            this.splitBSP({ x: node.x + splitX,  y: node.y, w: node.w - splitX, h: node.h }, leaves, depth+1, maxDepth);
        } else {
            const splitY = randomRange(MIN_SIZE, node.h - MIN_SIZE);
            this.splitBSP({ x: node.x, y: node.y,           w: node.w, h: splitY          }, leaves, depth+1, maxDepth);
            this.splitBSP({ x: node.x, y: node.y + splitY,  w: node.w, h: node.h - splitY }, leaves, depth+1, maxDepth);
        }
    }

    /**
     * 2. DUNGEON GENERATION ENGINE (BSP + Room Shape Rollers + Winding A*)
     */
    generateUpperLevel() {
        const grid = create2DArray(this.width, this.height, TILE_TYPES.DUNGEON_WALL);
        const rooms = [];

        // 2.1 Partition grid
        const root = { x: 2, y: 2, w: this.width - 4, h: this.height - 4 };
        this.splitBSP(root, rooms, 0, 4);

        
        const roomList = [];
        let roomId = 1;
        const shuffledRooms = shuffleArray(rooms);
        const limit = Math.min(this.targetRoomCount, shuffledRooms.length);

        // Compute room shape weights
        const totalShapeWeight = this.shapeRect + this.shapeCircle + this.shapeHex + this.shapeIrreg;
        
        for (let i = 0; i < limit; i++) {
            const leaf = shuffledRooms[i];
            
            // Adjust room bounds slightly larger to fit circular/irregular details
            const w = randomRange(Math.max(5, Math.floor(leaf.w * 0.55)), Math.floor(leaf.w * 0.85));
            const h = randomRange(Math.max(5, Math.floor(leaf.h * 0.55)), Math.floor(leaf.h * 0.85));
            const x = leaf.x + randomRange(1, leaf.w - w - 1);
            const y = leaf.y + randomRange(1, leaf.h - h - 1);
            
            const room = { id: `room_${roomId}`, x, y, w, h, center: { x: x + Math.floor(w/2), y: y + Math.floor(h/2) } };
            
            // Roll room shape
            const roll = randomRange(1, totalShapeWeight);
            let shapeType = 'rectangular';
            if (roll <= this.shapeRect) {
                shapeType = 'rectangular';
            } else if (roll <= this.shapeRect + this.shapeCircle) {
                shapeType = 'circular';
            } else if (roll <= this.shapeRect + this.shapeCircle + this.shapeHex) {
                shapeType = 'hexagonal';
            } else {
                shapeType = 'irregular';
            }
            
            room.shape = shapeType;
            roomList.push(room);
            
            // Carve shape
            this.carveRoomShape(grid, room, shapeType);
            
            // Generate interior obstacles matching the room shape
            this.placeShapeSpecificObstacles(grid, room);

            roomId++;
        }

        // 2.2 Winding corridors builder using A* path weights & Simplex offsets
        // Prevents double corridors and weaves winding passageways
        const AStarWeights = create2DArray(this.width, this.height, 15);
        const noiseMap = this.generateValueNoise(this.width, this.height, 2);

        const rebuildWeightGrid = () => {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tile = grid[y][x];
                    
                    if (tile === TILE_TYPES.DUNGEON_ROOM || tile === TILE_TYPES.DUNGEON_CORRIDOR) {
                        AStarWeights[y][x] = 1; 
                    } else {
                        // Apply Simplex/Value noise winding cost offset
                        const noiseVal = noiseMap[y][x]; // 0.0 to 1.0
                        const wiggleCost = Math.floor(noiseVal * (this.winding / 10) * 1.5);
                        AStarWeights[y][x] = 15 + wiggleCost;
                    }
                    
                    // Adjacency penalty to prevent double corridors next to each other
                    if (tile === TILE_TYPES.DUNGEON_CORRIDOR) {
                        const neighbors = this.getNeighbors(x, y);
                        neighbors.forEach(n => {
                            if (grid[n.y][n.x] === TILE_TYPES.DUNGEON_WALL) {
                                AStarWeights[n.y][n.x] = 45; 
                            }
                        });
                    }
                }
            }
        };

        const connections = [];
        for (let i = 0; i < roomList.length - 1; i++) {
            rebuildWeightGrid();
            const r1 = roomList[i];
            const r2 = roomList[i+1];
            
            const path = this.findAStarPath(grid, r1.center.x, r1.center.y, r2.center.x, r2.center.y, (tile, x, y) => {
                return AStarWeights[y][x];
            });

            if (path) {
                path.forEach(pt => {
                    if (grid[pt.y][pt.x] === TILE_TYPES.DUNGEON_WALL) {
                        grid[pt.y][pt.x] = TILE_TYPES.DUNGEON_CORRIDOR;
                    }
                });
            }
            connections.push([i, i+1]);
        }

        // Loop connectivity connectivity loops
        const extraCount = Math.floor((this.connectivity / 100) * roomList.length);
        let safety = 0;
        for (let e = 0; e < extraCount && safety < 100; e++) {
            const r1Idx = randomRange(0, roomList.length - 1);
            const r2Idx = randomRange(0, roomList.length - 1);
            if (r1Idx !== r2Idx && !connections.some(c => (c[0] === r1Idx && c[1] === r2Idx) || (c[0] === r2Idx && c[1] === r1Idx))) {
                rebuildWeightGrid();
                const r1 = roomList[r1Idx];
                const r2 = roomList[r2Idx];
                
                const path = this.findAStarPath(grid, r1.center.x, r1.center.y, r2.center.x, r2.center.y, (tile, x, y) => {
                    return AStarWeights[y][x];
                });

                if (path) {
                    path.forEach(pt => {
                        if (grid[pt.y][pt.x] === TILE_TYPES.DUNGEON_WALL) {
                            grid[pt.y][pt.x] = TILE_TYPES.DUNGEON_CORRIDOR;
                        }
                    });
                }
                connections.push([r1Idx, r2Idx]);
            }
            safety++;
        }

        // 2.3 Place Doors and Torches along corridors
        this.placeDungeonDoorsAndLights(grid);

        // 2.4 Populating rooms meta data
        const dData = {};
        const stairsRoomIndex = randomRange(0, roomList.length - 1);
        
        roomList.forEach((r, idx) => {
            const key = r.id;
            const isStairs = idx === stairsRoomIndex;
            const hasLoot = Math.random() < 0.65 || isStairs;
            const hasTrap = Math.random() < 0.4 && !isStairs;
            
            const rTheme = ROOM_TEMPLATES[this.dungeonTheme] || ROOM_TEMPLATES.stone;
            const rName = rTheme.names[idx % rTheme.names.length] || `Chamber ${idx+1}`;
            const rDesc = randomChoice(rTheme.descriptions) || "Cold masonry dungeon walls.";

            let shapeLabel = r.shape.charAt(0).toUpperCase() + r.shape.substring(1);

            dData[key] = {
                id: key,
                name: `${rName} (${shapeLabel})`,
                type: isStairs ? "Exit Chamber" : "Dungeon Room",
                rect: { x: r.x, y: r.y, w: r.w, h: r.h },
                description: rDesc,
                sights: [randomChoice(SENSORY_MATRICES.sights)],
                sounds: [randomChoice(SENSORY_MATRICES.sounds)],
                smells: [randomChoice(SENSORY_MATRICES.smells)],
                encounter: this.generateEncounter(this.dungeonTheme),
                loot: hasLoot ? this.generateLoot() : null,
                hazard: hasTrap ? randomChoice(HAZARDS) : null,
                stairs: isStairs
            };

            if (isStairs) {
                grid[r.center.y][r.center.x] = TILE_TYPES.DUNGEON_STAIRS_DOWN;
            }
        });

        this.levels.upper = grid;
        this.roomsData.upper = dData;
    }

    carveRoomShape(grid, room, shapeType) {
        const cx = room.center.x;
        const cy = room.center.y;

        if (shapeType === 'rectangular') {
            for (let ry = room.y; ry < room.y + room.h; ry++) {
                for (let rx = room.x; rx < room.x + room.w; rx++) {
                    grid[ry][rx] = TILE_TYPES.DUNGEON_ROOM;
                }
            }
        } 
        else if (shapeType === 'circular') {
            // Radius R capped inside leaf footprint
            const R = Math.min(room.w, room.h) / 2;
            for (let ry = room.y; ry < room.y + room.h; ry++) {
                for (let rx = room.x; rx < room.x + room.w; rx++) {
                    const dx = rx - cx;
                    const dy = ry - cy;
                    if (dx*dx + dy*dy <= R*R) {
                        grid[ry][rx] = TILE_TYPES.DUNGEON_ROOM;
                    }
                }
            }
        } 
        else if (shapeType === 'hexagonal') {
            const R = Math.min(room.w, room.h) / 2;
            for (let ry = room.y; ry < room.y + room.h; ry++) {
                for (let rx = room.x; rx < room.x + room.w; rx++) {
                    // Check hex coordinate distances
                    const dist = this.getHexDistance(rx, ry, cx, cy);
                    if (dist <= R) {
                        grid[ry][rx] = TILE_TYPES.DUNGEON_ROOM;
                    }
                }
            }
        } 
        else if (shapeType === 'irregular') {
            // Cellular Automata Seed organic chamber carver
            // Turn on center cell plus local CA noise
            for (let ry = room.y + 1; ry < room.y + room.h - 1; ry++) {
                for (let rx = room.x + 1; rx < room.x + room.w - 1; rx++) {
                    const dist = Math.abs(rx - cx) + Math.abs(ry - cy);
                    grid[ry][rx] = dist < 2 || Math.random() < 0.65 ? TILE_TYPES.DUNGEON_ROOM : TILE_TYPES.DUNGEON_WALL;
                }
            }

            // Run CA smoothing steps inside room boundaries
            for (let iter = 0; iter < 2; iter++) {
                const temp = create2DArray(this.width, this.height, TILE_TYPES.DUNGEON_WALL);
                for (let ry = room.y + 1; ry < room.y + room.h - 1; ry++) {
                    for (let rx = room.x + 1; rx < room.x + room.w - 1; rx++) {
                        let activeNeighbors = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (grid[ry + dy][rx + dx] === TILE_TYPES.DUNGEON_ROOM) {
                                    activeNeighbors++;
                                }
                            }
                        }
                        temp[ry][rx] = activeNeighbors >= 4 ? TILE_TYPES.DUNGEON_ROOM : TILE_TYPES.DUNGEON_WALL;
                    }
                }
                for (let ry = room.y + 1; ry < room.y + room.h - 1; ry++) {
                    for (let rx = room.x + 1; rx < room.x + room.w - 1; rx++) {
                        grid[ry][rx] = temp[ry][rx];
                    }
                }
            }

            // Force center cell to be floor
            grid[cy][cx] = TILE_TYPES.DUNGEON_ROOM;
        }
    }

    placeShapeSpecificObstacles(grid, room) {
        const cx = room.center.x;
        const cy = room.center.y;
        
        if (room.shape === 'circular') {
            // circular columns placement
            const R = Math.floor(Math.min(room.w, room.h) / 2) - 1;
            if (R >= 2) {
                // place 3 to 4 pillars in circular configuration
                for (let angle = 0; angle < 360; angle += 90) {
                    const rad = angle * (Math.PI / 180);
                    const ox = Math.round(cx + R * Math.cos(rad));
                    const oy = Math.round(cy + R * Math.sin(rad));
                    if (grid[oy] && grid[oy][ox] === TILE_TYPES.DUNGEON_ROOM) {
                        grid[oy][ox] = TILE_TYPES.DUNGEON_OBSTACLE;
                    }
                }
            }
        } 
        else if (room.shape === 'hexagonal') {
            // place pillars at corners
            const R = Math.floor(Math.min(room.w, room.h) / 2) - 1;
            if (R >= 2) {
                for (let i = 0; i < 6; i++) {
                    const angle = 60 * i;
                    const rad = angle * (Math.PI / 180);
                    const ox = Math.round(cx + R * Math.cos(rad));
                    const oy = Math.round(cy + R * Math.sin(rad));
                    if (grid[oy] && grid[oy][ox] === TILE_TYPES.DUNGEON_ROOM) {
                        grid[oy][ox] = TILE_TYPES.DUNGEON_OBSTACLE;
                    }
                }
            }
        } 
        else if (room.shape === 'irregular') {
            // scattered random stones/rubble
            const obstacleCount = randomRange(2, 4);
            for (let i = 0; i < obstacleCount; i++) {
                const rx = randomRange(room.x + 1, room.x + room.w - 2);
                const ry = randomRange(room.y + 1, room.y + room.h - 2);
                if (grid[ry][rx] === TILE_TYPES.DUNGEON_ROOM && (rx !== cx || ry !== cy)) {
                    grid[ry][rx] = TILE_TYPES.DUNGEON_OBSTACLE;
                }
            }
        } 
        else {
            // rectangular layout: align obstacles with walls
            const obstacleCount = randomRange(1, 3);
            for (let i = 0; i < obstacleCount; i++) {
                const rx = Math.random() < 0.5 ? room.x + 1 : room.x + room.w - 2;
                const ry = randomRange(room.y + 1, room.y + room.h - 2);
                if (grid[ry][rx] === TILE_TYPES.DUNGEON_ROOM && (rx !== cx || ry !== cy)) {
                    grid[ry][rx] = TILE_TYPES.DUNGEON_OBSTACLE;
                }
            }
        }
    }

    placeDungeonDoorsAndLights(grid) {
        // Place doors
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (grid[y][x] === TILE_TYPES.DUNGEON_CORRIDOR) {
                    let isRoomN = grid[y - 1][x] === TILE_TYPES.DUNGEON_ROOM;
                    let isRoomS = grid[y + 1][x] === TILE_TYPES.DUNGEON_ROOM;
                    let isRoomW = grid[y][x - 1] === TILE_TYPES.DUNGEON_ROOM;
                    let isRoomE = grid[y][x + 1] === TILE_TYPES.DUNGEON_ROOM;

                    if ((isRoomN && grid[y + 1][x] === TILE_TYPES.DUNGEON_CORRIDOR) || 
                        (isRoomS && grid[y - 1][x] === TILE_TYPES.DUNGEON_CORRIDOR) ||
                        (isRoomW && grid[y][x + 1] === TILE_TYPES.DUNGEON_CORRIDOR) ||
                        (isRoomE && grid[y][x - 1] === TILE_TYPES.DUNGEON_CORRIDOR)) {
                        
                        const roll = Math.random();
                        if (roll < 0.08) {
                            grid[y][x] = TILE_TYPES.DUNGEON_SECRET_DOOR;
                        } else if (roll < 0.35) {
                            grid[y][x] = TILE_TYPES.DUNGEON_DOOR_OPEN;
                        } else {
                            grid[y][x] = TILE_TYPES.DUNGEON_DOOR_CLOSED;
                        }
                    }
                }
            }
        }

        // Place Light Torches at corridor junctions
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (grid[y][x] === TILE_TYPES.DUNGEON_CORRIDOR) {
                    // Check if corridor intersection
                    let n = grid[y-1][x] === TILE_TYPES.DUNGEON_CORRIDOR;
                    let s = grid[y+1][x] === TILE_TYPES.DUNGEON_CORRIDOR;
                    let w = grid[y][x-1] === TILE_TYPES.DUNGEON_CORRIDOR;
                    let e = grid[y][x+1] === TILE_TYPES.DUNGEON_CORRIDOR;
                    
                    const count = (n?1:0) + (s?1:0) + (w?1:0) + (e?1:0);
                    if (count >= 3 && Math.random() < 0.4) {
                        grid[y][x] = TILE_TYPES.DUNGEON_TORCH;
                    }
                }
            }
        }
    }

    /**
     * 3. LOWER CAVERN GENERATION (CA variant + Torches)
     */
    generateLowerLevel() {
        let grid = create2DArray(this.width, this.height, TILE_TYPES.CAVERN_WALL);
        const cData = {};

        const isHex = (this.gridShape === 'hex');
        const wallProbability = isHex ? 0.42 : 0.45;
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                grid[y][x] = Math.random() < wallProbability ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
            }
        }

        for (let x = 0; x < this.width; x++) {
            grid[0][x] = TILE_TYPES.CAVERN_WALL;
            grid[this.height - 1][x] = TILE_TYPES.CAVERN_WALL;
        }
        for (let y = 0; y < this.height; y++) {
            grid[y][0] = TILE_TYPES.CAVERN_WALL;
            grid[y][this.width - 1] = TILE_TYPES.CAVERN_WALL;
        }

        for (let iter = 0; iter < 4; iter++) {
            grid = this.runCAStep(grid);
        }

        this.ensureCavernConnectivity(grid);
        this.spawnCavernObstaclesAndMushrooms(grid);

        // Place Cavern Light sources (bioluminescent nodes)
        for (let y = 3; y < this.height - 3; y++) {
            for (let x = 3; x < this.width - 3; x++) {
                if (grid[y][x] === TILE_TYPES.CAVERN_FLOOR && Math.random() < 0.02) {
                    grid[y][x] = TILE_TYPES.CAVERN_TORCH;
                }
            }
        }

        this.identifyCavernRegions(grid, cData);

        this.levels.lower = grid;
        this.roomsData.lower = cData;
    }

    runCAStep(grid) {
        const nextGrid = create2DArray(this.width, this.height, TILE_TYPES.CAVERN_WALL);
        const isHex = (this.gridShape === 'hex');
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const neighbors = this.getNeighbors(x, y);
                let wallNeighbors = 0;
                
                neighbors.forEach(n => {
                    if (grid[n.y][n.x] === TILE_TYPES.CAVERN_WALL) {
                        wallNeighbors++;
                    }
                });

                if (isHex) {
                    if (grid[y][x] === TILE_TYPES.CAVERN_WALL) {
                        nextGrid[y][x] = wallNeighbors >= 3 ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
                    } else {
                        nextGrid[y][x] = wallNeighbors >= 4 ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
                    }
                } else {
                    let totalWallNeighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (grid[y + dy][x + dx] === TILE_TYPES.CAVERN_WALL) {
                                totalWallNeighbors++;
                            }
                        }
                    }

                    if (grid[y][x] === TILE_TYPES.CAVERN_WALL) {
                        nextGrid[y][x] = totalWallNeighbors >= 4 ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
                    } else {
                        nextGrid[y][x] = totalWallNeighbors >= 5 ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
                    }
                }
            }
        }
        return nextGrid;
    }

    ensureCavernConnectivity(grid) {
        const visited = create2DArray(this.width, this.height, false);
        const components = [];

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (grid[y][x] !== TILE_TYPES.CAVERN_WALL && !visited[y][x]) {
                    const component = [];
                    const queue = [{ x, y }];
                    visited[y][x] = true;

                    while (queue.length > 0) {
                        const cell = queue.shift();
                        component.push(cell);

                        const neighbors = this.getNeighbors(cell.x, cell.y);
                        for (const n of neighbors) {
                            if (grid[n.y][n.x] !== TILE_TYPES.CAVERN_WALL && !visited[n.y][n.x]) {
                                visited[n.y][n.x] = true;
                                queue.push(n);
                            }
                        }
                    }
                    components.push(component);
                }
            }
        }

        if (components.length <= 1) return;

        components.sort((a, b) => b.length - a.length);
        const mainComponent = components[0];

        for (let i = 1; i < components.length; i++) {
            const comp = components[i];
            let minDistance = Infinity;
            let bestA = null;
            let bestB = null;

            const sampleCount = Math.min(100, comp.length);
            const step = Math.max(1, Math.floor(comp.length / sampleCount));
            
            for (let cIdx = 0; cIdx < comp.length; cIdx += step) {
                const cellB = comp[cIdx];
                for (let mIdx = 0; mIdx < mainComponent.length; mIdx += Math.max(1, Math.floor(mainComponent.length / 100))) {
                    const cellA = mainComponent[mIdx];
                    const dist = Math.abs(cellA.x - cellB.x) + Math.abs(cellA.y - cellB.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestA = cellA;
                        bestB = cellB;
                    }
                }
            }

            if (bestA && bestB) {
                this.carveCavernTunnel(grid, bestA.x, bestA.y, bestB.x, bestB.y);
                mainComponent.push(...comp);
            }
        }
    }

    carveCavernTunnel(grid, x1, y1, x2, y2) {
        let curX = x1;
        let curY = y1;
        while (curX !== x2 || curY !== y2) {
            const neighbors = this.getNeighbors(curX, curY);
            grid[curY][curX] = TILE_TYPES.CAVERN_FLOOR;
            neighbors.forEach(n => {
                grid[n.y][n.x] = TILE_TYPES.CAVERN_FLOOR;
            });

            const dx = Math.sign(x2 - curX);
            const dy = Math.sign(y2 - curY);
            if (dx !== 0 && dy !== 0) {
                if (Math.random() < 0.5) curX += dx;
                else curY += dy;
            } else if (dx !== 0) {
                curX += dx;
            } else {
                curY += dy;
            }
        }
    }

    spawnCavernObstaclesAndMushrooms(grid) {
        for (let attempt = 0; attempt < 6; attempt++) {
            const px = randomRange(5, this.width - 6);
            const py = randomRange(5, this.height - 6);
            if (grid[py][px] === TILE_TYPES.CAVERN_FLOOR) {
                const neighbors = this.getNeighbors(px, py);
                grid[py][px] = TILE_TYPES.CAVERN_WATER;
                neighbors.forEach(n => {
                    if (grid[n.y][n.x] === TILE_TYPES.CAVERN_FLOOR && Math.random() < 0.7) {
                        grid[n.y][n.x] = TILE_TYPES.CAVERN_WATER;
                    }
                });
            }
        }

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (grid[y][x] === TILE_TYPES.CAVERN_FLOOR) {
                    const nList = this.getNeighbors(x, y);
                    const nearWater = nList.some(n => grid[n.y][n.x] === TILE_TYPES.CAVERN_WATER);
                    
                    if (Math.random() < (nearWater ? 0.25 : 0.03)) {
                        grid[y][x] = TILE_TYPES.CAVERN_MUSHROOMS;
                    }
                    else if (Math.random() < 0.04) {
                        grid[y][x] = TILE_TYPES.CAVERN_OBSTACLE;
                    }
                }
            }
        }
    }

    identifyCavernRegions(grid, cData) {
        const quadW = Math.floor(this.width / 2);
        const quadH = Math.floor(this.height / 2);
        const quads = [
            { x: 2, y: 2, w: quadW - 2, h: quadH - 2, name: "Eastern Echo-Cave" },
            { x: quadW, y: 2, w: quadW - 2, h: quadH - 2, name: "Luminescent Hollow" },
            { x: 2, y: quadH, w: quadW - 2, h: quadH - 2, name: "Obsidian Deep" },
            { x: quadW, y: quadH, w: quadW - 2, h: quadH - 2, name: "Whispering Chasm" }
        ];

        let caveId = 1;
        quads.forEach(q => {
            let fx = -1, fy = -1;
            for (let attempt = 0; attempt < 100; attempt++) {
                const rx = randomRange(q.x, q.x + q.w);
                const ry = randomRange(q.y, q.y + q.h);
                if (grid[ry][rx] === TILE_TYPES.CAVERN_FLOOR || grid[ry][rx] === TILE_TYPES.CAVERN_MUSHROOMS) {
                    fx = rx;
                    fy = ry;
                    break;
                }
            }

            if (fx !== -1) {
                const key = `cave_${caveId}`;
                const hasLoot = Math.random() < 0.55;
                const hasTrap = Math.random() < 0.35;

                cData[key] = {
                    id: key,
                    name: q.name,
                    type: "Cavern Chamber",
                    rect: { x: fx - 2, y: fy - 2, w: 5, h: 5 },
                    description: "Winding cavern structures, damp walls coated in luminescent fungal spores.",
                    sights: [randomChoice(SENSORY_MATRICES.sights)],
                    sounds: [randomChoice(SENSORY_MATRICES.sounds)],
                    smells: [randomChoice(SENSORY_MATRICES.smells)],
                    encounter: this.generateEncounter('cavern'),
                    loot: hasLoot ? this.generateLoot() : null,
                    hazard: hasTrap ? randomChoice(HAZARDS) : null,
                    stairs: false
                };
                caveId++;
            }
        });
    }

    /**
     * 4. INTER-LEVEL LINKING
     */
    linkMultilevels() {
        if (this.levels.surface && this.levels.upper) {
            let entranceX = -1, entranceY = -1;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.levels.surface[y][x] === TILE_TYPES.SURFACE_ENTRANCE) {
                        entranceX = x;
                        entranceY = y;
                        break;
                    }
                }
            }
            const upperRooms = Object.values(this.roomsData.upper);
            if (upperRooms.length > 0 && entranceX !== -1) {
                const firstRoom = upperRooms[0];
                firstRoom.description += ` An iron spiral staircase leads directly upward, exiting to the surface ruins at grid [${entranceX}, ${entranceY}].`;
                firstRoom.name = "Dungeon Entrance Chamber";
            }
        }

        if (this.levels.upper && this.levels.lower) {
            let dX = -1, dY = -1;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.levels.upper[y][x] === TILE_TYPES.DUNGEON_STAIRS_DOWN) {
                        dX = x;
                        dY = y;
                        break;
                    }
                }
            }

            if (dX !== -1) {
                let placed = false;
                let range = 0;
                while (!placed && range < this.width) {
                    for (let dy = -range; dy <= range; dy++) {
                        for (let dx = -range; dx <= range; dx++) {
                            const tx = dX + dx;
                            const ty = dY + dy;
                            if (tx > 0 && tx < this.width - 1 && ty > 0 && ty < this.height - 1) {
                                if (this.levels.lower[ty][tx] === TILE_TYPES.CAVERN_FLOOR || 
                                    this.levels.lower[ty][tx] === TILE_TYPES.CAVERN_MUSHROOMS) {
                                    this.levels.lower[ty][tx] = TILE_TYPES.CAVERN_STAIRS_UP;
                                    
                                    const lowerRooms = Object.values(this.roomsData.lower);
                                    if (lowerRooms.length > 0) {
                                        let closestCave = lowerRooms[0];
                                        let minDist = Infinity;
                                        lowerRooms.forEach(cr => {
                                            const dist = Math.abs(cr.rect.x - tx) + Math.abs(cr.rect.y - ty);
                                            if (dist < minDist) {
                                                minDist = dist;
                                                closestCave = cr;
                                            }
                                        });
                                        closestCave.description += ` A set of stone steps ascends back up to Level -1 at [${dX}, ${dY}].`;
                                        closestCave.name = "Cavern Ascent Chamber";
                                        closestCave.stairs = true;
                                    }
                                    placed = true;
                                    break;
                                }
                            }
                        }
                        if (placed) break;
                    }
                    range++;
                }
            }
        }
    }

    /**
     * 5. ENCOUNTER GENERATOR
     */
    generateEncounter(biomeCategory) {
        const levelThresholds = XP_THRESHOLDS[this.partyLevel] || XP_THRESHOLDS[1];
        let diffKey = 'medium'; 
        if (this.difficulty === 'hard') diffKey = 'hard';
        if (this.difficulty === 'deadly') diffKey = 'deadly';
        
        const baseXPPerPlayer = levelThresholds[diffKey];
        let totalBudget = baseXPPerPlayer * this.partySize;

        const monsterList = MONSTERS[biomeCategory] || MONSTERS.stone;
        const availableMonsters = monsterList.filter(m => m.xp <= totalBudget);
        
        if (availableMonsters.length === 0) {
            return { difficulty: diffKey, summary: "Empty room", monsters: [], totalXP: 0 };
        }

        const selectedMonsters = [];
        let remainingBudget = totalBudget;
        let safety = 0;

        while (remainingBudget > 0 && safety < 10) {
            const candidates = availableMonsters.filter(m => m.xp <= remainingBudget * 1.25);
            if (candidates.length === 0) break;
            
            let chosen;
            if (selectedMonsters.length > 0 && Math.random() < 0.6) {
                chosen = selectedMonsters[Math.floor(Math.random() * selectedMonsters.length)];
                if (chosen.xp > remainingBudget) {
                    chosen = randomChoice(candidates);
                }
            } else {
                chosen = randomChoice(candidates);
            }

            const existing = selectedMonsters.find(m => m.name === chosen.name);
            if (existing) {
                existing.count++;
            } else {
                selectedMonsters.push({ ...chosen, count: 1 });
            }
            remainingBudget -= chosen.xp;
            safety++;
        }

        let totalXP = 0;
        let monsterCount = 0;
        selectedMonsters.forEach(m => {
            totalXP += m.xp * m.count;
            monsterCount += m.count;
        });

        let multiplier = 1;
        if (monsterCount === 2) multiplier = 1.5;
        else if (monsterCount >= 3 && monsterCount <= 6) multiplier = 2;
        else if (monsterCount >= 7 && monsterCount <= 10) multiplier = 2.5;
        else if (monsterCount >= 11) multiplier = 3;

        const balancedXP = Math.floor(totalXP * multiplier);
        
        let finalDifficulty = diffKey;
        if (balancedXP > levelThresholds.deadly * this.partySize) finalDifficulty = "deadly";
        else if (balancedXP > levelThresholds.hard * this.partySize) finalDifficulty = "hard";
        else if (balancedXP > levelThresholds.medium * this.partySize) finalDifficulty = "medium";
        else finalDifficulty = "easy";

        let summary = "No active threats.";
        if (selectedMonsters.length > 0) {
            summary = selectedMonsters.map(m => `${m.count}x ${m.name}`).join(", ");
        }

        return {
            difficulty: finalDifficulty,
            summary,
            monsters: selectedMonsters,
            totalXP: balancedXP
        };
    }

    generateLoot() {
        const levelGroup = this.partyLevel >= 5 ? 'rare' : 'common';
        const gpMultiplier = this.partyLevel * randomRange(6, 25);
        const cRoll = randomRange(1, 100);
        const structure = LOOT_TEMPLATES.currency.find(c => cRoll <= c.roll) || LOOT_TEMPLATES.currency[0];
        
        const gpVal = gpMultiplier;
        const spVal = gpMultiplier * randomRange(4, 12);
        const ppVal = Math.floor(gpMultiplier * 0.15);
        const gemVal = Math.floor(gpMultiplier / 8) + 1;

        let coinSummary = structure.text
            .replace("{gp}", gpVal)
            .replace("{sp}", spVal)
            .replace("{pp}", ppVal)
            .replace("{gems}", gemVal);

        const itemPills = [];
        const pool1 = LOOT_TEMPLATES.items[levelGroup === 'rare' ? 'uncommon' : 'common'];
        itemPills.push(randomChoice(pool1));

        if (Math.random() < 0.5) {
            const pool2 = LOOT_TEMPLATES.items[levelGroup === 'rare' ? 'rare' : 'uncommon'];
            itemPills.push(randomChoice(pool2));
        }

        return { coins: coinSummary, items: itemPills };
    }

    /**
     * 6. A* PATHFINDER ROUTER (Noise weighted winding paths)
     */
    findAStarPath(grid, startX, startY, endX, endY, costFn) {
        const openSet = [{ x: startX, y: startY, g: 0, f: 0, parent: null }];
        const closedSet = new Set();
        
        const coordKey = (x, y) => `${x},${y}`;
        const endKey = coordKey(endX, endY);
        
        let safety = 0;
        while (openSet.length > 0 && safety < 5000) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            
            const curKey = coordKey(current.x, current.y);
            if (curKey === endKey) {
                const path = [];
                let node = current;
                while (node) {
                    path.push({ x: node.x, y: node.y });
                    node = node.parent;
                }
                return path.reverse();
            }
            
            closedSet.add(curKey);
            
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const n of neighbors) {
                const nKey = coordKey(n.x, n.y);
                if (closedSet.has(nKey)) continue;
                
                const tile = grid[n.y][n.x];
                const weight = costFn(tile, n.x, n.y);
                const tentativeG = current.g + weight;
                
                let openNode = openSet.find(o => coordKey(o.x, o.y) === nKey);
                if (!openNode) {
                    const h = Math.abs(endX - n.x) + Math.abs(endY - n.y);
                    openNode = {
                        x: n.x,
                        y: n.y,
                        g: tentativeG,
                        h: h,
                        f: tentativeG + h,
                        parent: current
                    };
                    openSet.push(openNode);
                } else if (tentativeG < openNode.g) {
                    openNode.g = tentativeG;
                    openNode.f = tentativeG + openNode.h;
                    openNode.parent = current;
                }
            }
            safety++;
        }
        return null;
    }

    /**
     * 7. IMAGE TO MAP CLASSIFICATION
     */
    forgeFromImageData(imgData, parserType, activeLevelKey) {
        const width = this.width;
        const height = this.height;
        const grid = create2DArray(width, height, TILE_TYPES.VOID);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = imgData[index];
                const g = imgData[index + 1];
                const b = imgData[index + 2];
                const a = imgData[index + 3];
                
                const br = (r + g + b) / 3;
                
                if (activeLevelKey === 'surface') {
                    if (parserType === 'contrast') {
                        grid[y][x] = br < 128 ? TILE_TYPES.SURFACE_ROCK : TILE_TYPES.SURFACE_GRASS;
                    } else {
                        if (a < 50) {
                            grid[y][x] = TILE_TYPES.SURFACE_GRASS;
                        } else if (b > r * 1.25 && b > g * 1.1) {
                            grid[y][x] = TILE_TYPES.SURFACE_WATER;
                        } else if (g > r * 1.1 && g > b * 1.1) {
                            grid[y][x] = TILE_TYPES.SURFACE_GRASS;
                            if (Math.random() < 0.15) grid[y][x] = TILE_TYPES.SURFACE_TREE;
                        } else if (r > 150 && g > 150 && b < 100) {
                            grid[y][x] = TILE_TYPES.SURFACE_DIRT;
                        } else if (br < 80) {
                            grid[y][x] = TILE_TYPES.SURFACE_ROCK;
                        } else {
                            grid[y][x] = TILE_TYPES.SURFACE_GRASS;
                        }
                    }
                } else if (activeLevelKey === 'upper') {
                    if (parserType === 'contrast') {
                        grid[y][x] = br < 128 ? TILE_TYPES.DUNGEON_WALL : TILE_TYPES.DUNGEON_FLOOR;
                    } else {
                        if (br < 60) grid[y][x] = TILE_TYPES.DUNGEON_WALL;
                        else if (b > r * 1.2 && b > g * 1.2) grid[y][x] = TILE_TYPES.DUNGEON_CORRIDOR;
                        else if (r > 180 && g < 100 && b < 100) grid[y][x] = TILE_TYPES.DUNGEON_SECRET_DOOR;
                        else grid[y][x] = TILE_TYPES.DUNGEON_ROOM;
                    }
                } else {
                    if (parserType === 'contrast') {
                        grid[y][x] = br < 128 ? TILE_TYPES.CAVERN_WALL : TILE_TYPES.CAVERN_FLOOR;
                    } else {
                        if (br < 60) grid[y][x] = TILE_TYPES.CAVERN_WALL;
                        else if (b > r * 1.2 && b > g * 1.2) grid[y][x] = TILE_TYPES.CAVERN_WATER;
                        else if (r > 120 && b > 120) grid[y][x] = TILE_TYPES.CAVERN_MUSHROOMS;
                        else grid[y][x] = TILE_TYPES.CAVERN_FLOOR;
                    }
                }
            }
        }

        this.levels[activeLevelKey] = grid;
        this.roomsData[activeLevelKey] = {};
        
        if (activeLevelKey === 'upper') {
            this.floodFillIdentifyRooms(grid, d => this.roomsData.upper = d, TILE_TYPES.DUNGEON_ROOM, "Imported Chamber");
        } else if (activeLevelKey === 'lower') {
            this.floodFillIdentifyRooms(grid, d => this.roomsData.lower = d, TILE_TYPES.CAVERN_FLOOR, "Imported Cavern");
        }
    }

    floodFillIdentifyRooms(grid, saveFn, walkableTileCode, namePrefix) {
        const visited = create2DArray(this.width, this.height, false);
        const data = {};
        let rId = 1;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (grid[y][x] === walkableTileCode && !visited[y][x]) {
                    const cells = [];
                    const queue = [{ x, y }];
                    visited[y][x] = true;

                    while (queue.length > 0) {
                        const c = queue.shift();
                        cells.push(c);
                        if (cells.length > 300) break;

                        const neighbors = this.getNeighbors(c.x, c.y);
                        for (const n of neighbors) {
                            if (grid[n.y][n.x] === walkableTileCode && !visited[n.y][n.x]) {
                                visited[n.y][n.x] = true;
                                queue.push(n);
                            }
                        }
                    }

                    if (cells.length > 4) {
                        let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
                        cells.forEach(c => {
                            if (c.x < minX) minX = c.x;
                            if (c.x > maxX) maxX = c.x;
                            if (c.y < minY) minY = c.y;
                            if (c.y > maxY) maxY = c.y;
                        });

                        const key = `imported_room_${rId}`;
                        data[key] = {
                            id: key,
                            name: `${namePrefix} #${rId}`,
                            type: "Imported Room",
                            rect: { x: minX, y: minY, w: (maxX - minX + 1), h: (maxY - minY + 1) },
                            description: "A chamber imported from an external layout design.",
                            sights: ["A trace of sketch lines or external details overlaying the grid"],
                            sounds: ["A silent echo of imports"],
                            smells: ["Stale paper ink smell"],
                            encounter: this.generateEncounter(this.dungeonTheme),
                            loot: this.generateLoot(),
                            hazard: null,
                            stairs: false
                        };
                        rId++;
                    }
                }
            }
        }
        saveFn(data);
    }

    generateValueNoise(width, height, octaves = 4) {
        const grid = create2DArray(width, height, 0);
        const baseNoise = create2DArray(width, height, 0);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                baseNoise[y][x] = Math.random();
            }
        }

        const interpolate = (a, b, t) => {
            const ft = t * Math.PI;
            const f = (1 - Math.cos(ft)) * 0.5;
            return a * (1 - f) + b * f;
        };

        const sampleNoise = (x, y) => {
            const rx = (x + width) % width;
            const ry = (y + height) % height;
            return baseNoise[ry][rx];
        };

        const smoothNoise = (x, y, scale) => {
            const x1 = Math.floor(x / scale) * scale;
            const x2 = (x1 + scale) % width;
            const y1 = Math.floor(y / scale) * scale;
            const y2 = (y1 + scale) % height;

            const tx = (x - x1) / scale;
            const ty = (y - y1) / scale;

            const n1 = sampleNoise(x1, y1);
            const n2 = sampleNoise(x2, y1);
            const n3 = sampleNoise(x1, y2);
            const n4 = sampleNoise(x2, y2);

            const ix1 = interpolate(n1, n2, tx);
            const ix2 = interpolate(n3, n4, tx);

            return interpolate(ix1, ix2, ty);
        };

        let maxVal = 0;
        for (let octave = 0; octave < octaves; octave++) {
            const scale = Math.max(2, Math.pow(2, octaves - octave));
            const amplitude = Math.pow(0.5, octave);
            maxVal += amplitude;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    grid[y][x] += smoothNoise(x, y, scale) * amplitude;
                }
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                grid[y][x] /= maxVal;
            }
        }

        return grid;
    }
}
