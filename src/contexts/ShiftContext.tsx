
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface ShiftContextType {
  activeShift: any | null;
  isStartShiftDialogOpen: boolean;
  setIsStartShiftDialogOpen: (open: boolean) => void;
  refetchShift: () => Promise<any>;
  isLoading: boolean;
  endShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);
  
  const { data: shiftData, refetch: refetchShift, isLoading } = useQuery({
    queryKey: ['activeShift', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1);
        
      if (error) {
        return null;
      }
      
      return data?.length > 0 ? data[0] : null;
    },
    enabled: !!user
  });

  useEffect(() => {
    setActiveShift(shiftData);
    
    if (!shiftData) {
      setIsStartShiftDialogOpen(true);
    }
  }, [shiftData]);

  const endShift = async () => {
    if (!activeShift) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'ended',
          end_time: new Date().toISOString(),
        })
        .eq('id', activeShift.id);

      if (error) throw error;
      
      await refetchShift();
      setIsStartShiftDialogOpen(true);
    } catch (error) {
      console.error('Error ending shift:', error);
    }
  };

  const value = {
    activeShift,
    isStartShiftDialogOpen,
    setIsStartShiftDialogOpen,
    refetchShift,
    isLoading,
    endShift
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
}
