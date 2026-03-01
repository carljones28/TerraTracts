import { Link, useLocation } from 'wouter';
import Logo from '@/components/ui/logo';
import { PlusCircle, Home, Building, Briefcase, BookOpen, LogOut, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [location] = useLocation();
  const { user, isLoading, logout } = useAuth();

  // Generate initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.username.charAt(0).toUpperCase();
  };

  // Navigation links - updated to match the image
  const navLinks = [
    { title: 'Buy Land', href: '/properties?type=for-sale', active: location === '/properties?type=for-sale' },
    { title: 'Find an Agent', href: '/agents', active: location.startsWith('/agent') },
    { title: 'Properties', href: '/properties', active: location === '/properties' },
  ];

  // Role-based dashboard link
  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'buyer':
        return { title: 'Buyer Dashboard', href: '/buyer/dashboard', icon: <Home className="mr-2 h-4 w-4" /> };
      case 'seller':
        return { title: 'Seller Dashboard', href: '/seller/dashboard', icon: <Building className="mr-2 h-4 w-4" /> };
      case 'agent':
        return { title: 'Agent Dashboard', href: '/agent/dashboard', icon: <Briefcase className="mr-2 h-4 w-4" /> };
      case 'admin':
        return { title: 'Admin Dashboard', href: '/admin/dashboard', icon: <BarChart className="mr-2 h-4 w-4" /> };
      default:
        return null;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
      <div className="w-full">
        <div className="flex items-center h-14 md:h-16 relative px-4 md:px-0">
          {/* Mobile: Logo on left */}
          <div className="md:hidden flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer touch-manipulation">
                <Logo size="sm" type="image" />
              </div>
            </Link>
          </div>
          
          {/* Desktop: Left side navigation - exactly 100px from edge */}
          <div className="absolute left-[100px] hidden md:flex items-center">
            <nav className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.title} href={link.href}>
                  <div className={`text-base font-semibold cursor-pointer ${link.active ? 'text-purple-800' : 'text-gray-900 hover:text-purple-800'}`}>
                    {link.title}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Desktop: Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <Logo size="md" type="image" />
              </div>
            </Link>
          </div>
          
          {/* Right side: Auth buttons */}
          <div className="ml-auto flex items-center space-x-3 md:space-x-5 md:absolute md:right-[100px]">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-purple-700 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Dashboard link based on user role */}
                  {getDashboardLink() && (
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link href={getDashboardLink()?.href || "#"}>
                        {getDashboardLink()?.icon}
                        <span>{getDashboardLink()?.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {/* Quick Profile Role Switching */}
                  <div className="px-2 py-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Quick Role Switch</p>
                    <RoleSwitcher />
                  </div>
                  
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/resources">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Insights</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth?tab=login">
                  <div className="text-base font-semibold text-gray-900 hover:text-purple-800 cursor-pointer">Log In</div>
                </Link>
                <Link href="/auth?tab=register">
                  <div className="text-base font-semibold text-gray-900 hover:text-purple-800 cursor-pointer">Sign Up</div>
                </Link>
              </>
            )}
            
            <Link href="/sell-land">
              <div className="hidden md:inline-flex items-center px-4 py-2 text-base font-semibold text-gray-800 bg-white rounded-md border-2 border-purple-500 hover:bg-purple-50 cursor-pointer transition-colors">
                Add a Listing
              </div>
            </Link>
            
            {/* Mobile: Add Listing button */}
            <Link href="/sell-land" className="md:hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white touch-manipulation">
                <PlusCircle className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
