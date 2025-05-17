
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ProductsPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeCategory: string | null;
  setActiveCategory: (categoryId: string | null) => void;
  addToCart: (product: Product) => void;
  activeShift: any;
}

const ProductsPanel = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  addToCart,
  activeShift,
}: ProductsPanelProps) => {
  const [categories, setCategories] = useState<any[]>([]);

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

  return (
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
  );
};

export default ProductsPanel;
