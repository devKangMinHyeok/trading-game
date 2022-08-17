import { CandlestickData, UTCTimestamp } from "lightweight-charts";
import { atom, selector } from "recoil";
import {
  IFutureAccount,
  IFutureAccountDetail,
  IMarketCodes,
  ITotalAccount,
  ITotalFutureAccount,
} from "./interfaces/interfaces";

export const INITIAL_TIME = 1660647240;
export const SPLIT_UNIT_OF_CANDLE = 40;
export const CHART_TIME_UNIT_SECOND = 60;
export const TRANSACTION_FEE_RATE = 0.01;
export const LEVERAGE_MIN = 1;
export const LEVERAGE_MAX = 50;
export const INIT_LEVERAGE = 1;
const INITIAL_CANDLE_CLOSE = 150;
const INITIAL_CANDLE_HIGH = 200;
const INITIAL_CANDLE_LOW = 50;

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
      high: INITIAL_CANDLE_HIGH,
      low: INITIAL_CANDLE_LOW,
      close: INITIAL_CANDLE_CLOSE,
    },
  ] as CandlestickData[],
});

export const lastClosePriceState = atom({
  key: "lastClosePriceState",
  default: INITIAL_CANDLE_CLOSE,
});

export const lastHighPriceState = atom({
  key: "lastHighPriceState",
  default: INITIAL_CANDLE_HIGH,
});

export const lastLowPriceState = atom({
  key: "lastLowPriceState",
  default: INITIAL_CANDLE_HIGH,
});

export const longLiquidState = atom({
  key: "longLiquidState",
  default: 0,
});

// 게좌 시스템
export const cashAccountState = atom({
  key: "accountState",
  default: 1000000,
});

export const longAccountState = atom({
  key: "longAccountState",
  default: {
    positionActive: false,
    openPrice: 0,
    liquidPrice: 0,
    leverage: 1,
    openPositionAmount: 0,
    openPositionValue: 0,
    currentPositionValue: 0,
  } as IFutureAccount,
});

export const shortAccountState = atom({
  key: "shortAccountState",
  default: {
    positionActive: false,
    openPrice: 0,
    liquidPrice: 0,
    leverage: 1,
    openPositionAmount: 0,
    openPositionValue: 0,
    currentPositionValue: 0,
  } as IFutureAccount,
});

export const longAccountDetailState = selector({
  key: "longAccountDetailState",
  get: ({ get }) => {
    const longAccount = get(longAccountState);
    const unrealizedPnl =
      longAccount.leverage *
      (longAccount.currentPositionValue - longAccount.openPositionValue);
    return {
      positionActive: longAccount.positionActive,
      openPrice: longAccount.openPrice,
      liquidPrice: longAccount.liquidPrice,
      leverage: longAccount.leverage,
      openPositionAmount: longAccount.openPositionAmount,
      openPositionValue: longAccount.openPositionValue,
      currentPositionValue: longAccount.currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / longAccount.openPositionValue,
      totalAsset: unrealizedPnl + longAccount.openPositionValue,
    } as IFutureAccountDetail;
  },
});

export const shortAccountDetailState = selector({
  key: "shortAccountDetailState",
  get: ({ get }) => {
    const shortAccount = get(shortAccountState);
    const unrealizedPnl =
      shortAccount.leverage *
      (shortAccount.currentPositionValue - shortAccount.openPositionValue);
    return {
      positionActive: shortAccount.positionActive,
      openPrice: shortAccount.openPrice,
      liquidPrice: shortAccount.liquidPrice,
      leverage: shortAccount.leverage,
      openPositionAmount: shortAccount.openPositionAmount,
      openPositionValue: shortAccount.openPositionValue,
      currentPositionValue: shortAccount.currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / shortAccount.openPositionValue,
      totalAsset: unrealizedPnl + shortAccount.openPositionValue,
    } as IFutureAccountDetail;
  },
});

export const totalFutureAccountState = selector({
  key: "futureAccountState",
  get: ({ get }) => {
    const longAccountDetail = get(longAccountDetailState);
    const shortAccountDetail = get(shortAccountDetailState);

    const openPositionValue =
      longAccountDetail.openPositionValue +
      shortAccountDetail.openPositionValue;
    const currentPositionValue =
      longAccountDetail.currentPositionValue +
      shortAccountDetail.currentPositionValue;
    const unrealizedPnl =
      longAccountDetail.unrealizedPnl + shortAccountDetail.unrealizedPnl;
    return {
      positionActive:
        longAccountDetail.positionActive || shortAccountDetail.positionActive,
      openPositionValue,
      currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / openPositionValue,
      totalAsset: unrealizedPnl + openPositionValue,
    } as ITotalFutureAccount;
  },
});

export const totalAccountState = selector({
  key: "totalAccountState",
  get: ({ get }) => {
    const cashAccount = get(cashAccountState);
    const futureAccount = get(totalFutureAccountState);

    const openValuation = futureAccount.openPositionValue + cashAccount;
    const totalAsset = cashAccount + futureAccount.totalAsset;
    const unrealizedPnl = totalAsset - openValuation;
    return {
      cash: cashAccount,
      futureValuation: futureAccount.totalAsset,
      totalAsset,
      unrealizedPnl,
      profitRate: unrealizedPnl / openValuation,
    } as ITotalAccount;
  },
});
