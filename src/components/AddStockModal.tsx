import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addHolding } from '../store/slices/portfolioSlice';
import { addTransaction } from '../store/slices/transactionsSlice';
import StockSearch from './StockSearch';
import type { StockSymbol } from '../services/finnhub';
import finnhubService from '../services/finnhub';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddStockModal({ isOpen, onClose, userId }: AddStockModalProps) {
  const dispatch = useDispatch();
  const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStockSelect = async (stock: StockSymbol) => {
    setSelectedStock(stock);
    // Pre-fill with current market price
    try {
      const quote = await finnhubService.getQuote(stock.symbol);
      setPrice(quote.c.toString());
    } catch (error) {
      console.error('Failed to fetch stock price:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !quantity || !price) return;

    setIsLoading(true);
    setError(null);

    try {
      await dispatch(addHolding({
        userId,
        symbol: selectedStock.symbol,
        quantity: Number(quantity),
        price: Number(price),
      })).unwrap();

      // Reset form and close modal
      setSelectedStock(null);
      setQuantity('');
      setPrice('');
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to add stock to portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              Add Stock to Portfolio
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Stock
                </label>
                <StockSearch
                  onSelect={handleStockSelect}
                  placeholder="Enter stock symbol or name..."
                />
              </div>

              {selectedStock && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Share
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price per share"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStock || !quantity || !price || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding...' : 'Add to Portfolio'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 