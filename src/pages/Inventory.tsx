
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { RestockDialog } from "@/components/inventory/RestockDialog";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog";

const Inventory = () => {
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  const { data: inventory = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory', sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });
      
      if (error) {
        toast.error(`Error fetching inventory: ${error.message}`);
        throw new Error(`Error fetching inventory: ${error.message}`);
      }
      
      return data;
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'Out of stock', color: 'red' };
    if (quantity <= 5) return { label: 'Low stock', color: 'amber' };
    if (quantity > 20) return { label: 'Well stocked', color: 'green' };
    return { label: 'In stock', color: 'gray' };
  };

  const openRestockDialog = (product: any) => {
    setSelectedProduct(product);
    setIsRestockDialogOpen(true);
  };

  const openAdjustDialog = (product: any) => {
    setSelectedProduct(product);
    setIsAdjustDialogOpen(true);
  };

  const handleInventoryUpdate = () => {
    refetch();
  };

  return (
    <>
      <RestockDialog 
        product={selectedProduct} 
        open={isRestockDialogOpen} 
        onOpenChange={setIsRestockDialogOpen} 
        onSuccess={handleInventoryUpdate}
      />
      
      <AdjustStockDialog 
        product={selectedProduct} 
        open={isAdjustDialogOpen} 
        onOpenChange={setIsAdjustDialogOpen}
        onSuccess={handleInventoryUpdate}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Inventory Management</CardTitle>
              <CardDescription>
                Track and manage your stock levels
              </CardDescription>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button onClick={() => openRestockDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Restock
              </Button>
              <Button variant="outline" onClick={() => openAdjustDialog(null)}>
                <MinusCircle className="mr-2 h-4 w-4" />
                Adjust
              </Button>
            </div>
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Product
                        {sortBy === 'name' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('stock_quantity')}>
                      <div className="flex items-center">
                        Current Stock
                        {sortBy === 'stock_quantity' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item: any) => {
                    const status = getStockStatus(item.stock_quantity);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
                        <TableCell>{item.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`
                              ${status.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                              ${status.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                              ${status.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              ${status.color === 'gray' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                            `}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openRestockDialog(item)}
                          >
                            Update Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Inventory;
