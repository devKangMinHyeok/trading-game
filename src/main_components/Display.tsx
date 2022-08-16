import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";
import { cloneDeep, delay, random, throttle } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import {
  CHART_TIME_UNIT_SECOND,
  initialCandleState,
  isCandleMovingState,
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
  const [lastClosePrice, setLastClosePrice] = useState(initialCandle[0].close);
  const [updatedData, setUpdatedData] = useState<CandlestickData[]>();
  const updateData = useCallback(
    (newCandle: CandlestickData[], index: number, lastIndex: number) => {
      return setTimeout(() => {
        setUpdatedData(newCandle);
        if (index === lastIndex) {
          setIsCandleMoving(false);
        }
      }, 500 * index);
    },
    []
  );
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

      console.log({ newCandleSet });
      console.log({ lastNewCandle });

      for (let i = 0; i < newCandleSet.length; i++) {
        timers.push(updateData([newCandleSet[i]], i, newCandleSet.length - 1));
      }
      return () => {
        timers.forEach((ele) => clearTimeout(ele));
      };
    }
  }, [turnNumber]);

  useEffect(() => {
    console.log("lastTimeStamp : ", lastTimeStamp);
    console.log("lastClosePrice: ", lastClosePrice);
  }, [lastTimeStamp]);

  return (
    <ChartContainer>
      <ChartComponent
        processedData={initialCandle}
        updatedCandle={updatedData}
      />
    </ChartContainer>
  );
}

const ShopContainer = styled.div`
  border: 1px solid black;
`;

function Shop() {
  return <ShopContainer>Shop</ShopContainer>;
}

const AccountContainer = styled.div`
  border: 1px solid black;
`;

function Account() {
  return <AccountContainer>Account</AccountContainer>;
}

const TradeContainer = styled.div`
  border: 1px solid black;
`;

function Trade() {
  return <TradeContainer>Trade</TradeContainer>;
}

const ControlContainer = styled.div`
  border: 1px solid black;
`;

function Control() {
  const [turnNumber, setTurnNumber] = useRecoilState(turnNumberState);
  const [isCandleMoving, setIsCandleMoving] =
    useRecoilState(isCandleMovingState);
  const nextTurnHandler = (evt: React.MouseEvent<HTMLButtonElement>) => {
    setIsCandleMoving(true);
    setTurnNumber((prev) => prev + 1);
  };
  return (
    <ControlContainer>
      {isCandleMoving ? (
        <button disabled>Next Turn</button>
      ) : (
        <button onClick={nextTurnHandler}>Next Turn</button>
      )}
    </ControlContainer>
  );
}

const DisplayContainer = styled.div`
  width: 900px;
  border: 1px solid red;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 10vh 55vh 25vh;
`;

function Display() {
  const turnNumber = useRecoilValue(turnNumberState);

  return (
    <>
      <div>Turn Number : {turnNumber}</div>
      <DisplayContainer>
        <Chart />
        <Account />
        <Trade />
        <Shop />
        <Control />
      </DisplayContainer>
    </>
  );
}

export default Display;
