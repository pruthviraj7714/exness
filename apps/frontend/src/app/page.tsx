import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TrendingUp, Shield, Zap, BarChart3, Users, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Professional Trading Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-emerald-400 sm:text-6xl lg:text-7xl text-balance">
              Trade Options with
              <span className="text-white"> Confidence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-emrald-400text-emerald-400 text-pretty">
              Advanced options trading platform with real-time analytics, professional tools, and institutional-grade
              security. Start trading with as little as $10.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-black hover:bg-white/90">
                  Start Trading Now
                </Button>
              </Link>
              <Link href="/signin">
                <Button className="text-white bg-emerald-400 hover:bg-emerald-400/90">
                  Sign In to Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-emerald-400 sm:text-4xl">Professional Trading Tools</h2>
            <p className="mt-4 text-lg text-muted-emrald-400text-emerald-400">
              Everything you need to trade options like a professional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Advanced Analytics</CardTitle>
                </div>
                <CardDescription>
                  Real-time market data, technical indicators, and professional charting tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Secure Trading</CardTitle>
                </div>
                <CardDescription>
                  Bank-level security with encrypted transactions and regulatory compliance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Lightning Fast</CardTitle>
                </div>
                <CardDescription>Ultra-low latency execution with institutional-grade infrastructure</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Expert Support</CardTitle>
                </div>
                <CardDescription>24/7 professional support from experienced trading specialists</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Global Markets</CardTitle>
                </div>
                <CardDescription>Access to international markets with competitive spreads and fees</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-emerald-400" />
                  <CardTitle>Smart Insights</CardTitle>
                </div>
                <CardDescription>AI-powered market insights and personalized trading recommendations</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">$2.5B+</div>
              <div className="text-muted-emrald-400text-emerald-400 mt-2">Trading Volume</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">150K+</div>
              <div className="text-muted-emrald-400text-emerald-400 mt-2">Active Traders</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">99.9%</div>
              <div className="text-muted-emrald-400text-emerald-400 mt-2">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-emerald-400 sm:text-4xl text-balance">Ready to Start Trading?</h2>
          <p className="mt-4 text-lg text-muted-emrald-400text-emerald-400 text-pretty">
            Join thousands of professional traders who trust our platform
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg" className="text-white bg-emerald-400 hover:bg-emerald-400/90">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
