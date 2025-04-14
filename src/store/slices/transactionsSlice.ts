import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Stock = Database['public']['Tables']['stocks']['Row'];

interface TransactionsState {
  items: (Transaction & { stock: Stock })[];
  loading: boolean;
  error: string | null;
  filters: {
    startDate?: string;
    endDate?: string;
    type?: 'BUY' | 'SELL';
    symbol?: string;
  };
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
  filters: {},
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ userId, filters }: { 
    userId: string;
    filters?: TransactionsState['filters'];
  }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters?.type) {
      query = query.eq('transaction_type', filters.type);
    }
    if (filters?.symbol) {
      query = query.eq('stock.symbol', filters.symbol);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) throw error;
    return data;
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async ({ 
    userId,
    stockId,
    quantity,
    price,
    type,
    notes
  }: {
    userId: string;
    stockId: string;
    quantity: number;
    price: number;
    type: 'BUY' | 'SELL';
    notes?: string;
  }) => {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        stock_id: stockId,
        quantity,
        price,
        transaction_type: type,
        transaction_date: new Date().toISOString(),
        notes,
      })
      .select(`
        *,
        stock:stocks(*)
      `)
      .single();

    if (error) throw error;
    return transaction;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { setFilters, clearFilters } = transactionsSlice.actions;
export default transactionsSlice.reducer; 