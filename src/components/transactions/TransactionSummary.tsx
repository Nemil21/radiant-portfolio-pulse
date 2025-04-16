import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionSummaryProps {
  stats: {
    totalBuys: number;
    totalSells: number;
    totalBuyAmount: number;
    totalSellAmount: number;
    buyPercentage: number;
    sellPercentage: number;
    monthlySummary: Array<{
      month: string;
      buyAmount: number;
      sellAmount: number;
      transactionCount: number;
    }>;
  };
  loading: boolean;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ stats, loading }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate total transactions
  const totalTransactions = stats.totalBuys + stats.totalSells;
  
  // Calculate net cash flow
  const netCashFlow = stats.totalSellAmount - stats.totalBuyAmount;
  
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Transactions */}
      <Card className="glass animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">All Time</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold">{totalTransactions}</h3>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </div>
        </CardContent>
      </Card>

      {/* Buy Transactions */}
      <Card className="glass animate-fade-in animate-delay-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-finance-profit/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-finance-profit" />
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.buyPercentage.toFixed(1)}% of total
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold">{formatCurrency(stats.totalBuyAmount)}</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalBuys} Buy Transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sell Transactions */}
      <Card className="glass animate-fade-in animate-delay-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-finance-loss/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-finance-loss" />
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.sellPercentage.toFixed(1)}% of total
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold">{formatCurrency(stats.totalSellAmount)}</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalSells} Sell Transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Net Cash Flow */}
      <Card className="glass animate-fade-in animate-delay-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Net Flow</span>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-semibold ${netCashFlow >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
              {formatCurrency(Math.abs(netCashFlow))}
            </h3>
            <p className="text-sm text-muted-foreground">
              {netCashFlow >= 0 ? 'Net Inflow' : 'Net Outflow'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSummary;
