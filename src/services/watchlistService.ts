import { supabase } from "@/integrations/supabase/client";
import { getStockQuote } from "./finnhubService";
import { StockData } from "@/data/mockData";

export interface WatchlistItem {
  id: string;
  stockId: string;
  symbol: string;
  name: string;
  sector?: string;
  color?: string;
  price: number;
  change: number;
  changePercent: number;
  category?: string;
  priceAlertHigh?: number;
  priceAlertLow?: number;
}

// Get all stocks in user's watchlist
export const getWatchlistItems = async (): Promise<WatchlistItem[]> => {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('watchlist_items')
      .select(`
        id,
        category,
        price_alert_high,
        price_alert_low,
        stocks (
          id,
          symbol,
          name,
          sector,
          logo_url
        )
      `);
    
    if (itemsError) {
      console.error('Error fetching watchlist items:', itemsError);
      return [];
    }

    // Get current prices for all stocks in watchlist
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const stockQuote = await getStockQuote(item.stocks.symbol);
        
        // Generate a random color for the stock if not available
        const color = generateStockColor(item.stocks.symbol);
        
        return {
          id: item.id,
          stockId: item.stocks.id,
          symbol: item.stocks.symbol,
          name: item.stocks.name,
          sector: item.stocks.sector,
          color,
          price: stockQuote?.c || 0,
          change: stockQuote?.d || 0,
          changePercent: stockQuote?.dp || 0,
          category: item.category,
          priceAlertHigh: item.price_alert_high,
          priceAlertLow: item.price_alert_low
        };
      })
    );
    
    return enrichedItems;
  } catch (error) {
    console.error('Error in getWatchlistItems:', error);
    return [];
  }
};

// Add a stock to watchlist
export const addToWatchlist = async (
  stockSymbol: string,
  category?: string,
  priceAlertHigh?: number,
  priceAlertLow?: number
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
    
    // Now check if this stock is already in the user's watchlist
    const { data: existingItem, error: itemError } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('stock_id', stock.id)
      .eq('user_id', user.id)
      .single();
    
    if (!itemError && existingItem) {
      // Update existing watchlist item
      const { error: updateError } = await supabase
        .from('watchlist_items')
        .update({ 
          category, 
          price_alert_high: priceAlertHigh,
          price_alert_low: priceAlertLow,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);
      
      if (updateError) {
        console.error('Error updating watchlist item:', updateError);
        return false;
      }
    } else {
      // Add new watchlist item
      const { error: insertError } = await supabase
        .from('watchlist_items')
        .insert({ 
          user_id: user.id,
          stock_id: stock.id, 
          category, 
          price_alert_high: priceAlertHigh,
          price_alert_low: priceAlertLow
        });
      
      if (insertError) {
        console.error('Error inserting watchlist item:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in addToWatchlist:', error);
    return false;
  }
};

// Remove stock from watchlist
export const removeFromWatchlist = async (watchlistItemId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', watchlistItemId);
    
    if (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeFromWatchlist:', error);
    return false;
  }
};

// Update watchlist item
export const updateWatchlistItem = async (
  id: string,
  category?: string,
  priceAlertHigh?: number,
  priceAlertLow?: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('watchlist_items')
      .update({ 
        category, 
        price_alert_high: priceAlertHigh,
        price_alert_low: priceAlertLow,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating watchlist item:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateWatchlistItem:', error);
    return false;
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
