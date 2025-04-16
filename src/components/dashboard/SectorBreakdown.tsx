import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { SectorData } from '@/data/mockData';
import { getSectorColor } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';

interface SectorBreakdownProps {
  sectorData: SectorData[];
  loading?: boolean;
}

const SectorBreakdown: React.FC<SectorBreakdownProps> = ({ sectorData, loading = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalValue = sectorData.reduce((acc, sector) => acc + sector.value, 0);
      const percentage = ((data.value / totalValue) * 100).toFixed(1);
      
      return (
        <div className="glass p-3 text-xs">
          <p className="font-medium text-white">{data.name}</p>
          <p className="text-white font-bold">{formatCurrency(data.value)}</p>
          <p className="text-gray-300">{percentage}% of portfolio</p>
        </div>
      );
    }
    return null;
  };
  
  const renderLegend = (props: any) => {
    const { payload } = props;
    const totalValue = sectorData.reduce((acc, sector) => acc + sector.value, 0);
    
    return (
      <ul className="flex flex-wrap mt-4 justify-center gap-x-4 gap-y-2">
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
          return (
            <li key={`item-${index}`} className="flex items-center text-xs">
              <div
                className="h-3 w-3 rounded-full mr-1"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white">{entry.value} ({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };
  
  // Loading skeleton for the sector breakdown
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-center items-center h-56">
        <div className="relative">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-24 w-24 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-16 rounded-full" />
        ))}
      </div>
    </div>
  );
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <PieChartIcon className="h-5 w-5 mr-2 text-finance-amber" />
          Sector Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSectorColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectorBreakdown;
