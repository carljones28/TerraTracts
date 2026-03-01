import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, ArrowLeft, Share2, Heart, Mail, MapPin, Ruler, Trees, Home, ChevronDown, ChevronUp, User } from 'lucide-react';
import ZillowStyleGallery from '@/components/property/ZillowStyleGallery';
import PropertyVideoTour from '@/components/property/PropertyVideoTour';
import PropertyVideoSection from '@/components/property/PropertyVideoSection';
import PropertyHeader from '@/components/property/PropertyHeader';
import PropertyDetails from '@/components/property/PropertyDetails';
import PropertyFeaturesGrid from '@/components/property/PropertyFeaturesGrid';
import PropertyLocationSection from '@/components/property/PropertyLocationSection';
import LandBoundariesSection from '@/components/property/LandBoundariesSection';
import ResourcesSection from '@/components/property/ResourcesSection';
import NearbyProperties from '@/components/property/NearbyProperties';
import AgentListings from '@/components/property/AgentListings';
import ContactAgentForm from '@/components/property/ContactAgentForm';
import AgentProfileCard from '@/components/property/AgentProfileCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Property, Resource } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';

import SharePropertyCard from '@/components/property/SharePropertyCard';

const PropertyDetailsPage = () => {
  const { id } = useParams<{id: string}>();
  const propertyId = parseInt(id || '0');
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    features: false,
    video: false,
    location: false,
    resources: false
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const { 
    isFavorited, 
    toggleFavorite,
    isAdding: isAddingFavorite,
    isRemoving: isRemovingFavorite 
  } = useFavorites();
  
  const { isFavorited: isFavoritedStatus, favoriteId } = isFavorited(propertyId);
  
  // Fetch property details
  const { data: rawProperty, isLoading, error } = useQuery<any>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !isNaN(propertyId)
  });
  
  // Get listingAgentId (user id) from rawProperty
  const listingUserId = rawProperty?.listingAgentId || rawProperty?.listing_agent_id;

  // Fetch the real agent profile by user id
  const { data: agentProfile } = useQuery<any>({
    queryKey: [`/api/agents/by-user/${listingUserId}`],
    enabled: !!listingUserId
  });

  // For listings query, use the agent_profiles.id from the fetched profile
  const agentProfileId = agentProfile?.id;
  const { data: agentListings = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${agentProfileId}/properties`],
    enabled: !!agentProfileId
  });
  
  // Filter out current property from agent listings
  const otherAgentListings = agentListings.filter((p: any) => p.id !== propertyId);
  const hasAgentListings = otherAgentListings.length > 0;
  
  // Fetch property tracts for boundary display
  const { data: tracts = [] } = useQuery<any[]>({
    queryKey: [`/api/properties/${propertyId}/tracts`],
    enabled: !isNaN(propertyId)
  });

  // Transform the raw property data to match our interface
  const property = rawProperty ? {
    ...rawProperty,
    // Convert coordinates if available
    coordinates: rawProperty.latitude && rawProperty.longitude 
      ? (() => {
          try {
            const lat = parseFloat(String(rawProperty.latitude));
            const lng = parseFloat(String(rawProperty.longitude));
            
            if (isNaN(lat) || isNaN(lng)) {
              console.error('Invalid coordinates - NaN values:', { 
                lat: rawProperty.latitude, 
                lng: rawProperty.longitude 
              });
              return undefined;
            }
            
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
              console.error('Coordinates out of range:', { lat, lng });
              return undefined;
            }
            
            return [lat, lng] as [number, number];
          } catch (e) {
            console.error('Error parsing coordinates:', e);
            return undefined;
          }
        })()
      : undefined,
    // Ensure other properties are properly set
    size: rawProperty.acreage ? parseFloat(String(rawProperty.acreage)) : rawProperty.size,
    features: Array.isArray(rawProperty.amenities) ? rawProperty.amenities : 
              Array.isArray(rawProperty.features) ? rawProperty.features : [],
    agent: rawProperty.agent || (rawProperty.agentName || rawProperty.agent_name ? {
      id: rawProperty.listingAgentId || rawProperty.listing_agent_id,
      name: rawProperty.agentName || rawProperty.agent_name,
      photo: null,
      brokerage: rawProperty.agentCompany || rawProperty.agent_company || ''
    } : null),
    videoUrl: rawProperty.video_url || rawProperty.videoUrl || '',
    status: rawProperty.status || 'active',
    isAgent: true
  } as Property : undefined;
  
  const handleContactAgent = () => {
    toast({
      title: "Contact Request Sent",
      description: "A land specialist will contact you shortly!",
    });
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        url: window.location.href
      });
    }
  };
  
  const handleFavorite = () => {
    toggleFavorite(propertyId);
  };
  
  // Effects - after all state declarations and before any conditional returns
  useEffect(() => {
    if (property) {
      console.log('Transformed property with coordinates:', 
        property.coordinates ? 
          `[${property.coordinates[0]}, ${property.coordinates[1]}]` : 
          'undefined'
      );
      
      // Deep debug of video URL issues
      const rawPropertyStr = JSON.stringify(rawProperty);
      const hasVideoUrl = rawPropertyStr.includes('"videoUrl"');
      const hasVideo_url = rawPropertyStr.includes('"video_url"');
      
      console.log('🎥 DETAILS - Property video URL deep debug:', {
        propertyId: property.id,
        videoUrl: property.videoUrl,
        hasVideoUrl: Boolean(property.videoUrl),
        rawVideoUrl: rawProperty.video_url, 
        rawVideoUrlCamelCase: rawProperty.videoUrl,
        rawPropertyHasVideoUrl: hasVideoUrl,
        rawPropertyHasVideo_url: hasVideo_url,
        rawPropertyKeys: Object.keys(rawProperty || {})
      });
      
      // If we don't have videoUrl but we find video_url in the raw JSON, let's fix
      if (!property.videoUrl && hasVideo_url) {
        try {
          const parsed = JSON.parse(rawPropertyStr);
          console.log("🎥 DETAILS - Found video_url in raw property JSON:", parsed.video_url);
          property.videoUrl = parsed.video_url;
          console.log("🎥 DETAILS - Updated property.videoUrl with video_url value:", property.videoUrl);
        } catch (e) {
          console.error("🎥 Error parsing raw property:", e);
        }
      }
    }
  }, [property, rawProperty]);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load property details. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Not found state
  if (!property && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
        <p className="mb-6 text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
        <a 
          href="/"
          className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-3 text-white font-medium transition-colors"
        >
          Return to Home
        </a>
      </div>
    );
  }
  
  // Final null check
  if (!property) return null;
  
  // Determine if user is owner or agent now that property is loaded
  const isOwnerOrAgent = user && (
    ((rawProperty?.ownerId && rawProperty.ownerId === user.id)) || 
    ((rawProperty?.listingAgentId && rawProperty.listingAgentId === user.id)) || 
    (user.role === 'admin') ||
    (user.isAgent === true)
  );
  
  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price.toLocaleString()}`;
  };
  
  // Get price per acre
  const pricePerAcre = property.price && property.size 
    ? Math.round(property.price / property.size).toLocaleString()
    : null;

  // Main render
  return (
    <>
      {/* MOBILE LAYOUT - Zillow Style */}
      <div className="md:hidden bg-white min-h-screen pb-32">
        {/* Mobile Sticky Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 safe-area-top">
          <div className="flex items-center justify-between px-3 py-2">
            <button 
              onClick={() => setLocation('/properties')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Go back to properties"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-1">
              <SharePropertyCard
                property={{
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  location: property.location || property.state,
                  state: property.state,
                  size: property.size,
                  propertyType: property.propertyType,
                  images: Array.isArray(property.images) ? property.images : []
                }}
              />
              <button 
                onClick={handleFavorite}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${isFavoritedStatus ? 'text-red-500' : 'text-gray-700'}`}
                aria-label={isFavoritedStatus ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-5 w-5 ${isFavoritedStatus ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Full-bleed Image Gallery */}
        <div className="pt-12">
          <div className="relative">
            <ZillowStyleGallery 
              images={property.images} 
              alt={property.title} 
            />
          </div>
        </div>
        
        {/* Compact Price & Key Facts */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-baseline justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              ${property.price?.toLocaleString()}
            </h1>
            {pricePerAcre && (
              <span className="text-sm text-gray-500">${pricePerAcre}/acre</span>
            )}
          </div>
          
          {/* Key Stats Row */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              <span className="font-medium">{property.size?.toFixed(1)} acres</span>
            </div>
            <div className="flex items-center gap-1">
              <Trees className="h-4 w-4" />
              <span>{property.propertyType || 'Land'}</span>
            </div>
            {(rawProperty?.bedrooms || 0) > 0 && (
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>{rawProperty?.bedrooms} bd • {rawProperty?.bathrooms} ba</span>
              </div>
            )}
          </div>
          
          {/* Address */}
          <div className="flex items-start gap-1 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{property.location || rawProperty?.address || ''}, {property.state}</span>
          </div>
          
          {/* Status Badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              property.status === 'active' ? 'bg-green-100 text-green-800' : 
              property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {property.status === 'active' ? 'For Sale' : property.status || 'For Sale'}
            </span>
          </div>
        </div>
        
        {/* Overview Section (Accordion) */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleSection('overview')}
            className="w-full px-4 py-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
            aria-expanded={expandedSections.overview}
            aria-controls="overview-content"
          >
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            {expandedSections.overview ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          {expandedSections.overview && (
            <div className="px-4 pb-4">
              <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
              
              {/* Features Grid */}
              {property.features && property.features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.features.slice(0, 6).map((feature: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Features Section (Accordion) */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleSection('features')}
            className="w-full px-4 py-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
            aria-expanded={expandedSections.features}
            aria-controls="features-content"
          >
            <h2 className="text-lg font-semibold text-gray-900">Property Features</h2>
            {expandedSections.features ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          {expandedSections.features && (
            <div className="px-4 pb-4">
              <PropertyFeaturesGrid property={property} rawProperty={rawProperty} />
            </div>
          )}
        </div>
        
        {/* Location Section (Accordion) */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleSection('location')}
            className="w-full px-4 py-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
            aria-expanded={expandedSections.location}
            aria-controls="location-content"
          >
            <h2 className="text-lg font-semibold text-gray-900">Property Location</h2>
            {expandedSections.location ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          {expandedSections.location && (
            <div className="px-4 pb-4">
              <PropertyLocationSection
                latitude={rawProperty?.latitude}
                longitude={rawProperty?.longitude}
                state={property.state}
                roadAccess={rawProperty?.roadAccess}
                boundary={rawProperty?.boundary}
                tracts={tracts}
                currentTractId={tracts[0]?.id}
                propertyName={property.title}
              />
            </div>
          )}
        </div>
        
        {/* Video Section (Accordion) - only show if property has video */}
        {(property.videoUrl || rawProperty?.video_url) && (
          <div className="border-b border-gray-100">
            <button 
              onClick={() => toggleSection('video')}
              className="w-full px-4 py-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
              aria-expanded={expandedSections.video}
              aria-controls="video-content"
            >
              <h2 className="text-lg font-semibold text-gray-900">Video Tour</h2>
              {expandedSections.video ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {expandedSections.video && (
              <div className="px-4 pb-4">
                <PropertyVideoSection 
                  videoUrl={property.videoUrl || rawProperty?.video_url}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Resources Section (Accordion) */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => toggleSection('resources')}
            className="w-full px-4 py-4 flex items-center justify-between focus:outline-none focus:bg-gray-50"
            aria-expanded={expandedSections.resources}
            aria-controls="resources-content"
          >
            <h2 className="text-lg font-semibold text-gray-900">Resources & Documents</h2>
            {expandedSections.resources ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          {expandedSections.resources && (
            <div className="px-4 pb-4">
              <ResourcesSection
                documents={rawProperty?.documents}
                websiteUrl={rawProperty?.websiteUrl}
                virtualTourUrl={rawProperty?.virtualTourUrl}
                countyGisUrl={rawProperty?.countyGisUrl}
                parcelNumber={rawProperty?.parcelNumber}
              />
            </div>
          )}
        </div>
        
        {/* Agent Profile Card */}
        {property.agent && (
          <div className="px-4 py-4 border-b border-gray-100">
            <AgentProfileCard
              name={agentProfile ? `${agentProfile.user?.firstName || ''} ${agentProfile.user?.lastName || ''}`.trim() || property.agent.name : property.agent.name}
              title={agentProfile?.specialty || 'Land Specialist'}
              company={agentProfile?.brokerage || agentProfile?.brokerageName || property.agent.brokerage}
              photo={agentProfile?.profileImage || agentProfile?.profileImageUrl || property.agent.photo}
              bio={agentProfile?.bio}
              phone={agentProfile?.phone}
              yearsExperience={agentProfile?.yearsExperience || agentProfile?.years_experience}
              totalDeals={agentProfile?.totalTransactions}
              activeListings={otherAgentListings.length}
              rating={agentProfile ? parseFloat(agentProfile.averageRating || agentProfile.rating || '0') : undefined}
              reviewCount={agentProfile?.totalReviews || agentProfile?.reviewCount}
              specializations={agentProfile?.specialtyAreas || agentProfile?.specialty_areas}
              verified={agentProfile?.verificationStatus ?? agentProfile?.verification_status}
              location={property.location || property.state}
              agentId={agentProfile?.id}
              onContact={() => setShowContactModal(true)}
              onViewProfile={() => setLocation(`/agents/${agentProfile?.id || listingUserId}`)}
              onCompanyClick={() => setLocation(`/properties?company=${encodeURIComponent(agentProfile?.brokerage || property.agent?.brokerage || '')}`)}
              onShare={handleShare}
            />
          </div>
        )}
        
        {/* Mobile Sticky Bottom Contact Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowContactModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-3.5 px-4 rounded-xl transition-colors shadow-lg"
              aria-label="Contact agent about this property"
            >
              <Mail className="h-5 w-5" />
              <span>Contact Agent</span>
            </button>
            <button 
              onClick={handleFavorite}
              className={`flex items-center justify-center p-3.5 rounded-xl transition-colors ${isFavoritedStatus ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-label={isFavoritedStatus ? "Remove from favorites" : "Save to favorites"}
            >
              <Heart className={`h-6 w-6 ${isFavoritedStatus ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Contact Modal */}
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contact Agent</DialogTitle>
              <DialogDescription>Send a message about this property</DialogDescription>
            </DialogHeader>
            <ContactAgentForm 
              propertyId={property.id}
              propertyTitle={property.title}
              propertyLocation={property.location || property.state}
              agentName={property.agent?.name}
              agentPhoto={property.agent?.photo}
              agentBrokerage={property.agent?.brokerage}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* DESKTOP LAYOUT - Modern Redesign */}
      <div className="hidden md:block bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6 md:py-10">
          {/* Property header */}
          <PropertyHeader 
            property={property} 
            onShare={handleShare} 
            onFavorite={handleFavorite} 
          />
          
          {/* Photo gallery */}
          <div className="mb-10">
            <ZillowStyleGallery 
              images={property.images} 
              alt={property.title} 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Property details, features, map, resources */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Details (About section) */}
              <PropertyDetails 
                property={property} 
                onContactClick={handleContactAgent}
                onScheduleTourClick={handleContactAgent}
              />
              
              {/* Property Features Grid */}
              <PropertyFeaturesGrid 
                property={property} 
                rawProperty={rawProperty} 
              />
              
              {/* Property Location Map Section */}
              <PropertyLocationSection
                latitude={rawProperty?.latitude}
                longitude={rawProperty?.longitude}
                state={property.state}
                roadAccess={rawProperty?.roadAccess}
                boundary={rawProperty?.boundary}
                tracts={tracts}
                currentTractId={tracts[0]?.id}
                propertyName={property.title}
              />
              
              {/* Property Video Section */}
              <PropertyVideoSection 
                videoUrl={property.videoUrl || rawProperty?.video_url}
              />
              
              {/* Resources & Documents Section */}
              <ResourcesSection
                documents={rawProperty?.documents}
                websiteUrl={rawProperty?.websiteUrl}
                virtualTourUrl={rawProperty?.virtualTourUrl}
                countyGisUrl={rawProperty?.countyGisUrl}
                parcelNumber={rawProperty?.parcelNumber}
              />
              
              {/* Agent Profile Card */}
              {property.agent && (
                <AgentProfileCard
                  name={agentProfile ? `${agentProfile.user?.firstName || ''} ${agentProfile.user?.lastName || ''}`.trim() || property.agent.name : property.agent.name}
                  title={agentProfile?.specialty || 'Land Specialist'}
                  company={agentProfile?.brokerage || agentProfile?.brokerageName || property.agent.brokerage}
                  photo={agentProfile?.profileImage || agentProfile?.profileImageUrl || property.agent.photo}
                  bio={agentProfile?.bio}
                  phone={agentProfile?.phone}
                  yearsExperience={agentProfile?.yearsExperience || agentProfile?.years_experience}
                  totalDeals={agentProfile?.totalTransactions}
                  activeListings={otherAgentListings.length}
                  rating={agentProfile ? parseFloat(agentProfile.averageRating || agentProfile.rating || '0') : undefined}
                  reviewCount={agentProfile?.totalReviews || agentProfile?.reviewCount}
                  specializations={agentProfile?.specialtyAreas || agentProfile?.specialty_areas}
                  verified={agentProfile?.verificationStatus ?? agentProfile?.verification_status}
                  location={property.location || property.state}
                  agentId={agentProfile?.id}
                  onContact={() => {
                    const formContainer = document.getElementById('contact-form-container');
                    if (formContainer) {
                      formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setTimeout(() => {
                        const nameInput = formContainer.querySelector('input[id="name"]') as HTMLInputElement;
                        if (nameInput) {
                          nameInput.focus();
                          nameInput.classList.add('ring-2', 'ring-blue-500');
                          setTimeout(() => nameInput.classList.remove('ring-2', 'ring-blue-500'), 2000);
                        }
                      }, 500);
                    }
                  }}
                  onViewProfile={() => setLocation(`/agents/${agentProfile?.id || listingUserId}`)}
                  onCompanyClick={() => setLocation(`/properties?company=${encodeURIComponent(agentProfile?.brokerage || property.agent?.brokerage || '')}`)}
                  onShare={() => setShowShareModal(true)}
                />
              )}

              {/* Share Modal Controller */}
              <SharePropertyCard
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                property={{
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  location: property.location || property.state,
                  state: property.state,
                  size: property.size,
                  propertyType: property.propertyType,
                  images: Array.isArray(property.images) ? property.images : []
                }}
              />
            </div>
            
            {/* Right side - Contact form */}
            <div className="space-y-6">
              <div id="contact-form-container" className="sticky top-24">
                <ContactAgentForm 
                  propertyId={property.id}
                  propertyTitle={property.title}
                  propertyLocation={property.location || property.state}
                  agentName={property.agent?.name}
                  agentPhoto={property.agent?.photo}
                  agentBrokerage={property.agent?.brokerage}
                />
              </div>
            </div>
          </div>
          
          {/* Agent Listings or Nearby Properties Section */}
          <div className="mt-16 space-y-16">
            {hasAgentListings ? (
              <AgentListings
                agentId={agentProfile?.id}
                currentPropertyId={property.id}
              />
            ) : (
              <NearbyProperties
                currentPropertyId={property.id}
                latitude={property.coordinates?.[0]}
                longitude={property.coordinates?.[1]}
                state={property.state}
                limit={8}
                agentName={property.agent?.name}
                agentId={agentProfile?.id}
              />
            )}

            {/* Sold Properties Carousel */}
            <NearbyProperties
              currentPropertyId={property.id}
              latitude={property.coordinates?.[0]}
              longitude={property.coordinates?.[1]}
              state={property.state}
              limit={8}
              agentName={property.agent?.name}
              agentId={agentProfile?.id}
              showSold={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetailsPage;
