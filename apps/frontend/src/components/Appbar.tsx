import { LogOut, TrendingUp, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Appbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken");
  const isLoggedIn = !!token;

  return (
    <nav className="relative border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/50 to-zinc-950 opacity-60"></div>

      <div className="relative mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:bg-emerald-500/30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                TradePro
              </span>
            </div>
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">
                    Welcome back
                  </span>
                  <span className="text-xs text-emerald-400">
                    Active Session
                  </span>
                </div>
              </div>

              <form
                action={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/signout`}
                method="post"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className="relative overflow-hidden bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <LogOut className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Sign Out</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/signup">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:text-white transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/10 to-emerald-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 font-medium">Sign Up</span>
                </Button>
              </Link>

              <Link href="/signin">
                <Button
                  size="sm"
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 font-medium">Login</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
    </nav>
  );
}
