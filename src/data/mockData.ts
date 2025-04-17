import { faker } from '@faker-js/faker';

// Types for our financial data
export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  quantity: number;
  averageCost: number;
  value: number;
  profit: number;
  profitPercent: number;
  color: string;
}

export interface HistoricalData {
  date: string;
  value: number;
}

export interface PerformanceData {
  daily: HistoricalData[];
  weekly: HistoricalData[];
  monthly: HistoricalData[];
  // Metrics for display
  dailyMetric?: HistoricalData[];
  weeklyMetric?: HistoricalData[];
  monthlyMetric?: HistoricalData[];
}

export interface SectorData {
  name: string;
  value: number;
  color: string;
}

// Extended color palette for sectors
const sectorColors = [
  '#2dd4bf', // teal
  '#a78bfa', // purple
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#f472b6', // pink
  '#34d399', // green
  '#fb923c', // orange
  '#818cf8', // indigo
  '#f87171', // red
  '#4ade80', // lime
  '#e879f9', // fuchsia
  '#38bdf8', // sky
  '#facc15', // yellow
  '#fb7185', // rose
  '#a3e635', // lime
];

// Map to store sector-color assignments
let sectorColorMap = new Map<string, string>();

// Function to get or assign a color for a sector
export const getSectorColor = (sectorName: string): string => {
  // If sector already has a color, return it
  if (sectorColorMap.has(sectorName)) {
    return sectorColorMap.get(sectorName)!;
  }

  // Find the first unused color
  const usedColors = new Set(sectorColorMap.values());
  const availableColor = sectorColors.find(color => !usedColors.has(color));

  // If all colors are used, start reusing from the beginning
  const color = availableColor || sectorColors[Math.floor(Math.random() * sectorColors.length)];
  
  // Assign the color to the sector
  sectorColorMap.set(sectorName, color);
  return color;
};

// Generate portfolio stocks
export const generateStocks = (count: number = 8): StockData[] => {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'JNJ', 'V', 'PG', 'DIS', 'NFLX', 'ADBE'];
  const names = ['Apple Inc.', 'Microsoft Corp.', 'Alphabet Inc.', 'Amazon.com Inc.', 'Meta Platforms Inc.', 'Tesla Inc.', 'NVIDIA Corp.', 'JPMorgan Chase & Co.', 'Johnson & Johnson', 'Visa Inc.', 'Procter & Gamble Co.', 'The Walt Disney Co.', 'Netflix Inc.', 'Adobe Inc.'];
  
  return Array.from({ length: Math.min(count, symbols.length) }).map((_, i) => {
    const price = faker.number.float({ min: 50, max: 500, fractionDigits: 2 });
    const change = faker.number.float({ min: -20, max: 20, fractionDigits: 2 });
    const changePercent = (change / price) * 100;
    const quantity = faker.number.int({ min: 5, max: 100 });
    const averageCost = price - (change > 0 ? faker.number.float({ min: 0, max: change, fractionDigits: 2 }) : faker.number.float({ min: change, max: 0, fractionDigits: 2 }));
    const value = price * quantity;
    const profit = (price - averageCost) * quantity;
    const profitPercent = ((price - averageCost) / averageCost) * 100;
    
    return {
      id: faker.string.uuid(),
      symbol: symbols[i],
      name: names[i],
      price,
      change,
      changePercent,
      volume: faker.number.int({ min: 1000000, max: 10000000 }),
      marketCap: faker.number.int({ min: 10000000000, max: 3000000000000 }),
      sector: sectors[i % sectors.length].name,
      quantity,
      averageCost,
      value,
      profit,
      profitPercent,
      color: stockColors[i % stockColors.length],
    };
  });
};

// Generate historical performance data
export const generatePerformanceData = (): PerformanceData => {
  // Helper to generate time series data
  const generateTimeSeries = (days: number, volatility: number): HistoricalData[] => {
    let value = faker.number.float({ min: 100000, max: 500000 });
    const startDate = new Date();
    
    return Array.from({ length: days }).map((_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() - (days - i - 1));
      
      // Add some randomness but with a trend
      const change = (faker.number.float({ min: -volatility, max: volatility }) / 100) * value;
      value += change;
      
      // Ensure value doesn't go below a reasonable amount
      value = Math.max(value, 50000);
      
      return {
        date: date.toISOString().split('T')[0],
        value: parseFloat(value.toFixed(2)),
      };
    });
  };
  
  return {
    daily: generateTimeSeries(24, 2),  // 24 hours with low volatility
    weekly: generateTimeSeries(7, 3),   // 7 days with medium volatility
    monthly: generateTimeSeries(30, 5), // 30 days with higher volatility
    yearly: generateTimeSeries(12, 8),  // 12 months with highest volatility (this would normally be 365 days, but simplified for visualization)
  };
};

// Generate sector breakdown data
export const generateSectorData = (stocks: StockData[]): SectorData[] => {
  const sectorMap = new Map<string, number>();
  
  // Sum up the value by sector
  stocks.forEach(stock => {
    const currentValue = sectorMap.get(stock.sector) || 0;
    sectorMap.set(stock.sector, currentValue + stock.value);
  });
  
  // Convert to array and assign colors
  return Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: getSectorColor(name),
  }));
};

// Portfolio summary data
export const generatePortfolioSummary = (stocks: StockData[]) => {
  const totalValue = stocks.reduce((acc, stock) => acc + stock.value, 0);
  const totalProfit = stocks.reduce((acc, stock) => acc + stock.profit, 0);
  const totalProfitPercent = (totalProfit / (totalValue - totalProfit)) * 100;
  
  return {
    totalValue,
    totalProfit,
    totalProfitPercent,
    stockCount: stocks.length,
  };
};

// Watchlist stocks (different from portfolio)
export const generateWatchlist = (count: number = 5): StockData[] => {
  const symbols = ['KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'INTC', 'AMD', 'CRM', 'PYPL', 'COST'];
  const names = ['Coca-Cola Co.', 'PepsiCo Inc.', 'McDonald\'s Corp.', 'Starbucks Corp.', 'Nike Inc.', 'Intel Corp.', 'Advanced Micro Devices Inc.', 'Salesforce Inc.', 'PayPal Holdings Inc.', 'Costco Wholesale Corp.'];
  
  return Array.from({ length: Math.min(count, symbols.length) }).map((_, i) => {
    const price = faker.number.float({ min: 50, max: 500, fractionDigits: 2 });
    const change = faker.number.float({ min: -20, max: 20, fractionDigits: 2 });
    const changePercent = (change / price) * 100;
    
    return {
      id: faker.string.uuid(),
      symbol: symbols[i],
      name: names[i],
      price,
      change,
      changePercent,
      volume: faker.number.int({ min: 1000000, max: 10000000 }),
      marketCap: faker.number.int({ min: 10000000000, max: 3000000000000 }),
      sector: sectors[(i + count) % sectors.length].name,
      quantity: 0,
      averageCost: 0,
      value: 0,
      profit: 0,
      profitPercent: 0,
      color: stockColors[(i + count) % stockColors.length],
    };
  });
};

// Generate stock price movements for a specific stock (for charts)
export const generateStockPriceData = (days: number = 30): HistoricalData[] => {
  let price = faker.number.float({ min: 100, max: 300 });
  const startDate = new Date();
  
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - (days - i - 1));
    
    // Add some randomness but with a trend
    const change = faker.number.float({ min: -5, max: 5 });
    price += change;
    
    // Ensure price doesn't go below a reasonable amount
    price = Math.max(price, 50);
    
    return {
      date: date.toISOString().split('T')[0],
      value: parseFloat(price.toFixed(2)),
    };
  });
};
