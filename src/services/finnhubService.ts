import axios from 'axios';

const FINNHUB_API_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

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

// Create axios instance with default config
const finnhubClient = axios.create({
  baseURL: FINNHUB_API_URL,
  params: {
    token: FINNHUB_API_KEY
  }
});

// Get current price quote for a stock
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    const { data } = await finnhubClient.get<StockQuote>('/quote', {
      params: { symbol }
    });
    
    if (!data || typeof data.c !== 'number') {
      console.error('Invalid quote data received:', data);
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
    const { data } = await finnhubClient.get<StockProfile>('/stock/profile2', {
      params: { symbol }
    });
    
    if (!data || !data.name) {
      console.error('Invalid profile data received:', data);
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
    const { data } = await finnhubClient.get<HistoricalData>('/stock/candle', {
      params: {
        symbol,
        resolution,
        from,
        to
      }
    });
    
    if (!data || data.s !== 'ok') {
      console.error('Invalid historical data received:', data);
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
    const { data } = await finnhubClient.get('/search', {
      params: { q: query }
    });
    
    if (!data || !Array.isArray(data.result)) {
      console.error('Invalid search results received:', data);
      return [];
    }
    
    return data.result
      .filter(item => item.type === 'Common Stock')
      .map(item => ({
        symbol: item.symbol,
        displaySymbol: item.displaySymbol,
        description: item.description,
        type: item.type
      }))
      .slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error in searchStocks:', error);
    return [];
  }
};
