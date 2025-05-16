
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock_quantity: number;
  image_url: string | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500 text-xs">No image</span>
          </div>
        )}
        
        {isOutOfStock && (
          <Badge className="absolute top-2 right-2 bg-red-500">Out of stock</Badge>
        )}
        
        {isLowStock && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-amber-50 border-amber-500 text-amber-700">
            Low stock: {product.stock_quantity}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-1">
          <div className="truncate font-medium text-sm" title={product.name}>
            {product.name}
          </div>
          <div className="text-sm font-bold">${product.price.toFixed(2)}</div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs"
          disabled={isOutOfStock}
          onClick={onAddToCart}
        >
          <PlusCircle className="mr-1 h-3 w-3" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
