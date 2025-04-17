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
  getUserTransactions,
  getTransactionStats,
  getPortfolioHistory,
  calculatePerformanceMetrics,
  calculateProfitLoss as getProfitLossData, // Rename the imported function
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
  loadingTransactions: boolean;
  
  // Portfolio data
  stocks: PortfolioHolding[];
  portfolioSummary: PortfolioSummary;
  
  // Watchlist data
  watchlist: WatchlistItem[];
  
  // Performance data
  performanceData: PerformanceData;
  performanceMetrics: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  // Sector data
  sectorData: SectorData[];
  
  // Transactions
  transactions: Transaction[];
  transactionStats: {
    totalBuys: number;
    totalSells: number;
    totalBuyAmount: number;
    totalSellAmount: number;
    buyPercentage: number;
    sellPercentage: number;
    monthlySummary: Array<{
      month: string;
      buyAmount: number;
      sellAmount: number;
      transactionCount: number;
    }>;
  };
  
  // Profit/Loss data
  profitLossData: {
    totalProfit: number;
    totalLoss: number;
    netProfitLoss: number;
    profitLossPercentage: number;
    sectorProfitLoss: Array<{
      sector: string;
      profit: number;
      loss: number;
      netProfitLoss: number;
      profitLossPercentage: number;
      transactionCount: number;
    }>;
  };
  
  // Timestamps
  lastUpdated: Date;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
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

const FinanceContext = createContext<FinanceContextType>({
  user: null,
  profile: null,
  isAuthenticated: false,
  loading: false,
  loadingStocks: false,
  loadingWatchlist: false,
  loadingSummary: false,
  loadingTransactions: false,
  stocks: [],
  portfolioSummary: {
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
    stockCount: 0,
    dailyChange: 0,
    dailyChangePercent: 0
  },
  watchlist: [],
  performanceData: generatePerformanceData(),
  performanceMetrics: {
    daily: 0,
    weekly: 0,
    monthly: 0
  },
  sectorData: [],
  transactions: [],
  transactionStats: {
    totalBuys: 0,
    totalSells: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    buyPercentage: 0,
    sellPercentage: 0,
    monthlySummary: []
  },
  profitLossData: {
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    profitLossPercentage: 0,
    sectorProfitLoss: []
  },
  lastUpdated: new Date(),
  refreshData: async () => {},
  refreshTransactions: async () => {},
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => false,
  updateProfile: async () => false,
  addStock: async () => false,
  removeStock: async () => false,
  addToWatchlist: async () => false,
  removeFromWatchlist: async () => false,
  searchStocks: async () => [],
  getHistoricalData: async () => null
});

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
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  
  const [stocks, setStocks] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    totalBuys: 0,
    totalSells: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    buyPercentage: 0,
    sellPercentage: 0,
    monthlySummary: []
  });
  const [profitLossData, setProfitLossData] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    profitLossPercentage: 0,
    sectorProfitLoss: []
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

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

    // Transactions subscription
    const transactionsSubscription = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data: transaction } = await supabase
            .from('transactions')
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

          if (transaction) {
            // Transform the database response to match the Transaction interface
            const transformedTransaction: Transaction = {
              id: transaction.id,
              stockId: transaction.stock_id,
              stockSymbol: transaction.stocks.symbol,
              stockName: transaction.stocks.name,
              transactionType: transaction.transaction_type as 'buy' | 'sell',
              price: transaction.price,
              quantity: transaction.quantity,
              transactionDate: transaction.transaction_date,
              notes: transaction.notes
            };
            
            setTransactions(prev => {
              const index = prev.findIndex(t => t.id === transformedTransaction.id);
              if (index === -1) return [...prev, transformedTransaction];
              const newTransactions = [...prev];
              newTransactions[index] = transformedTransaction;
              return newTransactions;
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      portfolioSubscription.unsubscribe();
      watchlistSubscription.unsubscribe();
      transactionsSubscription.unsubscribe();
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
      
      // Generate sector data from holdings
      const sectorsData = generateSectorData(holdingsData.map(h => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        price: h.price,
        change: h.change,
        changePercent: h.changePercent,
        volume: 0,
        marketCap: 0,
        sector: h.sector || 'Unknown',
        quantity: h.quantity,
        averageCost: h.averageCost,
        value: h.value,
        profit: h.profit,
        profitPercent: h.profitPercent,
        color: '',
      })));
      setSectorData(sectorsData);
      
      // Fetch real portfolio history data
      const historyData = await getPortfolioHistory();
      if (historyData) {
        // Calculate performance metrics from the most recent data points
        const dailyData = historyData.daily;
        const weeklyData = historyData.weekly;
        const monthlyData = historyData.monthly;
        
        // Calculate metrics based on the first and last data points
        const calculateMetric = (data: HistoricalData[]): number => {
          if (data.length < 2) return 0;
          const oldest = data[0].value;
          const newest = data[data.length - 1].value;
          return newest - oldest;
        };
        
        const dailyChange = calculateMetric(dailyData);
        const weeklyChange = calculateMetric(weeklyData);
        const monthlyChange = calculateMetric(monthlyData);
        
        // Only use the calculated value if it's non-zero
        // Otherwise, keep the value calculated from the actual data
        
        // Create data objects for the performance metrics display
        const dailyMetricData = [{ date: 'Today', value: dailyChange }];
        const weeklyMetricData = [{ date: 'This Week', value: weeklyChange }];
        const monthlyMetricData = [{ date: 'This Month', value: monthlyChange }];
        
        // Set the performance data
        setPerformanceData({
          daily: dailyData,
          weekly: weeklyData,
          monthly: monthlyData,
          dailyMetric: dailyMetricData,
          weeklyMetric: weeklyMetricData,
          monthlyMetric: monthlyMetricData
        });
        
        // Set performance metrics
        setPerformanceMetrics({
          daily: dailyChange,
          weekly: weeklyChange,
          monthly: monthlyChange
        });
        
        // Update portfolio summary with the correct change values
        if (summaryData) {
          const updatedSummary = {
            ...summaryData,
            dailyChange: dailyChange,
            dailyChangePercent: dailyData.length > 1 ? 
              (dailyChange / dailyData[0].value) * 100 : 0
          };
          setPortfolioSummary(updatedSummary);
        }
      }
      
      // Only refresh watchlist if it's been more than 5 minutes
      if (force || !lastUpdated || (now.getTime() - lastUpdated.getTime() > CACHE_DURATION)) {
        setLoadingWatchlist(true);
        const watchlistData = await getWatchlistItems();
        setWatchlist(watchlistData);
        setLoadingWatchlist(false);
      }
      
      // Fetch transaction data
      setLoadingTransactions(true);
      const transactionsData = await getUserTransactions();
      setTransactions(transactionsData);
      
      const stats = await getTransactionStats();
      setTransactionStats(stats);
      setLoadingTransactions(false);
      
      // Calculate profit/loss data
      const profitLossData = await calculateProfitLoss();
      setProfitLossData(profitLossData);
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

  const refreshTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      
      // Get transactions
      const transactions = await getUserTransactions();
      setTransactions(transactions);
      
      // Calculate transaction stats
      const stats = await getTransactionStats();
      setTransactionStats(stats);
      
      // Update profit/loss data
      const profitLossData = await calculateProfitLoss();
      setProfitLossData(profitLossData);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

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

  // Calculate profit/loss data
  const calculateProfitLoss = async () => {
    try {
      // Use the implementation from portfolioService
      const profitLossData = await getProfitLossData();
      return profitLossData;
    } catch (error) {
      console.error('Error calculating profit/loss data:', error);
      return {
        totalProfit: 0,
        totalLoss: 0,
        netProfitLoss: 0,
        profitLossPercentage: 0,
        sectorProfitLoss: []
      };
    }
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
      loadingTransactions,
      stocks,
      portfolioSummary: portfolioSummary || defaultPortfolioSummary,
      watchlist,
      performanceData: performanceData || generatePerformanceData(),
      performanceMetrics,
      sectorData,
      transactions,
      transactionStats,
      profitLossData,
      lastUpdated,
      refreshData,
      refreshTransactions,
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
