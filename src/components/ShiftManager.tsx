
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { useShift } from "@/contexts/ShiftContext";
import { useEffect } from "react";

export const ShiftManager = () => {
  const { isStartShiftDialogOpen, setIsStartShiftDialogOpen, refetchShift, activeShift } = useShift();

  // Log shift status for debugging
  useEffect(() => {
    console.log("ShiftManager - Active shift status:", activeShift ? activeShift.status : "No active shift");
    console.log("ShiftManager - Dialog open:", isStartShiftDialogOpen);
  }, [activeShift, isStartShiftDialogOpen]);

  return (
    <StartShiftDialog 
      open={isStartShiftDialogOpen} 
      onOpenChange={setIsStartShiftDialogOpen}
      onSuccess={() => {
        console.log("Shift started successfully, refetching...");
        refetchShift();
        setIsStartShiftDialogOpen(false);
      }} 
    />
  );
};
