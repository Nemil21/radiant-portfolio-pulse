import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockData } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioHolding } from '@/services/portfolioService';

interface TopPerformersProps {
  stocks: PortfolioHolding[];
  loading?: boolean;
}

const TopPerformers: React.FC<TopPerformersProps> = ({ stocks, loading = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get top 3 gainers and losers, ensuring no overlap
  const sortedByProfit = [...stocks].sort((a, b) => b.profitPercent - a.profitPercent);
  const gainers = sortedByProfit.filter(stock => stock.profitPercent > 0).slice(0, 3);
  const losers = sortedByProfit.filter(stock => stock.profitPercent < 0).slice(-3).reverse();
  
  // Loading skeleton for the top performers
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium flex items-center mb-2">
          <TrendingUp className="h-4 w-4 mr-1 text-finance-profit" />
          Top Gainers
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2 rounded-lg bg-finance-profit/10 border border-finance-profit/20">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center mb-2">
          <TrendingDown className="h-4 w-4 mr-1 text-finance-loss" />
          Top Losers
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2 rounded-lg bg-finance-loss/10 border border-finance-loss/20">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <TrendingUp className="h-4 w-4 mr-1 text-finance-profit" />
                Top Gainers
              </h3>
              <div className="space-y-2">
                {gainers.map(stock => (
                  <div 
                    key={stock.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-finance-profit/10 border border-finance-profit/20 animate-slide-in"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{stock.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stock.averageCost)} → {formatCurrency(stock.price)}
                      </div>
                    </div>
                    <div className="text-finance-profit text-sm">
                      +{stock.profitPercent.toFixed(2)}%
                    </div>
                  </div>
                ))}
                {gainers.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No gainers found
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <TrendingDown className="h-4 w-4 mr-1 text-finance-loss" />
                Top Losers
              </h3>
              <div className="space-y-2">
                {losers.map(stock => (
                  <div 
                    key={stock.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-finance-loss/10 border border-finance-loss/20 animate-slide-in"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{stock.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cost: {formatCurrency(stock.averageCost)} → Current: {formatCurrency(stock.price)}
                      </div>
                    </div>
                    <div className="text-finance-loss text-sm">
                      {stock.profitPercent.toFixed(2)}%
                    </div>
                  </div>
                ))}
                {losers.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No losers found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPerformers;
