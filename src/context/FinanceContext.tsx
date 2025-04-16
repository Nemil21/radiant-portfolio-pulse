import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Services
import { 
  getPortfolioHoldings, 
  getPortfolioSummary, 
  updatePortfolioHolding, 
  removePortfolioHolding,
  getTransactions,
  PortfolioHolding,
  PortfolioSummary,
  Transaction
} from '@/services/portfolioService';

import {
  getWatchlistItems,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  WatchlistItem
} from '@/services/watchlistService';

import {
  getUserProfile,
  updateUserProfile,
  signIn,
  signUp,
  signOut,
  UserProfile
} from '@/services/userService';

import {
  searchStocks,
  getHistoricalData,
  getStockQuote,
  StockSearchResult,
  HistoricalData
} from '@/services/finnhubService';

// Types
import { 
  PerformanceData,
  SectorData,
  generateSectorData,
  generatePerformanceData,
  StockData
} from '@/data/mockData';

interface FinanceContextType {
  // Authentication state
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Granular loading states
  loadingStocks: boolean;
  loadingWatchlist: boolean;
  loadingSummary: boolean;
  
  // Portfolio data
  stocks: PortfolioHolding[];
  portfolioSummary: PortfolioSummary;
  
  // Watchlist data
  watchlist: WatchlistItem[];
  
  // Performance data
  performanceData: PerformanceData;
  
  // Sector data
  sectorData: SectorData[];
  
  // Transactions
  transactions: Transaction[];
  
  // Actions
  refreshData: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  addStock: (symbol: string, quantity: number, price: number) => Promise<boolean>;
  removeStock: (holdingId: string, quantity: number, sellPrice: number) => Promise<boolean>;
  addToWatchlist: (symbol: string, category?: string) => Promise<boolean>;
  removeFromWatchlist: (watchlistItemId: string) => Promise<boolean>;
  searchStocks: (query: string) => Promise<StockSearchResult[]>;
  getHistoricalData: (symbol: string, resolution?: string, from?: number, to?: number) => Promise<HistoricalData | null>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const CACHE_DURATION = 10 * 1000;

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Granular loading states
  const [loadingStocks, setLoadingStocks] = useState<boolean>(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState<boolean>(false);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  
  const [stocks, setStocks] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && session.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Portfolio holdings subscription
    const portfolioSubscription = supabase
      .channel('portfolio-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'portfolio_holdings',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        // Refresh only the affected data
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data: holding } = await supabase
            .from('portfolio_holdings')
            .select(`
              *,
              stocks (
                id,
                symbol,
                name,
                sector,
                logo_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (holding) {
            const quote = await getStockQuote(holding.stocks.symbol);
            const updatedHolding: PortfolioHolding = {
              id: holding.id,
              stockId: holding.stocks.id,
              symbol: holding.stocks.symbol,
              name: holding.stocks.name,
              sector: holding.stocks.sector,
              color: '#' + Math.floor(Math.random()*16777215).toString(16), // Generate random color
              quantity: holding.quantity,
              price: quote?.c || 0,
              averageCost: holding.average_cost,
              value: (quote?.c || 0) * holding.quantity,
              change: quote?.d || 0,
              changePercent: quote?.dp || 0,
              profit: ((quote?.c || 0) - holding.average_cost) * holding.quantity,
              profitPercent: ((quote?.c || 0) - holding.average_cost) / holding.average_cost * 100
            };

            setStocks(prev => {
              const index = prev.findIndex(h => h.id === holding.id);
              if (index === -1) return [...prev, updatedHolding];
              const newHoldings = [...prev];
              newHoldings[index] = updatedHolding;
              return newHoldings;
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setStocks(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .subscribe();

    // Watchlist subscription
    const watchlistSubscription = supabase
      .channel('watchlist-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'watchlist_items',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data: item } = await supabase
            .from('watchlist_items')
            .select(`
              *,
              stocks (
                id,
                symbol,
                name,
                sector,
                logo_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (item) {
            // Get stock quote
            const quote = await getStockQuote(item.stocks.symbol);
            
            // Transform to WatchlistItem format
            const watchlistItem: WatchlistItem = {
              id: item.id,
              stockId: item.stocks.id,
              symbol: item.stocks.symbol,
              name: item.stocks.name,
              sector: item.stocks.sector,
              color: '#' + Math.floor(Math.random()*16777215).toString(16), // Generate random color
              price: quote?.c || 0,
              change: quote?.d || 0,
              changePercent: quote?.dp || 0,
              category: item.category,
              priceAlertHigh: item.price_alert_high,
              priceAlertLow: item.price_alert_low
            };
            
            setWatchlist(prev => {
              const index = prev.findIndex(w => w.id === item.id);
              if (index === -1) return [...prev, watchlistItem];
              const newWatchlist = [...prev];
              newWatchlist[index] = watchlistItem;
              return newWatchlist;
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setWatchlist(prev => prev.filter(w => w.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      portfolioSubscription.unsubscribe();
      watchlistSubscription.unsubscribe();
    };
  }, [user]);

  // Load user profile when user is authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
        }
      }
    };

    loadUserProfile();
  }, [user]);

  // Load data when user profile is loaded
  useEffect(() => {
    if (profile) {
      refreshData();
    } else if (!user) {
      setLoading(false);
    }
  }, [profile]);

  const refreshData = useCallback(async (force = false) => {
    const now = new Date();
    if (!force && lastUpdated && (now.getTime() - lastUpdated.getTime() < CACHE_DURATION)) {
      return; // Use cached data
    }

    // Only set global loading on initial load
    if (!lastUpdated) {
      setLoading(true);
    }
    
    try {
      // Load portfolio holdings with granular loading state
      setLoadingStocks(true);
      const holdingsData = await getPortfolioHoldings();
      setStocks(holdingsData);
      setLoadingStocks(false);
      
      // Calculate summary from holdings with granular loading state
      setLoadingSummary(true);
      const summaryData: PortfolioSummary = {
        totalValue: holdingsData.reduce((sum, holding) => sum + holding.value, 0),
        totalCost: holdingsData.reduce((sum, holding) => sum + (holding.averageCost * holding.quantity), 0),
        totalProfit: holdingsData.reduce((sum, holding) => sum + holding.profit, 0),
        totalProfitPercent: holdingsData.reduce((sum, holding) => sum + holding.profitPercent, 0) / holdingsData.length,
        stockCount: holdingsData.length,
        dailyChange: holdingsData.reduce((sum, holding) => sum + (holding.change * holding.quantity), 0),
        dailyChangePercent: holdingsData.reduce((sum, holding) => sum + holding.changePercent, 0) / holdingsData.length
      };
      setPortfolioSummary(summaryData);
      setLoadingSummary(false);
      
      // Only refresh watchlist if it's been more than 5 minutes
      if (force || !lastUpdated || (now.getTime() - lastUpdated.getTime() > CACHE_DURATION)) {
        setLoadingWatchlist(true);
        const watchlistData = await getWatchlistItems();
        setWatchlist(watchlistData);
        setLoadingWatchlist(false);
      }
      
      // Generate derived data from holdings
      const sectorsData = generateSectorData(adaptHoldingsToStockData(holdingsData));
      setSectorData(sectorsData);
      
      setLastUpdated(now);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [lastUpdated]);

  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
    }
    return result;
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const result = await signUp(email, password, firstName, lastName);
    if (result.success) {
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    }
    return result;
  };

  const logout = async () => {
    const success = await signOut();
    if (success) {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    }
    return success;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const success = await updateUserProfile(updates);
    if (success) {
      // Update the local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
    return success;
  };

  const addStock = async (symbol: string, quantity: number, price: number) => {
    setLoadingStocks(true);
    const success = await updatePortfolioHolding(symbol, quantity, price);
    if (success) {
      toast({
        title: "Stock added",
        description: `${symbol} has been added to your portfolio`,
      });
      
      // Refresh only the affected data
      const holdingsData = await getPortfolioHoldings();
      setStocks(holdingsData);
      
      // Update summary
      const summaryData: PortfolioSummary = {
        totalValue: holdingsData.reduce((sum, holding) => sum + holding.value, 0),
        totalCost: holdingsData.reduce((sum, holding) => sum + (holding.averageCost * holding.quantity), 0),
        totalProfit: holdingsData.reduce((sum, holding) => sum + holding.profit, 0),
        totalProfitPercent: holdingsData.reduce((sum, holding) => sum + holding.profitPercent, 0) / holdingsData.length,
        stockCount: holdingsData.length,
        dailyChange: holdingsData.reduce((sum, holding) => sum + (holding.change * holding.quantity), 0),
        dailyChangePercent: holdingsData.reduce((sum, holding) => sum + holding.changePercent, 0) / holdingsData.length
      };
      setPortfolioSummary(summaryData);
      
      // Update sector data
      const sectorsData = generateSectorData(adaptHoldingsToStockData(holdingsData));
      setSectorData(sectorsData);
      
      setLastUpdated(new Date());
    } else {
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio",
        variant: "destructive"
      });
    }
    setLoadingStocks(false);
    return success;
  };

  const removeStock = async (holdingId: string, quantity: number, sellPrice: number) => {
    setLoadingStocks(true);
    const success = await removePortfolioHolding(holdingId, quantity, sellPrice);
    if (success) {
      toast({
        title: "Stock sold",
        description: "The stock has been sold from your portfolio",
      });
      
      // Refresh only the affected data
      const holdingsData = await getPortfolioHoldings();
      setStocks(holdingsData);
      
      // Update summary
      const summaryData: PortfolioSummary = {
        totalValue: holdingsData.reduce((sum, holding) => sum + holding.value, 0),
        totalCost: holdingsData.reduce((sum, holding) => sum + (holding.averageCost * holding.quantity), 0),
        totalProfit: holdingsData.reduce((sum, holding) => sum + holding.profit, 0),
        totalProfitPercent: holdingsData.length > 0 ? holdingsData.reduce((sum, holding) => sum + holding.profitPercent, 0) / holdingsData.length : 0,
        stockCount: holdingsData.length,
        dailyChange: holdingsData.reduce((sum, holding) => sum + (holding.change * holding.quantity), 0),
        dailyChangePercent: holdingsData.length > 0 ? holdingsData.reduce((sum, holding) => sum + holding.changePercent, 0) / holdingsData.length : 0
      };
      setPortfolioSummary(summaryData);
      
      // Update sector data
      const sectorsData = generateSectorData(adaptHoldingsToStockData(holdingsData));
      setSectorData(sectorsData);
      
      setLastUpdated(new Date());
    } else {
      toast({
        title: "Error",
        description: "Failed to sell stock from portfolio",
        variant: "destructive"
      });
    }
    setLoadingStocks(false);
    return success;
  };

  const addToWatchlistHandler = async (symbol: string, category?: string) => {
    setLoadingWatchlist(true);
    const success = await addToWatchlist(symbol, category);
    if (success) {
      toast({
        title: "Stock added to watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
      
      // Refresh only watchlist data
      const watchlistData = await getWatchlistItems();
      setWatchlist(watchlistData);
      
      setLastUpdated(new Date());
    } else {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist",
        variant: "destructive"
      });
    }
    setLoadingWatchlist(false);
    return success;
  };

  const removeFromWatchlistHandler = async (watchlistItemId: string) => {
    setLoadingWatchlist(true);
    const success = await removeFromWatchlist(watchlistItemId);
    if (success) {
      toast({
        title: "Stock removed from watchlist",
        description: "The stock has been removed from your watchlist",
      });
      
      // Refresh only watchlist data
      const watchlistData = await getWatchlistItems();
      setWatchlist(watchlistData);
      
      setLastUpdated(new Date());
    } else {
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive"
      });
    }
    setLoadingWatchlist(false);
    return success;
  };

  const searchStocksHandler = async (query: string) => {
    return await searchStocks(query);
  };

  const getHistoricalDataHandler = async (
    symbol: string, 
    resolution: string = 'D', 
    from: number = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), 
    to: number = Math.floor(Date.now() / 1000)
  ) => {
    return await getHistoricalData(symbol, resolution, from, to);
  };

  // Helper function to adapt PortfolioHolding to StockData
  const adaptHoldingsToStockData = (holdings: PortfolioHolding[]): StockData[] => {
    return holdings.map(holding => ({
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      price: holding.price,
      change: holding.change,
      changePercent: holding.changePercent,
      volume: 0, // Default value as this is not in PortfolioHolding
      marketCap: 0, // Default value as this is not in PortfolioHolding
      sector: holding.sector || 'Unknown',
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      value: holding.value,
      profit: holding.profit,
      profitPercent: holding.profitPercent,
      color: holding.color || '#000000'
    }));
  };

  // Set default values for context
  const defaultPortfolioSummary: PortfolioSummary = {
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
    stockCount: 0,
    dailyChange: 0,
    dailyChangePercent: 0
  };

  return (
    <FinanceContext.Provider value={{
      user,
      profile,
      isAuthenticated: !!user,
      loading,
      loadingStocks,
      loadingWatchlist,
      loadingSummary,
      stocks,
      portfolioSummary: portfolioSummary || defaultPortfolioSummary,
      watchlist,
      performanceData: performanceData || generatePerformanceData(),
      sectorData,
      transactions,
      refreshData,
      login,
      register,
      logout,
      updateProfile,
      addStock,
      removeStock,
      addToWatchlist: addToWatchlistHandler,
      removeFromWatchlist: removeFromWatchlistHandler,
      searchStocks: searchStocksHandler,
      getHistoricalData: getHistoricalDataHandler
    }}>
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
