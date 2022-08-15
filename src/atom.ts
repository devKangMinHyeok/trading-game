import { atom } from "recoil";

export const marketCodesState = atom({
  key: "marketCodesState",
  default: [],
});

export interface IMarketCodes {
  market: string;
  korean_name: string;
  english_name: string;
}

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
