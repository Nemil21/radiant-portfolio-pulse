
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { PerformanceData } from '@/data/mockData';

interface PerformanceMetricsProps {
  performanceData: PerformanceData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ performanceData }) => {
  const [activeTab, setActiveTab] = useState('daily');
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 text-xs">
          <p className="text-white">{label}</p>
          <p className="text-finance-purple font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  const getDataForTab = () => {
    switch (activeTab) {
      case 'daily':
        return performanceData.daily;
      case 'weekly':
        return performanceData.weekly;
      case 'monthly':
        return performanceData.monthly;
      case 'yearly':
        return performanceData.yearly;
      default:
        return performanceData.daily;
    }
  };
  
  const dataForActiveTab = getDataForTab();
  const firstValue = dataForActiveTab[0]?.value || 0;
  const lastValue = dataForActiveTab[dataForActiveTab.length - 1]?.value || 0;
  const changeValue = lastValue - firstValue;
  const changePercent = (changeValue / firstValue) * 100;
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-finance-purple" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          
          <div className="mb-4">
            <div className="flex justify-between items-baseline">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(lastValue)}
              </div>
              <div className={`text-sm font-medium px-2 py-0.5 rounded-md ${changeValue >= 0 ? 'bg-finance-profit/20 text-finance-profit' : 'bg-finance-loss/20 text-finance-loss'}`}>
                {changeValue >= 0 ? '+' : ''}{formatCurrency(changeValue)} ({changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
          
          {Object.keys(performanceData).map((period) => (
            <TabsContent key={period} value={period} className="h-64 mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData[period as keyof PerformanceData]}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Format based on the period
                      if (period === 'yearly') {
                        return value.split('-')[1]; // Month
                      }
                      return value.split('-')[2]; // Day
                    }}
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    domain={['dataMin - 10000', 'dataMax + 10000']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: '#a78bfa', r: 1 }}
                    activeDot={{ r: 6, fill: '#a78bfa', stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
