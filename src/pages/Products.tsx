
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Plus, Trash2 } from "lucide-react";
import { AddProductDialog } from "@/components/AddProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { toast } from "sonner";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['allProducts', searchTerm],
    queryFn: async () => {
      let query = supabase.from('products').select(`
        *,
        categories(name)
      `);
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }
      
      return data;
    }
  });

  const handleEditProduct = (product: any) => {
    setEditProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setDeletingProductId(productId);
    
    try {
      // First, delete all inventory transactions for this product
      const { error: inventoryError } = await supabase
        .from("inventory_transactions")
        .delete()
        .eq("product_id", productId);

      if (inventoryError) {
        throw inventoryError;
      }

      // Then, delete all sale items for this product
      const { error: saleItemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("product_id", productId);

      if (saleItemsError) {
        throw saleItemsError;
      }

      // Finally, delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productError) {
        throw productError;
      }

      toast.success("Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["allProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      toast.error(`Failed to delete product: ${error.message}`);
      console.error("Delete product error:", error);
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <>
      <AddProductDialog 
        open={isAddProductDialogOpen} 
        onOpenChange={setIsAddProductDialogOpen} 
      />
      
      <EditProductDialog
        product={editProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Products</CardTitle>
            <CardDescription>
              Manage your product catalog
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddProductDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Package className="h-8 w-8 mb-2" />
                          <p>No products found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>${product.cost_price?.toFixed(2) || '—'}</TableCell>
                        <TableCell>
                          <span className={product.stock_quantity <= 0 ? 'text-red-500' : ''}>
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell>{product.barcode || '—'}</TableCell>
                        <TableCell>
                          {product.image_url ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingProductId === product.id}
                            >
                              {deletingProductId === product.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Products;
