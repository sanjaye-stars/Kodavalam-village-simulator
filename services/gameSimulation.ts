/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  TileData,
  VillageResources,
  Villager,
  Season,
  BusState,
  CowherdState,
  GameSaveData,
} from '../types';
import {
  MAP_SIZE,
  INITIAL_RESOURCES,
  BUILDINGS_CATALOG,
  KASARAGOD_NAMES,
  SEASONS_BY_MONTH,
  WIN_POPULATION_TARGET,
  WIN_HAPPINESS_TARGET,
  MAX_YEARS,
} from '../constants';

const SAVE_KEY = 'kodavalam_village_save_v5';

export function createInitialMap(): TileData[][] {
  const map: TileData[][] = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push({
        id: `tile_${x}_${y}`,
        x,
        y,
        type: 'grass',
        level: 1,
      });
    }
    map.push(row);
  }

  // ========================================================
  // 1. CONNECTING ROADS BETWEEN VISHNU'S KINGDOM AND KODAVALAM
  // ========================================================
  for (const rx of [16, 17]) {
    map[18][rx].type = 'road';
    map[18][rx].name = 'Main Royal Highway';
    map[10][rx].type = 'road';
    map[10][rx].name = 'North Avenue';
    map[26][rx].type = 'road';
    map[26][rx].name = 'South Avenue';
  }

  // ========================================================
  // 3. WEST LANDMASS: "VISHNU'S KINGDOM" (1:4 of the realm, x: 0 to 15)
  // ========================================================
  // Royal Highways of Vishnu's Kingdom
  for (let x = 1; x <= 15; x++) {
    map[18][x].type = 'road'; // Main Royal Highway of Vishnu
    map[10][x].type = 'road'; // North Palace Avenue
    map[26][x].type = 'road'; // South Temple Avenue
  }
  for (let y = 6; y <= 28; y++) {
    map[y][6].type = 'road'; // Central Palace Axis
    map[y][11].type = 'road'; // Royal Guard Avenue
  }

  // A. Royal Triple Archway Gate at dividing wall (x = 15, y = 18)
  map[18][15].type = 'royal_gate';
  map[18][15].isLandmark = true;
  map[18][15].name = 'Royal Triple Archway Gate';

  // B. Sri Vishnu Mahakshetram Temple at (x = 5, y = 10)
  map[10][5].type = 'temple';
  map[10][5].isLandmark = true;
  map[10][5].name = 'Sri Vishnu Mahakshetram Temple';

  // C. Raja Pushkarini Lotus Lake (x: 7–8, y: 9–10)
  map[9][7].type = 'pond';
  map[9][7].name = 'Raja Pushkarini Lotus Lake';
  map[9][8].type = 'pond';
  map[9][8].name = 'Raja Pushkarini Lotus Lake';
  map[10][7].type = 'pond';
  map[10][7].name = 'Raja Pushkarini Lotus Lake';
  map[10][8].type = 'pond';
  map[10][8].name = 'Raja Pushkarini Lotus Lake';

  // D. Arabian Souk / Grand Bazaar at (x = 12, y = 19)
  map[19][12].type = 'market';
  map[19][12].isLandmark = true;
  map[19][12].name = 'Arabian Souk / Grand Bazaar';

  // E. Royal Ayurveda Vaidyasala (Apothecary) at (x = 7, y = 26)
  map[26][7].type = 'clinic';
  map[26][7].isLandmark = true;
  map[26][7].name = 'Royal Ayurveda Vaidyasala (Apothecary)';

  // F. Saraswathi Royal Grantha Library (Bayt al-Hikma) at (x = 11, y = 17)
  map[17][11].type = 'library';
  map[17][11].isLandmark = true;
  map[17][11].name = 'Saraswathi Royal Grantha Library (Bayt al-Hikma)';

  // G. Vishnu's Royal Durbar Hall at (x = 5, y = 26)
  map[26][5].type = 'community_hall';
  map[26][5].isLandmark = true;
  map[26][5].name = "Vishnu's Royal Durbar Hall";

  // H. Royal Wells
  map[9][5].type = 'well';
  map[9][5].name = 'Palace Golden Well';
  map[25][7].type = 'well';
  map[25][7].name = 'Royal Durbar Well';
  map[19][11].type = 'well';
  map[19][11].name = 'Gateway Well';

  // I. Royal Farmlands & Terraces
  const royalPaddies = [
    [3, 6], [4, 6], [3, 7], [4, 7], [3, 8], [4, 8],
    [3, 23], [4, 23], [3, 24], [4, 24], [3, 25], [4, 25]
  ];
  royalPaddies.forEach(([px, py]) => {
    map[py][px].type = 'paddy';
    map[py][px].name = "Royal Terraced Garden of Vishnu's Kingdom";
  });

  // J. Royal Courtier Residences (12 Villas)
  const royalHouses = [
    [4, 14], [5, 14], [7, 14], [8, 14],
    [4, 20], [5, 20], [7, 20], [8, 20],
    [9, 10], [12, 10], [9, 26], [12, 26]
  ];
  royalHouses.forEach(([hx, hy]) => {
    map[hy][hx].type = 'house';
    map[hy][hx].name = "Royal Courtier Residence (Vishnu's Kingdom)";
  });

  // ========================================================
  // 4. EAST LANDMASS: "KODAVALAM GRAMA PANCHAYAT" (x: 18 to 35)
  // ========================================================
  // Roads of Kodavalam
  for (let x = 18; x <= 33; x++) {
    map[18][x].type = 'road'; // Main Panchayat Highway
    map[10][x].type = 'road'; // North Street
    map[26][x].type = 'road'; // South Street
  }
  for (let y = 6; y <= 28; y++) {
    map[y][22].type = 'road'; // Central Junction Artery
    map[y][29].type = 'road'; // Eastern Temple Avenue
  }

  // A. Central Junction & Balan's Chayakkada (x = 21, y = 17)
  map[17][21].type = 'chayakada';
  map[17][21].isLandmark = true;
  map[17][21].name = 'Balan Chettante Chayakkada (Tea Shop)';

  // B. Bus Stop with SREELAKAM Bus bay (x = 22, y = 17)
  map[17][22].type = 'bus_stop';
  map[17][22].isLandmark = true;
  map[17][22].name = 'Kodavalam Bus Stop (Sreelakam Bay)';

  // C. Kodavalam Devi Kshetram Temple at (x = 29, y = 9)
  map[9][29].type = 'temple';
  map[9][29].isLandmark = true;
  map[9][29].name = 'Kodavalam Devi Kshetram';

  // D. Kalyani Lotus Pond at (x: 27-28, y: 9-10)
  map[9][27].type = 'pond';
  map[9][27].name = 'Kalyani Lotus Pond';
  map[9][28].type = 'pond';
  map[9][28].name = 'Kalyani Lotus Pond';
  map[10][27].type = 'pond';
  map[10][27].name = 'Kalyani Lotus Pond';
  map[10][28].type = 'pond';
  map[10][28].name = 'Kalyani Lotus Pond';

  // E. Kodavalam Juma Masjid at (x = 29, y = 26)
  map[26][29].type = 'mosque';
  map[26][29].isLandmark = true;
  map[26][29].name = 'Kodavalam Juma Masjid';

  // F. St. Mary's Latin Church at (x = 22, y = 9)
  map[9][22].type = 'church';
  map[9][22].isLandmark = true;
  map[9][22].name = "St. Mary's Latin Church";

  // G. Govt. UP School at (x = 22, y = 25)
  map[25][22].type = 'school';
  map[25][22].isLandmark = true;
  map[25][22].name = 'Govt. UP School Kodavalam';

  // H. Sevens & Volleyball Court at (x = 21, y = 26)
  map[26][21].type = 'volleyball_court';
  map[26][21].isLandmark = true;
  map[26][21].name = 'Kodavalam Sevens & Volleyball Court';

  // I. Civic Amenities
  map[19][23].type = 'market';
  map[19][23].name = 'Kodavalam Central Market Bazaar';

  map[20][23].type = 'community_hall';
  map[20][23].name = 'Panchayat Community Hall';

  map[19][24].type = 'clinic';
  map[19][24].name = 'Primary Health Clinic';

  map[19][21].type = 'library';
  map[19][21].name = 'Deshabhimani Vayanashala Library';

  // J. Public Wells
  map[17][20].type = 'well';
  map[17][20].name = 'Junction Stone Ring Well';
  map[8][29].type = 'well';
  map[8][29].name = 'Temple Ring Well';
  map[25][29].type = 'well';
  map[25][29].name = 'Masjid Ring Well';
  map[24][22].type = 'well';
  map[24][22].name = 'School Ring Well';

  // K. Pokkali Paddy Terraces
  const kodavalamPaddies = [
    [24, 5], [25, 5], [24, 6], [25, 6], [24, 7], [25, 7],
    [31, 15], [32, 15], [31, 16], [32, 16], [31, 17], [32, 17],
    [24, 28], [25, 28], [24, 29], [25, 29]
  ];
  kodavalamPaddies.forEach(([kx, ky]) => {
    map[ky][kx].type = 'paddy';
    map[ky][kx].name = 'Pokkali Paddy Field';
  });

  // L. Traditional Tharavadu Family Houses
  const kodavalamHouses = [
    [20, 14], [23, 14], [24, 14], [25, 14],
    [20, 20], [21, 20], [24, 20], [25, 20],
    [28, 12], [30, 12], [28, 14], [30, 14],
    [28, 20], [30, 20], [20, 24], [23, 24]
  ];
  kodavalamHouses.forEach(([hx, hy]) => {
    map[hy][hx].type = 'house';
    map[hy][hx].name = 'Tharavadu Family House';
  });

  return map;
}

export function createInitialVillagers(): Villager[] {
  const villagers: Villager[] = [];

  KASARAGOD_NAMES.forEach((person, idx) => {
    const homeX = 10 + (idx % 8);
    const homeY = 10 + Math.floor(idx / 4);

    villagers.push({
      id: `villager_${idx}`,
      name: person.name,
      gender: person.gender,
      age: 18 + (idx * 3) % 55,
      job: person.defaultJob,
      happiness: 72 + (idx % 24),
      health: 82,
      x: homeX,
      y: homeY,
      targetX: homeX,
      targetY: homeY,
      homeX,
      homeY,
      thought: 'Enjoying the peaceful morning in Kodavalam.',
    });
  });

  return villagers;
}

// Prototype pollution and safe numeric validator for localStorage integrity
function isSafeNumber(val: any, min = 0, max = 1_000_000_000): boolean {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) && val >= min && val <= max;
}

export function saveGameState(data: GameSaveData): void {
  try {
    if (!data || typeof data !== 'object') return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Security notice: Failed to write to localStorage safely:', e);
  }
}

export function loadGameState(): GameSaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || typeof raw !== 'string') return null;

    // Defense-in-depth against Prototype Pollution payloads
    if (raw.includes('__proto__') || raw.includes('constructor') || raw.includes('prototype')) {
      console.warn('Security alert: Potential prototype pollution detected in storage. Clearing save.');
      clearGameSave();
      return null;
    }

    const data = JSON.parse(raw) as GameSaveData;
    if (!data || typeof data !== 'object') return null;

    // Validate core data structure
    if (!Array.isArray(data.tiles) || data.tiles.length !== MAP_SIZE || !Array.isArray(data.tiles[0]) || data.tiles[0].length !== MAP_SIZE) {
      return null;
    }

    // Sanitize resources and numeric bounds
    if (data.resources && typeof data.resources === 'object') {
      data.resources.money = isSafeNumber(data.resources.money) ? data.resources.money : 500;
      data.resources.food = isSafeNumber(data.resources.food) ? data.resources.food : 120;
      data.resources.water = isSafeNumber(data.resources.water) ? data.resources.water : 100;
      data.resources.population = isSafeNumber(data.resources.population, 1, 5000) ? data.resources.population : 25;
      data.resources.maxPopulation = isSafeNumber(data.resources.maxPopulation, 1, 10000) ? data.resources.maxPopulation : 60;
      data.resources.happiness = isSafeNumber(data.resources.happiness, 0, 100) ? data.resources.happiness : 80;
      data.resources.health = isSafeNumber(data.resources.health, 0, 100) ? data.resources.health : 85;
      data.resources.education = isSafeNumber(data.resources.education, 0, 100) ? data.resources.education : 70;
    } else {
      data.resources = {
        money: 500,
        food: 120,
        water: 100,
        population: 25,
        maxPopulation: 60,
        happiness: 80,
        health: 85,
        education: 70,
      };
    }

    // Ensure Vishnu's Kingdom (western 1:4, x <= 15) has its royal landmarks intact
    if (data.tiles[18]?.[15]?.type !== 'royal_gate' || data.tiles[10]?.[5]?.type !== 'temple') {
      const freshMap = createInitialMap();
      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x <= 15; x++) {
          data.tiles[y][x] = freshMap[y][x];
        }
      }
    }

    // Ensure villagers array is valid
    if (!Array.isArray(data.villagers)) {
      data.villagers = createInitialVillagers();
    }

    return data;
  } catch (e) {
    console.warn('Security notice: Failed to safely parse save data:', e);
    clearGameSave();
    return null;
  }
}

export function clearGameSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * Calculates building capacities & resource generation
 */
export function calculateTurnOutput(
  tiles: TileData[][],
  currentResources: VillageResources,
  season: Season
): {
  delta: Partial<VillageResources>;
  capacity: number;
} {
  let foodDelta = 0;
  let waterDelta = 0;
  let moneyDelta = 0;
  let happinessDelta = 0;
  let healthDelta = 0;
  let educationDelta = 0;
  let totalCapacity = 40; // Base village capacity for big village

  tiles.flat().forEach((tile) => {
    const info = BUILDINGS_CATALOG[tile.type];
    if (info) {
      const levelMultiplier = tile.level === 3 ? 1.8 : tile.level === 2 ? 1.4 : 1.0;

      foodDelta += info.foodGen * levelMultiplier;
      waterDelta += info.waterGen * levelMultiplier;
      moneyDelta += info.moneyGen * levelMultiplier;
      happinessDelta += (info.happinessGen * levelMultiplier) * 0.1;
      healthDelta += (info.healthGen * levelMultiplier) * 0.1;
      educationDelta += (info.educationGen * levelMultiplier) * 0.1;
      totalCapacity += info.popCapacity;
    }
  });

  // Seasonal modifiers
  if (season === 'Southwest Monsoon') {
    waterDelta += 30;
    foodDelta *= 1.3;
    healthDelta -= 0.5;
  } else if (season === 'Summer') {
    waterDelta -= 20;
  } else if (season === 'Post-Monsoon') {
    foodDelta += 15;
    happinessDelta += 0.5;
  }

  // Consumption per capita
  const foodConsumed = currentResources.population * 0.35;
  const waterConsumed = currentResources.population * 0.4;

  foodDelta -= foodConsumed;
  waterDelta -= waterConsumed;

  // Revenue per capita
  moneyDelta += currentResources.population * 1.4;

  // Penalties
  if (currentResources.food <= 10) happinessDelta -= 2;
  if (currentResources.water <= 10) {
    happinessDelta -= 2;
    healthDelta -= 2;
  }

  return {
    delta: {
      food: Math.round(foodDelta),
      water: Math.round(waterDelta),
      money: Math.round(moneyDelta),
      happiness: happinessDelta,
      health: healthDelta,
      education: educationDelta,
    },
    capacity: totalCapacity,
  };
}

export function evaluateWinLoss(
  resources: VillageResources,
  year: number,
  zeroFoodStreak: number,
  zeroHappinessStreak: number
): {
  won: boolean;
  lost: boolean;
  reason?: string;
} {
  if (
    resources.population >= WIN_POPULATION_TARGET &&
    resources.happiness >= WIN_HAPPINESS_TARGET &&
    year <= MAX_YEARS
  ) {
    return {
      won: true,
      lost: false,
      reason: `Congratulations, Panchayat Leader! You have turned Kodavalam into a flourishing, joyful model village with over ${WIN_POPULATION_TARGET} residents!`,
    };
  }

  if (year > MAX_YEARS) {
    return {
      won: false,
      lost: true,
      reason: `5 Years have passed. Kodavalam has not met the development goals of ${WIN_POPULATION_TARGET} citizens and ${WIN_HAPPINESS_TARGET}% happiness.`,
    };
  }

  if (zeroFoodStreak >= 5) {
    return {
      won: false,
      lost: true,
      reason: 'Famine! The village ran out of food for 5 consecutive days and citizens have migrated away.',
    };
  }

  if (zeroHappinessStreak >= 5) {
    return {
      won: false,
      lost: true,
      reason: 'Despair! Village happiness reached 0% for 5 consecutive days; citizens voted for a new council.',
    };
  }

  return { won: false, lost: false };
}
