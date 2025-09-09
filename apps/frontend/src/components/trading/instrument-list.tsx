"use client";

import useSocket from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { DecimalsMap, SUPPORTED_MARKETS } from "@repo/common";
import { Input } from "../ui/input";

interface IPriceData {
  buyPrice: number;
  sellPrice: number;
  symbol: string;
  timestamp: number;
  decimal: number;
}

type Dir = "up" | "down" | null;

interface InstrumentListProps {
  onSelectInstrument: (asset: string) => void;
  selectedInstrument: string;
}

export default function InstrumentList(props: InstrumentListProps) {
  const { socket, isConnected } = useSocket();

  const [assetPrices, setAssetPrices] = useState<Record<string, IPriceData>>({});
  const [bidChange, setBidChange] = useState<Record<string, Dir>>({});
  const [askChange, setAskChange] = useState<Record<string, Dir>>({});

  const lastRef = useRef<Record<string, { bid: number; ask: number }>>({});

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = ({ data }: MessageEvent) => {
      try {
        const payload = JSON.parse(data.toString());
        
        
        if (payload.type !== "ALL_PRICES") return;

        const allPrices = payload.data as Record<string, { 
          bid: number; 
          ask: number; 
          decimal: number; 
          asset: string 
        }>;


        Object.values(allPrices).forEach((p) => {
          const symbol = p.asset;
          const buyPrice = p.bid ;
          const sellPrice = p.ask;
          const decimal = p.decimal;
          const timestamp = Date.now();

          const last = lastRef.current[symbol];
          const newBidDir: Dir =
            last && last.bid !== undefined
              ? buyPrice > last.bid
                ? "up"
                : buyPrice < last.bid
                  ? "down"
                  : null
              : null;

          const newAskDir: Dir =
            last && last.ask !== undefined
              ? sellPrice > last.ask
                ? "up"
                : sellPrice < last.ask
                  ? "down"
                  : null
              : null;

          setAssetPrices((prev) => ({
            ...prev,
            [symbol]: {
              buyPrice,
              sellPrice,
              symbol,
              timestamp,
              decimal,
            },
          }));

          lastRef.current[symbol] = { bid: buyPrice, ask: sellPrice };

          if (newBidDir) {
            setBidChange((prev) => ({ ...prev, [symbol]: newBidDir }));
            setTimeout(() => {
              setBidChange((prev) => ({ ...prev, [symbol]: null }));
            }, 600);
          }
          if (newAskDir) {
            setAskChange((prev) => ({ ...prev, [symbol]: newAskDir }));
            setTimeout(() => {
              setAskChange((prev) => ({ ...prev, [symbol]: null }));
            }, 600);
          }
        });
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };

    socket.onmessage = handleMessage;

    return () => {
      socket.onmessage = null;
    };
  }, [socket, isConnected, props.selectedInstrument]);

  function formatPrice(raw?: number, decimals = 2) {
    if (raw === undefined || raw === null) return "-";
    const normalized = raw / 10 ** decimals;
    const places = Math.min(decimals, 6);
    return normalized.toLocaleString(undefined, {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    });
  }

  function PriceCell({
    dir,
    text,
    ariaLabel,
  }: {
    dir: Dir;
    text: string;
    ariaLabel: string;
  }) {
    const isUp = dir === "up";
    const isDown = dir === "down";

    return (
      <div
        className={cn(
          "flex items-center gap-2 font-medium tabular-nums",
          isUp && "text-emerald-600",
          isDown && "text-red-600"
        )}
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className="relative h-2 w-2">
          {dir && (
            <>
              <span
                className={cn(
                  "absolute inline-flex h-2 w-2 rounded-full opacity-75 animate-ping",
                  isUp ? "bg-emerald-500" : "bg-red-500"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isUp ? "bg-emerald-500" : "bg-red-500"
                )}
              />
            </>
          )}
        </div>

        <span>{text}</span>

        {isUp && <ChevronUp className="h-4 w-4 text-emerald-600" aria-hidden />}
        {isDown && <ChevronDown className="h-4 w-4 text-red-600" aria-hidden />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search" className="h-7 text-xs" />
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-2 py-1 font-normal text-center">Symbol</th>
              <th className="px-2 py-1 font-normal text-center w-28">Bid</th>
              <th className="px-2 py-1 font-normal text-center w-28">Ask</th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_MARKETS.map((m) => {
              const data = assetPrices[m.asset];
              const decimals = DecimalsMap[m.asset] ?? 2;
              const bidDir = bidChange[m.asset] ?? null;
              const askDir = askChange[m.asset] ?? null;

              const bidText = formatPrice(data?.buyPrice, decimals);
              const askText = formatPrice(data?.sellPrice, decimals);

              return (
                <tr
                  key={m.name}
                  className={cn(
                    "border-t transition-colors cursor-pointer hover:bg-white/30",
                    props.selectedInstrument === m.asset && "dark:bg-blue-950/20"
                  )}
                  onClick={() => props.onSelectInstrument(m.asset)}
                >
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1">
                      <img
                        src={m.logo || "/placeholder.svg?height=16&width=16"}
                        alt={`${m.asset} logo`}
                        className="h-4 w-4 rounded-sm"
                      />
                      <span className="font-medium text-white">
                        {m.asset}
                      </span>
                    </div>
                  </td>

                  <td
                    className={cn(
                      "px-2 py-1 text-right tabular-nums transition-colors",
                      bidDir === "up" && "bg-emerald-50 dark:bg-emerald-950/40",
                      bidDir === "down" && "bg-red-50 dark:bg-red-950/40"
                    )}
                  >
                    <PriceCell
                      dir={bidDir}
                      text={bidText}
                      ariaLabel={`${m.asset} bid ${bidDir ?? "unchanged"}`}
                    />
                  </td>

                  <td
                    className={cn(
                      "px-2 py-1 text-right tabular-nums transition-colors",
                      askDir === "up" && "bg-emerald-50 dark:bg-emerald-950/40",
                      askDir === "down" && "bg-red-50 dark:bg-red-950/40"
                    )}
                  >
                    <PriceCell
                      dir={askDir}
                      text={askText}
                      ariaLabel={`${m.asset} ask ${askDir ?? "unchanged"}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}