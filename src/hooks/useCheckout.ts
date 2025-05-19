
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  tax_amount: number;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
}

export const useCheckout = (
  cart: CartItem[],
  calculateGrandTotal: () => number,
  calculateTax: () => number,
  clearCart: () => void
) => {
  const { user } = useAuth();
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  const handleCheckout = async (activeShift: any) => {
    if (!activeShift) {
      toast.error("You need to start a shift first");
      return false;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return false;
    }

    try {
      // 1. Create a new sale
      const { data: receiptData, error: receiptError } = await supabase.rpc('generate_receipt_number');
      
      if (receiptError) {
        toast.error("Failed to generate receipt number");
        console.error(receiptError);
        return false;
      }
      
      const receipt_number = receiptData;
      const total_amount = calculateGrandTotal();
      const tax_amount = calculateTax();
      const payment_method = "cash"; // Default payment method
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          shift_id: activeShift.id,
          user_id: user?.id,
          total_amount,
          tax_amount,
          payment_method,
          receipt_number
        })
        .select('*')
        .single();
      
      if (saleError) {
        toast.error("Failed to create sale");
        console.error(saleError);
        return false;
      }
      
      // 2. Create sale items
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) {
        toast.error("Failed to create sale items");
        console.error(itemsError);
        return false;
      }
      
      // 3. Update inventory
      for (const item of cart) {
        // Create inventory transaction
        const { error: invError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.product.id,
            quantity: -item.quantity, // Negative for sales
            transaction_type: 'sale',
            reference_id: saleData.id,
            user_id: user?.id
          });
        
        if (invError) {
          toast.error(`Failed to update inventory for ${item.product.name}`);
          console.error(invError);
          continue;
        }
        
        // Update product stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.product.stock_quantity - item.quantity 
          })
          .eq('id', item.product.id);
        
        if (stockError) {
          toast.error(`Failed to update stock for ${item.product.name}`);
          console.error(stockError);
        }
      }
      
      // 4. Show receipt
      setCompletedSale({
        ...saleData,
        items: cart.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: item.subtotal
        }))
      });
      
      setIsReceiptDialogOpen(true);
      
      // 5. Clear cart
      clearCart();
      
      toast.success("Sale completed successfully");
      return true;
      
    } catch (error) {
      toast.error("An error occurred during checkout");
      console.error(error);
      return false;
    }
  };

  const handlePrint = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    const mockSale = {
      id: "preview",
      receipt_number: "PREVIEW",
      total_amount: calculateGrandTotal(),
      tax_amount: calculateTax(),
      payment_method: "preview",
      created_at: new Date().toISOString(),
      items: cart.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.subtotal
      }))
    };
    
    setCompletedSale(mockSale);
    setIsReceiptDialogOpen(true);
  };

  return {
    completedSale,
    isReceiptDialogOpen,
    setIsReceiptDialogOpen,
    handleCheckout,
    handlePrint
  };
};
