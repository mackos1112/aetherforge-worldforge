import { MapGenerator } from './generator.js';
import { MapRenderer } from './renderer.js';
import { TILE_TYPES, THEMES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize core systems
    const generator = new MapGenerator();
    const renderer = new MapRenderer('mapCanvas', 'canvasContainer');
    
    let currentLevel = 'surface'; 
    let activeTool = 'inspect'; // inspect, paint-wall, paint-floor, paint-door, paint-torch, paint-chest, paint-obstacle, erase
    
    // Connect to Sync channel
    const syncChannel = new BroadcastChannel('aetherforge_sync');

    // 2. DOM Elements
    const selectStructure = document.getElementById('selectMapStructure');
    const selectGridShape = document.getElementById('selectGridShape');
    const selectSize = document.getElementById('selectMapSize');
    const selectWildBiome = document.getElementById('selectWildernessBiome');
    const selectDungTheme = document.getElementById('selectDungeonTheme');
    const selectPartySize = document.getElementById('selectPartySize');
    const selectPartyLevel = document.getElementById('selectPartyLevel');
    const selectDifficulty = document.getElementById('selectDifficulty');
    
    // Phase 3 Sliders
    const rangeWinding = document.getElementById('rangeWinding');
    const valWinding = document.getElementById('valWinding');
    const rangeMountains = document.getElementById('rangeMountains');
    const valMountains = document.getElementById('valMountains');
    const rangeRivers = document.getElementById('rangeRivers');
    const valRivers = document.getElementById('valRivers');
    
    const rangeShapeRect = document.getElementById('rangeShapeRect');
    const rangeShapeCircle = document.getElementById('rangeShapeCircle');
    const rangeShapeHex = document.getElementById('rangeShapeHex');
    const rangeShapeIrreg = document.getElementById('rangeShapeIrreg');

    const rangeWildDensity = document.getElementById('rangeWildernessDensity');
    const valWildDensity = document.getElementById('valWildernessDensity');
    const rangeRoomCount = document.getElementById('rangeRoomCount');
    const valRoomCount = document.getElementById('valRoomCount');
    const rangeConnectivity = document.getElementById('rangeConnectivity');
    const valConnectivity = document.getElementById('valConnectivity');
    
    const sectionWilderness = document.getElementById('sectionWilderness');
    const sectionDungeon = document.getElementById('sectionDungeon');
    
    const btnGenerate = document.getElementById('btnGenerateMap');
    const btnExportPng = document.getElementById('btnExportPng');
    const btnExportJson = document.getElementById('btnExportJson');
    const btnExportVtt = document.getElementById('btnExportVtt');
    const btnImportJson = document.getElementById('btnImportJson');
    const fileImportSelector = document.getElementById('fileImportSelector');
    
    const btnLaunchPlayer = document.getElementById('btnLaunchPlayer');
    const chkPlayMode = document.getElementById('chkPlayMode');
    const chkPlayerView = document.getElementById('chkPlayerView');
    const editorToolbar = document.getElementById('editorToolbar');
    
    const inputImageMap = document.getElementById('inputImageMap');
    const selectImageParser = document.getElementById('selectImageParser');
    const btnForgeImage = document.getElementById('btnForgeImage');
    const imageTempCanvas = document.getElementById('imageTempCanvas');
    
    const levelTabsContainer = document.getElementById('levelTabsContainer');
    const tabSurface = document.getElementById('btnTabSurface');
    const tabUpper = document.getElementById('btnTabUpper');
    const tabLower = document.getElementById('btnTabLower');
    const allTabs = [tabSurface, tabUpper, tabLower];
    
    const txtCoordinates = document.getElementById('txtCoordinates');
    const txtTileType = document.getElementById('txtTileType');
    
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnZoomReset = document.getElementById('btnZoomReset');
    
    const inspectorContent = document.getElementById('inspectorContent');
    const btnExportRoomKey = document.getElementById('btnExportRoomKey');

    // Parse URL search parameters for deep-linking
    const urlParams = new URLSearchParams(window.location.search);
    const paramSeed = urlParams.get('seed');
    const paramTheme = urlParams.get('theme');
    const paramStructure = urlParams.get('structure');

    if (paramSeed) {
        const seedInput = document.getElementById('inputSeed');
        if (seedInput) seedInput.value = paramSeed;
    }
    if (paramTheme) {
        const themeSelect = document.getElementById('selectDungeonTheme');
        if (themeSelect) {
            themeSelect.value = paramTheme;
        }
    }
    if (paramStructure) {
        const structureSelect = document.getElementById('selectMapStructure');
        if (structureSelect) {
            structureSelect.value = paramStructure;
        }
    }

    // State pointer
    let activeInspectorObject = null;
    let activeInspectorType = 'room'; 
    let activeInspectorKey = ''; 

    // 3. UI Settings Bindings
    function updateUISettingsVisibility() {
        const mode = selectStructure.value;
        if (mode === 'multilevel') {
            sectionWilderness.style.display = 'block';
            sectionDungeon.style.display = 'block';
            levelTabsContainer.style.display = 'flex';
        } else if (mode === 'single-wilderness') {
            sectionWilderness.style.display = 'block';
            sectionDungeon.style.display = 'none';
            levelTabsContainer.style.display = 'none';
        } else if (mode === 'single-dungeon') {
            sectionWilderness.style.display = 'none';
            sectionDungeon.style.display = 'block';
            levelTabsContainer.style.display = 'none';
        } else if (mode === 'single-cavern') {
            sectionWilderness.style.display = 'none';
            sectionDungeon.style.display = 'none';
            levelTabsContainer.style.display = 'none';
        }
    }

    // Sliders value updates
    rangeWinding.addEventListener('input', () => {
        valWinding.textContent = `${rangeWinding.value}% wiggle`;
    });
    rangeMountains.addEventListener('input', () => {
        valMountains.textContent = `${rangeMountains.value}% ridges`;
    });
    rangeRivers.addEventListener('input', () => {
        valRivers.textContent = `${rangeRivers.value} ${parseInt(rangeRivers.value) === 1 ? 'River' : 'Rivers'}`;
    });
    rangeWildDensity.addEventListener('input', () => {
        valWildDensity.textContent = `${rangeWildDensity.value}% trees`;
    });
    rangeRoomCount.addEventListener('input', () => {
        valRoomCount.textContent = `${rangeRoomCount.value} Rooms`;
    });
    rangeConnectivity.addEventListener('input', () => {
        valConnectivity.textContent = `${rangeConnectivity.value}% extra`;
    });

    selectStructure.addEventListener('change', updateUISettingsVisibility);

    function applyAccentTheme(themeKey) {
        const tConf = THEMES[themeKey];
        if (tConf) {
            document.documentElement.style.setProperty('--accent-hue', tConf.hue);
        }
    }

    selectDungTheme.addEventListener('change', () => {
        if (selectStructure.value !== 'single-wilderness') {
            applyAccentTheme(selectDungTheme.value);
        }
    });

    selectWildBiome.addEventListener('change', () => {
        if (selectStructure.value === 'single-wilderness') {
            applyAccentTheme(selectWildBiome.value);
        }
    });

    // 4. Generate Map Trigger
    const genOverlay   = document.getElementById('genProgressOverlay');
    const genBar       = document.getElementById('genProgressBar');
    const genLabel     = document.getElementById('genProgressLabel');
    const genSub       = document.getElementById('genProgressSub');

    function setProgress(pct, sub) {
        genBar.style.width = `${pct}%`;
        if (sub) genSub.textContent = sub;
    }

    function yieldFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    async function handleGenerate() {
        // Show progress overlay
        genOverlay.style.display = 'flex';
        genLabel.textContent = 'Forging Map…';
        setProgress(0, 'Reading configuration');
        await yieldFrame();

        let sizeVal = 48;
        const sizeStr = selectSize.value;
        if (sizeStr === 'small') sizeVal = 32;
        if (sizeStr === 'large') sizeVal = 64;

        const config = {
            width: sizeVal,
            height: sizeVal,
            structureMode: selectStructure.value,
            gridShape: selectGridShape.value,
            wildernessBiome: selectWildBiome.value,
            dungeonTheme: selectDungTheme.value,
            wildernessDensity: parseInt(rangeWildDensity.value),
            targetRoomCount: parseInt(rangeRoomCount.value),
            connectivity: parseInt(rangeConnectivity.value),
            partySize: parseInt(selectPartySize.value),
            partyLevel: parseInt(selectPartyLevel.value),
            difficulty: selectDifficulty.value,
            winding: parseInt(rangeWinding.value),
            shapeRect: parseInt(rangeShapeRect.value),
            shapeCircle: parseInt(rangeShapeCircle.value),
            shapeHex: parseInt(rangeShapeHex.value),
            shapeIrreg: parseInt(rangeShapeIrreg.value),
            riversCount: parseInt(rangeRivers.value),
            mountainsDensity: parseInt(rangeMountains.value)
        };

        setProgress(10, 'Seeding elevation noise…');
        await yieldFrame();

        generator.updateConfig(config);

        setProgress(20, 'Generating terrain…');
        await yieldFrame();

        let result;
        try {
            result = generator.generateAll();
        } catch (err) {
            genOverlay.style.display = 'none';
            console.error('Map generation failed:', err);
            alert('Generation error: ' + err.message);
            return;
        }

        setProgress(70, 'Placing rooms & corridors…');
        await yieldFrame();

        // Setup initial tabs / renderer
        if (config.structureMode === 'multilevel') {
            currentLevel = 'surface';
            applyAccentTheme(config.wildernessBiome);
            allTabs.forEach(t => t.classList.remove('active'));
            tabSurface.classList.add('active');
            renderer.setMapData(
                'surface',
                result.levels.surface,
                result.roomsData.surface,
                config.dungeonTheme,
                config.wildernessBiome,
                config.gridShape
            );
        } else {
            if (config.structureMode === 'single-wilderness') {
                currentLevel = 'surface';
                applyAccentTheme(config.wildernessBiome);
                renderer.setMapData('surface', result.levels.surface, result.roomsData.surface, config.dungeonTheme, config.wildernessBiome, config.gridShape);
            } else if (config.structureMode === 'single-dungeon') {
                currentLevel = 'upper';
                applyAccentTheme(config.dungeonTheme);
                renderer.setMapData('upper', result.levels.upper, result.roomsData.upper, config.dungeonTheme, config.wildernessBiome, config.gridShape);
            } else if (config.structureMode === 'single-cavern') {
                currentLevel = 'lower';
                applyAccentTheme('cavern');
                renderer.setMapData('lower', result.levels.lower, result.roomsData.lower, 'cavern', config.wildernessBiome, config.gridShape);
            }
        }

        setProgress(88, 'Applying fog & lights…');
        await yieldFrame();

        // Apply Fog Masks — only render fog if Play Mode is explicitly ON
        renderer.fogMask = generator.fogMasks[currentLevel];
        renderer.playModeActive = chkPlayMode.checked;
        renderer.isPlayerView = chkPlayerView.checked;

        setProgress(95, 'Centering camera…');
        await yieldFrame();

        // Re-center camera now that canvas has proper dimensions
        renderer.centerCamera();

        setProgress(100, 'Done!');
        await yieldFrame();

        clearInspector();
        broadcastSyncState();

        // Hide overlay after brief delay so user sees 100%
        setTimeout(() => {
            genOverlay.style.display = 'none';
            setProgress(0, 'Initializing world seed');
        }, 350);
    }

    btnGenerate.addEventListener('click', handleGenerate);


    // 5. Level Tab Navigation
    allTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const destLevel = tab.getAttribute('data-level');
            if (destLevel === currentLevel || !generator.levels[destLevel]) return;
            
            currentLevel = destLevel;
            allTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (currentLevel === 'surface') {
                applyAccentTheme(selectWildBiome.value);
            } else if (currentLevel === 'upper') {
                applyAccentTheme(selectDungTheme.value);
            } else {
                applyThemeHexAccents();
            }

            // Load new level on renderer
            renderer.fogMask = generator.fogMasks[currentLevel];
            renderer.setMapData(
                currentLevel,
                generator.levels[currentLevel],
                generator.roomsData[currentLevel],
                generator.dungeonTheme,
                generator.wildernessBiome,
                generator.gridShape
            );
            
            clearInspector();
            broadcastSyncState();
        });
    });

    function applyThemeHexAccents() {
        applyAccentTheme('cavern');
    }

    // 6. Camera Zoom HUD bindings
    btnZoomIn.addEventListener('click', () => {
        renderer.scale = Math.min(3.0, renderer.scale + 0.15);
        renderer.applyTransform();
        broadcastSyncState();
    });
    btnZoomOut.addEventListener('click', () => {
        renderer.scale = Math.max(0.2, renderer.scale - 0.15);
        renderer.applyTransform();
        broadcastSyncState();
    });
    btnZoomReset.addEventListener('click', () => {
        renderer.centerCamera();
        broadcastSyncState();
    });

    // Capture dragging transitions to sync VTT cameras
    window.addEventListener('mouseup', () => {
        broadcastSyncState();
    });
    renderer.canvas.addEventListener('wheel', () => {
        broadcastSyncState();
    });

    // 7. Interactive Coordinates and Info HUD
    renderer.addEventListener('cellHover', (data) => {
        txtCoordinates.textContent = `X: ${data.x}, Y: ${data.y}`;
        
        let typeName = "Void Space";
        for (const [key, val] of Object.entries(TILE_TYPES)) {
            if (val === data.tileType) {
                typeName = key.replace("SURFACE_", "").replace("DUNGEON_", "").replace("CAVERN_", "").replace("_", " ");
                break;
            }
        }
        typeName = typeName.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
        
        if (data.roomId && generator.roomsData[currentLevel][data.roomId]) {
            const roomName = generator.roomsData[currentLevel][data.roomId].name;
            txtTileType.textContent = `Hovered: ${typeName} (${roomName})`;
        } else {
            txtTileType.textContent = `Hovered Tile: ${typeName}`;
        }
    });

    // 8. Room Selection Event Handling
    renderer.addEventListener('roomSelected', (roomId) => {
        const room = generator.roomsData[currentLevel][roomId];
        if (room) {
            activeInspectorObject = room;
            activeInspectorType = 'room';
            activeInspectorKey = roomId;
            renderRoomInspector(room);
        }
    });

    renderer.addEventListener('cellSelected', (cell) => {
        const coordKey = `${cell.x},${cell.y}`;
        let details = generator.customDetails[currentLevel][coordKey];
        
        if (!details) {
            let tileCode = generator.levels[currentLevel][cell.y][cell.x];
            let tileName = "Void";
            for (const [k, v] of Object.entries(TILE_TYPES)) {
                if (v === tileCode) {
                    tileName = k.replace("SURFACE_", "").replace("DUNGEON_", "").replace("CAVERN_", "").replace("_", " ").toLowerCase();
                    break;
                }
            }
            tileName = tileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');

            details = {
                id: coordKey,
                name: `${tileName} (Cell [${cell.x}, ${cell.y}])`,
                type: "Custom Coordinate Detail",
                description: `A customized cell coordinate at [${cell.x}, ${cell.y}].`,
                hazard: null,
                encounter: { difficulty: "easy", summary: "No active threats", monsters: [], totalXP: 0 },
                loot: null
            };
            generator.customDetails[currentLevel][coordKey] = details;
        }

        activeInspectorObject = details;
        activeInspectorType = 'tile';
        activeInspectorKey = coordKey;
        renderRoomInspector(details);
    });

    function clearInspector() {
        activeInspectorObject = null;
        activeInspectorType = 'room';
        activeInspectorKey = '';
        inspectorContent.innerHTML = `
            <div class="inspector-empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                <p>Hover or click on a rooms, corridors, or points of interest on the map to inspect encounters, loot, and descriptive room keys.</p>
            </div>
        `;
    }

    // Dynamic Inspector UI Builder
    function renderRoomInspector(obj) {
        let html = `
            <div class="inspector-card">
                <div class="room-card-header">
                    <h3>${obj.name}</h3>
                    <span class="room-type-tag">${obj.type}</span>
                </div>
                
                <div class="room-section">
                    <h4>Description</h4>
                    <textarea id="editDescription" class="inspector-textarea">${obj.description}</textarea>
                </div>

                <div class="room-section">
                    <h4>Environmental Hazard / Trap</h4>
                    <div class="editor-field-group">
                        <label>Hazard Name</label>
                        <input type="text" id="editTrapName" class="inspector-input" value="${obj.hazard ? obj.hazard.name : ''}" placeholder="None">
                    </div>
                    <div class="editor-field-group">
                        <label>Trigger</label>
                        <input type="text" id="editTrapTrigger" class="inspector-input" value="${obj.hazard ? obj.hazard.trigger : ''}" placeholder="e.g. pressure plate">
                    </div>
                    <div class="editor-field-group">
                        <label>Effect Description</label>
                        <textarea id="editTrapEffect" class="inspector-textarea" placeholder="e.g. DC 14 Dex save, 2d10 fire damage">${obj.hazard ? obj.hazard.effect : ''}</textarea>
                    </div>
                </div>
        `;

        const enc = obj.encounter || { difficulty: "easy", summary: "Empty", monsters: [] };
        html += `
            <div class="room-section">
                <h4>Combat Monsters</h4>
                <div class="editor-monster-list" id="editorMonsterList">
        `;

        if (enc.monsters && enc.monsters.length > 0) {
            enc.monsters.forEach((m, idx) => {
                html += `
                    <div class="editor-monster-row" data-index="${idx}">
                        <input type="number" class="inspector-input monster-qty-input" value="${m.count}" min="1" max="50">
                        <input type="text" class="inspector-input monster-name-input" value="${m.name}">
                        <button class="btn-small-danger delete-monster-btn" title="Remove">&times;</button>
                    </div>
                `;
            });
        } else {
            html += `<p class="no-monsters-tip" style="font-size:12px; color:var(--text-muted);">No monsters generated. Click below to add.</p>`;
        }

        html += `
                </div>
                <button class="btn btn-secondary btn-icon" id="btnAddMonsterField" style="width: 100%; margin-top: 8px; font-size:11px; padding: 4px;">
                    + Add Monster Row
                </button>
            </div>
        `;

        const loot = obj.loot || { coins: "", items: [] };
        html += `
            <div class="room-section">
                <h4>Loot Drop</h4>
                <div class="editor-field-group">
                    <label>Coins & Currency</label>
                    <input type="text" id="editLootCoins" class="inspector-input" value="${loot.coins}" placeholder="e.g. 50 gp, 100 sp">
                </div>
                <div class="editor-field-group">
                    <label>Magic Items (comma separated)</label>
                    <input type="text" id="editLootItems" class="inspector-input" value="${loot.items ? loot.items.join(', ') : ''}" placeholder="e.g. Bag of Holding, Potion">
                </div>
            </div>
            
            <div class="editor-actions-row">
                <button class="btn btn-primary" id="btnSaveTileEdits" style="flex:1; padding: 8px;">
                    Save Details
                </button>
            </div>
        </div>`;

        inspectorContent.innerHTML = html;

        document.getElementById('btnSaveTileEdits').addEventListener('click', handleSaveEdits);
        document.getElementById('btnAddMonsterField').addEventListener('click', handleAddMonsterRow);
        
        const delBtns = inspectorContent.querySelectorAll('.delete-monster-btn');
        delBtns.forEach(btn => btn.addEventListener('click', handleDeleteMonsterRow));
    }

    function handleAddMonsterRow() {
        const list = document.getElementById('editorMonsterList');
        const tip = list.querySelector('.no-monsters-tip');
        if (tip) tip.remove();

        const index = list.children.length;
        const row = document.createElement('div');
        row.className = 'editor-monster-row';
        row.setAttribute('data-index', index);
        row.innerHTML = `
            <input type="number" class="inspector-input monster-qty-input" value="1" min="1" max="50">
            <input type="text" class="inspector-input monster-name-input" value="" placeholder="Monster Name">
            <button class="btn-small-danger delete-monster-btn" title="Remove">&times;</button>
        `;
        list.appendChild(row);
        row.querySelector('.delete-monster-btn').addEventListener('click', handleDeleteMonsterRow);
    }

    function handleDeleteMonsterRow(e) {
        e.target.parentElement.remove();
    }

    function handleSaveEdits() {
        if (!activeInspectorObject) return;

        activeInspectorObject.description = document.getElementById('editDescription').value;

        const trapName = document.getElementById('editTrapName').value.trim();
        const trapTrigger = document.getElementById('editTrapTrigger').value;
        const trapEffect = document.getElementById('editTrapEffect').value;
        if (trapName === "") {
            activeInspectorObject.hazard = null;
        } else {
            activeInspectorObject.hazard = {
                name: trapName,
                trigger: trapTrigger,
                effect: trapEffect,
                type: "trap"
            };
        }

        const monsterList = document.getElementById('editorMonsterList');
        const rows = monsterList.querySelectorAll('.editor-monster-row');
        const compiledMonsters = [];
        rows.forEach(r => {
            const qty = parseInt(r.querySelector('.monster-qty-input').value) || 1;
            const name = r.querySelector('.monster-name-input').value.trim();
            if (name !== "") {
                compiledMonsters.push({ name, count: qty, cr: "Custom", xp: 0 });
            }
        });

        activeInspectorObject.encounter = {
            difficulty: "Custom",
            summary: compiledMonsters.length > 0 ? compiledMonsters.map(m => `${m.count}x ${m.name}`).join(", ") : "Empty",
            monsters: compiledMonsters,
            totalXP: 0
        };

        const coins = document.getElementById('editLootCoins').value.trim();
        const itemsStr = document.getElementById('editLootItems').value.trim();
        if (coins === "" && itemsStr === "") {
            activeInspectorObject.loot = null;
        } else {
            activeInspectorObject.loot = {
                coins,
                items: itemsStr !== "" ? itemsStr.split(',').map(s => s.trim()) : []
            };
        }

        renderer.draw();
        broadcastSyncState();
        alert("Details updated successfully!");
    }

    // 9. IMAGE TO MAP CONTROLS
    btnForgeImage.addEventListener('click', () => {
        const file = inputImageMap.files[0];
        if (!file) return;

        const parserType = selectImageParser.value;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const ctx = imageTempCanvas.getContext('2d');
                let targetSize = 48;
                const sizeStr = selectSize.value;
                if (sizeStr === 'small') targetSize = 32;
                if (sizeStr === 'large') targetSize = 64;

                generator.width = targetSize;
                generator.height = targetSize;
                imageTempCanvas.width = targetSize;
                imageTempCanvas.height = targetSize;
                
                ctx.drawImage(img, 0, 0, targetSize, targetSize);
                const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
                generator.forgeFromImageData(imgData.data, parserType, currentLevel);
                
                renderer.setMapData(
                    currentLevel,
                    generator.levels[currentLevel],
                    generator.roomsData[currentLevel],
                    generator.dungeonTheme,
                    generator.wildernessBiome,
                    generator.gridShape
                );

                clearInspector();
                broadcastSyncState();
                alert(`Image successfully parsed!`);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 10. DUAL WINDOW SYNC & PLAY MODE TRIGGERS
    btnLaunchPlayer.addEventListener('click', () => {
        window.open('player.html', '_blank', 'width=1024,height=768');
        setTimeout(broadcastSyncState, 500); // give it a brief delay to open
    });

    // Broadcast synchronization state to BroadcastChannel
    function broadcastSyncState() {
        if (!generator.levels[currentLevel]) return;
        
        syncChannel.postMessage({
            type: 'sync_state',
            grid: generator.levels[currentLevel],
            roomsData: generator.roomsData[currentLevel],
            levelKey: currentLevel,
            theme: generator.dungeonTheme,
            biome: generator.wildernessBiome,
            gridShape: generator.gridShape,
            scale: renderer.scale,
            offsetX: renderer.offsetX,
            offsetY: renderer.offsetY,
            playModeActive: chkPlayMode.checked,
            fogMask: generator.fogMasks[currentLevel]
        });
    }

    chkPlayMode.addEventListener('change', () => {
        renderer.playModeActive = chkPlayMode.checked;
        renderer.draw();
        broadcastSyncState();
    });

    chkPlayerView.addEventListener('change', () => {
        renderer.isPlayerView = chkPlayerView.checked;
        renderer.draw();
        broadcastSyncState();
    });

    // In play mode, clicking a tile carves out fog
    renderer.addEventListener('fogClick', (cell) => {
        if (generator.fogMasks[currentLevel] && generator.fogMasks[currentLevel][cell.y]) {
            // Check if cell is in a room
            const roomId = renderer.findRoomAt(cell.x, cell.y);
            
            if (roomId && generator.roomsData[currentLevel][roomId]) {
                // Reveal entire room at once
                const room = generator.roomsData[currentLevel][roomId];
                for (let y = room.rect.y; y < room.rect.y + room.rect.h; y++) {
                    for (let x = room.rect.x; x < room.rect.x + room.rect.w; x++) {
                        if (generator.fogMasks[currentLevel][y]) {
                            generator.fogMasks[currentLevel][y][x] = false;
                        }
                    }
                }
            } else {
                // Reveal single tile
                generator.fogMasks[currentLevel][cell.y][cell.x] = false;
            }
            
            renderer.fogMask = generator.fogMasks[currentLevel];
            renderer.draw();
            broadcastSyncState();
        }
    });

    // 11. FREEHAND CANVAS PAINT BRUSH PALETTE
    const brushTools = editorToolbar.querySelectorAll('.editor-tool-btn');
    brushTools.forEach(btn => {
        btn.addEventListener('click', () => {
            brushTools.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTool = btn.getAttribute('data-tool');
        });
    });

    // Canvas click and drag to paint tiles
    let isPainting = false;
    
    renderer.canvas.addEventListener('mousedown', (e) => {
        if (activeTool !== 'inspect' && e.button === 0) {
            isPainting = true;
            paintTileAtCursor();
        }
    });

    renderer.canvas.addEventListener('mousemove', () => {
        if (isPainting && activeTool !== 'inspect') {
            paintTileAtCursor();
        }
    });

    window.addEventListener('mouseup', () => {
        isPainting = false;
    });

    function paintTileAtCursor() {
        const x = renderer.hoveredCell.x;
        const y = renderer.hoveredCell.y;
        if (x < 0 || x >= renderer.gridWidth || y < 0 || y >= renderer.gridHeight) return;

        let targetTileCode = TILE_TYPES.VOID;
        
        // Match active brush tool
        if (activeTool === 'paint-wall') {
            targetTileCode = currentLevel === 'surface' ? TILE_TYPES.SURFACE_RUIN_WALL : 
                             (currentLevel === 'upper' ? TILE_TYPES.DUNGEON_WALL : TILE_TYPES.CAVERN_WALL);
        } else if (activeTool === 'paint-floor') {
            targetTileCode = currentLevel === 'surface' ? TILE_TYPES.SURFACE_GRASS : 
                             (currentLevel === 'upper' ? TILE_TYPES.DUNGEON_FLOOR : TILE_TYPES.CAVERN_FLOOR);
        } else if (activeTool === 'paint-door') {
            targetTileCode = TILE_TYPES.DUNGEON_DOOR_CLOSED;
        } else if (activeTool === 'paint-torch') {
            targetTileCode = currentLevel === 'lower' ? TILE_TYPES.CAVERN_TORCH : TILE_TYPES.DUNGEON_TORCH;
        } else if (activeTool === 'paint-chest') {
            targetTileCode = TILE_TYPES.DUNGEON_ROOM; // place floor and mark loot
            const coordKey = `${x},${y}`;
            generator.customDetails[currentLevel][coordKey] = {
                id: coordKey,
                name: `Loot Cache (Cell [${x}, ${y}])`,
                type: "Custom Loot Node",
                description: "A chest placed manually.",
                hazard: null,
                encounter: { difficulty: "easy", summary: "Empty", monsters: [] },
                loot: generator.generateLoot()
            };
        } else if (activeTool === 'paint-obstacle') {
            targetTileCode = currentLevel === 'lower' ? TILE_TYPES.CAVERN_OBSTACLE : TILE_TYPES.DUNGEON_OBSTACLE;
        } else if (activeTool === 'erase') {
            targetTileCode = TILE_TYPES.VOID;
        }

        if (activeTool !== 'inspect') {
            generator.levels[currentLevel][y][x] = targetTileCode;
            renderer.draw();
            broadcastSyncState();
        }
    }

    // 12. KEYBOARD NAVIGATION
    renderer.canvas.addEventListener('click', () => {
        renderer.canvas.focus();
    });

    window.addEventListener('keydown', (e) => {
        if (document.activeElement !== renderer.canvas) return;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            
            if (renderer.selectedCell.x === -1 || renderer.selectedCell.y === -1) {
                renderer.selectedCell = { x: Math.floor(renderer.gridWidth / 2), y: Math.floor(renderer.gridHeight / 2) };
            } else {
                let dx = 0;
                let dy = 0;
                
                if (e.key === 'ArrowLeft') dx = -1;
                else if (e.key === 'ArrowRight') dx = 1;
                else if (e.key === 'ArrowUp') dy = -1;
                else if (e.key === 'ArrowDown') dy = 1;
                
                const tx = renderer.selectedCell.x + dx;
                const ty = renderer.selectedCell.y + dy;
                
                if (tx >= 0 && tx < renderer.gridWidth && ty >= 0 && ty < renderer.gridHeight) {
                    renderer.selectedCell = { x: tx, y: ty };
                }
            }

            renderer.draw();
            broadcastSyncState();

            const clickedRoomId = renderer.findRoomAt(renderer.selectedCell.x, renderer.selectedCell.y);
            if (clickedRoomId) {
                renderer.selectedRoomId = clickedRoomId;
                renderer.triggerEvent('roomSelected', clickedRoomId);
            } else {
                renderer.selectedRoomId = null;
                renderer.triggerEvent('cellSelected', renderer.selectedCell);
            }
        }
    });

    // 13. UNIVERSAL VTT (.dd2vtt) EXPORTER (DMs Priority)
    btnExportVtt.addEventListener('click', () => {
        if (!generator.levels[currentLevel]) {
            alert("Forge a map first!");
            return;
        }

        // Get base64 canvas PNG string
        const dataUrl = renderer.canvas.toDataURL("image/png");
        const base64Image = dataUrl.split(',')[1];
        
        const isHex = (generator.gridShape === 'hex');
        
        // 13.1 Compute VTT line-of-sight wall vectors
        // To optimize VTT imports, we only export line segments separating walls from floors
        const wallsList = [];
        const isWall = (tx, ty) => {
            if (tx < 0 || tx >= generator.width || ty < 0 || ty >= generator.height) return true;
            const tile = generator.levels[currentLevel][ty][tx];
            return tile === TILE_TYPES.DUNGEON_WALL || tile === TILE_TYPES.CAVERN_WALL;
        };

        const addSegment = (x1, y1, x2, y2) => {
            wallsList.push([
                { x: x1, y: y1 },
                { x: x2, y: y2 }
            ]);
        };

        // Standard Square boundary line tracer
        for (let y = 0; y < generator.height; y++) {
            for (let x = 0; x < generator.width; x++) {
                if (isWall(x, y)) {
                    const px = x * 32;
                    const py = y * 32;
                    
                    // North wall border segment
                    if (!isWall(x, y - 1)) addSegment(px, py, px + 32, py);
                    // South
                    if (!isWall(x, y + 1)) addSegment(px, py + 32, px + 32, py + 32);
                    // West
                    if (!isWall(x - 1, y)) addSegment(px, py, px, py + 32);
                    // East
                    if (!isWall(x + 1, y)) addSegment(px + 32, py, px + 32, py + 32);
                }
            }
        }

        // 13.2 Locate light source positions (torches, mushrooms)
        const lightsList = [];
        for (let y = 0; y < generator.height; y++) {
            for (let x = 0; x < generator.width; x++) {
                const tile = generator.levels[currentLevel][y][x];
                
                const isTorch = tile === TILE_TYPES.DUNGEON_TORCH || tile === TILE_TYPES.CAVERN_TORCH;
                const isMush = tile === TILE_TYPES.CAVERN_MUSHROOMS;
                
                if (isTorch || isMush) {
                    let cx, cy;
                    if (isHex) {
                        const coords = renderer.getHexCoordinates(x, y);
                        cx = coords.x;
                        cy = coords.y;
                    } else {
                        cx = x * 32 + 16;
                        cy = y * 32 + 16;
                    }
                    
                    lightsList.push({
                        position: { x: cx, y: cy },
                        range: isTorch ? 7.5 : 4.5, // range in grid units
                        intensity: 0.5,
                        color: isTorch ? (generator.dungeonTheme === 'temple' ? "#5cff3d" : "#ffcc00") : "#a855f7",
                        shadows: true
                    });
                }
            }
        }

        // Pack VTT details
        const uvtt = {
            format: 0.2,
            resolution: {
                x: renderer.canvas.width,
                y: renderer.canvas.height
            },
            grid_type: isHex ? "pointy-hex" : "square",
            grid_size: 32,
            offset: { x: 0, y: 0 },
            line_of_sight: wallsList,
            lights: lightsList,
            image: base64Image
        };

        const blob = new Blob([JSON.stringify(uvtt, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `aetherforge_${currentLevel}_import.dd2vtt`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Export Save JSON
    btnExportJson.addEventListener('click', () => {
        if (!generator.levels.surface && !generator.levels.upper && !generator.levels.lower) return;

        const mapSaveData = {
            version: "3.0",
            dimensions: { width: generator.width, height: generator.height },
            structureMode: generator.structureMode,
            gridShape: generator.gridShape,
            wildernessBiome: generator.wildernessBiome,
            dungeonTheme: generator.dungeonTheme,
            wildernessDensity: generator.wildernessDensity,
            targetRoomCount: generator.targetRoomCount,
            connectivity: generator.connectivity,
            partySize: generator.partySize,
            partyLevel: generator.partyLevel,
            difficulty: generator.difficulty,
            winding: generator.winding,
            shapeRect: generator.shapeRect,
            shapeCircle: generator.shapeCircle,
            shapeHex: generator.shapeHex,
            shapeIrreg: generator.shapeIrreg,
            riversCount: generator.riversCount,
            mountainsDensity: generator.mountainsDensity,
            levels: generator.levels,
            roomsData: generator.roomsData,
            customDetails: generator.customDetails,
            fogMasks: generator.fogMasks
        };

        const blob = new Blob([JSON.stringify(mapSaveData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `aetherforge_map_v3_${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Import Save JSON
    fileImportSelector.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed.levels || !parsed.roomsData) {
                    alert("Invalid file structure.");
                    return;
                }

                generator.width = parsed.dimensions.width;
                generator.height = parsed.dimensions.height;
                generator.structureMode = parsed.structureMode;
                generator.gridShape = parsed.gridShape || 'square';
                generator.wildernessBiome = parsed.wildernessBiome;
                generator.dungeonTheme = parsed.dungeonTheme;
                generator.wildernessDensity = parsed.wildernessDensity;
                generator.targetRoomCount = parsed.targetRoomCount;
                generator.connectivity = parsed.connectivity;
                generator.partySize = parsed.partySize;
                generator.partyLevel = parsed.partyLevel;
                generator.difficulty = parsed.difficulty;
                
                // Load Phase 3 parameters
                generator.winding = parsed.winding || 25;
                generator.shapeRect = parsed.shapeRect || 50;
                generator.shapeCircle = parsed.shapeCircle || 20;
                generator.shapeHex = parsed.shapeHex || 10;
                generator.shapeIrreg = parsed.shapeIrreg || 20;
                generator.riversCount = parsed.riversCount || 1;
                generator.mountainsDensity = parsed.mountainsDensity || 25;

                generator.levels = parsed.levels;
                generator.roomsData = parsed.roomsData;
                generator.customDetails = parsed.customDetails || { surface: {}, upper: {}, lower: {} };
                generator.fogMasks = parsed.fogMasks || {
                    surface: create2DArray(generator.width, generator.height, true),
                    upper: create2DArray(generator.width, generator.height, true),
                    lower: create2DArray(generator.width, generator.height, true)
                };

                // GUI updates
                selectStructure.value = parsed.structureMode;
                selectGridShape.value = generator.gridShape;
                selectWildBiome.value = parsed.wildernessBiome;
                selectDungTheme.value = parsed.dungeonTheme;
                selectPartySize.value = parsed.partySize;
                selectPartyLevel.value = parsed.partyLevel;
                selectDifficulty.value = parsed.difficulty;

                rangeWinding.value = generator.winding;
                valWinding.textContent = `${generator.winding}% wiggle`;
                rangeMountains.value = generator.mountainsDensity;
                valMountains.textContent = `${generator.mountainsDensity}% ridges`;
                rangeRivers.value = generator.riversCount;
                valRivers.textContent = `${generator.riversCount} ${generator.riversCount === 1 ? 'River' : 'Rivers'}`;

                rangeShapeRect.value = generator.shapeRect;
                rangeShapeCircle.value = generator.shapeCircle;
                rangeShapeHex.value = generator.shapeHex;
                rangeShapeIrreg.value = generator.shapeIrreg;
                
                let sizeKey = 'medium';
                if (generator.width === 32) sizeKey = 'small';
                if (generator.width === 64) sizeKey = 'large';
                selectSize.value = sizeKey;

                rangeWildDensity.value = parsed.wildernessDensity;
                valWildDensity.textContent = `${parsed.wildernessDensity}% trees`;
                rangeRoomCount.value = parsed.targetRoomCount;
                valRoomCount.textContent = `${parsed.targetRoomCount} Rooms`;
                rangeConnectivity.value = parsed.connectivity;
                valConnectivity.textContent = `${parsed.connectivity}% extra`;

                updateUISettingsVisibility();
                
                if (generator.structureMode === 'multilevel') {
                    currentLevel = 'surface';
                    allTabs.forEach(t => t.classList.remove('active'));
                    tabSurface.classList.add('active');
                } else {
                    if (generator.structureMode === 'single-wilderness') currentLevel = 'surface';
                    else if (generator.structureMode === 'single-dungeon') currentLevel = 'upper';
                    else if (generator.structureMode === 'single-cavern') currentLevel = 'lower';
                }

                const activeTheme = currentLevel === 'surface' ? generator.wildernessBiome : (currentLevel === 'upper' ? generator.dungeonTheme : 'cavern');
                applyAccentTheme(activeTheme);

                renderer.fogMask = generator.fogMasks[currentLevel];
                renderer.setMapData(
                    currentLevel,
                    generator.levels[currentLevel],
                    generator.roomsData[currentLevel],
                    generator.dungeonTheme,
                    generator.wildernessBiome,
                    generator.gridShape
                );

                clearInspector();
                broadcastSyncState();
                alert("Map loaded successfully!");

            } catch (err) {
                alert("Error reading JSON file: " + err.message);
            }
        };
        reader.readAsText(file);
    });

    btnImportJson.addEventListener('click', () => {
        fileImportSelector.click();
    });

    btnExportPng.addEventListener('click', () => {
        if (!generator.levels[currentLevel]) return;
        const imgUrl = renderer.canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `aetherforge_${currentLevel}_map.png`;
        link.href = imgUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    btnExportRoomKey.addEventListener('click', () => {
        if (!generator.levels[currentLevel]) return;
        
        const rooms = Object.values(generator.roomsData[currentLevel]);
        const customCells = Object.values(generator.customDetails[currentLevel]);

        let md = `# Aetherforge Dungeon Key - Layer: ${currentLevel.toUpperCase()}\n`;
        md += `*Generated on ${new Date().toLocaleDateString()} | Layout: ${selectGridShape.value.toUpperCase()}*\n\n`;
        md += `## Encounter Specifications\n`;
        md += `- Party: ${selectPartySize.value} Players at level ${selectPartyLevel.value}\n\n`;
        md += `---\n\n`;

        if (rooms.length > 0) {
            md += `## Generated Chambers\n\n`;
            rooms.forEach((r, idx) => {
                md += `### Chamber ${idx+1}: ${r.name} (${r.type})\n`;
                md += `- **Location**: rect bounds [${r.rect.x}, ${r.rect.y}]\n`;
                md += `- **Description**: *"${r.description}"*\n`;
                md += `- **Sensory**:\n`;
                md += `  - Look: ${r.sights ? r.sights[0] : 'None'}\n`;
                md += `  - Hear: ${r.sounds ? r.sounds[0] : 'None'}\n`;
                md += `  - Smell: ${r.smells ? r.smells[0] : 'None'}\n`;

                if (r.hazard) {
                    md += `- **Hazard**: **${r.hazard.name}** | Trigger: ${r.hazard.trigger} | Effect: ${r.hazard.effect}\n`;
                }
                if (r.encounter && r.encounter.monsters.length > 0) {
                    md += `- **Monsters**: ${r.encounter.summary}\n`;
                }
                if (r.loot) {
                    md += `- **Loot**: Coins: ${r.loot.coins} | Items: ${r.loot.items ? r.loot.items.join(', ') : 'None'}\n`;
                }
                md += `\n---\n\n`;
            });
        }

        const editedTiles = customCells.filter(c => c.description !== `A customized cell coordinate at [${c.id}].` || c.hazard || (c.encounter && c.encounter.monsters.length > 0) || c.loot);
        if (editedTiles.length > 0) {
            md += `## Customized Coordinate Points\n\n`;
            editedTiles.forEach(c => {
                md += `### Point coordinates [${c.id}]: ${c.name}\n`;
                md += `- **Description**: *"${c.description}"*\n`;
                if (c.hazard) {
                    md += `- **Hazard**: **${c.hazard.name}** | Trigger: ${c.hazard.trigger} | Effect: ${c.hazard.effect}\n`;
                }
                if (c.encounter && c.encounter.monsters.length > 0) {
                    md += `- **Encounter**: ${c.encounter.summary}\n`;
                }
                if (c.loot) {
                    md += `- **Loot**: Coins: ${c.loot.coins} | Items: ${c.loot.items ? c.loot.items.join(', ') : 'None'}\n`;
                }
                md += `\n---\n\n`;
            });
        }

        const blob = new Blob([md], { type: 'text/markdown' });
        const link = document.createElement('a');
        link.download = `aetherforge_${currentLevel}_key.md`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 14. Initial trigger
    updateUISettingsVisibility();
    handleGenerate();
});
