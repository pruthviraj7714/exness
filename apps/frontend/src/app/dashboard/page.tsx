import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogOut } from "lucide-react";
import TradingInterface from "@/components/trading/trading-interface";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    redirect("/signin");
  }

  const user = verifyAuthToken(token);
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 sm:px-2 lg:px-4 py-4">
        <TradingInterface />
      </div>
    </div>
  );
}
