
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from 'recharts';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChevronUp, ChevronDown, Wallet } from 'lucide-react';
import { HistoricalData } from '@/data/mockData';
import { format } from 'date-fns';

interface PortfolioValueProps {
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  historicalData: HistoricalData[];
}

const PortfolioValue: React.FC<PortfolioValueProps> = ({
  totalValue,
  totalProfit,
  totalProfitPercent,
  historicalData
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Format the date to be more readable
      const dateStr = payload[0].payload.date;
      let formattedDate = dateStr;
      
      try {
        const date = new Date(dateStr);
        formattedDate = format(date, 'MMM d, yyyy');
      } catch (e) {
        console.error('Error formatting date:', e);
      }
      
      return (
        <div className="glass p-3 text-xs">
          <p className="text-white">{formattedDate}</p>
          <p className="text-finance-teal font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass h-full overflow-hidden animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-finance-teal" />
          Portfolio Value
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-3xl font-bold mb-2 text-white">
            {formatCurrency(totalValue)}
          </div>
          <div className="flex items-center space-x-2">
            {totalProfit >= 0 ? (
              <div className="bg-finance-profit/20 text-finance-profit px-2 py-1 rounded-md flex items-center text-sm">
                <ChevronUp className="h-4 w-4 mr-1" />
                {formatCurrency(totalProfit)} (+{totalProfitPercent.toFixed(2)}%)
              </div>
            ) : (
              <div className="bg-finance-loss/20 text-finance-loss px-2 py-1 rounded-md flex items-center text-sm">
                <ChevronDown className="h-4 w-4 mr-1" />
                {formatCurrency(totalProfit)} ({totalProfitPercent.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
        
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                hide={true}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip 
                content={<CustomTooltip />}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2dd4bf" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioValue;
