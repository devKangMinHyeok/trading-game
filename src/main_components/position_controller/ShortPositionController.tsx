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
  shortAccountDetailState,
  shortAccountState,
  shortLiquidState,
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

const ShortPositionControlBox = styled.div<PositionControlProps>`
  display: ${(props) => (props.selected ? "block" : "none")};
`;

function ShortPositionController() {
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);
  const shortAccountDetail = useRecoilValue(shortAccountDetailState);
  const isLongControllerActive = useRecoilValue(isLongControllerActiveState);

  const [cashAccount, setCashAccount] = useRecoilState(cashAccountState);
  const [shortAccount, setShortAccount] = useRecoilState(shortAccountState);
  const [shortLiquid, setShortLiquid] = useRecoilState(shortLiquidState);

  const [shortLeverage, setShortLeverage] = useState(INIT_LEVERAGE);
  const [shortCoinAmount, setShortCoinAmount] = useState(1);
  const [amountRate, setAmountRate] = useState(0);
  const [shortTotalPrice, setShortTotalPrice] = useState(0);

  // long과 로직 동일
  const shortLeverageHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = Number(evt.currentTarget.value);
    if (newValue > LEVERAGE_MAX) newValue = LEVERAGE_MAX;
    if (newValue < LEVERAGE_MIN) newValue = LEVERAGE_MIN;
    setShortLeverage(newValue);
  };

  // long과 로직 동일
  const amountRateHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = Number(evt.currentTarget.value);
    if (newValue < 0) {
      newValue = 0;
    } else if (newValue > 100) {
      newValue = 100;
    }
    setAmountRate(newValue);
  };

  const shortBuyHandler = (
    evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!isCandleMoving) {
      setCashAccount((prev) => prev - shortTotalPrice);
      if (!shortAccountDetail.positionActive && shortCoinAmount > 0) {
        const newShortAccount = {
          positionActive: true,
          openPrice: lastClosePrice,
          liquidPrice: shortLiquid,
          leverage: shortLeverage,
          openPositionValue: lastClosePrice * shortCoinAmount,
          openPositionAmount: shortCoinAmount,
          currentPositionValue: lastClosePrice * shortCoinAmount,
        };
        setShortAccount(newShortAccount);
      } else if (shortAccountDetail.positionActive) {
        setShortAccount((prev) => {
          const newLog = cloneDeep(prev);
          const newOpenPositionValue = lastClosePrice * shortCoinAmount;
          newLog.openPrice =
            (newLog.openPrice * newLog.openPositionAmount +
              newOpenPositionValue) /
            (newLog.openPositionAmount + shortCoinAmount);

          newLog.openPositionAmount =
            newLog.openPositionAmount + shortCoinAmount;

          newLog.openPositionValue =
            newLog.openPositionValue + newOpenPositionValue;

          newLog.currentPositionValue =
            newLog.currentPositionValue + newOpenPositionValue;

          newLog.liquidPrice = newLog.openPrice * (1 + 1 / newLog.leverage);
          return newLog;
        });
      } else if (shortCoinAmount === 0) {
        alert("0개는 주문할 수 없습니다.");
      }
      setAmountRate(0);
    }
  };

  useEffect(() => {
    setShortTotalPrice(
      lastClosePrice *
        shortCoinAmount *
        (1 + (TRANSACTION_FEE_RATE / 100) * shortLeverage)
    );
  }, [lastClosePrice, shortCoinAmount]);

  useEffect(() => {
    if (isCandleMoving) {
      setShortLiquid(0);
    } else {
      setShortLiquid(lastClosePrice * (1 + 1 / shortLeverage));
    }
  }, [lastClosePrice, shortLeverage, isCandleMoving]);

  useEffect(() => {
    const targetCash = (cashAccount * amountRate) / 100;
    const ableCoinAmount = Math.floor(
      targetCash /
        (lastClosePrice * (1 + (TRANSACTION_FEE_RATE / 100) * shortLeverage))
    );
    setShortCoinAmount(ableCoinAmount);
  }, [amountRate, shortLeverage]);

  return (
    <ShortPositionControlBox selected={!isLongControllerActive}>
      <div>
        <div>레버리지</div>
        {LEVERAGE_UNITS.map((ele) => (
          <LeverageBox
            key={ele}
            selected={shortLeverage == ele}
            disabled={shortAccountDetail.positionActive}
          >
            {ele}
            <input
              type={"radio"}
              value={ele}
              checked={shortLeverage == ele}
              onChange={shortLeverageHandler}
              disabled={shortAccountDetail.positionActive}
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
        <div>개수 :{shortCoinAmount}</div>
      </div>
      <div>
        주문 총액 :{" "}
        {shortTotalPrice.toLocaleString("ko-KR", {
          maximumFractionDigits: 0,
        })}
        원
      </div>
      <div>
        청산가 :{" "}
        {isCandleMoving
          ? "산정중..."
          : `${shortLiquid.toLocaleString("ko-KR", {
              maximumFractionDigits: 3,
            })}원`}
      </div>

      {!isCandleMoving ? (
        <button onClick={shortBuyHandler}>Buy</button>
      ) : (
        <button disabled>Buy</button>
      )}
    </ShortPositionControlBox>
  );
}

export default ShortPositionController;
