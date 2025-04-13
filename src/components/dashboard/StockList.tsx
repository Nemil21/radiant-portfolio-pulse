
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, ChevronUp, ChevronDown, Search } from "lucide-react";
import { StockData } from '@/data/mockData';
import { Input } from '@/components/ui/input';

interface StockListProps {
  stocks: StockData[];
  title?: string;
  icon?: React.ReactNode;
}

const StockList: React.FC<StockListProps> = ({ 
  stocks, 
  title = "Your Portfolio",
  icon = <BarChart3 className="h-5 w-5 mr-2" />,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return formatCurrency(value);
  };
  
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card className="glass h-full animate-fade-in animate-delay-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          {icon}
          {title}
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks..."
            className="pl-8 bg-secondary/20 border-secondary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="bg-secondary/20 sticky top-0">
              <TableRow>
                <TableHead className="w-[100px]">Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                {stocks[0]?.quantity > 0 && (
                  <>
                    <TableHead className="text-right">Holdings</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.length > 0 ? (
                filteredStocks.map(stock => (
                  <TableRow key={stock.id} className="hover:bg-secondary/20 cursor-pointer animate-scale-in">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: stock.color }}></div>
                        {stock.symbol}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{stock.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stock.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className={`inline-flex items-center ${stock.change >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                        {stock.change >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {Math.abs(stock.changePercent).toFixed(2)}%
                      </div>
                    </TableCell>
                    {stock.quantity > 0 && (
                      <>
                        <TableCell className="text-right">
                          <div className="flex flex-col">
                            <span>{stock.quantity} shares</span>
                            <span className="text-xs text-muted-foreground">{formatCurrency(stock.value)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex flex-col ${stock.profit >= 0 ? 'text-finance-profit' : 'text-finance-loss'}`}>
                            <span>{formatCurrency(stock.profit)}</span>
                            <span className="text-xs">{stock.profitPercent.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={stocks[0]?.quantity > 0 ? 6 : 4} className="text-center text-muted-foreground py-6">
                    No stocks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockList;
