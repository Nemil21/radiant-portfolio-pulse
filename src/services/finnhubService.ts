
import { supabase } from "@/integrations/supabase/client";

// Types for Finnhub API responses
export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface StockProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  industry: string;
  sector: string;
}

export interface StockSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface HistoricalData {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

// Get current price quote for a stock
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    const { data, error } = await supabase.rpc('get_stock_price', { stock_symbol: symbol });
    
    if (error) {
      console.error('Error fetching stock quote:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getStockQuote:', error);
    return null;
  }
};

// Get company profile information
export const getStockProfile = async (symbol: string): Promise<StockProfile | null> => {
  try {
    const { data, error } = await supabase.rpc('get_stock_details', { stock_symbol: symbol });
    
    if (error) {
      console.error('Error fetching stock profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getStockProfile:', error);
    return null;
  }
};

// Get historical price data
export const getHistoricalData = async (
  symbol: string, 
  resolution: string = 'D', 
  from: number = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), 
  to: number = Math.floor(Date.now() / 1000)
): Promise<HistoricalData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_historical_data', { 
      stock_symbol: symbol,
      resolution,
      from_timestamp: from,
      to_timestamp: to
    });
    
    if (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getHistoricalData:', error);
    return null;
  }
};

// Search for stocks by query
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  try {
    // Since we're storing common stocks in our Supabase database, we'll search there first
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10);
    
    if (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
    
    return data.map(stock => ({
      symbol: stock.symbol,
      displaySymbol: stock.symbol,
      description: stock.name,
      type: 'Common Stock'
    }));
  } catch (error) {
    console.error('Error in searchStocks:', error);
    return [];
  }
};
