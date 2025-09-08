"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

const INSTRUMENTS = [
  { symbol: "BTC", name: "Bitcoin", price: 45234.56, change: 2.34, changePercent: 5.45 },
  { symbol: "ETH", name: "Ethereum", price: 2834.12, change: -45.23, changePercent: -1.57 },
  { symbol: "SOL", name: "Solana", price: 98.45, change: 3.21, changePercent: 3.37 },
]

interface InstrumentListProps {
  onSelectInstrument: (symbol: string) => void
  selectedInstrument?: string
}

export function InstrumentList({ onSelectInstrument, selectedInstrument }: InstrumentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instruments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {INSTRUMENTS.map((instrument) => (
            <div
              key={instrument.symbol}
              className={`flex items-center justify-between p-4 border-b border-border/40 hover:bg-muted/50 cursor-pointer transition-colors ${
                selectedInstrument === instrument.symbol ? "bg-muted" : ""
              }`}
              onClick={() => onSelectInstrument(instrument.symbol)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{instrument.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {instrument.symbol.length === 3 ? "CRYPTO" : "STOCK"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{instrument.name}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">${instrument.price.toLocaleString()}</div>
                <div
                  className={`flex items-center text-sm ${instrument.change >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {instrument.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {instrument.changePercent >= 0 ? "+" : ""}
                  {instrument.changePercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
