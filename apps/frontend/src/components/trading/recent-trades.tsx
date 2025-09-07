import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const recentTrades = [
  { id: 1, symbol: "AAPL", type: "CALL", strike: 190, expiry: "2024-01-19", status: "Open", pnl: 125.5 },
  { id: 2, symbol: "TSLA", type: "PUT", strike: 250, expiry: "2024-01-26", status: "Closed", pnl: -45.2 },
  { id: 3, symbol: "SPY", type: "CALL", strike: 450, expiry: "2024-02-02", status: "Open", pnl: 78.9 },
]

export function RecentTrades() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>Your latest options positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  <Badge variant="outline">{trade.type}</Badge>
                  <span className="text-sm text-muted-foreground">${trade.strike}</span>
                </div>
                <div className="text-xs text-muted-foreground">Exp: {trade.expiry}</div>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={trade.status === "Open" ? "default" : "secondary"}>{trade.status}</Badge>
                <div className={`text-sm font-semibold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
