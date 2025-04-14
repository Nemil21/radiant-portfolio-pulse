
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from '@/context/FinanceContext';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface StockActionDialogProps {
  holdingId: string;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  action: 'buy' | 'sell';
  trigger?: React.ReactNode;
}

const StockActionDialog: React.FC<StockActionDialogProps> = ({
  holdingId,
  stockSymbol,
  stockName,
  currentPrice,
  action,
  trigger
}) => {
  const { addStock, removeStock } = useFinance();
  
  // Form state
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(currentPrice);
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleAction = async () => {
    if (quantity <= 0 || price <= 0) return;
    
    setSubmitting(true);
    
    try {
      let success = false;
      
      if (action === 'buy') {
        success = await addStock(stockSymbol, quantity, price);
      } else {
        success = await removeStock(holdingId, price);
      }
      
      if (success) {
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error(`Error ${action === 'buy' ? 'buying' : 'selling'} stock:`, error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setQuantity(0);
    setPrice(currentPrice);
  };
  
  const actionColor = action === 'buy' ? 'finance-profit' : 'finance-loss';
  const ActionIcon = action === 'buy' ? TrendingUp : TrendingDown;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className={`text-${actionColor} border-${actionColor}/30 hover:bg-${actionColor}/10`}
          >
            <ActionIcon className="h-4 w-4 mr-2" />
            {action === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {action === 'buy' ? 'Buy' : 'Sell'} {stockSymbol}
          </DialogTitle>
          <DialogDescription>
            {stockName} - Current price: ${currentPrice.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{action === 'buy' ? 'Purchase' : 'Sell'} Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          
          <div className="bg-secondary/20 p-3 rounded-md">
            <div className="flex justify-between">
              <span>Total {action === 'buy' ? 'Cost' : 'Proceeds'}</span>
              <span className="font-bold">${(price * quantity).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleAction}
            disabled={quantity <= 0 || price <= 0 || submitting}
            className={`bg-${actionColor} hover:bg-${actionColor}/80`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ActionIcon className="h-4 w-4 mr-2" />
            )}
            {action === 'buy' ? 'Buy' : 'Sell'} {stockSymbol}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockActionDialog;
