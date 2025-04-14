import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import finnhubService from '../../services/finnhub';
import type { Database } from '../../integrations/supabase/types';

type PortfolioHolding = Database['public']['Tables']['portfolio_holdings']['Row'];
type Stock = Database['public']['Tables']['stocks']['Row'];

interface PortfolioState {
  holdings: (PortfolioHolding & { stock: Stock; currentPrice?: number })[];
  loading: boolean;
  error: string | null;
  totalValue: number;
  totalGainLoss: number;
}

const initialState: PortfolioState = {
  holdings: [],
  loading: false,
  error: null,
  totalValue: 0,
  totalGainLoss: 0,
};

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (userId: string) => {
    const { data: holdings, error } = await supabase
      .from('portfolio_holdings')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Fetch current prices for all holdings
    const holdingsWithPrices = await Promise.all(
      holdings.map(async (holding) => {
        const quote = await finnhubService.getQuote(holding.stock.symbol);
        return {
          ...holding,
          currentPrice: quote.c,
        };
      })
    );

    return holdingsWithPrices;
  }
);

export const addHolding = createAsyncThunk(
  'portfolio/addHolding',
  async ({ userId, symbol, quantity, price }: {
    userId: string;
    symbol: string;
    quantity: number;
    price: number;
  }) => {
    // First check if stock exists in our database
    let { data: existingStock } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (!existingStock) {
      // Fetch stock details from Finnhub
      const profile = await finnhubService.getCompanyProfile(symbol);
      
      // Insert new stock
      const { data: newStock, error: stockError } = await supabase
        .from('stocks')
        .insert({
          symbol,
          name: profile.name,
          sector: profile.finnhubIndustry,
          logo_url: profile.logo,
        })
        .select()
        .single();

      if (stockError) throw stockError;
      existingStock = newStock;
    }

    // Add holding
    const { data: holding, error } = await supabase
      .from('portfolio_holdings')
      .insert({
        user_id: userId,
        stock_id: existingStock.id,
        quantity,
        average_cost: price,
      })
      .select(`
        *,
        stock:stocks(*)
      `)
      .single();

    if (error) throw error;

    // Add transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        stock_id: existingStock.id,
        quantity,
        price,
        transaction_type: 'BUY',
        transaction_date: new Date().toISOString(),
      });

    const quote = await finnhubService.getQuote(symbol);
    return { ...holding, currentPrice: quote.c };
  }
);

export const updateHolding = createAsyncThunk(
  'portfolio/updateHolding',
  async ({ holdingId, quantity, price }: {
    holdingId: string;
    quantity: number;
    price: number;
  }) => {
    const { data: holding, error } = await supabase
      .from('portfolio_holdings')
      .update({ quantity, average_cost: price })
      .eq('id', holdingId)
      .select(`
        *,
        stock:stocks(*)
      `)
      .single();

    if (error) throw error;
    
    const quote = await finnhubService.getQuote(holding.stock.symbol);
    return { ...holding, currentPrice: quote.c };
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.holdings = action.payload;
        state.totalValue = action.payload.reduce(
          (sum, holding) => sum + (holding.currentPrice || 0) * holding.quantity,
          0
        );
        state.totalGainLoss = action.payload.reduce(
          (sum, holding) => 
            sum + ((holding.currentPrice || 0) - holding.average_cost) * holding.quantity,
          0
        );
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch portfolio';
      })
      .addCase(addHolding.fulfilled, (state, action) => {
        state.holdings.push(action.payload);
        state.totalValue = state.holdings.reduce(
          (sum, holding) => sum + (holding.currentPrice || 0) * holding.quantity,
          0
        );
        state.totalGainLoss = state.holdings.reduce(
          (sum, holding) => 
            sum + ((holding.currentPrice || 0) - holding.average_cost) * holding.quantity,
          0
        );
      })
      .addCase(updateHolding.fulfilled, (state, action) => {
        const index = state.holdings.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.holdings[index] = action.payload;
          state.totalValue = state.holdings.reduce(
            (sum, holding) => sum + (holding.currentPrice || 0) * holding.quantity,
            0
          );
          state.totalGainLoss = state.holdings.reduce(
            (sum, holding) => 
              sum + ((holding.currentPrice || 0) - holding.average_cost) * holding.quantity,
            0
          );
        }
      });
  },
});

export default portfolioSlice.reducer; 