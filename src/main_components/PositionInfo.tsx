import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import styled from "styled-components";
import {
  cashAccountState,
  isCandleMovingState,
  lastClosePriceState,
  longAccountDetailState,
  longAccountState,
} from "../atom";

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

export default PositionInfo;
