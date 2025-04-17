import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceData } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import PerformanceChart from './PerformanceChart';

interface PerformanceMetricsProps {
  performanceData: PerformanceData;
  loading?: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  performanceData,
  loading = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Loading skeleton for the performance metrics
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-secondary/20">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 rounded-lg bg-secondary/20">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 rounded-lg bg-secondary/20">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 rounded-lg bg-secondary/20">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <Skeleton className="h-[200px] w-full mt-6" />
    </div>
  );
  
  if (loading) return <LoadingSkeleton />;
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Daily Change</p>
              <p className={`text-xl font-semibold ${(performanceData.dailyMetric?.[0]?.value || 0) >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.dailyMetric?.[0]?.value || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Weekly Change</p>
              <p className={`text-xl font-semibold ${(performanceData.weeklyMetric?.[0]?.value || 0) >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.weeklyMetric?.[0]?.value || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Monthly Change</p>
              <p className={`text-xl font-semibold ${(performanceData.monthlyMetric?.[0]?.value || 0) >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.monthlyMetric?.[0]?.value || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Yearly Change</p>
              <p className={`text-xl font-semibold ${(performanceData.yearlyMetric?.[0]?.value || 0) >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.yearlyMetric?.[0]?.value || 0)}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <PerformanceChart data={performanceData} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
