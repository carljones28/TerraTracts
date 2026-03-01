import { FC } from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLocation } from 'wouter';

const Footer: FC = () => {
  const [location] = useLocation();
  
  return (
    <footer className="bg-[#0F172A] border-t border-gray-800">
      <div className="container mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description column */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-white mr-2 flex items-center justify-center">
                <span className="text-[#0F172A] font-bold">T</span>
              </div>
              <span className="text-white font-semibold text-lg">TerraTracts</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Redefining the land marketplace with AI-powered tools and immersive experiences.
            </p>
            <div className="flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-white"><Facebook size={18} /></a>
              <a href="#" className="hover:text-white"><Twitter size={18} /></a>
              <a href="#" className="hover:text-white"><Instagram size={18} /></a>
              <a href="#" className="hover:text-white"><Linkedin size={18} /></a>
            </div>
          </div>
          
          {/* Explore column */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/properties" className="hover:text-white">Find Land</a></li>
              <li><a href="/sell-land" className="hover:text-white">Sell Property</a></li>
              <li><a href="/agents" className="hover:text-white">Agent Directory</a></li>
              <li><a href="/land-categories" className="hover:text-white">Land Categories</a></li>
              <li><a href="/resources" className="hover:text-white">Land Types</a></li>
              <li><a href="/resources" className="hover:text-white">Market Insights</a></li>
            </ul>
          </div>
          
          {/* Insights column */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Insights</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/resources" className="hover:text-white">TerraTracts Academy</a></li>
              <li><a href="/resources" className="hover:text-white">Land Buying Guide</a></li>
              <li><a href="/resources" className="hover:text-white">Land Valuation</a></li>
              <li><a href="/resources" className="hover:text-white">Zoning Atlas</a></li>
              <li><a href="/resources" className="hover:text-white">TerraFund</a></li>
            </ul>
          </div>
          
          {/* Support column */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
              <li><a href="/help" className="hover:text-white">Help Center</a></li>
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              <li><a href="/careers" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright section */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© 2025 TerraTracts. All rights reserved.</p>
          <div className="mt-2 space-x-3 flex justify-center">
            <a href="/privacy" className="text-gray-500 hover:text-gray-300">Privacy</a>
            <a href="/terms" className="text-gray-500 hover:text-gray-300">Terms</a>
            <a href="/cookies" className="text-gray-500 hover:text-gray-300">Cookies</a>
            <button className="text-gray-500 hover:text-gray-300">
              <span className="sr-only">Settings</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;