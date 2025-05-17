
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import ProductsPanel from "@/components/pos/ProductsPanel";
import CartPanel from "@/components/pos/CartPanel";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";

const PosScreen = () => {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    calculateTotal,
    calculateTax,
    calculateGrandTotal,
    clearCart
  } = useCart();

  const {
    completedSale,
    isReceiptDialogOpen,
    setIsReceiptDialogOpen,
    handleCheckout,
    handlePrint
  } = useCheckout(cart, calculateGrandTotal, calculateTax, clearCart);

  // Check for active shift
  const { data: shiftData, refetch: refetchShift } = useQuery({
    queryKey: ['activeShift', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1);
        
      if (error) {
        return null;
      }
      
      return data?.length > 0 ? data[0] : null;
    },
    enabled: !!user
  });

  useEffect(() => {
    setActiveShift(shiftData);
    
    if (!shiftData) {
      setIsStartShiftDialogOpen(true);
    }
  }, [shiftData]);

  const onCheckout = async () => {
    await handleCheckout(activeShift);
  };

  return (
    <div className="h-full">
      <StartShiftDialog 
        open={isStartShiftDialogOpen} 
        onOpenChange={setIsStartShiftDialogOpen}
        onSuccess={() => {
          refetchShift();
          setIsStartShiftDialogOpen(false);
        }} 
      />
      
      <ReceiptDialog
        open={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        sale={completedSale}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Products Panel */}
        <div className="lg:col-span-2">
          <ProductsPanel
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            addToCart={addToCart}
            activeShift={activeShift}
          />
        </div>
        
        {/* Cart Panel */}
        <div>
          <CartPanel
            cart={cart}
            activeShift={activeShift}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
            calculateTotal={calculateTotal}
            calculateTax={calculateTax}
            calculateGrandTotal={calculateGrandTotal}
            handleCheckout={onCheckout}
            handlePrint={handlePrint}
          />
        </div>
      </div>
    </div>
  );
};

export default PosScreen;
