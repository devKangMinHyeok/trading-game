import { CandlestickData, UTCTimestamp } from "lightweight-charts";
import { atom } from "recoil";
import { IMarketCodes } from "./interfaces/interfaces";

export const INITIAL_TIME = 1660647240;
export const SPLIT_UNIT_OF_CANDLE = 20;
export const CHART_TIME_UNIT_SECOND = 60;

export const marketCodesState = atom({
  key: "marketCodesState",
  default: [],
});

export const selectedCoinState = atom({
  key: "selectedCoinState",
  default: [
    {
      market: "KRW-BTC",
      korean_name: "비트코인",
      english_name: "Bitcoin",
    },
  ] as IMarketCodes[],
});

export const turnNumberState = atom({
  key: "turnNumberState",
  default: 1,
});

export const isCandleMovingState = atom({
  key: "isCandleMovingState",
  default: false,
});

export const initialCandleState = atom({
  key: "initialCandleState",
  default: [
    {
      time: INITIAL_TIME as UTCTimestamp,
      open: 100,
      high: 200,
      low: 50,
      close: 150,
    },
  ] as CandlestickData[],
});
