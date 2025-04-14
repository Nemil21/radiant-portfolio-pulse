import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { RootState } from '../store';
import { getSectorColor } from '@/data/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PortfolioAnalytics() {
  const { holdings } = useSelector((state: RootState) => state.portfolio);

  const metrics = useMemo(() => {
    const totalValue = holdings.reduce(
      (sum, holding) => sum + (holding.currentPrice || 0) * holding.quantity,
      0
    );

    const totalCost = holdings.reduce(
      (sum, holding) => sum + holding.average_cost * holding.quantity,
      0
    );

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

    const sectorAllocation = holdings.reduce((acc, holding) => {
      const sector = holding.stock.sector || 'Unknown';
      const value = (holding.currentPrice || 0) * holding.quantity;
      acc[sector] = (acc[sector] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const topHoldings = [...holdings]
      .sort((a, b) => {
        const valueA = (a.currentPrice || 0) * a.quantity;
        const valueB = (b.currentPrice || 0) * b.quantity;
        return valueB - valueA;
      })
      .slice(0, 5);

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      sectorAllocation,
      topHoldings,
    };
  }, [holdings]);

  const sectorChartData = {
    labels: Object.keys(metrics.sectorAllocation),
    datasets: [
      {
        data: Object.values(metrics.sectorAllocation),
        backgroundColor: Object.keys(metrics.sectorAllocation).map(sector => getSectorColor(sector)),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${metrics.totalValue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${metrics.totalCost.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Gain/Loss</h3>
          <p className={`mt-2 text-3xl font-semibold ${
            metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${metrics.totalGainLoss.toFixed(2)}
          </p>
          <p className={`text-sm ${
            metrics.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {metrics.totalGainLossPercent.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Number of Holdings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {holdings.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Sector Allocation</h3>
          <div className="h-64">
            <Line
              data={sectorChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Top Holdings</h3>
          <div className="space-y-4">
            {metrics.topHoldings.map((holding) => {
              const value = (holding.currentPrice || 0) * holding.quantity;
              const percentage = (value / metrics.totalValue) * 100;
              
              return (
                <div key={holding.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{holding.stock.symbol}</p>
                    <p className="text-sm text-gray-500">{holding.stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${value.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 