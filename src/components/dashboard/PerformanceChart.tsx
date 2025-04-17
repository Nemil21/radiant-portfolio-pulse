import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { HistoricalData } from '@/data/mockData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PerformanceChartProps {
  data: {
    daily: HistoricalData[];
    weekly: HistoricalData[];
    monthly: HistoricalData[];
  };
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Get the appropriate data based on the selected timeframe
  const chartData = data[timeframe];
  
  // Calculate the current value and change
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const previousValue = chartData.length > 1 ? chartData[0].value : currentValue;
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date for X-axis based on timeframe
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      
      // Use different date formats based on the selected timeframe
      switch(timeframe) {
        case 'daily':
          return format(date, 'dd'); // Day of month (01-31)
        case 'weekly':
          return format(date, 'EEE'); // Abbreviated day name (Mon, Tue, etc.)
        case 'monthly':
          return format(date, 'dd MMM'); // Day + abbreviated month (01 Jan)
        // Yearly tab removed
        default:
          return format(date, 'dd');
      }
    } catch (e) {
      return dateStr;
    }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let displayDate = label;
      try {
        const date = new Date(label);
        // Use different date formats based on the selected timeframe
        switch(timeframe) {
          case 'daily':
            displayDate = format(date, 'MMM dd');
            break;
          case 'weekly':
            displayDate = format(date, 'MMM dd, yyyy');
            break;
          case 'monthly':
            displayDate = format(date, 'MMM dd, yyyy');
            break;
          // Yearly tab removed
          default:
            displayDate = format(date, 'MMM dd, yyyy');
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
      
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="text-sm font-medium">{displayDate}</p>
          <p className="text-sm text-finance-teal font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate min and max for Y-axis
  const values = chartData.map(item => item.value);
  const minValue = Math.min(...values) * 0.99; // Add 1% padding
  const maxValue = Math.max(...values) * 1.01; // Add 1% padding
  
  // Format Y-axis ticks
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };
  
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="daily" onValueChange={(value) => setTimeframe(value as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="h-full">
          <div className="mb-4">
            <div className="text-3xl font-bold">{formatCurrency(currentValue)}</div>
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${change >= 0 ? 'bg-finance-profit/20 text-finance-profit' : 'bg-finance-loss/20 text-finance-loss'}`}>
              {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(2)}%)
            </div>
          </div>
          
          <div className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width={timeframe === 'monthly' ? '200%' : '100%'} height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  // Show fewer ticks for better readability
                  interval={timeframe === 'daily' ? 2 : timeframe === 'weekly' ? 1 : 1}
                />
                <YAxis 
                  domain={[minValue, maxValue]} 
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a78bfa" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="h-full">
          <div className="mb-4">
            <div className="text-3xl font-bold">{formatCurrency(currentValue)}</div>
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${change >= 0 ? 'bg-finance-profit/20 text-finance-profit' : 'bg-finance-loss/20 text-finance-loss'}`}>
              {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(2)}%)
            </div>
          </div>
          
          <div className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width={timeframe === 'monthly' ? '200%' : '100%'} height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  // Show fewer ticks for better readability
                  interval={timeframe === 'daily' ? 2 : timeframe === 'weekly' ? 1 : 1}
                />
                <YAxis 
                  domain={[minValue, maxValue]} 
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a78bfa" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="h-full">
          <div className="mb-4">
            <div className="text-3xl font-bold">{formatCurrency(currentValue)}</div>
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${change >= 0 ? 'bg-finance-profit/20 text-finance-profit' : 'bg-finance-loss/20 text-finance-loss'}`}>
              {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(2)}%)
            </div>
          </div>
          
          <div className="h-[300px] overflow-x-auto">
            <ResponsiveContainer width={timeframe === 'monthly' ? '200%' : '100%'} height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  // Show fewer ticks for better readability
                  interval={timeframe === 'daily' ? 2 : timeframe === 'weekly' ? 1 : 1}
                />
                <YAxis 
                  domain={[minValue, maxValue]} 
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a78bfa" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        

      </Tabs>
    </div>
  );
};

export default PerformanceChart;
