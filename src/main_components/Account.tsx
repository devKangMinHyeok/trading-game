import { useRecoilValue } from "recoil";
import styled from "styled-components";
import { totalAccountState } from "../atom";

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

export default Account;
