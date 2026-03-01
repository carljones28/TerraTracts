import { ExternalLink, FileText } from 'lucide-react';

interface Document {
  name: string;
  url: string;
  size?: string;
  type?: string;
  dateAdded?: string;
}

interface ResourcesSectionProps {
  documents?: Document[];
  websiteUrl?: string;
  virtualTourUrl?: string;
  countyGisUrl?: string;
  parcelNumber?: string;
  className?: string;
}

const ResourcesSection = ({ 
  documents = [], 
  websiteUrl,
  virtualTourUrl,
  countyGisUrl,
  parcelNumber,
  className = ''
}: ResourcesSectionProps) => {

  const attachments = [
    ...documents.map(doc => ({ name: doc.name, url: doc.url })),
  ];

  const externalLinks = [
    websiteUrl && { name: 'Acreage Report Map.jpg', url: websiteUrl },
    virtualTourUrl && { name: 'Aerial/Land Photography Map.jpg', url: virtualTourUrl },
    countyGisUrl && { name: 'County GIS/Tax Records', url: countyGisUrl },
  ].filter(Boolean) as { name: string; url: string }[];

  const defaultAttachments = [
    { name: 'Plat Map And Map links', url: '#' },
    { name: 'Land Tax And Map files', url: '#' },
    { name: 'Survey/Boundary Map.pdf', url: '#' },
  ];

  const defaultExternalLinks = [
    { name: 'Acreage Report Map.jpg', url: '#' },
    { name: 'Aerial/Land Photography Map.jpg', url: '#' },
  ];

  const leftColumn = attachments.length > 0 ? attachments : defaultAttachments;
  const rightColumn = externalLinks.length > 0 ? externalLinks : defaultExternalLinks;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="px-6 py-4">
        <h3 className="text-xl font-bold text-gray-900">Resources</h3>
      </div>

      <div className="px-6 pb-6">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="space-y-2">
            {leftColumn.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </a>
            ))}
          </div>
          
          <div className="space-y-2">
            {rightColumn.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesSection;
