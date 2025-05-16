
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Grocery Store POS</h1>
        <p className="text-xl text-gray-600">Welcome, {user?.email}</p>
        <p className="text-md text-gray-500">You're successfully logged in!</p>
      </div>

      <div className="space-y-4">
        <Button onClick={signOut} variant="destructive">
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Index;
