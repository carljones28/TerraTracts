export const PROPERTY_BADGE_MAP: Record<string, string> = {
  farm: 'Farm land',
  ranch: 'Ranch land',
  recreational: 'Recreation land',
  residential: 'Residential lot',
  timberland: 'Timber land',
  timber: 'Timber land',
  agricultural: 'Farm land',
  commercial: 'Commercial lot',
  conservation: 'Conservation',
  waterfront: 'Waterfront',
  mountain: 'Mountain views',
  hunting: 'Hunting land',
  horse: 'Horse property',
  equestrian: 'Equestrian',
};

export const PROPERTY_TYPE_LABEL_MAP: Record<string, string> = {
  farm: 'Farm Land for sale',
  ranch: 'Ranch Land for sale',
  recreational: 'Recreational Land for sale',
  residential: 'Residential Land for sale',
  timberland: 'Timberland for sale',
  timber: 'Timberland for sale',
  agricultural: 'Agricultural Land for sale',
  commercial: 'Commercial Land for sale',
  conservation: 'Conservation Land for sale',
  hunting: 'Hunting Land for sale',
  horse: 'Horse Property for sale',
  equestrian: 'Equestrian Property for sale',
};

const TERRAIN_BADGES = [
  'Nice level area',
  'Gently rolling terrain',
  'Flat, buildable lot',
  'Sloped topography',
  'Elevated with views',
  'Mostly level site',
  'Prime usable acreage',
  'Varied terrain & contours',
  'Open and level',
  'Easy to develop',
  'Ready to build',
  'Cleared and accessible',
  'Raw land, great potential',
  'Beautiful rolling hills',
  'High and dry location',
  'Well-drained soils',
  'Gentle slope to creek',
  'Terraced hillside lot',
];

const WATER_BADGES = [
  'Creek frontage',
  'Seasonal creek on site',
  'Pond on property',
  'River access included',
  'Spring-fed pond',
  'Year-round creek',
  'Two ponds on property',
  'Creek bottom land',
  'Deep water access',
  'Stocked fishing pond',
  'Natural spring on site',
  'Creek runs through it',
  'Wet-weather creek',
  'Live water frontage',
  'Meandering creek',
];

const VIEW_BADGES = [
  'Panoramic views',
  'Stunning valley views',
  'Desirable view lots',
  'Long-range mountain views',
  'Sunset views to the west',
  'Elevated hilltop setting',
  'Breathtaking vistas',
  'Scenic bluff property',
  'Views in all directions',
  'Private hilltop retreat',
  'Country and hill views',
  'Ridgeline with views',
];

const TREE_BADGES = [
  'Mature timber throughout',
  'Heavily wooded acreage',
  'Beautiful oak canopy',
  'Mixed hardwood forest',
  'Old-growth timber',
  'Pine and hardwood mix',
  'Dense cedar cover',
  'Natural wooded setting',
  'Pecan bottom land',
  'Shade trees throughout',
  'Wooded with clearings',
  'Timber investment potential',
];

const FARM_BADGES = [
  'Former crop production',
  'Row-crop ready fields',
  'Productive farm ground',
  'Hay production history',
  'Irrigated farmland',
  'High-yield soil types',
  'Former avocado orchard',
  'Former peach orchard',
  'Grazing-ready pasture',
  'Open meadow pasture',
  'Improved pasture grasses',
  'Native grass pasture',
  'Fenced and cross-fenced',
];

const HUNT_BADGES = [
  'Excellent deer habitat',
  'Trophy hunting potential',
  'Wildlife corridor',
  'Heavy deer & turkey sign',
  'Abundant wildlife',
  'Great hunting cover',
  'Food plot ready',
  'Recorded Boone & Crockett',
  'Duck hunting potential',
  'Quail habitat',
];

const ACCESS_BADGES = [
  'Paved road frontage',
  'County road access',
  'Gated private entrance',
  'Two road frontages',
  'Excellent road access',
  'Easy highway access',
  'Paved to the gate',
  'Private gravel road',
];

const INVESTMENT_BADGES = [
  'Rare investment opportunity',
  'Prime development land',
  'Utilities at road',
  'Electricity nearby',
  'Perc tested and approved',
  'Approved for subdivision',
  'In the path of growth',
  'High-growth corridor',
  'Fast-growing area',
  'Commercial potential',
  'Seller financing available',
  'Motivated seller',
  'Below market value',
];

const GENERAL_BADGES = [
  'End-of-road privacy',
  'Ultimate seclusion',
  'Private retreat setting',
  'No neighbors in sight',
  'Adjoins national forest',
  'Borders state wildlife area',
  'Unrestricted land',
  'No deed restrictions',
  'Light deed restrictions',
  'One of a kind property',
  'Bring the horses',
  'Amazing sunrises',
  'Quiet country setting',
  'Perfect weekend retreat',
  'Turn-key hunting property',
  'Multiple use possibilities',
];

const TYPE_BADGE_POOLS: Record<string, string[]> = {
  farm: [...FARM_BADGES, ...TERRAIN_BADGES],
  agricultural: [...FARM_BADGES, ...TERRAIN_BADGES],
  ranch: [...FARM_BADGES, ...HUNT_BADGES, ...TERRAIN_BADGES],
  waterfront: [...WATER_BADGES, ...VIEW_BADGES, ...GENERAL_BADGES],
  mountain: [...VIEW_BADGES, ...TREE_BADGES, ...GENERAL_BADGES],
  recreational: [...HUNT_BADGES, ...WATER_BADGES, ...TREE_BADGES, ...GENERAL_BADGES],
  conservation: [...TREE_BADGES, ...WATER_BADGES, ...GENERAL_BADGES],
  hunting: [...HUNT_BADGES, ...WATER_BADGES, ...TREE_BADGES],
  timberland: [...TREE_BADGES, ...HUNT_BADGES],
  timber: [...TREE_BADGES, ...HUNT_BADGES],
  residential: [...TERRAIN_BADGES, ...ACCESS_BADGES, ...INVESTMENT_BADGES],
  commercial: [...INVESTMENT_BADGES, ...ACCESS_BADGES, ...TERRAIN_BADGES],
  horse: [...FARM_BADGES, ...TERRAIN_BADGES, ...ACCESS_BADGES],
  equestrian: [...FARM_BADGES, ...TERRAIN_BADGES, ...ACCESS_BADGES],
};

const ALL_BADGES = [
  ...TERRAIN_BADGES,
  ...WATER_BADGES,
  ...VIEW_BADGES,
  ...TREE_BADGES,
  ...FARM_BADGES,
  ...HUNT_BADGES,
  ...ACCESS_BADGES,
  ...INVESTMENT_BADGES,
  ...GENERAL_BADGES,
];

export function generateDescriptiveHeadline(
  propertyId: number,
  opts?: {
    propertyType?: string;
    isWaterfront?: boolean;
    isMountainView?: boolean;
    acreage?: number | string;
  }
): string {
  const type = (opts?.propertyType || '').toLowerCase();

  if (opts?.isWaterfront) {
    const pool = WATER_BADGES;
    return pool[propertyId % pool.length];
  }

  if (opts?.isMountainView) {
    const pool = VIEW_BADGES;
    return pool[propertyId % pool.length];
  }

  const pool = TYPE_BADGE_POOLS[type] || ALL_BADGES;
  return pool[propertyId % pool.length];
}

export interface PropertyBadgeParams {
  propertyId?: number;
  propertyType: string;
  isWaterfront?: boolean;
  isMountainView?: boolean;
  featured?: boolean;
  videoUrl?: string;
  createdAt?: string | Date;
  priceReduced?: boolean;
  priceReductionPercent?: number;
  headline?: string;
}

export function getPropertyBadge(params: PropertyBadgeParams): string {
  if (params.priceReduced || params.priceReductionPercent) {
    const percent = params.priceReductionPercent || 5;
    return `Price cut: ${percent}% off`;
  }

  if (params.createdAt) {
    const createdDate = typeof params.createdAt === 'string' ? new Date(params.createdAt) : params.createdAt;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'New today';
    if (diffDays === 1) return '1 day on TerraTracts';
    if (diffDays <= 7) return `${diffDays} days on TerraTracts`;
    // For older listings: show days on market for ~1 in 6 properties (Zillow-style mix)
    if (diffDays > 7 && diffDays <= 365 && params.propertyId !== undefined && params.propertyId % 6 === 0) {
      return `${diffDays} days on TerraTracts`;
    }
  }

  if (params.headline) return params.headline;

  const key = (params.propertyType || '').toLowerCase();
  return PROPERTY_BADGE_MAP[key] || 'Land for sale';
}

export function getDaysOnMarket(createdAt?: string | Date): number {
  if (!createdAt) return 0;
  const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getPropertyTypeLabel(propertyType: string): string {
  const key = (propertyType || '').toLowerCase();
  return PROPERTY_TYPE_LABEL_MAP[key] || 'Lot / Land for sale';
}

export function formatPropertyPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  if (isNaN(numPrice)) return 'Price TBD';
  return `$${numPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatAcreage(acreage: number | string | undefined | null): string {
  if (acreage === undefined || acreage === null) return '—';
  const num = typeof acreage === 'string' ? parseFloat(acreage) : acreage;
  if (isNaN(num)) return '—';
  return num.toFixed(2);
}

export function formatLocation(location: string): string {
  return location.replace(/, USA$/, '').replace(/, United States$/, '');
}
