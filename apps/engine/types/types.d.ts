interface IBaseEvent {
  id: string;
  streamId: string;
}

interface UserBalanceWallet {
  usedMargin : number;
  freeMargin : number;
}

interface IPlaceOrderEvent extends IBaseEvent {
  event: "PLACE_ORDER";
  data: {
    id : string;
    asset: string;
    userId: string;
    type: "LONG" | "SHORT";
    margin: number;
    leverage: number;
    slippage: number;
  };
}

interface ICancelOrderEvent extends IBaseEvent {
  event: "CANCEL_ORDER";
  data: {
    orderId : string
    userId: string;
  };
}

interface IPriceUpdateEvent extends IBaseEvent {
  event: "PRICE_UPDATE";
  data: Record<
    string,
    {
      decimal: number;
      bid: number;
      ask : number;
    }
  >;
}

interface IOrder {
  id : string;
  userId : string;
  asset : string;
  margin : number;
  event?: "ORDER_PLACED" | "ORDER_CLOSED"
  leverage : number;
  slippage : number;
  type : "LONG" | "SHORT",
  openPrice : number;
  pnl? : number;
  qty?: number;
  openedAt? : number;
  closedAt? : number;
  streamId: string;
}

export interface IPriceData {
  bid : number;
  ask : number;
  decimal: number;
}

export type IEventData =
  | IPlaceOrderEvent
  | ICancelOrderEvent
  | IPriceUpdateEvent;
