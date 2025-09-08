import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  LogOut,
} from "lucide-react";
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
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                TradePro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <form
                action={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/signout`}
                method="post"
              >
                <Button variant="destructive" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto px-2 sm:px-2 lg:px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Trading Dashboard
          </h1>
        </div>
        <TradingInterface />
      </div>
    </div>
  );
}
