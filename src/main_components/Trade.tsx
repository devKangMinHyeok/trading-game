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
  turnNumberState,
} from "../atom";
import LongPositionController from "./position_controller/LongPositionController";
import ShortPositionController from "./position_controller/ShortPositionController";

const TradeContainer = styled.div`
  border: 1px solid black;
  grid-row: 2 / span 2;
`;

function Trade() {
  const turnNumber = useRecoilValue(turnNumberState);
  const isCandleMoving = useRecoilValue(isCandleMovingState);
  const lastClosePrice = useRecoilValue(lastClosePriceState);

  const [isLongControllerActive, setIsLongControllerActive] = useRecoilState(
    isLongControllerActiveState
  );
  const [longAccount, setLongAccount] = useRecoilState(longAccountState);

  const controllerSwitchHandler = (
    evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setIsLongControllerActive((prev) => !prev);
  };

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
      {isCandleMoving ? (
        <button disabled={true}>
          {isLongControllerActive ? "Long" : "Short"}
        </button>
      ) : (
        <button onClick={controllerSwitchHandler}>
          {isLongControllerActive ? "Long" : "Short"}
        </button>
      )}

      <LongPositionController />
      <ShortPositionController />
    </TradeContainer>
  );
}

export default Trade;
