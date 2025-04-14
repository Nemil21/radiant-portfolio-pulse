import axios from 'axios';

const FINNHUB_API_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface StockCandle {
  c: number[];  // List of close prices
  h: number[];  // List of high prices
  l: number[];  // List of low prices
  o: number[];  // List of open prices
  s: string;    // Status of the response
  t: number[];  // List of timestamps
  v: number[];  // List of volume data
}

export interface StockSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

class FinnhubService {
  private readonly apiKey: string;
  private readonly client;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: FINNHUB_API_URL,
      params: {
        token: this.apiKey
      }
    });
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const { data } = await this.client.get(`/quote`, {
      params: { symbol }
    });
    return data;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const { data } = await this.client.get(`/stock/profile2`, {
      params: { symbol }
    });
    return data;
  }

  async getStockCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<StockCandle> {
    const { data } = await this.client.get(`/stock/candle`, {
      params: { symbol, resolution, from, to }
    });
    return data;
  }

  async searchSymbols(query: string): Promise<StockSymbol[]> {
    const { data } = await this.client.get(`/search`, {
      params: { q: query }
    });
    return data.result;
  }

  async getBasicFinancials(symbol: string): Promise<any> {
    const { data } = await this.client.get(`/stock/metric`, {
      params: { symbol, metric: 'all' }
    });
    return data;
  }
}

// Create and export a singleton instance
const finnhubService = new FinnhubService(import.meta.env.VITE_FINNHUB_API_KEY);
export default finnhubService; 