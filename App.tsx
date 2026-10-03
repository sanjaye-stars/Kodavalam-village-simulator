/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TileData,
  TileType,
  VillageResources,
  Villager,
  Season,
  BusState,
  CowherdState,
  DecisionChoice,
  VillageEvent,
  GameSaveData,
  UserRole,
  ViewMode,
  PauranCharacter,
  PlayerCharacterState,
} from './types';
import {
  INITIAL_RESOURCES,
  BUILDINGS_CATALOG,
  RANDOM_EVENTS,
  COWHERD_QUOTES,
  CHAYAKADA_GOSSIP,
  SEASONS_BY_MONTH,
  PAURAN_CHARACTERS,
  WORLD_SIZE,
} from './constants';
import {
  createInitialMap,
  createInitialVillagers,
  calculateTurnOutput,
  evaluateWinLoss,
  saveGameState,
  loadGameState,
  clearGameSave,
} from './services/gameSimulation';
import { villageAudio } from './services/audioService';
import Village3DCanvas from './components/Village3DCanvas';
import UnifiedPanchayatDrawer from './components/UnifiedPanchayatDrawer';
import RoleSelectionModal from './components/RoleSelectionModal';
import CharacterSelectModal from './components/CharacterSelectModal';
import MovementDPad from './components/MovementDPad';
import EventModal from './components/EventModal';
import GameOutcomeModal from './components/GameOutcomeModal';
import Minimap from './components/Minimap';

export function App() {
  // --- Game Time State ---
  const [day, setDay] = useState<number>(1);
  const [month, setMonth] = useState<number>(1);
  const [year, setYear] = useState<number>(1);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 0 = pause, 1 = 1x, 2 = 2x, 3 = 3x

  // --- Role Selection State ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  // Panchayath President has Sky View by default; Pauran has POV View by default
  const [viewMode, setViewMode] = useState<ViewMode>('sky');
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | undefined>(undefined);

  // --- Playable Pauran Character State ---
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState<boolean>(false);
  const [selectedPauranChar, setSelectedPauranChar] = useState<PauranCharacter>(PAURAN_CHARACTERS[0]);
  const [playerCharacter, setPlayerCharacter] = useState<PlayerCharacterState>({
    x: 3.5,
    z: 0.5,
    rotationY: 0,
    isMoving: false,
    characterId: PAURAN_CHARACTERS[0].id,
  });

  const stopMovingTimer = useRef<any>(null);

  const handlePlayerMove = useCallback((dx: number, dz: number) => {
    if (selectedPauranChar.id === 'king_vishnu') {
      // King Vishnu's POV is locked on the top floor balcony of Royal Palace of Valaskjalf
      return;
    }
    setPlayerCharacter((prev) => {
      const speed = 0.35;
      const limit = WORLD_SIZE * 0.45;
      const newX = Math.max(-limit, Math.min(limit, prev.x + dx * speed));
      const newZ = Math.max(-limit, Math.min(limit, prev.z + dz * speed));
      const angle = Math.atan2(dx, dz);
      return {
        ...prev,
        x: newX,
        z: newZ,
        rotationY: angle,
        isMoving: true,
      };
    });

    if (stopMovingTimer.current) clearTimeout(stopMovingTimer.current);
    stopMovingTimer.current = setTimeout(() => {
      setPlayerCharacter((prev) => ({ ...prev, isMoving: false }));
    }, 160);
  }, [selectedPauranChar.id]);

  // --- Core Resources & Expansive 26x26 World ---
  const [resources, setResources] = useState<VillageResources>(INITIAL_RESOURCES);
  const [tiles, setTiles] = useState<TileData[][]>(createInitialMap);
  const [villagers, setVillagers] = useState<Villager[]>(createInitialVillagers);

  // --- Interaction & Tools ---
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [activeBuildTool, setActiveBuildTool] = useState<TileType | 'demolish' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // --- Modals & Events ---
  const [activeEvent, setActiveEvent] = useState<VillageEvent | null>(null);
  const [gameOutcome, setGameOutcome] = useState<{ won: boolean; lost: boolean; reason?: string } | null>(null);

  // --- Detail 1: Man walking with his cow (DAMU) ---
  const [cowherd, setCowherd] = useState<CowherdState>({
    x: 14,
    y: 18,
    isGrazing: false,
    grazeTimer: 0,
    direction: 'right',
  });

  // --- Detail 3: Blue Private Bus "SREELAKAM" beside the tea shop ---
  const [busState, setBusState] = useState<BusState>({
    status: 'approaching',
    progress: 0,
    passengers: 18,
    timer: 0,
  });

  // --- Statistics ---
  const [stats, setStats] = useState({
    festivalsHeld: 0,
    busesWelcomed: 0,
    milkHarvested: 0,
    volleyballMatches: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Invariants
  const zeroFoodStreak = useRef<number>(0);
  const zeroHappyStreak = useRef<number>(0);
  const lastEventDay = useRef<number>(0);

  const season: Season = SEASONS_BY_MONTH[month] || 'Southwest Monsoon';

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  }, []);

  const handleToggleViewMode = useCallback(() => {
    setCameraTarget(undefined);
    setSelectedTile(null);
    setViewMode((cur) => {
      const next = cur === 'sky' ? 'pov' : 'sky';
      villageAudio.playCoin();
      showToast(
        next === 'sky'
          ? "🦅 Switched to Sky View (Aerial overview of Vishnu's Kingdom & Kodavalam)"
          : selectedPauranChar.id === 'king_vishnu'
          ? "👑 Switched to King Vishnu POV (Viewing mainland from top floor balcony of Valaskjalf)"
          : '🚶 Switched to POV View (Eye-level street exploration)'
      );
      return next;
    });
  }, [showToast, selectedPauranChar.id]);

  // --- Load Game from LocalStorage ---
  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      setDay(saved.day);
      setMonth(saved.month);
      setYear(saved.year);
      setResources(saved.resources);
      setTiles(saved.tiles);
      setVillagers(saved.villagers);
      setStats(saved.stats);
    }
  }, []);

  // --- Save Game Handler ---
  const handleSaveGame = useCallback(() => {
    const data: GameSaveData = {
      day,
      month,
      year,
      season,
      resources,
      tiles,
      villagers,
      stats,
      gameWon: gameOutcome?.won || false,
      gameLost: gameOutcome?.lost || false,
      lossReason: gameOutcome?.reason,
    };
    saveGameState(data);
    villageAudio.playCoin();
    showToast('Panchayat records saved to browser storage!');
  }, [day, month, year, season, resources, tiles, villagers, stats, gameOutcome, showToast]);

  // --- Simulation Tick Interval ---
  useEffect(() => {
    if (simSpeed === 0 || activeEvent !== null || (gameOutcome && gameOutcome.lost) || !userRole) return;

    const intervalMs = Math.round(2400 / simSpeed);

    const interval = setInterval(() => {
      // 1. Advance Calendar
      setDay((curDay) => {
        let nextDay = curDay + 1;
        let nextMonth = month;
        let nextYear = year;

        if (nextDay > 30) {
          nextDay = 1;
          nextMonth = month + 1;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = year + 1;
          }
          setMonth(nextMonth);
          setYear(nextYear);
          handleSaveGame();
        }

        // 2. Resource generation & consumption
        const { delta, capacity } = calculateTurnOutput(tiles, resources, season);

        setResources((prev) => {
          const newFood = Math.max(0, prev.food + (delta.food || 0));
          const newWater = Math.max(0, prev.water + (delta.water || 0));
          const newMoney = Math.max(0, prev.money + (delta.money || 0));
          const newHappy = Math.min(100, Math.max(0, prev.happiness + (delta.happiness || 0)));
          const newHealth = Math.min(100, Math.max(0, prev.health + (delta.health || 0)));
          const newEdu = Math.min(100, Math.max(0, prev.education + (delta.education || 0)));

          if (newFood <= 0) zeroFoodStreak.current += 1;
          else zeroFoodStreak.current = 0;

          if (newHappy <= 0) zeroHappyStreak.current += 1;
          else zeroHappyStreak.current = 0;

          let newPop = prev.population;
          if (newHappy > 60 && newFood > 20 && newPop < capacity && Math.random() < 0.25) {
            newPop += 1;
          } else if ((newFood <= 0 || newHappy < 20) && newPop > 10 && Math.random() < 0.2) {
            newPop -= 1;
          }

          return {
            food: newFood,
            water: newWater,
            money: newMoney,
            happiness: newHappy,
            health: newHealth,
            education: newEdu,
            population: newPop,
            maxPopulation: capacity,
          };
        });

        // 3. Random Events check
        if (nextDay - lastEventDay.current > 38 && Math.random() < 0.3) {
          lastEventDay.current = nextDay;
          const randomEvt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
          setActiveEvent(randomEvt);
          villageAudio.playFestiveChime();
        }

        // 4. Win/Loss check
        const outcome = evaluateWinLoss(resources, nextYear, zeroFoodStreak.current, zeroHappyStreak.current);
        if (outcome.won || outcome.lost) {
          setGameOutcome(outcome);
        }

        return nextDay;
      });

      // 5. Update SREELAKAM Bus
      setBusState((prev) => {
        let { status, progress, passengers, timer } = prev;
        timer += 1;

        if (status === 'approaching') {
          progress += 0.2;
          if (progress >= 1) {
            status = 'at_stop';
            progress = 1;
            timer = 0;
            villageAudio.playBusHorn();
            setStats((s) => ({ ...s, busesWelcomed: s.busesWelcomed + 1 }));
          }
        } else if (status === 'at_stop') {
          if (timer >= 5) {
            status = 'leaving';
            timer = 0;
            setResources((r) => ({ ...r, money: r.money + 45, happiness: Math.min(100, r.happiness + 2) }));
          }
        } else if (status === 'leaving') {
          progress += 0.25;
          if (progress >= 3) {
            status = 'departed';
            timer = 0;
          }
        } else if (status === 'departed') {
          if (timer >= 9) {
            status = 'approaching';
            progress = -2;
            timer = 0;
          }
        }

        return { status, progress, passengers, timer };
      });

      // 6. Update Appunni & Gomathi the cow
      setCowherd((prev) => {
        let { x, y, isGrazing, grazeTimer, direction, bubbleText, bubbleTimer } = prev;

        if (bubbleTimer && bubbleTimer > 0) {
          bubbleTimer -= 1;
          if (bubbleTimer <= 0) bubbleText = undefined;
        }

        if (isGrazing) {
          grazeTimer -= 1;
          if (grazeTimer <= 0) {
            isGrazing = false;
          }
        } else {
          // Walk along main East-West highway (x: 7 to 30 along y: 18)
          if (direction === 'right') {
            x += 0.14;
            if (x >= 30) {
              direction = 'left';
            }
          } else {
            x -= 0.14;
            if (x <= 7) {
              direction = 'right';
            }
          }

          if (Math.random() < 0.08) {
            isGrazing = true;
            grazeTimer = 5;
            setStats((s) => ({ ...s, milkHarvested: s.milkHarvested + 2 }));
            setResources((r) => ({ ...r, food: r.food + 2 }));
          }
        }

        return { x, y, isGrazing, grazeTimer, direction, bubbleText, bubbleTimer };
      });

      // 7. Villagers movement
      setVillagers((prev) =>
        prev.map((v) => {
          let { x, y, targetX, targetY } = v;
          if (Math.hypot(targetX - x, targetY - y) < 0.3) {
            if (Math.random() < 0.2) {
              targetX = 10 + Math.random() * 8;
              targetY = 11 + Math.random() * 4;
            }
          } else {
            x += (targetX - x) * 0.08;
            y += (targetY - y) * 0.08;
          }
          return { ...v, x, y, targetX, targetY };
        })
      );
    }, intervalMs);

    return () => clearInterval(interval);
  }, [simSpeed, activeEvent, gameOutcome, month, year, tiles, resources, season, handleSaveGame, userRole]);

  // --- Tile Click & Build Handler ---
  const handleSelectTile = (x: number, y: number) => {
    setSelectedTile({ x, y });
    const tile = tiles[y][x];

    // If active tool selected
    if (activeBuildTool) {
      // ONLY Panchayat President can build or demolish!
      if (userRole !== 'president') {
        showToast('Panchayat Rule: Only the authorized President can build or alter the village!');
        setActiveBuildTool(null);
        return;
      }

      if (activeBuildTool === 'demolish') {
        if (tile.isLandmark || tile.type === 'river' || tile.type === 'grass') {
          showToast('Cannot demolish natural terrain or heritage landmarks!');
          return;
        }
        const newTiles = tiles.map((row) => [...row]);
        newTiles[y][x] = { ...tile, type: 'grass', level: 1, name: undefined };
        setTiles(newTiles);
        villageAudio.playBuild();
        showToast('Demolished building. Tile returned to grass.');
        setActiveBuildTool(null);
        return;
      }

      // Construction
      const info = BUILDINGS_CATALOG[activeBuildTool];
      if (!info) return;

      if (tile.isLandmark || tile.type === 'river') {
        showToast(`Cannot build over ${tile.name || 'protected ground'}!`);
        return;
      }

      if (resources.money < info.cost) {
        showToast(`Insufficient treasury funds! Need ₹${info.cost} for ${info.name}.`);
        return;
      }

      setResources((r) => ({ ...r, money: r.money - info.cost }));
      const newTiles = tiles.map((row) => [...row]);
      newTiles[y][x] = {
        ...tile,
        type: activeBuildTool,
        level: 1,
        name: info.name,
      };
      setTiles(newTiles);
      villageAudio.playBuild();
      showToast(`Constructed ${info.name}!`);
      setActiveBuildTool(null);
    } else {
      // Just inspecting
      if (tile.name) {
        showToast(`Inspecting: ${tile.name}`);
      }
    }
  };

  // Upgrade building (President only)
  const handleUpgradeTile = (x: number, y: number) => {
    if (userRole !== 'president') {
      showToast('Only the Panchayat President can upgrade buildings!');
      return;
    }
    const tile = tiles[y][x];
    const info = BUILDINGS_CATALOG[tile.type];
    if (!info) return;

    const upgradeCost = Math.round(info.cost * 1.5);
    if (resources.money < upgradeCost) {
      showToast(`Need ₹${upgradeCost} to upgrade.`);
      return;
    }
    if (tile.level >= 3) {
      showToast('Building is already at max Level 3!');
      return;
    }

    setResources((r) => ({ ...r, money: r.money - upgradeCost }));
    const newTiles = tiles.map((row) => [...row]);
    newTiles[y][x] = { ...tile, level: tile.level + 1 };
    setTiles(newTiles);
    villageAudio.playCoin();
    showToast(`Upgraded ${info.name} to Level ${tile.level + 1}!`);
  };

  // Demolish building (President only)
  const handleDemolishTile = (x: number, y: number) => {
    if (userRole !== 'president') {
      showToast('Only the Panchayat President can clear or demolish structures!');
      return;
    }
    const tile = tiles[y][x];
    if (tile.isLandmark || tile.type === 'river' || tile.type === 'grass') return;

    const newTiles = tiles.map((row) => [...row]);
    newTiles[y][x] = { ...tile, type: 'grass', level: 1, name: undefined };
    setTiles(newTiles);
    villageAudio.playBuild();
    showToast('Structure cleared to grass field.');
  };

  // Interactive Detail 1: DAMU
  const handleTapCowherd = () => {
    villageAudio.playCowMoo();
    const quote = COWHERD_QUOTES[Math.floor(Math.random() * COWHERD_QUOTES.length)];
    setCowherd((prev) => ({
      ...prev,
      bubbleText: quote,
      bubbleTimer: 5,
    }));
    setResources((r) => ({ ...r, happiness: Math.min(100, r.happiness + 2), food: r.food + 3 }));
    showToast(`DAMU: "${quote}" (+Milk)`);
  };

  // Interactive Detail 2: Chayakkada (Tea Shop)
  const handleTapChayakada = () => {
    villageAudio.playTeaClink();
    const gossip = CHAYAKADA_GOSSIP[Math.floor(Math.random() * CHAYAKADA_GOSSIP.length)];
    setResources((r) => ({ ...r, happiness: Math.min(100, r.happiness + 3) }));
    showToast(`Chayakkada Corner: "${gossip}" (+Happiness)`);
  };

  // Interactive Detail 3: Sreelakam Private Bus
  const handleTapBus = () => {
    villageAudio.playBusHorn();
    showToast('Sreelakam Private Bus: Running daily route between Kodavalam and Kanhangad town!');
  };

  // Interactive Detail 4: Big Huge Frame of His Highness Lord Vishnu
  const handleTapVishnuPortrait = () => {
    villageAudio.playFestiveChime();
    villageAudio.playCoin();
    setResources((r) => ({ ...r, money: r.money + 200, happiness: Math.min(100, r.happiness + 10) }));
    showToast('👑 His Highness Lord Vishnu: "Greetings from the Sovereign Landlord! May my golden kingdom prosper forever." (+₹200, +10 Happiness)');
  };

  // Interactive Detail 5: Monumental Asgard Royal Palace of Vishnu
  const handleTapAsgard = () => {
    villageAudio.playFestiveChime();
    villageAudio.playCoin();
    setResources((r) => ({ ...r, money: r.money + 100, happiness: Math.min(100, r.happiness + 5) }));
    showToast('⚡ Asgard Royal Palace: Lord Vishnu surveys his golden kingdom from the towering spires of Asgard! (+₹100, +5 Happiness)');
  };

  // Interactive Detail 6: Camels in Vishnu's Kingdom
  const handleTapCamel = (id: string, name: string) => {
    villageAudio.playCamelGrunt();
    const quotes = [
      "The Landlord Vishnu brought us across the golden desert trade routes to his kingdom!",
      "Chewing sweet desert oasis dates in Vishnu's Kingdom. A life fit for a royal camel!",
      "Carrying silk, frankincense, and gold for the Landlord's royal treasury!",
      "Gazing at the golden spires of Asgard Palace across the oasis sands.",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setResources((r) => ({ ...r, happiness: Math.min(100, r.happiness + 2), money: r.money + 15 }));
    showToast(`🐫 ${name}: "${quote}" (+₹15, +Happiness)`);
  };

  // Interactive Detail 7: Sacred Royal Cows in Vishnu's Kingdom
  const handleTapVishnuCow = (id: string, name: string) => {
    villageAudio.playCowMoo();
    const quotes = [
      "Grazing peacefully in the Landlord's golden oasis clover by the pushkarini pool!",
      "The Landlord Vishnu's royal dairy provides the sweetest golden milk in Kasaragod!",
      "Resting in the shade of the date palms outside Asgard Palace.",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    setResources((r) => ({ ...r, food: r.food + 5, health: Math.min(100, r.health + 2) }));
    showToast(`🐄 ${name}: "${quote}" (+Milk & Food)`);
  };

  // Event Resolution
  const handleEventChoice = (choice: DecisionChoice) => {
    if (userRole !== 'president') {
      showToast('Council resolutions can only be enacted by the Panchayat President!');
      return;
    }
    setResources((prev) => ({
      food: Math.max(0, prev.food + (choice.resourceDelta.food || 0)),
      water: Math.max(0, prev.water + (choice.resourceDelta.water || 0)),
      money: Math.max(0, prev.money + (choice.resourceDelta.money || 0)),
      happiness: Math.min(100, Math.max(0, prev.happiness + (choice.resourceDelta.happiness || 0))),
      health: Math.min(100, Math.max(0, prev.health + (choice.resourceDelta.health || 0))),
      education: Math.min(100, Math.max(0, prev.education + (choice.resourceDelta.education || 0))),
      population: prev.population,
      maxPopulation: prev.maxPopulation,
    }));

    if (activeEvent?.category === 'festival') {
      setStats((s) => ({ ...s, festivalsHeld: s.festivalsHeld + 1 }));
    } else if (activeEvent?.category === 'sports') {
      setStats((s) => ({ ...s, volleyballMatches: s.volleyballMatches + 1 }));
    }

    showToast(`Enacted: ${choice.loreOutcome}`);
    setActiveEvent(null);
  };

  // Restart Game
  const handleRestart = () => {
    clearGameSave();
    setDay(1);
    setMonth(1);
    setYear(1);
    setResources(INITIAL_RESOURCES);
    setTiles(createInitialMap());
    setVillagers(createInitialVillagers());
    setGameOutcome(null);
    setStats({
      festivalsHeld: 0,
      busesWelcomed: 0,
      milkHarvested: 0,
      volleyballMatches: 0,
    });
    showToast('A fresh 5-year Panchayat term begins for Kodavalam!');
  };

  const selectedTileData = selectedTile ? tiles[selectedTile.y][selectedTile.x] : null;

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100 select-none">
      {/* 1. ROLE SELECTION OPENING MODAL (Shown when opening the game) */}
      {!userRole && !isCharacterSelectOpen && (
        <RoleSelectionModal
          onSelectRole={(role) => {
            if (role === 'president') {
              setUserRole('president');
              setViewMode('sky');
              showToast(
                'Authenticated as Panchayat President! Defaulting to Sky View for village planning & oversight.'
              );
            } else {
              // Open 5-character choosing window after choosing Pauran!
              setIsCharacterSelectOpen(true);
            }
          }}
        />
      )}

      {/* 1B. 5-CHARACTER CHOOSING WINDOW AFTER CHOOSING PAURAN */}
      {isCharacterSelectOpen && (
        <CharacterSelectModal
          onSelectCharacter={(char) => {
            setSelectedPauranChar(char);
            setUserRole('pauran');
            setIsCharacterSelectOpen(false);
            setViewMode('pov');
            setCameraTarget(undefined);
            setSelectedTile(null);
            if (char.id === 'king_vishnu') {
              setPlayerCharacter({
                x: -23.8,
                z: 0.0,
                rotationY: Math.PI / 2, // Facing East toward mainland
                isMoving: false,
                characterId: char.id,
              });
              showToast(
                '👑 Ascended the Throne of Valaskjalf as King Vishnu! Viewing the mainland from the top floor balcony in ultra high-definition vista.'
              );
            } else {
              setPlayerCharacter({
                x: 3.5,
                z: 0.5,
                rotationY: 0,
                isMoving: false,
                characterId: char.id,
              });
              showToast(
                `Entered village as ${char.name}! Move with W, A, S, D or the on-screen buttons.`
              );
            }
          }}
        />
      )}

      {/* 2. CONSOLIDATED FLOATING BUTTONS (PANCHAYAT MENU + DEDICATED CAMERA VIEW TOGGLE) */}
      {userRole && (
        <div className="absolute top-4 left-4 z-30 pointer-events-auto flex items-center gap-2.5">
          {/* Main Consolidated Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-stone-900/90 hover:bg-stone-800 text-amber-200 border-2 border-amber-600/70 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-xs tracking-wide active:scale-95 transition-all group"
            title="Open Panchayat Office, Ledger, Construction & Settings"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🏛️</span>
            <span className="font-serif-title text-sm">ഗ്രാമപഞ്ചായത്ത് (Menu)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-normal bg-stone-800 text-amber-300 border border-stone-700">
              {userRole === 'president' ? '👑 President' : '🚶 Pauran'}
            </span>
          </button>

          {/* Separate Option for Sky View / POV View (Pauran can switch to Sky View easily) */}
          <button
            onClick={handleToggleViewMode}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-xs tracking-wide active:scale-95 transition-all border-2 ${
              viewMode === 'sky'
                ? 'bg-sky-950/90 hover:bg-sky-900 text-sky-200 border-sky-500/70'
                : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-500/70'
            }`}
            title={
              viewMode === 'sky'
                ? 'Currently in Sky View. Click to switch to Street POV View'
                : 'Currently in POV View. Click to switch to Sky View'
            }
          >
            <span className="text-base">{viewMode === 'sky' ? '🦅' : '🚶'}</span>
            <span className="font-mono text-xs">
              {viewMode === 'sky' ? 'Sky View' : 'POV View'}
            </span>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-black/40 border border-white/10 uppercase">
              {viewMode === 'sky' ? '→ POV' : '→ Sky'}
            </span>
          </button>

          {/* Quick Pauran Character Avatar Switcher */}
          {userRole === 'pauran' && (
            <button
              onClick={() => setIsCharacterSelectOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-900/90 hover:bg-stone-800 text-emerald-200 border-2 border-emerald-600/70 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-xs tracking-wide active:scale-95 transition-all group"
              title="Click to change your Pauran Character"
            >
              <span className="text-base group-hover:scale-110 transition-transform">
                {selectedPauranChar.avatarIcon}
              </span>
              <span className="font-mono text-xs hidden md:inline">
                {selectedPauranChar.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-md border border-emerald-600/50 uppercase font-mono">
                Switch
              </span>
            </button>
          )}
        </div>
      )}

      {/* 3. ACTIVE BUILDING TOOL PROMPT (Floating indicator when President is building) */}
      {activeBuildTool && userRole === 'president' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-xl shadow-2xl text-xs flex items-center gap-3 animate-bounce">
          <span>
            {activeBuildTool === 'demolish'
              ? '⛏️ Demolish Mode: Tap any building to clear'
              : `🔨 Constructing: ${BUILDINGS_CATALOG[activeBuildTool]?.name} · Tap any green tile on map`}
          </span>
          <button
            onClick={() => setActiveBuildTool(null)}
            className="px-2 py-0.5 bg-stone-900 text-white rounded text-[10px] uppercase font-mono"
          >
            Cancel ✕
          </button>
        </div>
      )}

      {/* 4. EXPANSIVE FULL 3D VILLAGE CANVAS (Sunny Day Time) */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <Village3DCanvas
          tiles={tiles}
          villagers={villagers}
          busState={busState}
          cowherd={cowherd}
          userRole={userRole || 'pauran'}
          viewMode={viewMode}
          selectedTile={selectedTile}
          cameraTarget={cameraTarget}
          playerCharacter={userRole === 'pauran' ? playerCharacter : undefined}
          selectedPauranChar={selectedPauranChar}
          onSelectTile={handleSelectTile}
          onTapCowherd={handleTapCowherd}
          onTapChayakada={handleTapChayakada}
          onTapBus={handleTapBus}
          onTapCamel={handleTapCamel}
          onTapVishnuCow={handleTapVishnuCow}
          onTapAsgard={handleTapAsgard}
          onTapVishnuPortrait={handleTapVishnuPortrait}
        />

        {/* 4B. On-Screen Movement Buttons Screen (W, A, S, D D-Pad) for Pauran */}
        {userRole === 'pauran' && (
          <MovementDPad
            onMove={handlePlayerMove}
            isMoving={playerCharacter.isMoving}
            characterId={playerCharacter.characterId}
          />
        )}

        {/* 4C. Interactive Scaled Minimap Showing Full World Size */}
        {userRole && (
          <Minimap
            tiles={tiles}
            cowherd={cowherd}
            busState={busState}
            cameraTarget={cameraTarget}
            onNavigate={(wx, wz) => {
              setCameraTarget([wx, 0, wz]);
              showToast(`Navigated camera to (${Math.round(wx)}, ${Math.round(wz)})`);
            }}
          />
        )}

        {/* Floating Quick Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-stone-900/95 border border-amber-500/60 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium backdrop-blur-md animate-fade-in flex items-center gap-2 max-w-lg text-center">
            <span>🌴</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* 5. CONSOLIDATED PANCHAYAT MENU DRAWER */}
      <UnifiedPanchayatDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        resources={resources}
        day={day}
        month={month}
        year={year}
        season={season}
        simSpeed={simSpeed}
        onSetSpeed={setSimSpeed}
        userRole={userRole || 'pauran'}
        onChangeRole={(role) => {
          setUserRole(role);
          setViewMode(role === 'president' ? 'sky' : 'pov');
          showToast(
            `Switched active role to: ${
              role === 'president' ? 'Panchayath President (Sky View)' : 'Pauran (POV View)'
            }`
          );
        }}
        activeBuildTool={activeBuildTool}
        onSelectBuildTool={(tool) => setActiveBuildTool(tool)}
        selectedTileData={selectedTileData}
        onUpgradeTile={handleUpgradeTile}
        onDemolishTile={handleDemolishTile}
        stats={stats}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(villageAudio.toggleMute())}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onSaveGame={handleSaveGame}
        onRestartGame={handleRestart}
      />

      {/* 6. EVENT POP-UP CARD */}
      {activeEvent && userRole === 'president' && (
        <EventModal
          event={activeEvent}
          onMakeChoice={handleEventChoice}
        />
      )}

      {/* 7. GAME OUTCOME (WIN / LOSS) MODAL */}
      {gameOutcome && (
        <GameOutcomeModal
          won={gameOutcome.won}
          reason={gameOutcome.reason}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
