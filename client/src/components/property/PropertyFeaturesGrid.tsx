import { 
  Ruler, 
  Home, 
  Mountain, 
  Trees, 
  Droplet, 
  Plug, 
  Car, 
  Scale, 
  Eye, 
  Waves, 
  Fence, 
  Building2, 
  Tractor, 
  Tent, 
  Factory,
  Sun,
  Wind,
  MapPin,
  Compass,
  Bed,
  Bath,
  Calendar
} from 'lucide-react';

interface PropertyFeaturesGridProps {
  property: {
    acreage?: number;
    size?: number;
    propertyType?: string;
    terrainType?: string;
    utilities?: string;
    roadAccess?: string;
    zoning?: string;
    waterFeatures?: string;
    vegetation?: string;
    views?: string;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    features?: string[];
  };
  rawProperty?: any;
}

const getPropertyTypeIcon = (type?: string) => {
  const normalizedType = type?.toLowerCase() || '';
  if (normalizedType.includes('residential') || normalizedType.includes('home')) return Home;
  if (normalizedType.includes('commercial')) return Building2;
  if (normalizedType.includes('agricultural') || normalizedType.includes('farm')) return Tractor;
  if (normalizedType.includes('recreational') || normalizedType.includes('hunting')) return Tent;
  if (normalizedType.includes('industrial')) return Factory;
  if (normalizedType.includes('ranch')) return Fence;
  return Mountain;
};

const getTerrainIcon = (terrain?: string) => {
  const normalizedTerrain = terrain?.toLowerCase() || '';
  if (normalizedTerrain.includes('water') || normalizedTerrain.includes('lake') || normalizedTerrain.includes('river')) return Waves;
  if (normalizedTerrain.includes('forest') || normalizedTerrain.includes('wooded')) return Trees;
  if (normalizedTerrain.includes('mountain') || normalizedTerrain.includes('hill')) return Mountain;
  return Compass;
};

const PropertyFeaturesGrid = ({ property, rawProperty }: PropertyFeaturesGridProps) => {
  const acreage = property.acreage || property.size || rawProperty?.acreage;
  const propertyType = property.propertyType || rawProperty?.propertyType;
  const terrainType = property.terrainType || rawProperty?.terrainType;
  const utilities = property.utilities || rawProperty?.utilities;
  const roadAccess = property.roadAccess || rawProperty?.roadAccess;
  const zoning = property.zoning || rawProperty?.zoning;
  const waterFeatures = property.waterFeatures || rawProperty?.waterFeatures;
  const views = property.views || rawProperty?.views;
  const bedrooms = property.bedrooms || rawProperty?.bedrooms;
  const bathrooms = property.bathrooms || rawProperty?.bathrooms;
  const yearBuilt = property.yearBuilt || rawProperty?.yearBuilt;

  const PropertyTypeIcon = getPropertyTypeIcon(propertyType);
  const TerrainIcon = getTerrainIcon(terrainType);

  const features = [
    { icon: Ruler, label: 'Acreage', value: acreage ? `${acreage.toLocaleString()} acres` : null, priority: 1 },
    { icon: PropertyTypeIcon, label: 'Property Type', value: propertyType, priority: 2 },
    { icon: TerrainIcon, label: 'Terrain', value: terrainType, priority: 3 },
    { icon: Scale, label: 'Zoning', value: zoning, priority: 4 },
    { icon: Car, label: 'Road Access', value: roadAccess, priority: 5 },
    { icon: Plug, label: 'Utilities', value: utilities, priority: 6 },
    { icon: Droplet, label: 'Water', value: waterFeatures, priority: 7 },
    { icon: Eye, label: 'Views', value: views, priority: 8 },
    { icon: Bed, label: 'Bedrooms', value: bedrooms ? `${bedrooms} beds` : null, priority: 9 },
    { icon: Bath, label: 'Bathrooms', value: bathrooms ? `${bathrooms} baths` : null, priority: 10 },
    { icon: Calendar, label: 'Year Built', value: yearBuilt ? `${yearBuilt}` : null, priority: 11 },
  ].filter(f => f.value);

  if (features.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Property Features</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{feature.label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{feature.value}</p>
              </div>
            </div>
          ))}
        </div>

        {property.features && property.features.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Features</h3>
            <div className="flex flex-wrap gap-2">
              {property.features.map((feature, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyFeaturesGrid;
