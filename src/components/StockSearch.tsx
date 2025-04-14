import React, { useState, useCallback, useRef } from 'react';
import { useCombobox } from 'downshift';
import { debounce } from 'lodash';
import finnhubService from '../services/finnhub';
import type { StockSymbol } from '../services/finnhub';

interface StockSearchProps {
  onSelect: (symbol: StockSymbol) => void;
  placeholder?: string;
  className?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search stocks...', className = '' }: StockSearchProps) {
  const [items, setItems] = useState<StockSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchStocks = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setItems([]);
        return;
      }

      setIsLoading(true);

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const results = await finnhubService.searchSymbols(query);
        setItems(results);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to search stocks:', error);
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items,
    onInputValueChange: ({ inputValue }) => {
      searchStocks(inputValue || '');
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSelect(selectedItem);
      }
    },
    itemToString: (item) => item?.symbol || '',
  });

  return (
    <div className={`relative ${className}`}>
      <div {...getComboboxProps()}>
        <input
          {...getInputProps()}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
      <ul
        {...getMenuProps()}
        className={`absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg ${
          isOpen && items.length > 0 ? '' : 'hidden'
        }`}
      >
        {isOpen &&
          items.map((item, index) => (
            <li
              key={item.symbol}
              {...getItemProps({ item, index })}
              className={`px-4 py-2 cursor-pointer ${
                highlightedIndex === index
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.symbol}</span>
                <span className="text-sm text-gray-500">{item.type}</span>
              </div>
              <div className="text-sm text-gray-500 truncate">
                {item.description}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
} 