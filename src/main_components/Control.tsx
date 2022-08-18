import { useRecoilState } from "recoil";
import styled from "styled-components";
import { isCandleMovingState, turnNumberState } from "../atom";

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
      <div>Turn Number : {turnNumber}</div>
      {isCandleMoving ? (
        <button disabled>Next Turn</button>
      ) : (
        <button onClick={nextTurnHandler}>Next Turn</button>
      )}
    </ControlContainer>
  );
}

export default Control;
