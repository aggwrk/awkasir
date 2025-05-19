
import { StartShiftDialog } from "@/components/StartShiftDialog";
import { useShift } from "@/contexts/ShiftContext";

export const ShiftManager = () => {
  const { isStartShiftDialogOpen, setIsStartShiftDialogOpen, refetchShift } = useShift();

  return (
    <StartShiftDialog 
      open={isStartShiftDialogOpen} 
      onOpenChange={setIsStartShiftDialogOpen}
      onSuccess={() => {
        refetchShift();
        setIsStartShiftDialogOpen(false);
      }} 
    />
  );
};
