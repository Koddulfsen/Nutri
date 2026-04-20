/**
 * Food Source Configuration
 *
 * Defines all available food data sources for the Add Food modal.
 * Each source has a code, display name, icon, and API endpoints.
 *
 * Generated: 2026-01-18
 */

export interface FoodSourceConfig {
  code: string;              // API source code (CNF, FDC, FOODB, etc.)
  name: string;              // Display name
  shortName: string;         // Short name for compact display
  icon: string;              // Emoji flag or icon
  searchEndpoint: string;    // API endpoint for search
  enabled: boolean;          // Whether this source is currently available
  region?: string;           // Geographic region (for grouping)
}

/**
 * All available food sources
 * Order determines display order in the modal
 */
export const FOOD_SOURCES: FoodSourceConfig[] = [
  // North America
  {
    code: 'CNF',
    name: 'Canadian Nutrient File',
    shortName: 'CNF',
    icon: '🇨🇦',
    searchEndpoint: '/api/foods/cnf/search',
    enabled: true,
    region: 'North America',
  },
  {
    code: 'FDC',
    name: 'USDA FoodData Central',
    shortName: 'USDA',
    icon: '🇺🇸',
    searchEndpoint: '/api/foods/fdc/search',
    enabled: true,
    region: 'North America',
  },

  // Enrichment Sources
  {
    code: 'FOODB',
    name: 'FooDB',
    shortName: 'FooDB',
    icon: '🧬',
    searchEndpoint: '/api/foods/foodb/search',
    enabled: true,
    region: 'Enrichment',
  },
  {
    code: 'PHENOL',
    name: 'Phenol-Explorer',
    shortName: 'Phenol',
    icon: '🍇',
    searchEndpoint: '/api/foods/phenol/search',
    enabled: true,
    region: 'Enrichment',
  },
  {
    code: 'DUKE',
    name: "Dr. Duke's Phytochemical",
    shortName: 'Duke',
    icon: '🌿',
    searchEndpoint: '/api/foods/duke/search',
    enabled: true,
    region: 'Enrichment',
  },

  // Europe
  {
    code: 'UK_COFID',
    name: 'UK Composition of Foods',
    shortName: 'UK',
    icon: '🇬🇧',
    searchEndpoint: '/api/foods/uk-cofid/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'CIQUAL',
    name: 'French CIQUAL',
    shortName: 'CIQUAL',
    icon: '🇫🇷',
    searchEndpoint: '/api/foods/ciqual/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'BLS',
    name: 'German BLS',
    shortName: 'BLS',
    icon: '🇩🇪',
    searchEndpoint: '/api/foods/bls/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'FRIDA',
    name: 'Danish Frida',
    shortName: 'FRIDA',
    icon: '🇩🇰',
    searchEndpoint: '/api/foods/frida/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'FINELI',
    name: 'Finnish Fineli',
    shortName: 'FINELI',
    icon: '🇫🇮',
    searchEndpoint: '/api/foods/fineli/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'NEVO',
    name: 'Dutch NEVO',
    shortName: 'NEVO',
    icon: '🇳🇱',
    searchEndpoint: '/api/foods/nevo/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'MATVARETABELLEN',
    name: 'Norwegian Matvaretabellen',
    shortName: 'Norway',
    icon: '🇳🇴',
    searchEndpoint: '/api/foods/matvaretabellen/search',
    enabled: true,
    region: 'Europe',
  },
  {
    code: 'FOODFILES',
    name: 'New Zealand FOODfiles',
    shortName: 'NZ',
    icon: '🇳🇿',
    searchEndpoint: '/api/foods/foodfiles/search',
    enabled: true,
    region: 'Asia-Pacific',
  },

  // Asia-Pacific
  {
    code: 'AFCD',
    name: 'Australian Food Composition',
    shortName: 'AFCD',
    icon: '🇦🇺',
    searchEndpoint: '/api/foods/afcd/search',
    enabled: true,
    region: 'Asia-Pacific',
  },
  {
    code: 'MEXT',
    name: 'Japanese MEXT',
    shortName: 'MEXT',
    icon: '🇯🇵',
    searchEndpoint: '/api/foods/mext/search',
    enabled: true,
    region: 'Asia-Pacific',
  },
  {
    code: 'KFCT',
    name: 'Korean KFCT',
    shortName: 'KFCT',
    icon: '🇰🇷',
    searchEndpoint: '/api/foods/kfct/search',
    enabled: true,
    region: 'Asia-Pacific',
  },
  {
    code: 'INDB',
    name: 'Indian INDB',
    shortName: 'INDB',
    icon: '🇮🇳',
    searchEndpoint: '/api/foods/indb/search',
    enabled: true,
    region: 'Asia-Pacific',
  },
  {
    code: 'ASEANFOODS',
    name: 'ASEAN Foods',
    shortName: 'ASEAN',
    icon: '🌏',
    searchEndpoint: '/api/foods/aseanfoods/search',
    enabled: true,
    region: 'Asia-Pacific',
  },
];

/**
 * Get only enabled sources
 */
export function getEnabledSources(): FoodSourceConfig[] {
  return FOOD_SOURCES.filter((s) => s.enabled);
}

/**
 * Get source by code
 */
export function getSourceByCode(code: string): FoodSourceConfig | undefined {
  return FOOD_SOURCES.find((s) => s.code === code);
}

/**
 * Group sources by region
 */
export function getSourcesByRegion(): Record<string, FoodSourceConfig[]> {
  return FOOD_SOURCES.reduce((acc, source) => {
    const region = source.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(source);
    return acc;
  }, {} as Record<string, FoodSourceConfig[]>);
}
