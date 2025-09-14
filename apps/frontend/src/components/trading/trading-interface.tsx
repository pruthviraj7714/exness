"use client";

import InstrumentList from "./instrument-list";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CandlestickSeries,
  type ChartOptions,
  createChart,
  type DeepPartial,
  type UTCTimestamp,
} from "lightweight-charts";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "../ui/badge";
import PositionRow from "../PositionRow";
import { DecimalsMap } from "@repo/common";
import useSocket from "@/hooks/useSocket";
import useBinanceKlines from "@/hooks/useBinanceKlines";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  trades?: number;
};

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const;
type Interval = (typeof INTERVALS)[number];

interface Position {
  id: string;
  asset: string;
  type: "LONG" | "SHORT";
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  userId?: string;
  openedAt: number;
  leverage: number;
  margin: number;
  closedAt?: number;
  status: "OPEN" | "CLOSE";
  slippage?: number;
  qty: number;
  closePrice?: number;
}

function TradingInterface() {
  const [selectedInstrument, setSelectedInstrument] = useState("BTC");
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState(0);
  const [tradeType, setTradeType] = useState<"LONG" | "SHORT">("LONG");
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [slippage, setSlippage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [latestPrices, setLatestPrices] = useState<
  Record<string, { ask: number; decimal: number; bid: number; asset: string }>
>({});
  const { isConnected, socket } = useSocket();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any | null>(null);
  const [interval, setTicksInterval] = useState<Interval>("1m");
  const { candleData: liveCandleData, connectionStatus } = useBinanceKlines(selectedInstrument, interval);

  const usdtDecimals = DecimalsMap["USDT"];

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const endTime = Date.now();
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/klines?asset=${selectedInstrument.toUpperCase()}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedData = data
        .map((candle: any) => ({
          time: Math.floor(candle.openTime / 1000) as UTCTimestamp,
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseFloat(candle.volume),
        }))
        .sort((a: Candle, b: Candle) => a.time - b.time);

      return transformedData;
    } catch (error: any) {
      console.error("Error fetching klines:", error);
      toast.error(
        error.response?.data?.message || error.message || "Failed to fetch chart data"
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updatePriceInfo = (data: Candle[]) => {
    if (data.length >= 2) {
      const current = data[data.length - 1];
      const previous = data[data.length - 2];

      setCurrentPrice(current.close);
      const change = current.close - previous.close;
      setPriceChange(change);
      setPercentChange((change / previous.close) * 100);
    } else if (data.length === 1) {
      setCurrentPrice(data[0].close);
      setPriceChange(0);
      setPercentChange(0);
    }
  };

  useEffect(() => {
    if (liveCandleData.length > 0 && candlestickSeriesRef.current) {
      setCandleData(prev => {
        const combined = [...prev];
        
        liveCandleData.forEach(liveCandle => {
          const existingIndex = combined.findIndex(c => c.time === liveCandle.time);
          if (existingIndex >= 0) {
            combined[existingIndex] = liveCandle;
          } else if (!combined.length || liveCandle.time > combined[combined.length - 1].time) {
            combined.push(liveCandle);
          }
        });

        combined.sort((a, b) => a.time - b.time);

        updatePriceInfo(combined);
        candlestickSeriesRef.current?.setData(combined);
        return combined;
      });
    }
  }, [liveCandleData]);

  const handleParsePrice = (symbol: string, price: number) => {
    const decimals = DecimalsMap[symbol];
    return price / 10 ** decimals;
  };

  const fetchUserBalance = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/balance/usd`,
        {
          credentials: "include",
          method: "GET",
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setBalance(data.usdBalance);
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      toast.error(error.response?.data?.message ?? error.message ?? "Failed to fetch balance");
    }
  };

  const fetchOpenPositions = async () => {
    setPositionsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/positions/open`,
        {
          credentials: "include",
          method: "GET",
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setOpenPositions(data);
    } catch (error: any) {
      console.error("Error fetching open positions:", error);
      toast.error(error.response?.data?.message ?? error.message ?? "Failed to fetch open positions", {
        position: "top-center",
      });
    } finally {
      setPositionsLoading(false);
    }
  };

  const fetchClosedPositions = async () => {
    setPositionsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/positions/closed`,
        {
          credentials: "include",
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setClosedPositions(data);
    } catch (error: any) {
      console.error("Error fetching closed positions:", error);
      toast.error(error.response?.data?.message ?? error.message ?? "Failed to fetch closed positions", {
        position: "top-center",
      });
    } finally {
      setPositionsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "open" | "closed");
    if (value === "open") {
      fetchOpenPositions();
    } else {
      fetchClosedPositions();
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        textColor: "#e5e7eb",
        background: { color: "#0b0b0b" },
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    };

    const chart = createChart(chartRef.current, chartOptions);
    chartInstanceRef.current = chart;

    chart.applyOptions({
      width: chartRef.current.clientWidth,
      height: 500,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candlestickSeriesRef.current = candlestickSeries;

    const loadData = async () => {
      const data = await fetchChartData();
      if (data.length > 0) {
        setCandleData(data);
        updatePriceInfo(data);
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
      }
    };

    loadData();

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr?.width && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: Math.floor(cr.width),
          height: 500,
        });
      }
    });

    if (chartRef.current) {
      ro.observe(chartRef.current);
    }

    return () => {
      ro.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
      candlestickSeriesRef.current = null;
    };
  }, [selectedInstrument, interval]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = ({ data }: MessageEvent) => {
      try {
        const payload = JSON.parse(data.toString());

        switch (payload.type) {
          case "ALL_PRICES": {
            const priceData = payload.data;
            
            setLatestPrices(priceData);
            
            if (priceData[selectedInstrument]) {
              const instrumentPrice = priceData[selectedInstrument];
              const price = (instrumentPrice.bid + instrumentPrice.ask) / 2 / (10 ** instrumentPrice.decimal);
              setCurrentPrice(price);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };

    socket.onmessage = handleMessage;

    return () => {
      if (socket.onmessage === handleMessage) {
        socket.onmessage = null;
      }
    };
  }, [socket, isConnected, selectedInstrument]);

  useEffect(() => {
    if (!openPositions.length || !Object.keys(latestPrices).length) return;

    setOpenPositions((prevPositions) =>
      prevPositions.map((pos) => {
        const priceData = latestPrices[pos.asset];
        if (!priceData) return pos;

        let currentPrice =
          pos.type === "LONG"
            ? priceData.bid / (10 ** priceData.decimal)
            : priceData.ask / (10 ** priceData.decimal);

        const openPrice = pos.openPrice / (10 ** priceData.decimal);

        const pnl =
          pos.type === "LONG"
            ? (currentPrice - openPrice) * pos.qty
            : (openPrice - currentPrice) * pos.qty;

        return {
          ...pos,
          currentPrice,
          pnl,
        };
      })
    );
  }, [latestPrices, usdtDecimals]);

  useEffect(() => {
    fetchUserBalance();
    fetchOpenPositions();
  }, []);

  const handleCancelPosition = async (positionId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/trade/close/${positionId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      fetchUserBalance();
      if (activeTab === "open") {
        fetchOpenPositions();
      } else {
        fetchClosedPositions();
      }
      toast.success(data.message || "Position closed successfully", { position: "top-center" });
    } catch (error: any) {
      console.error("Error closing position:", error);
      toast.error(error.response?.data?.message ?? error.message ?? "Failed to close position", {
        position: "top-center",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/trade/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            asset: selectedInstrument,
            type: tradeType,
            margin: Number.parseFloat(margin),
            leverage: leverage,
            slippage: slippage,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Trade created:", result);
        setMargin("");
        setLeverage(1);
        setSlippage(1);
        toast.success("Trade created successfully!");
        
        if (result.result) {
          setOpenPositions((prev) => [...prev, result.result]);
        }

        fetchUserBalance();
        if (activeTab === "open") {
          fetchOpenPositions();
        }
      } else {
        toast.error(`Error: ${result.error || result.message || "Failed to create trade"}`);
      }
    } catch (error: any) {
      console.error("[v0] Trade creation error:", error);
      toast.error("Failed to create trade");
    } finally {
      setIsLoading(false);
    }
  };

  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <InstrumentList
            onSelectInstrument={setSelectedInstrument}
            selectedInstrument={selectedInstrument}
          />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedInstrument.toUpperCase()}/USDT Chart</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${currentPrice.toFixed(4)}
                    {loading && (
                      <span className="ml-2 text-sm text-gray-500">
                        Loading...
                      </span>
                    )}
                    {connectionStatus !== "Connected" && (
                      <span className="ml-2 text-xs text-yellow-500">
                        ({connectionStatus})
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {priceChange.toFixed(4)} ({percentChange.toFixed(2)}%)
                  </div>
                </div>
              </CardTitle>

              <div className="flex flex-wrap gap-2 mt-4">
                {INTERVALS.map((int) => (
                  <Button
                    key={int}
                    variant={interval === int ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTicksInterval(int)}
                    disabled={loading}
                  >
                    {int}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div
                ref={chartRef}
                className="w-full h-[500px] bg-[#0b0b0b] rounded-lg"
              />

              {candleData.length === 0 && !loading && (
                <div className="flex items-center justify-center h-[200px] text-gray-500">
                  No chart data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Place Trade - {selectedInstrument}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Balance: ${balance.toFixed(2)}
              </div>
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

                <div className="py-2">
                  <Label htmlFor="margin">Margin ($)</Label>
                  <Input
                    id="margin"
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    placeholder="Enter margin amount"
                    min="1"
                    max={balance}
                    className="mt-1"
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
                  disabled={isLoading || !margin || parseFloat(margin) <= 0 || parseFloat(margin) > balance}
                >
                  {isLoading ? "Creating Trade..." : `Place ${tradeType} Order`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-full">
        <div className="border rounded-lg">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
              <TabsTrigger value="open" className="relative">
                Open Positions
                {openPositions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {openPositions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="closed" className="relative">
                Closed Positions
                {closedPositions.length > 0 && (
                  <Badge variant="outline" className="ml-2 h-5 text-xs">
                    {closedPositions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="p-3 space-y-3 min-h-[300px]">
              {positionsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-sm">Loading positions...</div>
                </div>
              ) : openPositions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-sm">No open positions</div>
                  <div className="text-xs mt-1">
                    Start trading to see your positions here
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Total Open: {openPositions.length}</span>
                    <span>
                      Total P&L:
                      <span
                        className={`ml-1 font-medium ${
                          openPositions.reduce(
                            (sum, p) => sum + (p.pnl / (10 ** usdtDecimals)),
                            0
                          ) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        $
                        {openPositions
                          .reduce(
                            (sum, p) => sum + (p.pnl / (10 ** usdtDecimals)),
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {openPositions.map((position) => (
                      <PositionRow
                        key={position.id}
                        onCancelPosition={handleCancelPosition}
                        currentPrice={
                          position.type === "LONG"
                            ? latestPrices[position.asset]?.bid || 0
                            : latestPrices[position.asset]?.ask || 0
                        }
                        position={position}
                        showCloseButton={true}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="closed" className="p-3 space-y-3 min-h-[300px]">
              {positionsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-sm">Loading positions...</div>
                </div>
              ) : closedPositions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-sm">No closed positions</div>
                  <div className="text-xs mt-1">
                    Your trading history will appear here
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Total Closed: {closedPositions.length}</span>
                    <span>
                      Historical P&L:
                      <span
                        className={`ml-1 font-medium ${
                          closedPositions.reduce(
                            (sum, p) => sum + (p.pnl / (10 ** DecimalsMap["USDT"])),
                            0
                          ) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        $
                        {closedPositions
                          .reduce(
                            (sum, p) => sum + (p.pnl / (10 ** DecimalsMap["USDT"])),
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {closedPositions.map((position) => (
                      <PositionRow
                        onCancelPosition={handleCancelPosition}
                        key={position.id}
                        position={position}
                        currentPrice={
                          position.type === "LONG"
                            ? latestPrices[position.asset]?.bid || 0
                            : latestPrices[position.asset]?.ask || 0
                        }
                        showCloseButton={false}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default TradingInterface;