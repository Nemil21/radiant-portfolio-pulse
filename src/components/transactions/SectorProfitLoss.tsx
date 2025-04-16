import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface SectorProfitLossProps {
  data: Array<{
    sector: string;
    profit: number;
    loss: number;
    netProfitLoss: number;
    profitLossPercentage: number;
    transactionCount: number;
  }>;
  loading: boolean;
}

const SectorProfitLoss: React.FC<SectorProfitLossProps> = ({ data, loading }) => {
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

  // Generate colors for sectors
  const generateSectorColor = (sector: string, isProfit: boolean = true) => {
    // Base colors
    const profitColors = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];
    const lossColors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];
    
    // Hash the sector name to get a consistent index
    const hash = sector.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % 5;
    
    return isProfit ? profitColors[index] : lossColors[index];
  };

  // Prepare data for pie chart
  const pieChartData = data.map(item => ({
    name: `${item.sector} (${item.profitLossPercentage.toFixed(1)}%)`,
    value: Math.abs(item.netProfitLoss),
    isProfit: item.netProfitLoss >= 0,
    percentage: item.profitLossPercentage,
    sector: item.sector
  }));

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{data.sector}</p>
          <p style={{ color: data.isProfit ? '#22c55e' : '#ef4444' }}>
            {data.isProfit ? 'Profit' : 'Loss'}: {formatCurrency(data.value)}
          </p>
          <p style={{ color: data.isProfit ? '#22c55e' : '#ef4444' }}>
            Return: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    // Don't render labels for small segments (less than 5%)
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    // Position the label in the middle of the segment
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="glass">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card className="glass">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sector Profit/Loss Chart */}
      <Card className="glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Sector Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={false}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={generateSectorColor(entry.sector, entry.isProfit)} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-sm">{value}</span>
                  )}
                  wrapperStyle={{ 
                    paddingLeft: '20px',
                    right: 0, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    lineHeight: '1.5em'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sector Profit/Loss Table */}
      <Card className="glass animate-fade-in animate-delay-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Sector Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Trades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((sector, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{sector.sector}</TableCell>
                    <TableCell className={sector.netProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                      <div className="flex items-center">
                        {sector.netProfitLoss >= 0 ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        {formatCurrency(sector.netProfitLoss)}
                      </div>
                    </TableCell>
                    <TableCell className={sector.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatPercentage(sector.profitLossPercentage)}
                    </TableCell>
                    <TableCell>{sector.transactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectorProfitLoss;
