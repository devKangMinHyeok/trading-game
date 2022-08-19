import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import {
  cashAccountState,
  INIT_LEVERAGE,
  isCandleMovingState,
  isLongControllerActiveState,
  lastClosePriceState,
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  LEVERAGE_UNITS,
  longAccountDetailState,
  longAccountState,
  longLiquidState,
  TRANSACTION_FEE_RATE,
} from "../../atom";

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

interface PositionControlProps {
  selected: boolean;
}

const LongPositionControlBox = styled.div<PositionControlProps>`
  display: ${(props) => (props.selected ? "block" : "none")};
`;

function LongPositionController() {
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);
  const longAccountDetail = useRecoilValue(longAccountDetailState);
  const isLongControllerActive = useRecoilValue(isLongControllerActiveState);

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
      lastClosePrice *
        longCoinAmount *
        (1 + (TRANSACTION_FEE_RATE / 100) * longLeverage)
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
      targetCash /
        (lastClosePrice * (1 + (TRANSACTION_FEE_RATE / 100) * longLeverage))
    );
    setLongCoinAmount(ableCoinAmount);
  }, [amountRate, longLeverage]);

  return (
    <LongPositionControlBox selected={isLongControllerActive}>
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
    </LongPositionControlBox>
  );
}

export default LongPositionController;
