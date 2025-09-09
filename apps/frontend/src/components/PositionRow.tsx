import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { DecimalsMap } from "@repo/common";

interface Position {
  id: string;
  asset: string;
  type: "LONG" | "SHORT";
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  openedAt: number;
  leverage : number;
  margin : number;
  status: "OPEN" | "CLOSE";
}

const formatPrice = (price: number) => {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const usdtDecimals = DecimalsMap["USDT"]!;

const PositionRow = ({
  position,
  showCloseButton = false,
  onCancelPosition,
}: {
  position: Position;
  showCloseButton?: boolean;
  onCancelPosition: (positionId: string) => void;
}) => (
  <div className="border rounded-lg p-3 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium">{position.asset}</span>
        <Badge
          variant={position.type === "LONG" ? "default" : "destructive"}
          className="text-xs"
        >
          {position.type === "LONG" ? (
            <>
              <TrendingUp className="w-3 h-3 mr-1" /> LONG
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3 mr-1" /> SHORT
            </>
          )}
        </Badge>
      </div>
      {showCloseButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancelPosition(position.id)}
          className="h-6 px-2"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <div>
        <div>Size: {(position.margin / 10 ** usdtDecimals) * position.leverage}</div>
        <div>Entry: ${formatPrice(position.openPrice)}</div>
      </div>
      <div>
        {/* {position.status === "OPEN" && (
          <div>Current: ${formatPrice(position.currentPrice)}</div>
        )} */}
        <div>Time: {formatTime(position.openedAt)}</div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-1 border-t">
      <span className="text-xs text-muted-foreground">P&L</span>
      <div
        className={`text-sm font-medium ${
          position.pnl >= 0 ? "text-emerald-600" : "text-red-600"
        }`}
      >
        ${position.pnl?.toFixed(2)} ({position.pnlPercentage >= 0 ? "+" : ""}
        {position.pnlPercentage?.toFixed(2)}%)
      </div>
    </div>
  </div>
);

export default PositionRow;
