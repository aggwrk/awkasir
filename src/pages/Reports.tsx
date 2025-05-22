
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { CalendarIcon, Download } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [period, setPeriod] = useState("7days");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['salesReport', period, date],
    queryFn: async () => {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '7days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'month':
          if (date) {
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            endDate.setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
          }
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(product_id, quantity, subtotal),
          shifts(user_id)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (error) {
        toast.error("Failed to fetch sales data");
        throw error;
      }
      
      return data;
    }
  });

  // Fetch product information to map IDs to names
  const { data: productsData } = useQuery({
    queryKey: ['productsForReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name');
        
      if (error) {
        console.error("Error fetching products:", error);
        return [];
      }
      
      return data.reduce((acc: Record<string, string>, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {});
    }
  });

  // Process sales data for charts
  const processSalesData = () => {
    if (!salesData) return { dailySales: [], paymentMethodData: [], topProducts: [] };
    
    // Daily sales
    const salesByDate = salesData.reduce((acc: any, sale: any) => {
      const date = format(new Date(sale.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += parseFloat(sale.total_amount.toString());
      acc[date].count += 1;
      return acc;
    }, {});
    
    const dailySales = Object.values(salesByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Payment methods
    const paymentMethods = salesData.reduce((acc: any, sale: any) => {
      const method = sale.payment_method;
      if (!acc[method]) {
        acc[method] = { name: method === 'card' ? 'Credit/Debit Card' : 'Cash', value: 0 };
      }
      acc[method].value += parseFloat(sale.total_amount.toString());
      return acc;
    }, {});
    
    const paymentMethodData = Object.values(paymentMethods);
    
    // Top products
    const products: any = {};
    salesData.forEach((sale: any) => {
      sale.sale_items.forEach((item: any) => {
        if (!products[item.product_id]) {
          products[item.product_id] = { 
            id: item.product_id, 
            name: productsData?.[item.product_id] || `Product ${item.product_id.substring(0,8)}...`,
            quantity: 0, 
            revenue: 0 
          };
        }
        products[item.product_id].quantity += item.quantity;
        products[item.product_id].revenue += parseFloat(item.subtotal.toString());
      });
    });
    
    const topProducts = Object.values(products)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return { dailySales, paymentMethodData, topProducts };
  };

  const { dailySales, paymentMethodData, topProducts } = processSalesData();
  
  const totalSales = salesData?.reduce((total, sale) => total + parseFloat(sale.total_amount.toString()), 0) || 0;
  const totalTransactions = salesData?.length || 0;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Sales Reports</CardTitle>
            <CardDescription>
              Analyze your business performance
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="month">Specific Month</SelectItem>
              </SelectContent>
            </Select>
            
            {period === 'month' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'MMMM yyyy') : "Select month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) setDate(selectedDate);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
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
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{totalTransactions}</div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">${averageTicket.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Average Ticket</p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="sales" className="w-full">
              <TabsList>
                <TabsTrigger value="sales">Sales Trend</TabsTrigger>
                <TabsTrigger value="payment">Payment Methods</TabsTrigger>
                <TabsTrigger value="products">Top Products</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales" className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailySales}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM dd')} 
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Sales']}
                        labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Sales" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="payment" className="pt-4">
                <div className="h-[300px] flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Total']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="products" className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                        tickFormatter={(name) => {
                          return name.length > 20 ? `${name.substring(0, 20)}...` : name;
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']} 
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#8884d8">
                        {topProducts.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Reports;
