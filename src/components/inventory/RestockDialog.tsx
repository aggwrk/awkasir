
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
import { useQuery } from "@tanstack/react-query";

interface RestockDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RestockDialog = ({ product, open, onOpenChange, onSuccess }: RestockDialogProps) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(product?.id || null);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch products for dropdown if no product is selected
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-restock"],
    queryFn: async () => {
      if (product) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open && !product,
  });

  const handleRestock = async () => {
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

      // Get current stock quantity
      const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newStockQuantity = currentProduct.stock_quantity + quantityNum;

      // 1. Add inventory transaction
      const { error: transactionError } = await supabase.from("inventory_transactions").insert({
        product_id: productId,
        quantity: quantityNum,
        transaction_type: "restock",
        user_id: user.id,
        notes: notes || null,
      });

      if (transactionError) {
        throw transactionError;
      }

      // 2. Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newStockQuantity })
        .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Successfully added ${quantityNum} items to inventory`);
      
      // Reset form and close dialog
      setQuantity("1");
      setNotes("");
      setSelectedProductId(null);
      
      // Refresh related queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to restock: ${error.message}`);
      console.error("Restock error:", error);
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
    } else if (product) {
      setSelectedProductId(product.id);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock Inventory</DialogTitle>
          <DialogDescription>
            Add items to your inventory
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
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
              Notes
            </Label>
            <div className="col-span-3">
              <Textarea
                id="notes"
                placeholder="Optional notes about this restock"
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
          <Button onClick={handleRestock} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Restock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
