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

export interface Quote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
}

// Mock data for fallback when API fails
const mockQuotes: Record<string, StockQuote> = {
  // Default mock quote for any symbol
  default: {
    c: 150.25,  // Current price
    d: 2.75,    // Change
    dp: 1.86,   // Percent change
    h: 152.0,   // High price of the day
    l: 148.5,   // Low price of the day
    o: 149.0,   // Open price of the day
    pc: 147.5,  // Previous close price
    t: Math.floor(Date.now() / 1000)  // Current timestamp
  }
};

// Create axios instance with default config
const finnhubClient = axios.create({
  baseURL: FINNHUB_API_URL,
  params: {
    token: FINNHUB_API_KEY
  },
  timeout: 5000 // 5 second timeout
});

// Get current price quote for a stock
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    // Check if we're in development mode and should use mock data
    if (import.meta.env.DEV && (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'your_api_key_here')) {
      console.log(`Using mock data for ${symbol} in development mode`);
      return generateMockQuote(symbol);
    }
    
    const { data } = await finnhubClient.get<StockQuote>('/quote', {
      params: { symbol }
    });
    
    if (!data || typeof data.c !== 'number') {
      console.error('Invalid quote data received:', data);
      return generateMockQuote(symbol);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return generateMockQuote(symbol);
  }
};

// Generate a mock quote with some randomness based on the symbol
const generateMockQuote = (symbol: string): StockQuote => {
  // Use symbol string to generate a deterministic but varying price
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 50 + (hash % 200); // Price between 50 and 250
  const priceChange = (Math.random() * 10) - 5; // Change between -5 and +5
  const percentChange = (priceChange / basePrice) * 100;
  
  return {
    c: basePrice,
    d: priceChange,
    dp: percentChange,
    h: basePrice + Math.abs(priceChange) + 2,
    l: basePrice - Math.abs(priceChange) - 2,
    o: basePrice - (priceChange / 2),
    pc: basePrice - priceChange,
    t: Math.floor(Date.now() / 1000)
  };
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
    console.error(`Error fetching profile for ${symbol}:`, error);
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
    
    if (!data || data.s !== 'ok' || !data.c || data.c.length === 0) {
      console.error('Invalid historical data received:', data);
      return generateMockHistoricalData(30);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return generateMockHistoricalData(30);
  }
};

// Generate mock historical data
const generateMockHistoricalData = (days: number): HistoricalData => {
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 24 * 60 * 60;
  
  const timestamps = Array.from({ length: days }, (_, i) => now - ((days - i) * dayInSeconds));
  const basePrice = 150;
  let currentPrice = basePrice;
  
  const closePrices: number[] = [];
  const highPrices: number[] = [];
  const lowPrices: number[] = [];
  const openPrices: number[] = [];
  const volumes: number[] = [];
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() * 10) - 5;
    currentPrice += change;
    currentPrice = Math.max(currentPrice, 50); // Ensure price doesn't go too low
    
    openPrices.push(currentPrice - (change / 2));
    closePrices.push(currentPrice);
    highPrices.push(currentPrice + Math.random() * 5);
    lowPrices.push(currentPrice - Math.random() * 5);
    volumes.push(Math.floor(Math.random() * 10000000) + 1000000);
  }
  
  return {
    c: closePrices,
    h: highPrices,
    l: lowPrices,
    o: openPrices,
    s: 'ok',
    t: timestamps,
    v: volumes
  };
};

// Search for stocks by query
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  try {
    if (!query || query.trim().length < 1) {
      return [];
    }
    
    const { data } = await finnhubClient.get<{ result: StockSearchResult[] }>('/search', {
      params: { q: query }
    });
    
    if (!data || !data.result || !Array.isArray(data.result)) {
      console.error('Invalid search results received:', data);
      return [];
    }
    
    // Filter out non-stock results and limit to 10 results
    return data.result
      .filter(item => item.type === 'Common Stock')
      .slice(0, 10);
  } catch (error) {
    console.error(`Error searching for stocks with query "${query}":`, error);
    return generateMockSearchResults(query);
  }
};

// Generate mock search results
const generateMockSearchResults = (query: string): StockSearchResult[] => {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' }
  ];
  
  return mockStocks
    .filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
      stock.name.toLowerCase().includes(query.toLowerCase())
    )
    .map(stock => ({
      description: stock.name,
      displaySymbol: stock.symbol,
      symbol: stock.symbol,
      type: 'Common Stock'
    }));
};

// Get real-time search suggestions
export const getSearchSuggestions = async (query: string): Promise<StockSearchResult[]> => {
  // Reuse the search function for suggestions
  return searchStocks(query);
};

// Get quotes for multiple symbols at once
export const getBatchQuotes = async (symbols: string[]): Promise<Record<string, Quote>> => {
  if (!symbols || symbols.length === 0) {
    return {};
  }
  
  const results: Record<string, Quote> = {};
  
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const batches = Math.ceil(symbols.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const batchSymbols = symbols.slice(i * batchSize, (i + 1) * batchSize);
    const batchPromises = batchSymbols.map(async symbol => {
      try {
        const quote = await getStockQuote(symbol);
        if (quote) {
          results[symbol] = {
            c: quote.c,
            d: quote.d,
            dp: quote.dp
          };
        }
      } catch (error) {
        console.error(`Error fetching quote for ${symbol} in batch:`, error);
        // Use mock data as fallback
        const mockQuote = generateMockQuote(symbol);
        results[symbol] = {
          c: mockQuote.c,
          d: mockQuote.d,
          dp: mockQuote.dp
        };
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
};
