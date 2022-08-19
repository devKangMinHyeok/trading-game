import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";
import { cloneDeep, random } from "lodash";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import styled from "styled-components";
import {
  CHART_TIME_UNIT_SECOND,
  initialCandleState,
  INITIAL_CANDLE_CLOSE,
  isCandleMovingState,
  lastClosePriceState,
  lastHighPriceState,
  lastLowPriceState,
  longAccountDetailState,
  longAccountState,
  longLiquidState,
  shortAccountDetailState,
  shortAccountState,
  shortLiquidState,
  SPLIT_UNIT_OF_CANDLE,
  turnNumberState,
} from "../atom";
import ChartComponent from "../components/ChartComponent";

const ChartContainer = styled.div`
  border: 1px solid black;
  grid-row: 1 / span 2;
`;

const candleGenerator = (
  time: Time,
  lastClosePrice: number,
  numberInUnit: number
) => {
  let previousCandle: CandlestickData = {
    time,
    open: lastClosePrice,
    high: lastClosePrice,
    low: lastClosePrice,
    close: lastClosePrice,
  };
  const candleSet = [previousCandle];
  const RANDOM_GAP = 0.05;

  for (let i = 0; i < numberInUnit; i++) {
    const newCandle = cloneDeep(previousCandle);

    const newClose =
      newCandle.close * random(1 - RANDOM_GAP, 1 + RANDOM_GAP, true);
    const newHigh = newCandle.high < newClose ? newClose : newCandle.high;
    const newLow = newCandle.low > newClose ? newClose : newCandle.low;

    newCandle.close = newClose;
    newCandle.high = newHigh;
    newCandle.low = newLow;

    previousCandle = newCandle;
    candleSet.push(newCandle);
  }

  return candleSet;
};

function Chart() {
  const turnNumber = useRecoilValue(turnNumberState);
  const [isCandleMoving, setIsCandleMoving] =
    useRecoilState(isCandleMovingState);
  const initialCandle = useRecoilValue(initialCandleState);
  const [lastTimeStamp, setLastTimeStamp] = useState(
    initialCandle[0].time as number
  );
  const [lastClosePrice, setLastClosePrice] =
    useRecoilState(lastClosePriceState);
  const [lastHighPrice, setLastHighPrice] = useRecoilState(lastHighPriceState);
  const [lastLowPrice, setLastLowPrice] = useRecoilState(lastLowPriceState);

  const longLiquid = useRecoilValue(longLiquidState);
  const [longAccount, setLongAccount] = useRecoilState(longAccountState);
  const resetLongAccount = useResetRecoilState(longAccountState);
  const longAccountDetail = useRecoilValue(longAccountDetailState);

  const shortLiquid = useRecoilValue(shortLiquidState);
  const [shortAccount, setShortAccount] = useRecoilState(shortAccountState);
  const resetShortAccount = useResetRecoilState(shortAccountState);
  const shortAccountDetail = useRecoilValue(shortAccountDetailState);

  const [updatedData, setUpdatedData] = useState<CandlestickData[]>();

  const updateData = (
    newCandle: CandlestickData[],
    index: number,
    lastIndex: number
  ) => {
    return setTimeout(() => {
      setUpdatedData(newCandle);
      if (longAccountDetail.positionActive) {
        setLongAccount((prev) => {
          const newLog = cloneDeep(prev);
          newLog.currentPositionValue =
            newCandle[0].close * newLog.openPositionAmount;
          return newLog;
        });
        if (longAccountDetail.liquidPrice >= newCandle[0].low) {
          resetLongAccount();
        }
      }
      if (shortAccountDetail.positionActive) {
        setShortAccount((prev) => {
          const newLog = cloneDeep(prev);
          newLog.currentPositionValue =
            newCandle[0].close * newLog.openPositionAmount;
          return newLog;
        });
        if (shortAccountDetail.liquidPrice <= newCandle[0].high) {
          resetShortAccount();
        }
      }
      if (index === lastIndex) {
        setIsCandleMoving(false);
      }
    }, 100 * index);
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    if (turnNumber > 1) {
      const newCandleSet = candleGenerator(
        (lastTimeStamp + CHART_TIME_UNIT_SECOND) as UTCTimestamp,
        lastClosePrice,
        SPLIT_UNIT_OF_CANDLE
      );

      const lastNewCandle = [...newCandleSet].pop();
      setLastTimeStamp(lastNewCandle?.time as number);
      setLastClosePrice(lastNewCandle?.close as number);
      setLastHighPrice(lastNewCandle?.high as number);
      setLastLowPrice(lastNewCandle?.low as number);

      for (let i = 0; i < newCandleSet.length; i++) {
        timers.push(updateData([newCandleSet[i]], i, newCandleSet.length - 1));
      }
      return () => {
        timers.forEach((ele) => clearTimeout(ele));
      };
    }
  }, [turnNumber]);

  return (
    <ChartContainer>
      <ChartComponent
        processedData={initialCandle}
        updatedCandle={updatedData}
        longLiquidPrice={
          longAccountDetail.positionActive
            ? longAccountDetail.liquidPrice
            : longLiquid
        }
        longPositionOpenPrice={
          longAccountDetail.positionActive ? longAccountDetail.openPrice : 0
        }
        shortLiquidPrice={
          shortAccountDetail.positionActive
            ? shortAccountDetail.liquidPrice
            : shortLiquid
        }
        shortPositionOpenPrice={
          shortAccountDetail.positionActive ? shortAccountDetail.openPrice : 0
        }
      />
    </ChartContainer>
  );
}

export default Chart;
