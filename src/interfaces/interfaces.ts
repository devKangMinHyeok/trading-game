import { CandlestickData } from "lightweight-charts";

export interface IMarketCodes {
  market: string;
  korean_name: string;
  english_name: string;
}

export interface IFetchedMinuteCandleData {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  unit: number;
}

export interface ITicker {
  type: string;
  code: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  acc_trade_price: number;
  change: string;
  change_price: number;
  signed_change_price: number;
  change_rate: number;
  signed_change_rate: number;
  ask_bid: string;
  trade_volume: number;
  acc_trade_volume: number;
  trade_date: string;
  trade_time: string;
  trade_timestamp: number;
  acc_ask_volume: number;
  acc_bid_volume: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  market_state: string;
  is_trading_suspended: boolean;
  delisting_date: null;
  market_warning: string;
  timestamp: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  stream_type: string;
}

export interface IUseUpbitWebSocket {
  socket: WebSocket | null;
  isConnected: boolean;
  socketData?: ITicker[];
}

export interface IChartComponent {
  processedData?: CandlestickData[];
  updatedCandle?: CandlestickData[];
  liquidPrice?: number;
  positionOpenPrice?: number;
}

export interface IFutureAccount {
  positionActive: boolean;
  openPrice: number;
  liquidPrice: number;
  leverage: number;
  openPositionAmount: number;
  openPositionValue: number;
  currentPositionValue: number;
}

export interface IFutureAccountDetail {
  positionActive: boolean;
  openPrice: number;
  liquidPrice: number;
  leverage: number;
  openPositionAmount: number;
  openPositionValue: number;
  currentPositionValue: number;
  unrealizedPnl: number;
  profitRate: number;
  totalAsset: number;
}

export interface ITotalFutureAccount {
  positionActive: boolean;
  openPositionValue: number;
  currentPositionValue: number;
  unrealizedPnl: number;
  profitRate: number;
  totalAsset: number;
}
export interface ITotalAccount {
  cash: number;
  futureValuation: number;
  totalAsset: number;
  unrealizedPnl: number;
  profitRate: number;
}
