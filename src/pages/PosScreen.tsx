
import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Search, Trash2, PlusCircle, MinusCircle, ShoppingCart, Printer } from "lucide-react";
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";

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

const PosScreen = () => {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);

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
        toast.error('Failed to load active shift');
        return null;
      }
      
      return data?.length > 0 ? data[0] : null;
    },
    enabled: !!user
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products', searchTerm, activeCategory],
    queryFn: async () => {
      let query = supabase.from('products').select('*');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      if (activeCategory) {
        query = query.eq('category_id', activeCategory);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        toast.error('Failed to fetch products');
        return [];
      }
      
      return data as Product[];
    }
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
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

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  useEffect(() => {
    setActiveShift(shiftData);
    
    if (!shiftData) {
      setIsStartShiftDialogOpen(true);
    }
  }, [shiftData]);

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

  const handleCheckout = async () => {
    if (!activeShift) {
      toast.error("You need to start a shift first");
      setIsStartShiftDialogOpen(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      // 1. Create a new sale
      const { data: receiptData, error: receiptError } = await supabase.rpc('generate_receipt_number');
      
      if (receiptError) {
        toast.error("Failed to generate receipt number");
        return;
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
        return;
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
        return;
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
      setCart([]);
      
      toast.success("Sale completed successfully");
      
    } catch (error) {
      toast.error("An error occurred during checkout");
      console.error(error);
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
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Products</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                {activeShift ? (
                  <span className="flex items-center gap-2">
                    <span className="text-sm">Active shift started at {new Date(activeShift.start_time).toLocaleTimeString()}</span>
                    <Badge variant="outline" className="bg-green-50">Active</Badge>
                  </span>
                ) : (
                  <span className="text-red-500">No active shift</span>
                )}
              </CardDescription>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full overflow-auto">
                  <TabsTrigger value="all" onClick={() => setActiveCategory(null)}>All</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-320px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => addToCart(product)} 
                  />
                ))}
                {products.length === 0 && (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No products found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Cart Panel */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
              <CardDescription>
                {cart.length} item(s) in cart
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-435px)]">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Cart is empty
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => decreaseQuantity(item.product.id)}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => increaseQuantity(item.product.id)}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex-col">
              <div className="w-full space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handlePrint}
                  disabled={cart.length === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || !activeShift}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PosScreen;
