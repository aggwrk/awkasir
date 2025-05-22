
import { Button } from "@/components/ui/button";
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { useShift } from "@/contexts/ShiftContext";
import { useEffect } from "react";
import { PowerOff } from "lucide-react";
import { toast } from "sonner";

export const ShiftManager = () => {
  const { isStartShiftDialogOpen, setIsStartShiftDialogOpen, refetchShift, activeShift, endShift } = useShift();

  // Log shift status for debugging
  useEffect(() => {
    console.log("ShiftManager - Active shift status:", activeShift ? activeShift.status : "No active shift");
    console.log("ShiftManager - Dialog open:", isStartShiftDialogOpen);
  }, [activeShift, isStartShiftDialogOpen]);

  const handleEndShift = async () => {
    if (!activeShift) {
      toast.error("No active shift to end");
      return;
    }
    
    if (window.confirm("Are you sure you want to end your current shift?")) {
      try {
        await endShift();
        toast.success("Shift ended successfully");
      } catch (error) {
        console.error("Failed to end shift:", error);
        toast.error("Failed to end shift");
      }
    }
  };

  return (
    <>
      <StartShiftDialog 
        open={isStartShiftDialogOpen} 
        onOpenChange={setIsStartShiftDialogOpen}
        onSuccess={() => {
          console.log("Shift started successfully, refetching...");
          refetchShift();
          setIsStartShiftDialogOpen(false);
        }} 
      />
      
      {activeShift && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="absolute top-4 right-4 z-10"
          onClick={handleEndShift}
        >
          <PowerOff className="mr-2 h-4 w-4" />
          End Shift
        </Button>
      )}
    </>
  );
};
