
import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PortfolioValue from '@/components/dashboard/PortfolioValue';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import SectorBreakdown from '@/components/dashboard/SectorBreakdown';
import StockList from '@/components/dashboard/StockList';
import TopPerformers from '@/components/dashboard/TopPerformers';
import { Eye } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const Index = () => {
  const { 
    loading, 
    stocks, 
    watchlist, 
    performanceData, 
    sectorData, 
    portfolioSummary 
  } = useFinance();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-finance-teal animate-pulse"></div>
          <p className="mt-4 text-lg font-medium">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <PortfolioValue 
              totalValue={portfolioSummary.totalValue}
              totalProfit={portfolioSummary.totalProfit}
              totalProfitPercent={portfolioSummary.totalProfitPercent}
              historicalData={performanceData.monthly}
            />
            <PerformanceMetrics performanceData={performanceData} />
            <SectorBreakdown sectorData={sectorData} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <StockList 
                stocks={stocks} 
                title="Your Portfolio" 
                type="portfolio"
              />
            </div>
            <div className="flex flex-col gap-4">
              <TopPerformers stocks={stocks} />
              <StockList 
                stocks={watchlist} 
                title="Watchlist" 
                icon={<Eye className="h-5 w-5 mr-2" />} 
                type="watchlist"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
