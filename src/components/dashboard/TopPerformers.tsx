
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockData } from '@/data/mockData';

interface TopPerformersProps {
  stocks: StockData[];
}

const TopPerformers: React.FC<TopPerformersProps> = ({ stocks }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get top 3 gainers and losers
  const sortedByProfit = [...stocks].sort((a, b) => b.profitPercent - a.profitPercent);
  const gainers = sortedByProfit.slice(0, 3);
  const losers = sortedByProfit.slice(-3).reverse();
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
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
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stock.name}</span>
                  </div>
                  <div className="text-finance-profit text-sm">
                    +{stock.profitPercent.toFixed(2)}%
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
              {losers.map(stock => (
                <div 
                  key={stock.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-finance-loss/10 border border-finance-loss/20 animate-slide-in"
                >
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stock.name}</span>
                  </div>
                  <div className="text-finance-loss text-sm">
                    {stock.profitPercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformers;
