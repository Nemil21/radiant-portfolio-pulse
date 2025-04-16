import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfitLossSummaryProps {
  data: {
    totalProfit: number;
    totalLoss: number;
    netProfitLoss: number;
    profitLossPercentage: number;
  };
  loading: boolean;
}

const ProfitLossSummary: React.FC<ProfitLossSummaryProps> = ({ data, loading }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="glass">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-20" />
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
      {/* Total Profit */}
      <Card className="glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Total Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(data.totalProfit)}
          </div>
          <p className="text-sm text-muted-foreground">
            From profitable trades
          </p>
        </CardContent>
      </Card>

      {/* Total Loss */}
      <Card className="glass animate-fade-in animate-delay-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
            Total Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(data.totalLoss)}
          </div>
          <p className="text-sm text-muted-foreground">
            From unprofitable trades
          </p>
        </CardContent>
      </Card>

      {/* Net Profit/Loss */}
      <Card className="glass animate-fade-in animate-delay-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Net Profit/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.netProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(data.netProfitLoss)}
          </div>
          <p className="text-sm text-muted-foreground">
            Overall performance
          </p>
        </CardContent>
      </Card>

      {/* Profit/Loss Percentage */}
      <Card className="glass animate-fade-in animate-delay-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Return Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(data.profitLossPercentage)}
          </div>
          <p className="text-sm text-muted-foreground">
            Return on investment
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossSummary;
