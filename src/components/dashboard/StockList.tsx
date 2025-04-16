import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, ChevronUp, ChevronDown, Search, TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useFinance } from '@/context/FinanceContext';
import AddStockDialog from '@/components/stocks/AddStockDialog';
import StockActionDialog from '@/components/stocks/StockActionDialog';
import { PortfolioHolding } from '@/services/portfolioService';
import { WatchlistItem } from '@/services/watchlistService';
import { Skeleton } from '@/components/ui/skeleton';

interface StockListProps {
  stocks: PortfolioHolding[] | WatchlistItem[];
  title?: string;
  icon?: React.ReactNode;
  type?: 'portfolio' | 'watchlist';
  loading?: boolean;
}

const StockList: React.FC<StockListProps> = ({ 
  stocks, 
  title = "Your Portfolio",
  icon = <BarChart3 className="h-5 w-5 mr-2" />,
  type = 'portfolio',
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { removeFromWatchlist, addToWatchlist } = useFinance();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return formatCurrency(value);
  };
  
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleRemoveFromWatchlist = async (id: string) => {
    await removeFromWatchlist(id);
  };
  
  const handleAddToWatchlist = async (symbol: string) => {
    await addToWatchlist(symbol);
  };
  
  // Loading skeleton for the table
  const LoadingSkeleton = () => (
    <div className="p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          {type === 'portfolio' && (
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </>
          )}
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-300">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center">
          {icon}
          {title}
        </CardTitle>
        <AddStockDialog 
          mode={type} 
          trigger={
            <Button size="sm" className="h-8 gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Add {type === 'portfolio' ? 'Stock' : 'to Watchlist'}
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pt-2 pb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks..."
              className="pl-8 bg-secondary/20 border-secondary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-secondary/20 sticky top-0">
                <TableRow>
                  <TableHead className="w-[100px]">Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  {type === 'portfolio' && (
                    <>
                      <TableHead className="text-right">Holdings</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                    </>
                  )}
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map(stock => (
                    <TableRow key={stock.id} className="hover:bg-secondary/20 cursor-pointer animate-scale-in">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                          {stock.symbol}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{stock.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stock.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className={`inline-flex items-center ${stock.change >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                          {stock.change >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {Math.abs(stock.changePercent).toFixed(2)}%
                        </div>
                      </TableCell>
                      {type === 'portfolio' && 'quantity' in stock && (
                        <>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span>{stock.quantity} shares</span>
                              <span className="text-xs text-muted-foreground">{formatCurrency(stock.value)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex flex-col ${stock.profit >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                              <span>{formatCurrency(stock.profit)}</span>
                              <span className="text-xs">{stock.profitPercent.toFixed(2)}%</span>
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {type === 'portfolio' && 'quantity' in stock ? (
                            <>
                              <StockActionDialog
                                holdingId={stock.id}
                                stockSymbol={stock.symbol}
                                stockName={stock.name}
                                currentPrice={stock.price}
                                currentQuantity={stock.quantity}
                                action="buy"
                                trigger={
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-finance-profit">
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <StockActionDialog
                                holdingId={stock.id}
                                stockSymbol={stock.symbol}
                                stockName={stock.name}
                                currentPrice={stock.price}
                                currentQuantity={stock.quantity}
                                action="sell"
                                trigger={
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-finance-loss">
                                    <TrendingDown className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAddToWatchlist(stock.symbol)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Add to Watchlist
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleRemoveFromWatchlist(stock.id)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={type === 'portfolio' ? 7 : 5} className="text-center py-6 text-muted-foreground">
                      No stocks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockList;
