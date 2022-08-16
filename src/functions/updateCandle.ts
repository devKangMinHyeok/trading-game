import { CandlestickData } from "lightweight-charts";

export const updateCandle = (
  currentCandle: CandlestickData,
  tradePrice: number
) => {
  if (currentCandle.high < tradePrice) {
    currentCandle.high = tradePrice;
  }
  if (currentCandle.low > tradePrice) {
    currentCandle.low = tradePrice;
  }
  currentCandle.close = tradePrice;
  return currentCandle;
};
