import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  StockSearchResult,
  HistoricalData
} from '@/services/finnhubService';

// Types
import { 
  PerformanceData,
  SectorData,
  generateSectorData,
  generatePerformanceData
} from '@/data/mockData';

interface FinanceContextType {
  // Authentication state
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  
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

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [stocks, setStocks] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Listen for auth changes
  useEffect(() => {
    // Set up auth state listener
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

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      // If user is not authenticated, clear data and show sign in state
      setLoading(false);
    }
  }, [profile]);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Load portfolio holdings
      const holdingsData = await getPortfolioHoldings();
      setStocks(holdingsData);
      
      // Load portfolio summary
      const summaryData = await getPortfolioSummary();
      setPortfolioSummary(summaryData);
      
      // Load watchlist items
      const watchlistData = await getWatchlistItems();
      setWatchlist(watchlistData);
      
      // Load transactions
      const transactionsData = await getTransactions();
      setTransactions(transactionsData);
      
      // Generate sector data based on holdings
      const sectorsData = generateSectorData(holdingsData);
      setSectorData(sectorsData);
      
      // For now, use mock performance data, to be replaced later with real API data
      const performanceMetrics = generatePerformanceData();
      setPerformanceData(performanceMetrics);
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
  };

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
    const success = await updatePortfolioHolding(symbol, quantity, price);
    if (success) {
      toast({
        title: "Stock added",
        description: `${symbol} has been added to your portfolio`,
      });
      
      // Refresh data to get updated stocks
      refreshData();
    } else {
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio",
        variant: "destructive"
      });
    }
    return success;
  };

  const removeStock = async (holdingId: string, quantity: number, sellPrice: number) => {
    const success = await removePortfolioHolding(holdingId, quantity, sellPrice);
    if (success) {
      toast({
        title: "Stock sold",
        description: "The stock has been sold from your portfolio",
      });
      
      // Refresh data to get updated stocks
      refreshData();
    } else {
      toast({
        title: "Error",
        description: "Failed to sell stock from portfolio",
        variant: "destructive"
      });
    }
    return success;
  };

  const addToWatchlistHandler = async (symbol: string, category?: string) => {
    const success = await addToWatchlist(symbol, category);
    if (success) {
      toast({
        title: "Stock added to watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
      
      // Refresh data to get updated watchlist
      refreshData();
    } else {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist",
        variant: "destructive"
      });
    }
    return success;
  };

  const removeFromWatchlistHandler = async (watchlistItemId: string) => {
    const success = await removeFromWatchlist(watchlistItemId);
    if (success) {
      toast({
        title: "Stock removed from watchlist",
        description: "The stock has been removed from your watchlist",
      });
      
      // Refresh data to get updated watchlist
      refreshData();
    } else {
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive"
      });
    }
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

  // Set default values for context
  const defaultPortfolioSummary: PortfolioSummary = {
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
    stockCount: 0
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        loading,
        stocks,
        watchlist,
        performanceData: performanceData || generatePerformanceData(),
        sectorData,
        portfolioSummary: portfolioSummary || defaultPortfolioSummary,
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
