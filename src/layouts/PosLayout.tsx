
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, ClipboardList, CalendarClock, BarChart3, Home, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const PosLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState<any>(null);
  
  // Check for active shift
  const { data: shiftData } = useQuery({
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
        toast.error('Failed to load active shift');
        return null;
      }
      
      return data?.length > 0 ? data[0] : null;
    },
    enabled: !!user
  });
  
  useEffect(() => {
    setActiveShift(shiftData);
  }, [shiftData]);

  const handleSignOut = async () => {
    try {
      if (activeShift) {
        toast.error("Please close your active shift before signing out");
        return;
      }
      
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Grocery POS</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
        
        {/* Navigation - flex-1 to take remaining space */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <NavLink 
              to="/"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <Home className="mr-2 h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/pos"
              end
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              <span>POS Screen</span>
            </NavLink>
            
            <NavLink 
              to="/pos/products"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <Package className="mr-2 h-5 w-5" />
              <span>Products</span>
            </NavLink>
            
            <NavLink 
              to="/pos/inventory"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              <span>Inventory</span>
            </NavLink>
            
            <NavLink 
              to="/pos/shifts"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <CalendarClock className="mr-2 h-5 w-5" />
              <span>Shifts</span>
              {activeShift && (
                <span className="ml-2 bg-green-500 rounded-full h-2 w-2"></span>
              )}
            </NavLink>
            
            <NavLink 
              to="/pos/reports"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
              }
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              <span>Reports</span>
            </NavLink>
          </div>
        </div>
        
        {/* Fixed bottom section for Profile and Sign Out */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <div className="flex flex-col space-y-2">
            <NavLink 
              to="/pos/profile"
              className={({ isActive }) => 
                `flex items-center p-2 rounded-md ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`
              }
            >
              <User className="mr-2 h-5 w-5" />
              <span>Profile</span>
            </NavLink>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosLayout;
