import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from '@/context/FinanceContext';
import { StockSearchResult } from '@/services/finnhubService';
import { Search, PlusCircle, Eye, Loader2 } from 'lucide-react';

interface AddStockDialogProps {
  trigger?: React.ReactNode;
  mode?: 'portfolio' | 'watchlist';
}

const AddStockDialog: React.FC<AddStockDialogProps> = ({ 
  trigger,
  mode = 'portfolio'
}) => {
  const { 
    searchStocks: searchStocksApi, 
    addStock, 
    addToWatchlist
  } = useFinance();
  
  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  
  // UI state
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('search');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const quantityInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchStocksApi(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
    } finally {
      setSearching(false);
    }
  };
  
  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        try {
          const results = await searchStocksApi(value);
          // Sort results to prioritize matches that start with the search query
          const sortedResults = results.sort((a, b) => {
            const aStartsWith = a.symbol.toLowerCase().startsWith(value.toLowerCase());
            const bStartsWith = b.symbol.toLowerCase().startsWith(value.toLowerCase());
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.symbol.length - b.symbol.length;
          });
          setSuggestions(sortedResults.slice(0, 5));
        } catch (error) {
          console.error('Error getting suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    }, 200);
  };
  
  const handleSuggestionSelect = (stock: StockSearchResult) => {
    setSearchQuery(stock.symbol);
    setSelectedStock(stock);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Automatically perform search when suggestion is selected
    setSearchResults([stock]);
    
    // Automatically move to the manual tab for quantity input
    setActiveTab('manual');
    
    // Focus on quantity input
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }, 100);
  };
  
  const handleStockSelect = (stock: StockSearchResult) => {
    setSelectedStock(stock);
    
    // Automatically move to the manual tab for quantity input
    setActiveTab('manual');
    
    // Focus on quantity input
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }, 100);
  };
  
  const handleAddPortfolio = async () => {
    if (!selectedStock || quantity <= 0 || price <= 0) return;
    
    setSubmitting(true);
    try {
      const success = await addStock(selectedStock.symbol, quantity, price);
      if (success) {
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAddWatchlist = async () => {
    if (!selectedStock) return;
    
    setSubmitting(true);
    try {
      const success = await addToWatchlist(selectedStock.symbol, category);
      if (success) {
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStock(null);
    setQuantity(0);
    setPrice(0);
    setCategory('');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            {mode === 'portfolio' 
              ? 'Add a new stock to your portfolio' 
              : 'Add a new stock to your watchlist'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="py-4">
            <div className="flex space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder=""
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                    {suggestions.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="p-2 hover:bg-secondary/20 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSuggestionSelect(stock)}
                      >
                        <div>
                          <div className="font-medium">
                            {stock.symbol}
                            {stock.symbol.toLowerCase().startsWith(searchQuery.toLowerCase()) && (
                              <span className="text-xs text-muted-foreground ml-2">(Exact match)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{stock.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                type="button" 
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((stock) => (
                    <div 
                      key={stock.symbol} 
                      className="p-3 rounded-md border border-border hover:bg-secondary/20 cursor-pointer"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.description}</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searching ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Search for a stock by symbol or company name
                  </div>
                )
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="py-4 space-y-4">
            {selectedStock && (
              <>
                <div className="bg-secondary/20 p-4 rounded-md">
                  <div className="text-2xl font-bold">{selectedStock.symbol}</div>
                  <div className="text-muted-foreground">{selectedStock.description}</div>
                </div>
                
                {mode === 'portfolio' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity || ''}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        ref={quantityInputRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Purchase Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price || ''}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      placeholder="e.g. Technology, Healthcare"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          
          {mode === 'portfolio' ? (
            <Button
              onClick={handleAddPortfolio}
              disabled={!selectedStock || quantity <= 0 || price <= 0 || submitting}
              className="bg-finance-teal hover:bg-finance-teal/80"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add to Portfolio
            </Button>
          ) : (
            <Button
              onClick={handleAddWatchlist}
              disabled={!selectedStock || submitting}
              className="bg-finance-purple hover:bg-finance-purple/80"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Add to Watchlist
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockDialog;
