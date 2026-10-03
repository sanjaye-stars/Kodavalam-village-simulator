/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Season = 'Summer' | 'Southwest Monsoon' | 'Post-Monsoon' | 'Winter';

export type UserRole = 'president' | 'pauran';

export type ViewMode = 'sky' | 'pov';

export interface VillageResources {
  food: number;
  water: number;
  money: number;
  happiness: number; // 0 - 100
  education: number; // 0 - 100
  health: number; // 0 - 100
  population: number;
  maxPopulation: number;
}

export type TileType =
  | 'grass'
  | 'paddy'
  | 'river'
  | 'pond'
  | 'road'
  | 'house'
  | 'well'
  | 'school'
  | 'clinic'
  | 'market'
  | 'community_hall'
  | 'library'
  | 'volleyball_court'
  | 'chayakada'
  | 'bus_stop'
  | 'temple'
  | 'mosque'
  | 'church'
  | 'palace'
  | 'royal_gate';

export interface TileData {
  id: string;
  x: number;
  y: number;
  type: TileType;
  level: number; // 1, 2, 3
  name?: string;
  isLandmark?: boolean;
}

export interface BuildingInfo {
  type: TileType;
  name: string;
  category: 'production' | 'infrastructure' | 'civic' | 'services';
  cost: number;
  description: string;
  foodGen: number;
  waterGen: number;
  moneyGen: number;
  happinessGen: number;
  healthGen: number;
  educationGen: number;
  popCapacity: number;
  icon: string;
}

export interface Villager {
  id: string;
  name: string;
  gender: 'M' | 'F';
  age: number;
  job: string;
  happiness: number;
  health: number;
  x: number; // floating tile coordinates for smooth walking
  y: number;
  targetX: number;
  targetY: number;
  homeX: number;
  homeY: number;
  thought: string;
  isSpecial?: boolean; // e.g. Damu with cow
}

export interface DecisionChoice {
  text: string;
  effectDescription: string;
  resourceDelta: Partial<VillageResources>;
  loreOutcome: string;
}

export interface VillageEvent {
  id: string;
  title: string;
  category: 'monsoon' | 'festival' | 'economic' | 'social' | 'sports';
  description: string;
  imageIcon: string;
  choices: DecisionChoice[];
}

export interface BusState {
  status: 'departed' | 'approaching' | 'at_stop' | 'leaving';
  progress: number; // 0 to 1 along road
  passengers: number;
  timer: number;
}

export interface CowherdState {
  x: number;
  y: number;
  isGrazing: boolean;
  grazeTimer: number;
  direction: 'left' | 'right' | 'up' | 'down';
  bubbleText?: string;
  bubbleTimer?: number;
}

export interface GameSaveData {
  day: number;
  month: number;
  year: number;
  season: Season;
  resources: VillageResources;
  tiles: TileData[][];
  villagers: Villager[];
  stats: {
    festivalsHeld: number;
    busesWelcomed: number;
    milkHarvested: number;
    volleyballMatches: number;
  };
  gameWon: boolean;
  gameLost: boolean;
  lossReason?: string;
}

export interface PauranCharacter {
  id: string;
  name: string;
  malayalamName: string;
  roleTitle: string;
  description: string;
  avatarIcon: string;
  outfitColor: string;
  munduColor: string;
  accessoryColor: string;
  skinTone: string;
  hairColor: string;
  isComingSoon?: boolean;
}

export interface PlayerCharacterState {
  x: number;
  z: number;
  rotationY: number;
  isMoving: boolean;
  characterId: string;
}

