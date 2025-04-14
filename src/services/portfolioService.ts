import { supabase } from "@/integrations/supabase/client";
import { getStockQuote } from "./finnhubService";

export interface PortfolioHolding {
  id: string;
  stockId: string;
  symbol: string;
  name: string;
  sector?: string;
  color?: string;
  quantity: number;
  price: number;
  averageCost: number;
  value: number;
  change: number;
  changePercent: number;
  profit: number;
  profitPercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitPercent: number;
  stockCount: number;
}

export interface Transaction {
  id: string;
  stockId: string;
  stockSymbol: string;
  stockName: string;
  transactionType: 'buy' | 'sell';
  price: number;
  quantity: number;
  transactionDate: string;
  notes?: string;
}

// Get all stocks in a user's portfolio
export const getPortfolioHoldings = async (): Promise<PortfolioHolding[]> => {
  try {
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select(`
        id,
        quantity,
        average_cost,
        stocks (
          id,
          symbol,
          name,
          sector,
          logo_url
        )
      `);
    
    if (holdingsError) {
      console.error('Error fetching portfolio holdings:', holdingsError);
      return [];
    }

    // Get current prices for all stocks in portfolio
    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const stockQuote = await getStockQuote(holding.stocks.symbol);
        
        // Generate a random color for the stock if not available
        const color = generateStockColor(holding.stocks.symbol);
        
        const currentPrice = stockQuote?.c || 0;
        const priceChange = stockQuote?.d || 0;
        const priceChangePercent = stockQuote?.dp || 0;
        
        const value = currentPrice * holding.quantity;
        const cost = holding.average_cost * holding.quantity;
        const profit = value - cost;
        const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
        
        return {
          id: holding.id,
          stockId: holding.stocks.id,
          symbol: holding.stocks.symbol,
          name: holding.stocks.name,
          sector: holding.stocks.sector,
          color,
          quantity: holding.quantity,
          price: currentPrice,
          averageCost: holding.average_cost,
          value,
          change: priceChange,
          changePercent: priceChangePercent,
          profit,
          profitPercent
        };
      })
    );
    
    return enrichedHoldings;
  } catch (error) {
    console.error('Error in getPortfolioHoldings:', error);
    return [];
  }
};

// Get portfolio summary
export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  try {
    const holdings = await getPortfolioHoldings();
    
    const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
    const totalCost = holdings.reduce((sum, holding) => sum + (holding.averageCost * holding.quantity), 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    
    return {
      totalValue,
      totalCost,
      totalProfit,
      totalProfitPercent,
      stockCount: holdings.length
    };
  } catch (error) {
    console.error('Error in getPortfolioSummary:', error);
    return {
      totalValue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      stockCount: 0
    };
  }
};

// Add or update a stock in the portfolio
export const updatePortfolioHolding = async (
  stockSymbol: string, 
  quantity: number, 
  price: number
): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting authenticated user:', userError);
      return false;
    }

    // First, check if the stock exists in our database
    let { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', stockSymbol)
      .single();
    
    // If the stock doesn't exist, fetch details and add it
    if (stockError || !stock) {
      // Fetch stock details from API
      const { data: stockDetails, error: detailsError } = await supabase
        .rpc('get_stock_details', { stock_symbol: stockSymbol });
      
      if (detailsError || !stockDetails) {
        console.error('Error fetching stock details:', detailsError);
        return false;
      }
      
      // Insert the new stock
      const { data: newStock, error: insertError } = await supabase
        .from('stocks')
        .insert({
          symbol: stockSymbol,
          name: stockDetails.name || stockSymbol,
          sector: stockDetails.sector || 'Unknown',
          logo_url: stockDetails.logo || null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting new stock:', insertError);
        return false;
      }
      
      stock = newStock;
    }
    
    // Now check if the user already has this stock in their portfolio
    const { data: existingHolding, error: holdingError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('stock_id', stock.id)
      .eq('user_id', user.id)
      .single();
    
    if (!holdingError && existingHolding) {
      // Update existing holding
      const newQuantity = existingHolding.quantity + quantity;
      const newAverageCost = ((existingHolding.average_cost * existingHolding.quantity) + (price * quantity)) / newQuantity;
      
      const { error: updateError } = await supabase
        .from('portfolio_holdings')
        .update({ 
          quantity: newQuantity, 
          average_cost: newAverageCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHolding.id)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating holding:', updateError);
        return false;
      }
    } else {
      // Create new holding
      const { error: insertError } = await supabase
        .from('portfolio_holdings')
        .insert({ 
          user_id: user.id,
          stock_id: stock.id, 
          quantity, 
          average_cost: price
        });
      
      if (insertError) {
        console.error('Error inserting new holding:', insertError);
        return false;
      }
    }
    
    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        stock_id: stock.id,
        transaction_type: 'buy',
        price,
        quantity,
        transaction_date: new Date().toISOString()
      });
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // We'll still return true as the holding was updated successfully
    }
    
    return true;
  } catch (error) {
    console.error('Error in updatePortfolioHolding:', error);
    return false;
  }
};

// Remove stock from portfolio
export const removePortfolioHolding = async (holdingId: string, sellPrice: number): Promise<boolean> => {
  try {
    // Get the holding details first
    const { data: holding, error: holdingError } = await supabase
      .from('portfolio_holdings')
      .select('*, stocks(id, symbol, name)')
      .eq('id', holdingId)
      .single();
    
    if (holdingError || !holding) {
      console.error('Error fetching holding to remove:', holdingError);
      return false;
    }
    
    // Record the sell transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        stock_id: holding.stock_id,
        transaction_type: 'sell',
        price: sellPrice,
        quantity: holding.quantity,
        transaction_date: new Date().toISOString(),
        notes: 'Removed from portfolio'
      });
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // We'll still continue as the transaction record is not critical
    }
    
    // Now delete the holding
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId);
    
    if (deleteError) {
      console.error('Error deleting holding:', deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removePortfolioHolding:', error);
    return false;
  }
};

// Get all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        stock_id,
        transaction_type,
        price,
        quantity,
        transaction_date,
        notes,
        stocks (
          symbol,
          name
        )
      `)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    
    return data.map(transaction => ({
      id: transaction.id,
      stockId: transaction.stock_id,
      stockSymbol: transaction.stocks.symbol,
      stockName: transaction.stocks.name,
      transactionType: transaction.transaction_type as 'buy' | 'sell',
      price: transaction.price,
      quantity: transaction.quantity,
      transactionDate: transaction.transaction_date,
      notes: transaction.notes
    }));
  } catch (error) {
    console.error('Error in getTransactions:', error);
    return [];
  }
};

// Generate a unique color based on stock symbol
const generateStockColor = (symbol: string): string => {
  // Hash the symbol to generate a consistent color
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a nice color
  const colors = [
    '#2DD4BF', // teal
    '#A78BFA', // purple
    '#F97316', // orange
    '#EC4899', // pink
    '#22C55E', // green
    '#3B82F6', // blue
    '#F43F5E', // red
    '#F59E0B', // amber
    '#06B6D4', // cyan
    '#6366F1', // indigo
  ];
  
  return colors[Math.abs(hash) % colors.length];
};
