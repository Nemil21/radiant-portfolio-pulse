
import React from 'react';
import { LayoutDashboard, Briefcase, LineChart, BarChart, List, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: true },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Portfolio', active: false },
    { icon: <LineChart className="h-5 w-5" />, label: 'Transactions', active: false },
    { icon: <BarChart className="h-5 w-5" />, label: 'Analytics', active: false },
    { icon: <List className="h-5 w-5" />, label: 'Watchlist', active: false },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', active: false },
  ];
  
  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-white/10 animate-fade-in">
      <div className="flex-1 py-6">
        <div className="px-3 mb-6">
          <h2 className="text-lg font-bold flex items-center px-3">
            <div className="h-5 w-5 rounded-full bg-finance-teal mr-2 animate-pulse-slow"></div>
            FinTrade
          </h2>
        </div>
        <nav className="space-y-1 px-3">
          {sidebarItems.map((item, i) => (
            <a
              key={i}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              } transition-all duration-300 ease-in-out animate-slide-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-lg bg-secondary/20 p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Portfolio Balance</p>
            <LineChart className="h-4 w-4 text-finance-teal" />
          </div>
          <p className="text-2xl font-bold">$248,890.24</p>
          <p className="text-xs text-finance-profit flex items-center mt-1">
            <span className="h-2 w-2 rounded-full bg-finance-profit mr-1"></span>
            +2.5% today
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
