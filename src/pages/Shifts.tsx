import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, Play } from "lucide-react";
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useShift } from "@/contexts/ShiftContext";
import { toast } from "sonner";

const Shifts = () => {
  const { user } = useAuth();
  const { refetchShift } = useShift();
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);
  
  const { data: shifts = [], isLoading, refetch } = useQuery({
    queryKey: ['shifts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          sales(id)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
      
      if (error) {
        toast.error("Failed to load shifts");
        throw error;
      }
      
      return data.map((shift: any) => ({
        ...shift,
        sales_count: shift.sales?.length || 0
      }));
    },
    enabled: !!user
  });

  const handleEndShift = async (shiftId: string) => {
    try {
      const { data: shiftData, error: getError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
        
      if (getError) {
        toast.error("Failed to load shift data");
        throw getError;
      }
      
      // Calculate total sales for the shift
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('shift_id', shiftId);
        
      if (salesError) {
        toast.error("Failed to calculate sales data");
        throw salesError;
      }
      
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
      const expectedCash = parseFloat(shiftData.starting_cash.toString()) + totalSales;
      
      // Prompt for closing cash amount
      const closingCash = prompt("Enter closing cash amount:", expectedCash.toFixed(2));
      if (closingCash === null) return; // User canceled
      
      const closingCashAmount = parseFloat(closingCash);
      if (isNaN(closingCashAmount)) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      // Update the shift
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          end_time: new Date().toISOString(),
          closing_cash: closingCashAmount,
          expected_cash: expectedCash,
          status: 'closed'
        })
        .eq('id', shiftId);
        
      if (updateError) {
        toast.error("Failed to end shift");
        throw updateError;
      }
      
      toast.success("Shift ended successfully");
      refetch();
      
    } catch (error) {
      console.error("Error ending shift:", error);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <>
      <StartShiftDialog 
        open={isStartShiftDialogOpen} 
        onOpenChange={setIsStartShiftDialogOpen}
        onSuccess={() => {
          refetch();
          refetchShift();
          setIsStartShiftDialogOpen(false);
        }}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Shifts</CardTitle>
              <CardDescription>
                Manage your cash register shifts
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setIsStartShiftDialogOpen(true)}>
                <Play className="mr-2 h-4 w-4" />
                Start New Shift
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-10">
              <CalendarClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-medium text-gray-900">No shifts found</h3>
              <p className="text-gray-500 mt-1">Get started by creating your first shift.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Starting Cash</TableHead>
                    <TableHead>Closing Cash</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift: any) => (
                    <TableRow key={shift.id}>
                      <TableCell>{formatDateTime(shift.start_time)}</TableCell>
                      <TableCell>{shift.end_time ? formatDateTime(shift.end_time) : '—'}</TableCell>
                      <TableCell>{calculateDuration(shift.start_time, shift.end_time)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={shift.status === 'active' ? 'default' : 'secondary'}
                          className={shift.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {shift.status === 'active' ? 'Active' : 'Closed'}
                        </Badge>
                      </TableCell>
                      <TableCell>${parseFloat(shift.starting_cash).toFixed(2)}</TableCell>
                      <TableCell>{shift.closing_cash ? `$${parseFloat(shift.closing_cash).toFixed(2)}` : '—'}</TableCell>
                      <TableCell>{shift.sales_count}</TableCell>
                      <TableCell className="text-right">
                        {shift.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEndShift(shift.id)}
                          >
                            End Shift
                          </Button>
                        )}
                        {shift.status !== 'active' && (
                          <Button variant="ghost" size="sm">View Details</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Shifts;
