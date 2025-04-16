import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

interface TransactionChartsProps {
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

const TransactionCharts: React.FC<TransactionChartsProps> = ({ stats, loading }) => {
  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage for tooltips
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare data for transaction type pie chart
  const transactionTypeData = [
    { name: 'Buy', value: stats.totalBuys, percentage: stats.buyPercentage, color: '#22c55e' },
    { name: 'Sell', value: stats.totalSells, percentage: stats.sellPercentage, color: '#ef4444' }
  ];

  // Prepare data for transaction amount pie chart
  const transactionAmountData = [
    { name: 'Buy Amount', value: stats.totalBuyAmount, color: '#22c55e' },
    { name: 'Sell Amount', value: stats.totalSellAmount, color: '#ef4444' }
  ];

  // Prepare monthly data for charts
  const monthlyData = stats.monthlySummary.map(item => ({
    month: formatMonth(item.month),
    buyAmount: item.buyAmount,
    sellAmount: item.sellAmount,
    transactionCount: item.transactionCount,
    netFlow: item.sellAmount - item.buyAmount
  }));

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            Count: {data.value}
          </p>
          <p style={{ color: data.color }}>
            Percentage: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="glass">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Monthly Transaction Volume */}
      <Card className="glass animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Monthly Transaction Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomLineTooltip />} />
                <Bar dataKey="transactionCount" fill="#3b82f6" name="Transactions" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Buy/Sell Amount */}
      <Card className="glass animate-fade-in animate-delay-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Monthly Buy/Sell Amounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar dataKey="buyAmount" fill="#22c55e" name="Buy Amount" />
                <Bar dataKey="sellAmount" fill="#ef4444" name="Sell Amount" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Distribution */}
      <Card className="glass animate-fade-in animate-delay-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Transaction Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionCharts;
