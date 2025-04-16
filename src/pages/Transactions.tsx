import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Search, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Transaction } from '@/services/portfolioService';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import TransactionCharts from '@/components/transactions/TransactionCharts';
import ProfitLossSummary from '@/components/transactions/ProfitLossSummary';
import SectorProfitLoss from '@/components/transactions/SectorProfitLoss';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

const Transactions: React.FC = () => {
  const { 
    transactions, 
    transactionStats, 
    profitLossData,
    loadingTransactions,
    refreshTransactions 
  } = useFinance();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Transaction>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Refresh data when component mounts
  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle sort
  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => 
      transaction.stockSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="container mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground">
                View and analyze your transaction history
              </p>
            </div>

            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="profitLoss">Profit/Loss</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-6">
                <TransactionSummary stats={transactionStats} loading={loadingTransactions} />
                <TransactionCharts stats={transactionStats} loading={loadingTransactions} />
              </TabsContent>
              
              {/* Profit/Loss Tab */}
              <TabsContent value="profitLoss" className="space-y-6">
                <ProfitLossSummary data={profitLossData} loading={loadingTransactions} />
                <SectorProfitLoss data={profitLossData.sectorProfitLoss} loading={loadingTransactions} />
              </TabsContent>
              
              {/* Transaction History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto font-medium"
                                onClick={() => handleSort('transactionDate')}
                              >
                                Date
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto font-medium"
                                onClick={() => handleSort('stockSymbol')}
                              >
                                Stock
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto font-medium"
                                onClick={() => handleSort('transactionType')}
                              >
                                Type
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto font-medium"
                                onClick={() => handleSort('price')}
                              >
                                Price
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto font-medium"
                                onClick={() => handleSort('quantity')}
                              >
                                Quantity
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                              <TableCell className="font-medium">
                                {transaction.stockSymbol}
                                <div className="text-xs text-muted-foreground">{transaction.stockName}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={transaction.transactionType === 'buy' ? 'default' : 'destructive'} className={transaction.transactionType === 'buy' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                  {transaction.transactionType.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(transaction.price)}</TableCell>
                              <TableCell>{transaction.quantity}</TableCell>
                              <TableCell>{formatCurrency(transaction.price * transaction.quantity)}</TableCell>
                              <TableCell>{transaction.notes}</TableCell>
                            </TableRow>
                          ))}
                          {filteredTransactions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                No transactions found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;
