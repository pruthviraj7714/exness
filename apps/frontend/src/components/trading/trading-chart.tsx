"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    CandlestickSeries,
    type ChartOptions,
    createChart,
    type DeepPartial,
    type UTCTimestamp,
  } from "lightweight-charts";
import axios from "axios"
import { toast } from "sonner"

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

interface TradingChartProps {
  instrument: string
}

export function TradingChart({ instrument }: TradingChartProps) {
  const [candleData, setCandleData] = useState<Candle[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [percentChange, setPercentChange] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any | null>(null);
  const [interval, setInterval] = useState<Interval>("1m");

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const endTime = Date.now(); 
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000; 
  
      const response = await axios.get(
        `/api/v1/klines?asset=${instrument.toUpperCase()}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`
      );
  
      const transformedData = response.data
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
      toast.error(error.response?.data?.message || "Failed to fetch chart data");
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
  }, [instrument, interval]);

  const isPositive = priceChange >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{instrument.toUpperCase()}/USDT Chart</span>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${currentPrice.toFixed(4)}
              {loading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
            </div>
            <div className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
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
              onClick={() => setInterval(int)}
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
  )
}