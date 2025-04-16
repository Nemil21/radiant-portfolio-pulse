import React from 'react';
import { LayoutDashboard, Briefcase, LineChart, BarChart, List, Settings } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { portfolioSummary } = useFinance();
  const location = useLocation();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', path: '/', active: location.pathname === '/' },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Portfolio', path: '/portfolio', active: location.pathname === '/portfolio' },
    { icon: <LineChart className="h-5 w-5" />, label: 'Transactions', path: '/transactions', active: location.pathname === '/transactions' },
    { icon: <BarChart className="h-5 w-5" />, label: 'Analytics', path: '/analytics', active: location.pathname === '/analytics' },
    { icon: <List className="h-5 w-5" />, label: 'Watchlist', path: '/watchlist', active: location.pathname === '/watchlist' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings', active: location.pathname === '/settings' },
  ];
  
  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-white/10 animate-fade-in">
      <div className="flex-1 py-6">
        
        <nav className="space-y-1 px-3">
          {sidebarItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              } transition-all duration-300 ease-in-out animate-slide-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-lg bg-secondary/20 p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Portfolio Balance</p>
            <LineChart className="h-4 w-4 text-finance-teal" />
          </div>
          <p className="text-2xl font-bold">
            {portfolioSummary ? formatCurrency(portfolioSummary.totalValue) : formatCurrency(0)}
          </p>
          <p className={`text-xs flex items-center mt-1 ${
            (portfolioSummary?.dailyChange ?? 0) >= 0 ? 'text-finance-profit' : 'text-finance-loss'
          }`}>
            <span className={`h-2 w-2 rounded-full mr-1 ${
              (portfolioSummary?.dailyChange ?? 0) >= 0 ? 'bg-finance-profit' : 'bg-finance-loss'
            }`}></span>
            {(portfolioSummary?.dailyChange ?? 0) >= 0 ? '+' : ''}
            {(portfolioSummary?.dailyChangePercent ?? 0).toFixed(2)}% today
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
