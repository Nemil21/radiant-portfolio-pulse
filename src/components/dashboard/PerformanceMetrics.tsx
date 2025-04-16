import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceData } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';

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
              <p className={`text-xl font-semibold ${performanceData.daily[performanceData.daily.length - 1].value >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.daily[performanceData.daily.length - 1].value)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Weekly Change</p>
              <p className={`text-xl font-semibold ${performanceData.weekly[performanceData.weekly.length - 1].value >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.weekly[performanceData.weekly.length - 1].value)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Monthly Change</p>
              <p className={`text-xl font-semibold ${performanceData.monthly[performanceData.monthly.length - 1].value >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.monthly[performanceData.monthly.length - 1].value)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Yearly Change</p>
              <p className={`text-xl font-semibold ${performanceData.yearly[performanceData.yearly.length - 1].value >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                {formatCurrency(performanceData.yearly[performanceData.yearly.length - 1].value)}
              </p>
            </div>
          </div>
          
          <div className="mt-6 h-[200px] bg-secondary/10 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Performance Chart</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
