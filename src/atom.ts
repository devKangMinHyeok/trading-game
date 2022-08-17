import { CandlestickData, UTCTimestamp } from "lightweight-charts";
import { atom, selector } from "recoil";
import {
  IFutureAccount,
  IFutureAccountDetail,
  IMarketCodes,
  ITotalAccount,
} from "./interfaces/interfaces";

export const INITIAL_TIME = 1660647240;
export const SPLIT_UNIT_OF_CANDLE = 40;
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

export const cashAccountState = atom({
  key: "accountState",
  default: 1000000,
});

export const longAccountState = atom({
  key: "longAccountState",
  default: {
    openPositionValue: 0,
    currentPositionValue: 0,
  } as IFutureAccount,
});

export const shortAccountState = atom({
  key: "shortAccountState",
  default: {
    openPositionValue: 0,
    currentPositionValue: 0,
  } as IFutureAccount,
});

export const longAccountDetailState = selector({
  key: "longAccountDetailState",
  get: ({ get }) => {
    const longAccount = get(longAccountState);
    const unrealizedPnl =
      longAccount.currentPositionValue - longAccount.openPositionValue;
    return {
      openPositionValue: longAccount.openPositionValue,
      currentPositionValue: longAccount.currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / longAccount.openPositionValue,
    } as IFutureAccountDetail;
  },
});

export const shortAccountDetailState = selector({
  key: "shortAccountDetailState",
  get: ({ get }) => {
    const shortAccount = get(shortAccountState);
    const unrealizedPnl =
      shortAccount.currentPositionValue - shortAccount.openPositionValue;
    return {
      openPositionValue: shortAccount.openPositionValue,
      currentPositionValue: shortAccount.currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / shortAccount.openPositionValue,
    } as IFutureAccountDetail;
  },
});

export const futureAccountState = selector({
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
      openPositionValue,
      currentPositionValue,
      unrealizedPnl,
      profitRate: unrealizedPnl / openPositionValue,
    } as IFutureAccountDetail;
  },
});

export const totalAccountState = selector({
  key: "totalAccountState",
  get: ({ get }) => {
    const cashAccount = get(cashAccountState);
    const futureAccount = get(futureAccountState);

    const openValuation = futureAccount.openPositionValue + cashAccount;
    const totalAsset = cashAccount + futureAccount.currentPositionValue;
    const unrealizedPnl = totalAsset - openValuation;
    return {
      cash: cashAccount,
      futureValuation: futureAccount.currentPositionValue,
      totalAsset,
      unrealizedPnl,
      profitRate: unrealizedPnl / openValuation,
    } as ITotalAccount;
  },
});
