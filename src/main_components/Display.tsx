import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";
import { cloneDeep, random } from "lodash";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import styled from "styled-components";
import {
  cashAccountState,
  CHART_TIME_UNIT_SECOND,
  initialCandleState,
  INIT_LEVERAGE,
  isCandleMovingState,
  lastClosePriceState,
  lastHighPriceState,
  lastLowPriceState,
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  LEVERAGE_UNITS,
  longAccountDetailState,
  longAccountState,
  longLiquidState,
  SPLIT_UNIT_OF_CANDLE,
  totalAccountState,
  TRANSACTION_FEE_RATE,
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
        liquidPrice={
          longAccountDetail.positionActive
            ? longAccountDetail.liquidPrice
            : longLiquid
        }
        positionOpenPrice={
          longAccountDetail.positionActive ? longAccountDetail.openPrice : 0
        }
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
  const totalAccount = useRecoilValue(totalAccountState);
  return (
    <AccountContainer>
      <div>나의 계좌</div>
      <div>
        평가 자산 :
        {totalAccount.totalAsset.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원 | {(totalAccount.profitRate * 100).toFixed(2)}%
      </div>
      <div>
        보유 현금 :{" "}
        {totalAccount.cash.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원
      </div>
      <div>
        선물 평가 금액:
        {totalAccount.futureValuation.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원
      </div>
    </AccountContainer>
  );
}

const TradeContainer = styled.div`
  border: 1px solid black;
  grid-row: 2 / span 2;
`;

interface LeverageBoxProps {
  selected: boolean;
  disabled: boolean;
}

const LeverageBox = styled.label<LeverageBoxProps>`
  border: 1px solid #96ffb5;
  background-color: ${(props) => (props.selected ? "#00eb46" : "#bdbdbd86")};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  border-radius: 5px;
  cursor: pointer;
  margin: 1px;
`;

function LongPositionController() {
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);
  const longAccountDetail = useRecoilValue(longAccountDetailState);

  const [cashAccount, setCashAccount] = useRecoilState(cashAccountState);
  const [longAccount, setLongAccount] = useRecoilState(longAccountState);

  const [longLeverage, setLongLeverage] = useState(INIT_LEVERAGE);
  const [longCoinAmount, setLongCoinAmount] = useState(1);
  const [amountRate, setAmountRate] = useState(0);
  const [longTotalPrice, setLongTotalPrice] = useState(0);
  const [longLiquid, setLongLiquid] = useRecoilState(longLiquidState);

  const longLeverageHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = Number(evt.currentTarget.value);
    if (newValue > LEVERAGE_MAX) newValue = LEVERAGE_MAX;
    if (newValue < LEVERAGE_MIN) newValue = LEVERAGE_MIN;
    setLongLeverage(newValue);
  };

  const amountRateHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = Number(evt.currentTarget.value);
    if (newValue < 0) {
      newValue = 0;
    } else if (newValue > 100) {
      newValue = 100;
    }
    setAmountRate(newValue);
  };

  const longBuyHandler = (
    evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!isCandleMoving) {
      setCashAccount((prev) => prev - longTotalPrice);
      if (!longAccountDetail.positionActive && longCoinAmount > 0) {
        const newLongAccount = {
          positionActive: true,
          openPrice: lastClosePrice,
          liquidPrice: longLiquid,
          leverage: longLeverage,
          openPositionValue: lastClosePrice * longCoinAmount,
          openPositionAmount: longCoinAmount,
          currentPositionValue: lastClosePrice * longCoinAmount,
        };
        setLongAccount(newLongAccount);
      } else if (longAccountDetail.positionActive) {
        setLongAccount((prev) => {
          const newLog = cloneDeep(prev);
          const newOpenPositionValue = lastClosePrice * longCoinAmount;
          newLog.openPrice =
            (newLog.openPrice * newLog.openPositionAmount +
              newOpenPositionValue) /
            (newLog.openPositionAmount + longCoinAmount);

          newLog.openPositionAmount =
            newLog.openPositionAmount + longCoinAmount;

          newLog.openPositionValue =
            newLog.openPositionValue + newOpenPositionValue;

          newLog.currentPositionValue =
            newLog.currentPositionValue + newOpenPositionValue;

          newLog.liquidPrice = newLog.openPrice * (1 - 1 / newLog.leverage);
          return newLog;
        });
      } else if (longCoinAmount === 0) {
        alert("0개는 주문할 수 없습니다.");
      }
      setAmountRate(0);
    }
  };

  useEffect(() => {
    setLongTotalPrice(
      lastClosePrice * longCoinAmount * (1 + TRANSACTION_FEE_RATE)
    );
  }, [lastClosePrice, longCoinAmount]);

  useEffect(() => {
    if (isCandleMoving) {
      setLongLiquid(0);
    } else {
      setLongLiquid(lastClosePrice * (1 - 1 / longLeverage));
    }
  }, [lastClosePrice, longLeverage, isCandleMoving]);

  useEffect(() => {
    const targetCash = (cashAccount * amountRate) / 100;
    const ableCoinAmount = Math.floor(
      targetCash / (lastClosePrice * (1 + TRANSACTION_FEE_RATE))
    );
    setLongCoinAmount(ableCoinAmount);
  }, [amountRate]);

  return (
    <>
      <div>
        <div>레버리지</div>
        {LEVERAGE_UNITS.map((ele) => (
          <LeverageBox
            key={ele}
            selected={longLeverage == ele}
            disabled={longAccountDetail.positionActive}
          >
            {ele}
            <input
              type={"radio"}
              value={ele}
              checked={longLeverage == ele}
              onChange={longLeverageHandler}
              disabled={longAccountDetail.positionActive}
              style={{ visibility: "hidden" }}
            />{" "}
          </LeverageBox>
        ))}
      </div>

      <div>
        <input
          type={"range"}
          min={0}
          max={100}
          step={5}
          value={amountRate}
          onChange={amountRateHandler}
          disabled={isCandleMoving}
        />
        {amountRate}% (보유 현금 대비)
        <div>개수 :{longCoinAmount}</div>
      </div>
      <div>
        주문 총액 :{" "}
        {longTotalPrice.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원
      </div>
      <div>
        청산가 :{" "}
        {isCandleMoving
          ? "산정중..."
          : `${longLiquid.toLocaleString("ko-KR", {
              maximumFractionDigits: 3,
            })}원`}
      </div>

      {!isCandleMoving ? (
        <button onClick={longBuyHandler}>Buy</button>
      ) : (
        <button disabled>Buy</button>
      )}
    </>
  );
}

const PositionInfoContainer = styled.div`
  width: 100%;
  border: 1px solid black;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;
const LongPositionInfoContainer = styled.div`
  border: 1px solid black;
`;
const ShortPositionInfoContainer = styled.div`
  border: 1px solid black;
`;

function LongPositionInfo() {
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const longAccountDetail = useRecoilValue(longAccountDetailState);
  const resetLongAccount = useResetRecoilState(longAccountState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);
  const [cashAccount, setCashAccount] = useRecoilState(cashAccountState);

  const longCloseHandler = () => {
    if (!isCandleMoving) {
      setCashAccount((prev) => prev + longAccountDetail.totalAsset);
      resetLongAccount();
    }
  };
  return (
    <LongPositionInfoContainer>
      <div>
        평단가 :{" "}
        {longAccountDetail.openPrice.toLocaleString("ko-KR", {
          maximumFractionDigits: 2,
        })}
        원
      </div>
      <div>
        현재가 :{" "}
        {isCandleMoving
          ? "산정중... "
          : `${lastClosePrice.toLocaleString("ko-KR", {
              maximumFractionDigits: 2,
            })}원`}
      </div>
      <div>보유 개수 : {longAccountDetail.openPositionAmount}개</div>
      <div>레버리지 : x{longAccountDetail.leverage}</div>
      <div>
        청산가 :{" "}
        {longAccountDetail.liquidPrice.toLocaleString("ko-KR", {
          maximumFractionDigits: 3,
        })}
        원
      </div>
      <div>
        미실현 손익 :{" "}
        {longAccountDetail.unrealizedPnl.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원(
        {longAccountDetail.profitRate
          ? `${(longAccountDetail.profitRate * 100).toFixed(2)}%`
          : "0%"}
        )
      </div>
      {!isCandleMoving && longAccountDetail.positionActive ? (
        <button onClick={longCloseHandler}>close</button>
      ) : (
        <button disabled>close</button>
      )}
    </LongPositionInfoContainer>
  );
}

function ShortPositionInfo() {
  return (
    <ShortPositionInfoContainer>
      ShortPositionInfoContainer
    </ShortPositionInfoContainer>
  );
}

function PositionInfo() {
  return (
    <PositionInfoContainer>
      <LongPositionInfo />
      <ShortPositionInfo />
    </PositionInfoContainer>
  );
}

function Trade() {
  const turnNumber = useRecoilValue(turnNumberState);
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);

  const [longAccount, setLongAccount] = useRecoilState(longAccountState);

  useEffect(() => {
    if (longAccount.positionActive) {
      setLongAccount((prev) => {
        const newValue = cloneDeep(prev);
        newValue.currentPositionValue =
          lastClosePrice * newValue.openPositionAmount;
        return newValue;
      });
    }
  }, [lastClosePrice, turnNumber]);

  return (
    <TradeContainer>
      <div>
        주문 가격 :{" "}
        {isCandleMoving
          ? "산정중..."
          : `${lastClosePrice.toLocaleString("ko-KR", {
              maximumFractionDigits: 2,
            })}원`}
      </div>
      <div>수수료 : {TRANSACTION_FEE_RATE}%</div>
      <hr />
      <div>Long</div>
      <LongPositionController />
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
  width: 1250px;
  height: 500px;
  border: 1px solid red;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1.5fr 1fr 1fr;
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
        <PositionInfo />
        <Shop />
        <Control />
      </DisplayContainer>
    </>
  );
}

export default Display;
