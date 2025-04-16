import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useFinance();
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-background/50 backdrop-blur-md border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center mr-2">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">Radiant Pulse</span>
          </Link>
        </div>
        
        {/* Navigation Links */}
        <div className="hidden md:flex space-x-1">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'default' : 'ghost'} 
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/transactions">
            <Button 
              variant={location.pathname === '/transactions' ? 'default' : 'ghost'} 
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Transactions
            </Button>
          </Link>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <div className="grid grid-cols-2 divide-x divide-border">
          <Link to="/" className={`flex items-center justify-center py-3 ${location.pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          <Link to="/transactions" className={`flex items-center justify-center py-3 ${location.pathname === '/transactions' ? 'bg-primary/10 text-primary' : ''}`}>
            <Calendar className="h-4 w-4 mr-2" />
            Transactions
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
