import { useLocation, Link } from 'wouter';
import { Home, Search, Heart, User, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/properties' },
  { icon: MapPin, label: 'Map', href: '/properties?view=map' },
  { icon: Heart, label: 'Saved', href: '/buyer/dashboard', requiresAuth: true },
  { icon: User, label: 'Profile', href: '/auth' },
];

const MobileBottomNav = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '/properties?view=map') return location.includes('/properties') && location.includes('view=map');
    if (href === '/properties') return location.startsWith('/properties') && !location.includes('view=map');
    return location.startsWith(href.split('?')[0]);
  };

  const getProfileHref = () => {
    if (!user) return '/auth';
    switch (user.role) {
      case 'buyer': return '/buyer/dashboard';
      case 'seller': return '/seller/dashboard';
      case 'agent': return '/agent/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/auth';
    }
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = item.label === 'Profile' ? getProfileHref() : item.href;
          const active = isActive(item.label === 'Profile' ? href : item.href);
          const showItem = !item.requiresAuth || user;

          if (!showItem && item.label === 'Saved') {
            return (
              <Link key={item.label} href="/auth?tab=login">
                <div
                  className="flex flex-col items-center justify-center py-2 px-4 min-w-[64px] touch-manipulation"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <div className="relative">
                    <Icon 
                      className="w-6 h-6 text-gray-400 transition-all duration-200"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-[10px] font-medium mt-1 text-gray-400">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.label} href={href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-4 min-w-[64px] touch-manipulation transition-all duration-200",
                  active && "scale-105"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div className="relative">
                  <div 
                    className={cn(
                      "absolute inset-0 -m-2 rounded-2xl transition-all duration-300",
                      active ? "bg-purple-100 scale-110" : "bg-transparent scale-0"
                    )}
                  />
                  <Icon 
                    className={cn(
                      "w-6 h-6 relative z-10 transition-all duration-200",
                      active 
                        ? "text-purple-600 transform" 
                        : "text-gray-500"
                    )}
                    strokeWidth={active ? 2.5 : 1.5}
                    fill={active ? "currentColor" : "none"}
                  />
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-medium mt-1 transition-colors duration-200",
                    active ? "text-purple-600" : "text-gray-500"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
