import React from 'react';
import { useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RootState } from '@/store';
import { formatCurrency } from '@/lib/utils';

const PerformanceMetrics = () => {
  const { holdings } = useSelector((state: RootState) => state.portfolio);
  const { transactions } = useSelector((state: RootState) => state.transactions);

  // Calculate portfolio value over time
  const portfolioValueData = React.useMemo(() => {
    if (!holdings.length || !transactions.length) return [];

    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, typeof transactions>);

    // Calculate portfolio value for each date
    const dates = Object.keys(transactionsByDate).sort();
    return dates.map(date => {
      const value = holdings.reduce((total, holding) => {
        const stockTransactions = transactionsByDate[date].filter(
          t => t.symbol === holding.symbol
        );
        const quantity = stockTransactions.reduce((q, t) => {
          return q + (t.type === 'buy' ? t.quantity : -t.quantity);
        }, 0);
        return total + (quantity * holding.currentPrice);
      }, 0);
      return {
        date,
        value
      };
    });
  }, [holdings, transactions]);

  // Calculate performance metrics
  const metrics = React.useMemo(() => {
    if (!holdings.length) return null;

    const totalValue = holdings.reduce((sum, holding) => 
      sum + (holding.quantity * holding.currentPrice), 0
    );
    const totalCost = holdings.reduce((sum, holding) => 
      sum + (holding.quantity * holding.averageCost), 0
    );
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent
    };
  }, [holdings]);

  if (!metrics) return null;

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${metrics.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(metrics.totalGainLoss)}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Gain/Loss %</p>
          <p className={`text-2xl font-bold ${metrics.totalGainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.totalGainLossPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={portfolioValueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
