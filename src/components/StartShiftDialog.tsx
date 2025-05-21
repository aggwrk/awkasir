
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StartShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const StartShiftDialog = ({ open, onOpenChange, onSuccess }: StartShiftDialogProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [startingCash, setStartingCash] = useState("");

  const handleStartShift = async () => {
    if (!user) {
      toast.error("You must be logged in to start a shift");
      return;
    }

    if (!startingCash || isNaN(parseFloat(startingCash))) {
      toast.error("Please enter a valid starting cash amount");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting shift for user:", user.id);
      
      // First check if there are any active shifts
      const { data: existingShifts, error: checkError } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);
        
      if (checkError) {
        console.error("Error checking existing shifts:", checkError);
        throw checkError;
      }
      
      if (existingShifts && existingShifts.length > 0) {
        toast.info("You already have an active shift");
        onSuccess(); // Close dialog and refresh
        setIsLoading(false);
        return;
      }
      
      // Create new shift
      const currentTime = new Date().toISOString();
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          user_id: user.id,
          starting_cash: parseFloat(startingCash),
          status: 'active',
          start_time: currentTime
        })
        .select();

      if (error) {
        console.error("Error starting shift:", error);
        
        if (error.code === "42501") {
          toast.error("Permission denied: Make sure you have the right permissions");
        } else if (error.message.includes("violates row-level security policy")) {
          toast.error("Security policy violation: Contact administrator");
        } else {
          toast.error("Failed to start shift: " + error.message);
        }
        
        throw error;
      }

      console.log("Shift started successfully:", data);
      toast.success("Shift started successfully");
      setStartingCash("");
      onSuccess();
    } catch (error) {
      console.error("Error starting shift:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Shift</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="starting-cash" className="col-span-4">
              Starting Cash Amount
            </Label>
            <div className="col-span-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  $
                </span>
                <Input
                  id="starting-cash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the amount of cash in the register at the start of your shift
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleStartShift} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
