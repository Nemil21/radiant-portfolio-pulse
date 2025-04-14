import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon, BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import { addToWatchlist, removeFromWatchlist, updateWatchlistAlerts } from '../store/slices/watchlistSlice';
import type { RootState } from '../store';
import StockSearch from './StockSearch';
import type { StockSymbol } from '../services/finnhub';

interface WatchlistTableProps {
  userId: string;
}

export default function WatchlistTable({ userId }: WatchlistTableProps) {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state: RootState) => state.watchlist);
  const [showSearch, setShowSearch] = useState(false);
  const [editingAlerts, setEditingAlerts] = useState<string | null>(null);
  const [alertHigh, setAlertHigh] = useState<string>('');
  const [alertLow, setAlertLow] = useState<string>('');

  const handleAddStock = async (stock: StockSymbol) => {
    try {
      await dispatch(addToWatchlist({
        userId,
        symbol: stock.symbol,
      })).unwrap();
      setShowSearch(false);
    } catch (error) {
      console.error('Failed to add stock to watchlist:', error);
    }
  };

  const handleRemoveStock = async (itemId: string) => {
    try {
      await dispatch(removeFromWatchlist(itemId)).unwrap();
    } catch (error) {
      console.error('Failed to remove stock from watchlist:', error);
    }
  };

  const handleUpdateAlerts = async (itemId: string) => {
    try {
      await dispatch(updateWatchlistAlerts({
        itemId,
        priceAlertHigh: alertHigh ? Number(alertHigh) : undefined,
        priceAlertLow: alertLow ? Number(alertLow) : undefined,
      })).unwrap();
      setEditingAlerts(null);
      setAlertHigh('');
      setAlertLow('');
    } catch (error) {
      console.error('Failed to update price alerts:', error);
    }
  };

  const startEditingAlerts = (itemId: string, high?: number, low?: number) => {
    setEditingAlerts(itemId);
    setAlertHigh(high?.toString() || '');
    setAlertLow(low?.toString() || '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Watchlist</h2>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Stock
        </button>
      </div>

      {showSearch && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <StockSearch
            onSelect={handleAddStock}
            placeholder="Search for a stock to add..."
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price Alerts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.stock.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.stock.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.currentPrice?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingAlerts === item.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={alertHigh}
                        onChange={(e) => setAlertHigh(e.target.value)}
                        placeholder="High"
                        className="w-24 px-2 py-1 text-sm border rounded"
                      />
                      <input
                        type="number"
                        value={alertLow}
                        onChange={(e) => setAlertLow(e.target.value)}
                        placeholder="Low"
                        className="w-24 px-2 py-1 text-sm border rounded"
                      />
                      <button
                        onClick={() => handleUpdateAlerts(item.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {item.price_alert_high && (
                        <span className="text-green-600">
                          High: ${item.price_alert_high}
                        </span>
                      )}
                      {item.price_alert_low && (
                        <span className="text-red-600">
                          Low: ${item.price_alert_low}
                        </span>
                      )}
                      <button
                        onClick={() => startEditingAlerts(item.id, item.price_alert_high || undefined, item.price_alert_low || undefined)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <BellIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleRemoveStock(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 