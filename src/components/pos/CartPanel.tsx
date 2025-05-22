import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, PlusCircle, MinusCircle, Trash2 } from "lucide-react";

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

interface CartPanelProps {
  cart: CartItem[];
  activeShift: any;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  calculateTotal: () => number;
  calculateTax: () => number;
  calculateGrandTotal: () => number;
  handleCheckout: () => void;
  handlePrint: () => void;
}

const CartPanel = ({
  cart,
  activeShift,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  calculateTotal,
  calculateTax,
  calculateGrandTotal,
  handleCheckout,
}: CartPanelProps) => {
  return (
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
        <Button 
          className="w-full" 
          onClick={handleCheckout}
          disabled={cart.length === 0 || !activeShift}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Checkout
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CartPanel;
