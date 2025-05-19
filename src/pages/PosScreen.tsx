
import { useState } from "react";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import ProductsPanel from "@/components/pos/ProductsPanel";
import CartPanel from "@/components/pos/CartPanel";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { ShiftManager } from "@/components/ShiftManager";
import { useShift } from "@/contexts/ShiftContext";
import { toast } from "sonner";

const PosScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const { activeShift } = useShift();

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

  const onCheckout = async () => {
    if (!activeShift) {
      toast.error("You need to start a shift first");
      return;
    }
    
    await handleCheckout(activeShift);
  };

  return (
    <div className="h-full">
      <ShiftManager />
      
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
