
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  tax_amount: number;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export const ReceiptDialog = ({ open, onOpenChange, sale }: ReceiptDialogProps) => {
  if (!sale) return null;
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert("Please allow pop-ups to print receipts");
      return;
    }
    
    const receiptContent = document.getElementById('receipt-content');
    
    if (!receiptContent) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${sale.receipt_number}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
            }
            .receipt-header h2 {
              margin: 0;
              font-size: 16px;
            }
            .receipt-header p {
              margin: 5px 0;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              text-align: left;
              padding: 3px 0;
            }
            .right {
              text-align: right;
            }
            .receipt-total {
              margin-top: 10px;
              font-size: 12px;
            }
            .receipt-footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt #{sale.receipt_number}</DialogTitle>
        </DialogHeader>
        
        <div id="receipt-content" className="text-sm space-y-4">
          <div className="text-center">
            <h2 className="font-bold">Grocery Store POS</h2>
            <p className="text-xs text-gray-500">123 Main Street, Anytown USA</p>
            <p className="text-xs text-gray-500">Tel: (555) 123-4567</p>
            <p className="text-xs">{formatDate(sale.created_at)}</p>
            <p className="text-xs">Receipt: #{sale.receipt_number}</p>
          </div>
          
          <div className="border-t border-dashed border-gray-200 pt-2"></div>
          
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left font-medium">Item</th>
                <th className="text-right font-medium">Qty</th>
                <th className="text-right font-medium">Price</th>
                <th className="text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-1">{item.product_name}</td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">${item.unit_price.toFixed(2)}</td>
                  <td className="text-right py-1">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(sale.total_amount - sale.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${sale.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment Method:</span>
              <span>{sale.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash'}</span>
            </div>
          </div>
          
          <div className="border-t border-dashed border-gray-200 pt-2"></div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Thank you for shopping with us!</p>
            <p>Please keep your receipt for returns</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
