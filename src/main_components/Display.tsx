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
      }, 100 * index);
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
  return (
    <AccountContainer>
      <div>나의 계좌</div>
      <div>총 보유 자산(=보유현금 + 보유코인가치) : 1,100,000원</div>

      <div>보유 현금 : 500,000원</div>

      <div>보유코인 가치(Long 보유 코인 가치 + short) : 600,000원</div>
    </AccountContainer>
  );
}

const TradeContainer = styled.div`
  border: 1px solid black;
`;

function Trade() {
  return (
    <TradeContainer>
      <div>주문 가격 : [종가]</div>
      <div>수수료 : [0.01% - global 살때만]</div>
      <hr />
      <div>Long</div>

      <div>레버리지 : [x1-x50]</div>
      <div>개수 : [ ]</div>
      <div>주문 총액 : [주문 금액 * 개수 + 수수료]</div>
      <div>청산가 : [주문 금액 * (1 - (1/레버리지))]</div>

      <div>미실현 손익 : +50,000원(+5%)</div>
      <button>Buy</button>
      <button>close</button>
      <hr />

      <div>Short</div>
      <div>레버리지 : [x1-x50]</div>
      <div>개수 : [ ]</div>

      <div>주문 총액 : [주문 금액 * 개수 + 수수료]</div>
      <div>청산가 : [주문 금액 * (1 - (1/레버리지))]</div>
      <div>미실현 손익 : +50,000원</div>
      <button>Sell</button>
      <button>close</button>
      <hr />
      <div>총 미실현 손익 : +100,000원(+10%)</div>
    </TradeContainer>
  );
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
  grid-template-rows: 25vh 55vh 25vh;
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
