
import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';

interface HeaderProps {
  onSidebarToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { toast } = useToast();
  
  const handleNotification = () => {
    toast({
      title: "Notifications",
      description: "You have no new notifications.",
    });
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-white/10">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-dark flex flex-col p-6">
            <div className="text-xl font-bold flex items-center mb-6">
              <div className="h-6 w-6 rounded-full bg-finance-teal mr-2 animate-pulse-slow"></div>
              FinTrade
            </div>
            <nav className="flex flex-col gap-4">
              <a href="#" className="flex items-center gap-2 text-lg hover:text-finance-teal transition-colors">
                Dashboard
              </a>
              <a href="#" className="flex items-center gap-2 text-lg hover:text-finance-teal transition-colors">
                Portfolio
              </a>
              <a href="#" className="flex items-center gap-2 text-lg hover:text-finance-teal transition-colors">
                Transactions
              </a>
              <a href="#" className="flex items-center gap-2 text-lg hover:text-finance-teal transition-colors">
                Watchlist
              </a>
              <a href="#" className="flex items-center gap-2 text-lg hover:text-finance-teal transition-colors">
                Settings
              </a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold hidden lg:flex items-center">
            <div className="h-6 w-6 rounded-full bg-finance-teal mr-2 animate-pulse-slow"></div>
            FinTrade
          </h1>
        </div>
        
        <div className="hidden md:flex items-center w-full max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks, companies..."
              className="pl-8 bg-secondary/20 border-secondary/30 w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="relative"
            onClick={handleNotification}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-finance-teal rounded-full" />
          </Button>
          
          <div className="h-8 w-8 rounded-full bg-secondary/80 flex items-center justify-center text-sm font-medium">
            JS
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
