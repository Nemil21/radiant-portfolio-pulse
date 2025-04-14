import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import finnhubService from '../../services/finnhub';
import type { Database } from '../../integrations/supabase/types';

type WatchlistItem = Database['public']['Tables']['watchlist_items']['Row'];
type Stock = Database['public']['Tables']['stocks']['Row'];

interface WatchlistState {
  items: (WatchlistItem & { stock: Stock; currentPrice?: number })[];
  loading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetchWatchlist',
  async (userId: string) => {
    const { data: items, error } = await supabase
      .from('watchlist_items')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Fetch current prices for all watchlist items
    const itemsWithPrices = await Promise.all(
      items.map(async (item) => {
        const quote = await finnhubService.getQuote(item.stock.symbol);
        return {
          ...item,
          currentPrice: quote.c,
        };
      })
    );

    return itemsWithPrices;
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/addToWatchlist',
  async ({ userId, symbol, priceAlertHigh, priceAlertLow }: {
    userId: string;
    symbol: string;
    priceAlertHigh?: number;
    priceAlertLow?: number;
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

    // Add to watchlist
    const { data: watchlistItem, error } = await supabase
      .from('watchlist_items')
      .insert({
        user_id: userId,
        stock_id: existingStock.id,
        price_alert_high: priceAlertHigh,
        price_alert_low: priceAlertLow,
      })
      .select(`
        *,
        stock:stocks(*)
      `)
      .single();

    if (error) throw error;

    const quote = await finnhubService.getQuote(symbol);
    return { ...watchlistItem, currentPrice: quote.c };
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/removeFromWatchlist',
  async (itemId: string) => {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return itemId;
  }
);

export const updateWatchlistAlerts = createAsyncThunk(
  'watchlist/updateAlerts',
  async ({ itemId, priceAlertHigh, priceAlertLow }: {
    itemId: string;
    priceAlertHigh?: number;
    priceAlertLow?: number;
  }) => {
    const { data: watchlistItem, error } = await supabase
      .from('watchlist_items')
      .update({
        price_alert_high: priceAlertHigh,
        price_alert_low: priceAlertLow,
      })
      .eq('id', itemId)
      .select(`
        *,
        stock:stocks(*)
      `)
      .single();

    if (error) throw error;

    const quote = await finnhubService.getQuote(watchlistItem.stock.symbol);
    return { ...watchlistItem, currentPrice: quote.c };
  }
);

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch watchlist';
      })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(updateWatchlistAlerts.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default watchlistSlice.reducer; 