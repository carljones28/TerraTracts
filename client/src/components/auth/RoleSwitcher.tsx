import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Building, Briefcase, Home } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check } from 'lucide-react';
import { cn } from "@/lib/utils";

// Define the available roles
const roles = [
  {
    value: 'buyer',
    label: 'Buyer Mode',
    icon: <Home className="mr-2 h-4 w-4" />,
    description: 'Search for properties and save favorites'
  },
  {
    value: 'seller',
    label: 'Seller Mode',
    icon: <Building className="mr-2 h-4 w-4" />,
    description: 'List your properties and manage inquiries'
  },
  {
    value: 'agent',
    label: 'Agent Mode',
    icon: <Briefcase className="mr-2 h-4 w-4" />,
    description: 'Represent clients and manage listings'
  }
];

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [open, setOpen] = useState(false);
  
  if (!user) return null;
  
  // Get the current role (default to 'buyer' if not set)
  const currentRole = user.role || 'buyer';
  
  // Find the current role object
  const currentRoleObj = roles.find(role => role.value === currentRole) || roles[0];
  
  // Handle role selection
  const handleRoleSelect = (value: string) => {
    const selectedRole = value as 'buyer' | 'seller' | 'agent';
    
    // Only switch if different from current role
    if (selectedRole !== currentRole) {
      switchRole.mutate({ role: selectedRole });
    }
    
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a role"
          className="flex items-center gap-2 w-full justify-between"
        >
          <div className="flex items-center truncate">
            {currentRoleObj.icon}
            <span className="ml-1 truncate">{currentRoleObj.label}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[200px]">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandEmpty>No role found.</CommandEmpty>
          <CommandGroup>
            {roles.map((role) => (
              <CommandItem
                key={role.value}
                value={role.value}
                onSelect={handleRoleSelect}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  {role.icon}
                  <span>{role.label}</span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    currentRole === role.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}