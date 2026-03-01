import { 
  BadgeCheck, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle,
  Building2,
  TrendingUp,
  Calendar,
  ChevronRight,
  Home,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AgentProfileCardProps {
  name: string;
  title?: string;
  company?: string;
  photo?: string;
  coverPhoto?: string;
  bio?: string;
  phone?: string;
  email?: string;
  yearsExperience?: number;
  totalDeals?: number;
  activeListings?: number;
  avgDealSize?: number;
  rating?: number;
  reviewCount?: number;
  specializations?: string[];
  verified?: boolean;
  featuredAgent?: boolean;
  location?: string;
  agentId?: number;
  onContact?: () => void;
  onViewProfile?: () => void;
  onCompanyClick?: () => void;
  onShare?: () => void;
  className?: string;
}

const AgentProfileCard = ({
  name = 'Robert Anderson',
  title = 'Senior Land Specialist',
  company = 'TerraTracts Realty',
  photo = 'https://randomuser.me/api/portraits/men/32.jpg',
  bio = 'Dedicated land professional with extensive experience helping clients find their perfect property.',
  phone = '(555) 123-4567',
  email = 'agent@terranova.com',
  yearsExperience = 12,
  totalDeals = 150,
  activeListings = 24,
  rating = 4.9,
  reviewCount = 127,
  specializations = ['Agricultural', 'Recreational', 'Residential'],
  verified = true,
  location = 'Austin, TX',
  agentId,
  onContact,
  onViewProfile,
  onCompanyClick,
  onShare,
  className = ''
}: AgentProfileCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: `${name} - ${title}`,
        text: `Check out ${name} at ${company}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="relative h-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.5) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.5) 75%)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-start gap-5 -mt-10">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              {!imageError ? (
                <img 
                  src={photo} 
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-md border-2 border-white">
                <BadgeCheck className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-12">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={onViewProfile}
                className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
              >
                {name}
              </button>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{rating}</span>
                <span className="text-xs text-amber-600">({reviewCount})</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{title}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <button 
                onClick={onCompanyClick}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5" />
                {company}
              </button>
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{yearsExperience}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Years Exp</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Deals Closed</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
              <Home className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active</p>
          </div>
        </div>

        {bio && (
          <p className="text-sm text-gray-600 leading-relaxed mt-5 line-clamp-2">{bio}</p>
        )}

        {specializations && specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {specializations.slice(0, 4).map((spec, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onContact}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 rounded-xl"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact
          </Button>
          <Button 
            variant="outline"
            onClick={onViewProfile}
            className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium h-12 rounded-xl"
          >
            View Profile
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button 
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              handleShare();
            }}
            className="border-gray-300 hover:bg-gray-50 text-gray-500 h-12 w-12 rounded-xl flex-shrink-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t border-gray-100">
          <a 
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <a 
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="truncate max-w-[160px]">{email}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileCard;
