/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BuildingInfo, TileType, VillageEvent, Season, PauranCharacter } from './types';

export const MAP_SIZE = 36;
// Scaled terrain/ground plane (5x larger in both directions: 36 * 5 = 180)
export const WORLD_SIZE = 180;
export const TILE_PIXELS = 48;
export const PRESIDENT_PASSWORD = 'president123';

export const INITIAL_RESOURCES = {
  food: 180,
  water: 200,
  money: 2500, // in Rupees ₹
  happiness: 80,
  education: 50,
  health: 75,
  population: 36,
  maxPopulation: 60,
};

export const WIN_POPULATION_TARGET = 150;
export const WIN_HAPPINESS_TARGET = 85;
export const MAX_YEARS = 5;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SEASONS_BY_MONTH: Record<number, Season> = {
  1: 'Winter',
  2: 'Winter',
  3: 'Summer',
  4: 'Summer',
  5: 'Summer',
  6: 'Southwest Monsoon',
  7: 'Southwest Monsoon',
  8: 'Southwest Monsoon',
  9: 'Post-Monsoon',
  10: 'Post-Monsoon',
  11: 'Post-Monsoon',
  12: 'Winter',
};

export const BUILDINGS_CATALOG: Record<string, BuildingInfo> = {
  house: {
    type: 'house',
    name: 'Traditional Tharavadu House',
    category: 'infrastructure',
    cost: 250,
    description: 'Sloped red-tiled roof home with open verandah. Houses 8 villagers.',
    foodGen: -2,
    waterGen: -2,
    moneyGen: 5,
    happinessGen: 2,
    healthGen: 0,
    educationGen: 0,
    popCapacity: 8,
    icon: '🏠',
  },
  paddy: {
    type: 'paddy',
    name: 'Pokkali Paddy Field',
    category: 'production',
    cost: 150,
    description: 'Indigenous organic rice field yielding aromatic grain each season.',
    foodGen: 15,
    waterGen: -5,
    moneyGen: 8,
    happinessGen: 1,
    healthGen: 0,
    educationGen: 0,
    popCapacity: 0,
    icon: '🌾',
  },
  well: {
    type: 'well',
    name: 'Stone Ring Well & Pump',
    category: 'production',
    cost: 120,
    description: 'Deep stone groundwater well providing sweet, fresh water.',
    foodGen: 0,
    waterGen: 25,
    moneyGen: 0,
    happinessGen: 2,
    healthGen: 2,
    educationGen: 0,
    popCapacity: 0,
    icon: '💧',
  },
  road: {
    type: 'road',
    name: 'Laterite Village Road',
    category: 'infrastructure',
    cost: 30,
    description: 'Crushed laterite stone path enabling fast travel and bus routes.',
    foodGen: 0,
    waterGen: 0,
    moneyGen: 1,
    happinessGen: 1,
    healthGen: 0,
    educationGen: 0,
    popCapacity: 0,
    icon: '🛤️',
  },
  school: {
    type: 'school',
    name: 'Govt. UP School Kodavalam',
    category: 'services',
    cost: 450,
    description: 'Primary school building with morning assembly bell and library books.',
    foodGen: -3,
    waterGen: -3,
    moneyGen: -10,
    happinessGen: 4,
    healthGen: 1,
    educationGen: 12,
    popCapacity: 0,
    icon: '🏫',
  },
  clinic: {
    type: 'clinic',
    name: 'Primary Health Center',
    category: 'services',
    cost: 500,
    description: 'Village dispensary with Ayurvedic remedies, first aid, and nurse.',
    foodGen: -2,
    waterGen: -4,
    moneyGen: -15,
    happinessGen: 3,
    healthGen: 15,
    educationGen: 0,
    popCapacity: 0,
    icon: '🏥',
  },
  market: {
    type: 'market',
    name: 'Kodavalam Village Market',
    category: 'civic',
    cost: 350,
    description: 'Bustling daily stalls selling fresh fish, bananas, spices, and coir.',
    foodGen: 4,
    waterGen: -2,
    moneyGen: 30,
    happinessGen: 4,
    healthGen: -1,
    educationGen: 0,
    popCapacity: 0,
    icon: '🛒',
  },
  community_hall: {
    type: 'community_hall',
    name: 'Panchayat Community Hall',
    category: 'civic',
    cost: 400,
    description: 'Hall for village meetings, weddings, Onam feasts, and disputes.',
    foodGen: -4,
    waterGen: -3,
    moneyGen: -5,
    happinessGen: 8,
    healthGen: 1,
    educationGen: 2,
    popCapacity: 0,
    icon: '🏛️',
  },
  library: {
    type: 'library',
    name: 'Deshabhimani Vayanashala',
    category: 'services',
    cost: 280,
    description: 'Village reading room with Malayalam newspapers and literary classics.',
    foodGen: 0,
    waterGen: -1,
    moneyGen: -4,
    happinessGen: 5,
    healthGen: 0,
    educationGen: 8,
    popCapacity: 0,
    icon: '📚',
  },
  volleyball_court: {
    type: 'volleyball_court',
    name: 'Sevens & Volleyball Ground',
    category: 'civic',
    cost: 200,
    description: 'Red mud court with net where youths train for district trophies.',
    foodGen: 0,
    waterGen: -2,
    moneyGen: 2,
    happinessGen: 9,
    healthGen: 5,
    educationGen: 0,
    popCapacity: 0,
    icon: '🏐',
  },
  palace: {
    type: 'palace',
    name: "Vishnu's Royal Palace (Kottaram)",
    category: 'civic',
    cost: 800,
    description: 'Majestic golden Durbar palace in Vishnu\'s Kingdom with golden kalash and throne.',
    foodGen: 5,
    waterGen: 5,
    moneyGen: 50,
    happinessGen: 15,
    healthGen: 5,
    educationGen: 5,
    popCapacity: 20,
    icon: '🏰',
  },
  royal_gate: {
    type: 'royal_gate',
    name: "Vishnu's Kingdom Royal Archway",
    category: 'infrastructure',
    cost: 300,
    description: 'Triumphal grand archway marking the boundary into Vishnu\'s Kingdom.',
    foodGen: 0,
    waterGen: 0,
    moneyGen: 10,
    happinessGen: 10,
    healthGen: 0,
    educationGen: 0,
    popCapacity: 0,
    icon: '⛩️',
  },
};

export const KASARAGOD_NAMES = [
  { name: 'Kunhambu', gender: 'M' as const, defaultJob: 'Farmer' },
  { name: 'Damodaran', gender: 'M' as const, defaultJob: 'Panchayat Member' },
  { name: 'Raghavan', gender: 'M' as const, defaultJob: 'Carpenter' },
  { name: 'Moideen', gender: 'M' as const, defaultJob: 'Trader' },
  { name: 'Fathima', gender: 'F' as const, defaultJob: 'Teacher' },
  { name: 'Mary', gender: 'F' as const, defaultJob: 'Nurse' },
  { name: 'Sudhakaran', gender: 'M' as const, defaultJob: 'Weaver' },
  { name: 'Thomas', gender: 'M' as const, defaultJob: 'Mechanic' },
  { name: 'Shylaja', gender: 'F' as const, defaultJob: 'Asha Worker' },
  { name: 'Soumya', gender: 'F' as const, defaultJob: 'Librarian' },
  { name: 'Anjali', gender: 'F' as const, defaultJob: 'Student' },
  { name: 'Gopalan', gender: 'M' as const, defaultJob: 'Coconut Harvester' },
  { name: 'Meenakshi', gender: 'F' as const, defaultJob: 'Artisan' },
  { name: 'Ashokan', gender: 'M' as const, defaultJob: 'Volleyball Captain' },
  { name: 'Nabeesa', gender: 'F' as const, defaultJob: 'Tailor' },
  { name: 'Sukumaran', gender: 'M' as const, defaultJob: 'Fisherman' },
  { name: 'Devaki', gender: 'F' as const, defaultJob: 'Homemaker' },
  { name: 'Kiran', gender: 'M' as const, defaultJob: 'Student' },
  { name: 'Binu', gender: 'M' as const, defaultJob: 'Bus Conductor' },
  { name: 'Chandran', gender: 'M' as const, defaultJob: 'Blacksmith' },
];

export const COWHERD_VILLAGE_LOOP = [
  { x: 21, y: 18, name: "Balan Chettan's Chayakkada (Kodavalam)" },
  { x: 29, y: 18, name: "East Highway Lane" },
  { x: 29, y: 10, name: "Devi Temple & Lotus Pond" },
  { x: 22, y: 10, name: "North Street by St. Mary's Church" },
  { x: 16, y: 10, name: "Crossing Northern Harmony Bridge into Vishnu's Kingdom" },
  { x: 6, y: 10, name: "Sri Vishnu Mahakshetram Temple & Raja Pushkarini" },
  { x: 6, y: 18, name: "Vishnu's Royal Palace (Kottaram)" },
  { x: 6, y: 26, name: "Vishnu's Royal Durbar Hall & Palace Gardens" },
  { x: 11, y: 26, name: "Royal Guard South Road" },
  { x: 11, y: 18, name: "Vishnu's Kingdom Royal Bazaar" },
  { x: 15, y: 18, name: "Vishnu's Kingdom Royal Archway" },
  { x: 17, y: 18, name: "Crossing Grand Royal Bridge back to Kodavalam" },
  { x: 21, y: 18, name: "Back at Chayakkada & Sreelakam Bus Stop" },
];

export const COWHERD_QUOTES = [
  "Taking Gomathi on our grand walk across the river into Vishnu's Kingdom!",
  "Gomathi loves grazing in the Royal Gardens of Vishnu's Palace!",
  "Crossing the Grand Royal Bridge! The view of both realms is breathtaking.",
  "The royal courtiers of Vishnu's Kingdom always wave at Gomathi!",
  "Gomathi gives sweet golden milk after visiting Vishnu's Kingdom!",
  "Going to the pasture with Gomathi! The grass is so sweet today.",
  "A good cowherd never rushes; the path between both lands teaches peace.",
];

export const CHAYAKADA_GOSSIP = [
  "Balan says Sreelakam bus driver brought hot chips from Kanhangad!",
  "The elders are debating the upcoming Panchayat election over ginger tea.",
  "Someone spotted peacocks dancing in the western coconut groves this morning.",
  "The monsoon clouds over Bekal fort mean heavy rains tonight!",
  "Kodavalam volleyball team is in top form for the tournament finals!",
];

export const PAURAN_CHARACTERS: PauranCharacter[] = [
  {
    id: 'sanju_nair',
    name: 'Sanju Nair',
    malayalamName: 'സഞ്ജു നായർ',
    roleTitle: 'Village Youth & River Explorer',
    description: 'Energetic Kerala youth in azure sky-blue jubba and crisp Kasavu mundu with golden sash. Quick on his feet, loves exploring hidden river trails and village corners.',
    avatarIcon: '👦',
    outfitColor: '#0284c7', // Sky Blue Jubba
    munduColor: '#f8fafc', // Crisp White Kasavu Mundu
    accessoryColor: '#f59e0b', // Gold border & sash
    skinTone: '#d97706',
    hairColor: '#1c1917',
  },
  {
    id: 'kannan_dr',
    name: 'Kannan Dr',
    malayalamName: 'കണ്ണൻ ഡോക്ടർ',
    roleTitle: 'Chief Village Physician',
    description: 'Respected medical doctor in a clinical white doctor coat with an emerald stethoscope scarf. Dedicated to the health and wellness of everyone from Kodavalam to the Royal Kingdom.',
    avatarIcon: '👨‍⚕️',
    outfitColor: '#f8fafc', // Crisp Clinical White Coat
    munduColor: '#0369a1', // Deep Blue Trousers / Mundu
    accessoryColor: '#10b981', // Emerald Stethoscope Scarf
    skinTone: '#d97706',
    hairColor: '#1c1917',
  },
  {
    id: 'sayyed_bin_salman_sayu',
    name: 'Sayyed Bin Salman Sayu',
    malayalamName: 'സയ്യിദ് ബിൻ സൽമാൻ സായു',
    roleTitle: 'Arabian Emissary & Silk Merchant',
    description: 'Distinguished royal envoy in an emerald-green thobe with an ornate gold-trimmed headscarf (shemagh). Bridges trade between the desert caravans and Kerala backwaters.',
    avatarIcon: '👳',
    outfitColor: '#059669', // Emerald Royal Thobe
    munduColor: '#047857', // Forest Green Silk Robe
    accessoryColor: '#fbbf24', // Golden Royal Shemagh Band
    skinTone: '#b45309',
    hairColor: '#0f172a',
  },
  {
    id: 'commoner_vishnu',
    name: 'Commoner Vishnu',
    malayalamName: 'സാധാരണക്കാരൻ വിഷ്ണു',
    roleTitle: 'Humble Village Farmer & Artisan',
    description: 'Beloved down-to-earth citizen sharing the landlord’s auspicious name! Dressed in a rustic terracotta shirt and double-folded work mundu with a sunny yellow thorthu towel.',
    avatarIcon: '🧑',
    outfitColor: '#ea580c', // Terracotta Ochre Shirt
    munduColor: '#fef08a', // Soft Cream Working Mundu
    accessoryColor: '#facc15', // Yellow Shoulder Thorthu (Towel)
    skinTone: '#b47348',
    hairColor: '#1c1917',
  },
  {
    id: 'karthi_vibranium',
    name: 'Karthi Vibranium',
    malayalamName: 'കാർത്തി വൈബ്രേനിയം',
    roleTitle: 'Vibranium Blacksmith & Tech Pioneer',
    description: 'Fearless powerhouse in metallic violet and sleek midnight attire with glowing cyan vibranium power bracelets. Always inventing next-generation contraptions for the village.',
    avatarIcon: '🦸',
    outfitColor: '#7c3aed', // Vibranium Deep Violet Tunics
    munduColor: '#1e1b4b', // Midnight Metallic Mundu
    accessoryColor: '#06b6d4', // Glowing Cyan Vibranium Power Band
    skinTone: '#b45309',
    hairColor: '#0f172a',
  },
  {
    id: 'king_vishnu',
    name: 'King Vishnu',
    malayalamName: 'വിഷ്ണു രാജാവ്',
    roleTitle: 'Sovereign of the Realm',
    description: 'The sovereign monarch. Locked in royal majesty on the top floor throne balcony of Valaskjalf, gazing across the entire kingdom and mainland with an ultra high-definition panoramic vista.',
    avatarIcon: '👑',
    outfitColor: '#f59e0b', // Imperial Gold Silk
    munduColor: '#78350f', // Royal Terracotta Brocade
    accessoryColor: '#38bdf8', // Sapphire Crown Jewel
    skinTone: '#d97706',
    hairColor: '#0f172a',
  },
];

export const RANDOM_EVENTS: VillageEvent[] = [
  {
    id: 'monsoon_deluge',
    title: 'Edavappathi Monsoon Deluge',
    category: 'monsoon',
    description: 'Incessant tropical rains have swollen the river canal. The low-lying Pokkali paddy fields risk waterlogging!',
    imageIcon: '🌧️',
    choices: [
      {
        text: 'Mobilize villagers to dig drainage trenches (Costs ₹200)',
        effectDescription: 'Saves the crops! Villagers work together proudly.',
        resourceDelta: { money: -200, food: 25, happiness: 6 },
        loreOutcome: 'Thanks to swift trench work, the paddy fields drank the rainwater safely.',
      },
      {
        text: 'Deploy emergency pump sets using Panchayat funds (Costs ₹400)',
        effectDescription: 'High cost, but boosts village health and food supply.',
        resourceDelta: { money: -400, food: 35, health: 8 },
        loreOutcome: 'The electric pump sets drained the waters and kept mosquitoes away.',
      },
      {
        text: 'Rely on natural runoff and pray at the shrines',
        effectDescription: 'Zero cost, but some crops get waterlogged.',
        resourceDelta: { food: -30, happiness: -5 },
        loreOutcome: 'A portion of the paddy harvest was lost to muddy river silt.',
      },
    ],
  },
  {
    id: 'onam_harvest',
    title: 'Onam Harvest & Pookkalam Festival',
    category: 'festival',
    description: 'Thiruvonam has arrived in Kodavalam! The children have laid out intricate flower carpets (Pookkalam) outside every house and the Chayakkada.',
    imageIcon: '🌸',
    choices: [
      {
        text: 'Host a Grand Village Sadya Feast at Community Hall (Costs ₹500, 30 Food)',
        effectDescription: 'Enormous happiness boost across all communities!',
        resourceDelta: { money: -500, food: -30, happiness: 22, health: 5 },
        loreOutcome: 'Twenty-four dishes on plantain leaves! Every villager dined together in joy.',
      },
      {
        text: 'Organize a Pookkalam & Tug-of-War (Vadamvali) Contest (Costs ₹200)',
        effectDescription: 'Spirited friendly competition boosts happiness and culture.',
        resourceDelta: { money: -200, happiness: 14, education: 4 },
        loreOutcome: 'The youth team won the Vadamvali rope trophy after an epic ten-minute battle!',
      },
      {
        text: 'Modest family observances this season',
        effectDescription: 'Conserves resources, minor festive cheer.',
        resourceDelta: { happiness: 4 },
        loreOutcome: 'Families lit lamps and ate sweet payasam quietly at home.',
      },
    ],
  },
  {
    id: 'sreelakam_bus_extension',
    title: 'Sreelakam Bus Route Expansion',
    category: 'economic',
    description: 'The owner of the blue private bus "SREELAKAM" offers to add two extra daily trips connecting Kodavalam to Kanhangad town, if the village improves the bus-stop bay.',
    imageIcon: '🚌',
    choices: [
      {
        text: 'Pave the bus-stop bay and build a covered passenger shelter (Costs ₹350)',
        effectDescription: 'Bus brings town trade, students commute easily, permanent income boost!',
        resourceDelta: { money: -350, happiness: 10, education: 8 },
        loreOutcome: 'The gleaming blue SREELAKAM bus now honks musically four times a day at the Chayakkada!',
      },
      {
        text: 'Keep the current schedule as is',
        effectDescription: 'Saves money, but travel to town remains slow.',
        resourceDelta: {},
        loreOutcome: 'Villagers continue taking the single morning and evening bus.',
      },
    ],
  },
  {
    id: 'volleyball_tournament',
    title: 'Kodavalam Sevens Volleyball Trophy',
    category: 'sports',
    description: 'Neighboring villages have arrived at the mud court for the annual floodlit volleyball championship! The crowd is cheering loudly.',
    imageIcon: '🏐',
    choices: [
      {
        text: 'Sponsor the tournament prizes & snacks (Costs ₹250)',
        effectDescription: 'Huge morale boost, visitor spending brings revenue to the market!',
        resourceDelta: { money: -250 + 150, happiness: 16, health: 6 },
        loreOutcome: 'Kodavalam won the thrilling 3rd set 25-23! Celebrations lasted until midnight.',
      },
      {
        text: 'Let the youth club fund it themselves',
        effectDescription: 'Small happiness gain without draining Panchayat funds.',
        resourceDelta: { happiness: 5 },
        loreOutcome: 'A spirited local match took place with enthusiastic whistles.',
      },
    ],
  },
  {
    id: 'eid_harmony_feast',
    title: 'Eid-ul-Fitr Celebration of Harmony',
    category: 'festival',
    description: 'Following morning prayers at Kodavalam Juma Masjid, Moideen and families prepare aromatic Malabar Biryani and sweet vermicelli payasam for all neighbors.',
    imageIcon: '🌙',
    choices: [
      {
        text: 'Contribute community spices & support the shared feast (Costs ₹300, 20 Food)',
        effectDescription: 'Solidifies communal unity and joyful celebration.',
        resourceDelta: { money: -300, food: -20, happiness: 18 },
        loreOutcome: 'Neighbors from the temple, church, and mosque shared fragrant biryani under coconut palms.',
      },
      {
        text: 'Send official Panchayat greetings',
        effectDescription: 'Simple warm goodwill.',
        resourceDelta: { happiness: 6 },
        loreOutcome: 'Festive greetings and sweets were exchanged outside the prayer hall.',
      },
    ],
  },
  {
    id: 'summer_drought_spell',
    title: 'Peak Summer Drought (Medam Heat)',
    category: 'economic',
    description: 'The pre-monsoon summer sun is scorching. The ring wells are dipping low, and drinking water is scarce.',
    imageIcon: '☀️',
    choices: [
      {
        text: 'Deepen the public ring wells & desilt Kalyani pond (Costs ₹400)',
        effectDescription: 'Restores fresh water and protects community health.',
        resourceDelta: { money: -400, water: 60, health: 8 },
        loreOutcome: 'The deepened wells hit clean underground springs, keeping the village hydrated.',
      },
      {
        text: 'Ration domestic water usage strictly',
        effectDescription: 'Saves water, but happiness dips slightly.',
        resourceDelta: { water: 20, happiness: -8 },
        loreOutcome: 'Villagers washed clothes in the river to save well water for cooking.',
      },
    ],
  },
  {
    id: 'school_sslc_exams',
    title: 'School Board Exams (SSLC)',
    category: 'social',
    description: 'Tenth standard students at Govt. UP School are preparing for crucial state board examinations. Teacher Fathima requests evening study lamps.',
    imageIcon: '📖',
    choices: [
      {
        text: 'Fund evening study classes & nutritional milk (Costs ₹200)',
        effectDescription: 'Boosts village education and high pass percentages!',
        resourceDelta: { money: -200, education: 18, happiness: 6 },
        loreOutcome: 'Kodavalam achieved a 100% pass rate in the SSLC exams! The whole village rejoiced.',
      },
      {
        text: 'Standard daylight school hours only',
        effectDescription: 'Normal outcomes without expenditure.',
        resourceDelta: { education: 4 },
        loreOutcome: 'The students studied by kerosene lamps at home and performed steadily.',
      },
    ],
  },
];
