
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";

interface AdjustStockDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AdjustStockDialog = ({ product, open, onOpenChange, onSuccess }: AdjustStockDialogProps) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(product?.id || null);
  const [quantity, setQuantity] = useState("1");
  const [adjustmentType, setAdjustmentType] = useState<"decrease" | "increase">("decrease");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch products for dropdown if no product is selected
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-adjustment"],
    queryFn: async () => {
      if (product) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open && !product,
  });

  const handleAdjustStock = async () => {
    if (!selectedProductId && !product?.id) {
      toast.error("Please select a product");
      return;
    }

    const productId = selectedProductId || product?.id;
    const quantityNum = parseInt(quantity);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        setIsSubmitting(false);
        return;
      }

      // Get current stock
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single();

      if (productError) {
        throw productError;
      }

      const currentStock = productData.stock_quantity;
      const adjustedQuantity = adjustmentType === "decrease" ? -quantityNum : quantityNum;

      // Don't allow negative stock
      if (adjustmentType === "decrease" && currentStock < quantityNum) {
        toast.error("Cannot reduce stock below zero");
        setIsSubmitting(false);
        return;
      }

      // 1. Add inventory transaction
      const { error: transactionError } = await supabase.from("inventory_transactions").insert({
        product_id: productId,
        quantity: adjustedQuantity,
        transaction_type: "adjustment",
        user_id: user.id,
        notes: notes || null,
      });

      if (transactionError) {
        throw transactionError;
      }

      // 2. Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock_quantity: adjustmentType === "decrease" 
            ? currentStock - quantityNum 
            : currentStock + quantityNum 
        })
        .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Successfully ${adjustmentType === "decrease" ? "removed" : "added"} ${quantityNum} items from inventory`);
      
      // Reset form and close dialog
      setQuantity("1");
      setNotes("");
      setSelectedProductId(null);
      setAdjustmentType("decrease");
      
      // Refresh related queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to adjust stock: ${error.message}`);
      console.error("Adjustment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity("1");
      setNotes("");
      setSelectedProductId(product?.id || null);
      setAdjustmentType("decrease");
    } else if (product) {
      setSelectedProductId(product.id);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            Adjust your inventory levels
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!product && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Product
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedProductId || ""}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.stock_quantity} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Adjustment
            </Label>
            <div className="col-span-3">
              <RadioGroup 
                value={adjustmentType} 
                onValueChange={(value) => setAdjustmentType(value as "decrease" | "increase")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <Label htmlFor="decrease">Decrease</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase">Increase</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <div className="col-span-3">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Reason
            </Label>
            <div className="col-span-3">
              <Textarea
                id="notes"
                placeholder="Reason for adjustment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdjustStock} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
