
import { useState } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string | null;
  description: string | null;
  category_id: string | null;
  stock_quantity: number;
  image_url: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        const currentQuantity = updatedCart[existingItemIndex].quantity;
        
        if (currentQuantity < product.stock_quantity) {
          updatedCart[existingItemIndex].quantity += 1;
          updatedCart[existingItemIndex].subtotal = 
            updatedCart[existingItemIndex].quantity * product.price;
        } else {
          toast.error(`Cannot add more ${product.name}, insufficient stock`);
        }
        
        return updatedCart;
      } else {
        return [...prev, { 
          product, 
          quantity: 1, 
          subtotal: product.price 
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const increaseQuantity = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        if (item.quantity < item.product.stock_quantity) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.product.price
          };
        } else {
          toast.error(`Cannot add more ${item.product.name}, insufficient stock`);
        }
      }
      return item;
    }));
  };

  const decreaseQuantity = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.quantity > 1) {
        const newQuantity = item.quantity - 1;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.product.price
        };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.08; // 8% tax rate
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    calculateTotal,
    calculateTax,
    calculateGrandTotal,
    clearCart
  };
};
