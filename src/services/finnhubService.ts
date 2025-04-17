import axios from 'axios';

const FINNHUB_API_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

// Cache and rate limiting configuration
const CACHE_DURATION = 60 * 1000; // 1 minute cache
const REQUEST_INTERVAL = 500; // 500ms between requests (max 120 requests per minute)
const BATCH_SIZE = 3; // Process 3 symbols at a time

// Cache for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: {
  quotes: Record<string, CacheItem<StockQuote>>;
  profiles: Record<string, CacheItem<StockProfile>>;
  historical: Record<string, CacheItem<HistoricalData>>;
  search: Record<string, CacheItem<StockSearchResult[]>>;
} = {
  quotes: {},
  profiles: {},
  historical: {},
  search: {}
};

// Queue for API requests
let requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

// Process the request queue with rate limiting
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
    }
  }
  
  isProcessingQueue = false;
};

// Add a request to the queue
const enqueueRequest = <T>(request: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    // Start processing the queue if it's not already being processed
    if (!isProcessingQueue) {
      processQueue();
    }
  });
};

// Check if cached data is still valid
const isCacheValid = <T>(cacheItem?: CacheItem<T>): boolean => {
  if (!cacheItem) return false;
  return Date.now() - cacheItem.timestamp < CACHE_DURATION;
};

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
  timeout: 10000 // 10 second timeout
});

// Get current price quote for a stock
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    // Check cache first
    const cachedQuote = cache.quotes[symbol];
    if (isCacheValid(cachedQuote)) {
      return cachedQuote.data;
    }
    
    // Check if we're in development mode and should use mock data
    if (import.meta.env.DEV && (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'your_api_key_here')) {
      console.log(`Using mock data for ${symbol} in development mode`);
      const mockData = generateMockQuote(symbol);
      
      // Cache the mock data
      cache.quotes[symbol] = {
        data: mockData,
        timestamp: Date.now()
      };
      
      return mockData;
    }
    
    // Make the API request with rate limiting
    const data = await enqueueRequest(async () => {
      const response = await finnhubClient.get<StockQuote>('/quote', {
        params: { symbol }
      });
      return response.data;
    });
    
    if (!data || typeof data.c !== 'number') {
      console.error('Invalid quote data received:', data);
      const mockData = generateMockQuote(symbol);
      
      // Cache the mock data
      cache.quotes[symbol] = {
        data: mockData,
        timestamp: Date.now()
      };
      
      return mockData;
    }
    
    // Cache the response
    cache.quotes[symbol] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    const mockData = generateMockQuote(symbol);
    
    // Cache the mock data
    cache.quotes[symbol] = {
      data: mockData,
      timestamp: Date.now()
    };
    
    return mockData;
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
    // Check cache first
    const cachedProfile = cache.profiles[symbol];
    if (isCacheValid(cachedProfile)) {
      return cachedProfile.data;
    }
    
    // Make the API request with rate limiting
    const data = await enqueueRequest(async () => {
      const response = await finnhubClient.get<StockProfile>('/stock/profile2', {
        params: { symbol }
      });
      return response.data;
    });
    
    if (!data || !data.name) {
      console.error('Invalid profile data received:', data);
      return null;
    }
    
    // Cache the response
    cache.profiles[symbol] = {
      data,
      timestamp: Date.now()
    };
    
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
    // Create a cache key that includes the parameters
    const cacheKey = `${symbol}-${resolution}-${from}-${to}`;
    
    // Check cache first
    const cachedData = cache.historical[cacheKey];
    if (isCacheValid(cachedData)) {
      return cachedData.data;
    }
    
    // Make the API request with rate limiting
    const data = await enqueueRequest(async () => {
      const response = await finnhubClient.get<HistoricalData>('/stock/candle', {
        params: { symbol, resolution, from, to }
      });
      return response.data;
    });
    
    if (!data || data.s === 'no_data') {
      console.error('No historical data available for', symbol);
      const mockData = generateMockHistoricalData(30);
      
      // Cache the mock data
      cache.historical[cacheKey] = {
        data: mockData,
        timestamp: Date.now()
      };
      
      return mockData;
    }
    
    // Cache the response
    cache.historical[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    const mockData = generateMockHistoricalData(30);
    
    // Cache the mock data
    const cacheKey = `${symbol}-${resolution}-${from}-${to}`;
    cache.historical[cacheKey] = {
      data: mockData,
      timestamp: Date.now()
    };
    
    return mockData;
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
    
    // Check cache first
    const cachedResults = cache.search[query];
    if (isCacheValid(cachedResults)) {
      return cachedResults.data;
    }
    
    // Make the API request with rate limiting
    const data = await enqueueRequest(async () => {
      const response = await finnhubClient.get<{ result: StockSearchResult[] }>('/search', {
        params: { q: query }
      });
      return response.data;
    });
    
    if (!data || !data.result || !Array.isArray(data.result)) {
      console.error('Invalid search results received:', data);
      return [];
    }
    
    // Filter out non-stock results and limit to 10 results
    const results = data.result
      .filter(item => item.type === 'Common Stock')
      .slice(0, 10);
    
    // Cache the results
    cache.search[query] = {
      data: results,
      timestamp: Date.now()
    };
    
    return results;
  } catch (error) {
    console.error(`Error searching for stocks with query "${query}":`, error);
    const mockResults = generateMockSearchResults(query);
    
    // Cache the mock results
    cache.search[query] = {
      data: mockResults,
      timestamp: Date.now()
    };
    
    return mockResults;
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
  
  // Check cache first for all symbols
  const uncachedSymbols = symbols.filter(symbol => !isCacheValid(cache.quotes[symbol]));
  
  // Add cached results to the output
  symbols.forEach(symbol => {
    const cachedQuote = cache.quotes[symbol];
    if (isCacheValid(cachedQuote)) {
      results[symbol] = {
        c: cachedQuote.data.c,
        d: cachedQuote.data.d,
        dp: cachedQuote.data.dp
      };
    }
  });
  
  // Process uncached symbols in smaller batches
  const batches = Math.ceil(uncachedSymbols.length / BATCH_SIZE);
  
  for (let i = 0; i < batches; i++) {
    const batchSymbols = uncachedSymbols.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const batchPromises = batchSymbols.map(symbol => getStockQuote(symbol));
    
    // Wait for all quotes in this batch
    const quotes = await Promise.all(batchPromises);
    
    // Add results to the output
    batchSymbols.forEach((symbol, index) => {
      const quote = quotes[index];
      if (quote) {
        results[symbol] = {
          c: quote.c,
          d: quote.d,
          dp: quote.dp
        };
      }
    });
  }
  
  return results;
};
