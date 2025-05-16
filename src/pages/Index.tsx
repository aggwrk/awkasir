
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ShoppingCart, Package, ClipboardList, CalendarClock, BarChart3 } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Grocery Store POS</h1>
        <p className="text-xl text-gray-600">Welcome, {user?.email}</p>
        <p className="text-md text-gray-500 mb-8">You're successfully logged in!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-8">
        <Link to="/pos" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col items-center">
            <ShoppingCart className="h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold">Point of Sale</h2>
            <p className="text-gray-500 text-center mt-2">Process sales and transactions</p>
          </div>
        </Link>

        <Link to="/pos/products" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col items-center">
            <Package className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold">Products</h2>
            <p className="text-gray-500 text-center mt-2">Manage product catalog</p>
          </div>
        </Link>

        <Link to="/pos/inventory" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col items-center">
            <ClipboardList className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold">Inventory</h2>
            <p className="text-gray-500 text-center mt-2">Track and manage stock</p>
          </div>
        </Link>

        <Link to="/pos/shifts" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col items-center">
            <CalendarClock className="h-12 w-12 text-purple-500 mb-4" />
            <h2 className="text-xl font-semibold">Shifts</h2>
            <p className="text-gray-500 text-center mt-2">Manage cashier shifts</p>
          </div>
        </Link>

        <Link to="/pos/reports" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col items-center">
            <BarChart3 className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold">Reports</h2>
            <p className="text-gray-500 text-center mt-2">View sales analytics</p>
          </div>
        </Link>
      </div>

      <Button onClick={signOut} variant="destructive">
        Log Out
      </Button>
    </div>
  );
};

export default Index;
