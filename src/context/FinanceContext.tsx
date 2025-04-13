
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  StockData,
  PerformanceData,
  SectorData,
  generateStocks,
  generatePerformanceData,
  generateSectorData,
  generatePortfolioSummary,
  generateWatchlist,
} from '@/data/mockData';

interface PortfolioSummary {
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  stockCount: number;
}

interface FinanceContextType {
  stocks: StockData[];
  watchlist: StockData[];
  performanceData: PerformanceData;
  sectorData: SectorData[];
  portfolioSummary: PortfolioSummary;
  loading: boolean;
  refreshData: () => void;
  addToWatchlist: (stock: StockData) => void;
  removeFromWatchlist: (stockId: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);

  const loadData = () => {
    setLoading(true);
    // Simulate API loading delay
    setTimeout(() => {
      const stocksData = generateStocks(8);
      const watchlistData = generateWatchlist(5);
      const performanceMetrics = generatePerformanceData();
      const sectorsData = generateSectorData(stocksData);
      const summary = generatePortfolioSummary(stocksData);
      
      setStocks(stocksData);
      setWatchlist(watchlistData);
      setPerformanceData(performanceMetrics);
      setSectorData(sectorsData);
      setPortfolioSummary(summary);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  const addToWatchlist = (stock: StockData) => {
    if (!watchlist.some(item => item.id === stock.id)) {
      setWatchlist([...watchlist, stock]);
    }
  };

  const removeFromWatchlist = (stockId: string) => {
    setWatchlist(watchlist.filter(stock => stock.id !== stockId));
  };

  return (
    <FinanceContext.Provider
      value={{
        stocks,
        watchlist,
        performanceData,
        sectorData,
        portfolioSummary,
        loading,
        refreshData,
        addToWatchlist,
        removeFromWatchlist,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
