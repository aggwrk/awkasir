
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  cost_price: z.string().optional(),
  stock_quantity: z.string().min(1, "Stock quantity is required"),
  category_id: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const AddProductDialog = ({ open, onOpenChange }: AddProductDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      cost_price: "",
      stock_quantity: "0",
      category_id: "",
      barcode: "",
      description: "",
      image_url: "",
    },
  });
  
  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) {
        toast.error('Failed to fetch categories');
        return [];
      }
      
      return data;
    }
  });
  
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // Convert string values to appropriate types
      const product = {
        name: data.name,
        price: parseFloat(data.price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
        stock_quantity: parseInt(data.stock_quantity),
        category_id: data.category_id || null,
        barcode: data.barcode || null,
        description: data.description || null,
        image_url: data.image_url || null,
      };
      
      const { error } = await supabase
        .from('products')
        .insert(product);
      
      if (error) {
        toast.error(`Failed to add product: ${error.message}`);
        return;
      }
      
      toast.success("Product added successfully");
      reset(); // Reset form fields
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      onOpenChange(false); // Close dialog
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        reset(); // Reset form when dialog is closed
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name*</Label>
              <Input 
                id="name" 
                placeholder="Enter product name" 
                {...register("name")} 
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)*</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0.00" 
                {...register("price")} 
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price ($)</Label>
              <Input 
                id="cost_price" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0.00" 
                {...register("cost_price")} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity*</Label>
              <Input 
                id="stock_quantity" 
                type="number" 
                min="0" 
                placeholder="0" 
                {...register("stock_quantity")} 
              />
              {errors.stock_quantity && <p className="text-xs text-red-500">{errors.stock_quantity.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input 
                id="barcode" 
                placeholder="Enter barcode" 
                {...register("barcode")} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Enter product description" 
              className="min-h-[80px]" 
              {...register("description")} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input 
              id="image_url" 
              placeholder="Enter image URL" 
              {...register("image_url")} 
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
