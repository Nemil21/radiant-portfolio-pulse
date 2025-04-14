
import React, { useState } from 'react';
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
  
  const handleStockSelect = (stock: StockSearchResult) => {
    setSelectedStock(stock);
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
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'portfolio' ? 'Add Stock to Portfolio' : 'Add Stock to Watchlist'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'portfolio' 
              ? 'Search for a stock and add it to your portfolio' 
              : 'Search for a stock and add it to your watchlist'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="search" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedStock}>Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="py-4">
            <div className="flex space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stock symbol or name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
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
                      className="p-3 rounded-md border border-border hover:bg-secondary/20 cursor-pointer flex justify-between items-center"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">{stock.description}</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Select
                      </Button>
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
                    No results found
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Search for a stock symbol or name
                  </div>
                )
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="py-4 space-y-4">
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
