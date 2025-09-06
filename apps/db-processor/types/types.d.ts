interface BaseOrderEvent {
    id: string;
    asset: string;
    leverage: number;
    margin: number;
    slippage: number;
    type: "LONG" | "SHORT" | "ERROR";
    userId: string;
    qty: number;
    streamId: string;
  }
  
  export interface IPlaceOrderEvent extends BaseOrderEvent {
    event: "ORDER_PLACED";
    openPrice: number;
    opendAt: number;
  }
  
  export interface ICloseOrderEvent extends BaseOrderEvent {
    event: "ORDER_CLOSED";
    closePrice: number;
    closedAt: number;
    pnl: number;
  }
  
  export type OrderEvent = IPlaceOrderEvent | ICloseOrderEvent;
  