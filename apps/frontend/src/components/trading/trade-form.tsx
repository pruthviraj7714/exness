"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface TradeFormProps {
  instrument: string;
}

export function TradeForm({ instrument }: TradeFormProps) {
  const [tradeType, setTradeType] = useState<"LONG" | "SHORT">("LONG");
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [slippage, setSlippage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/trade/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: instrument,
          type: tradeType,
          margin: Number.parseFloat(margin),
          leverage: leverage,
          slippage: slippage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Trade created:", result);
        setMargin("");
        setLeverage(1);
        setSlippage(1);
        toast.success("Trade created successfully!");
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("[v0] Trade creation error:", error);
      toast.error("Failed to create trade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Trade - {instrument}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={tradeType === "LONG" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTradeType("LONG")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              LONG
            </Button>
            <Button
              type="button"
              variant={tradeType === "SHORT" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTradeType("SHORT")}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              SHORT
            </Button>
          </div>

          <div>
            <Label htmlFor="margin">Margin ($)</Label>
            <Input
              id="margin"
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="Enter margin amount"
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leverage">Leverage</Label>
            <div className="flex items-center gap-4">
              <input
                id="leverage"
                type="range"
                min={1}
                max={100}
                step={1}
                value={leverage}
                onChange={(e) => setLeverage(e.target.valueAsNumber)}
                className="w-full accent-blue-500"
              />
              <span className="font-medium">{leverage}x</span>
            </div>
          </div>

          <div>
            <Label htmlFor="slippage">Slippage (%)</Label>
            <Input
              id="slippage"
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.valueAsNumber)}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !margin}
          >
            {isLoading ? "Creating Trade..." : `Place ${tradeType} Order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
