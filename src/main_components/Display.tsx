import styled from "styled-components";
import Account from "./Account";
import Chart from "./Chart";
import Control from "./Control";
import PositionInfo from "./PositionInfo";
import Shop from "./Shop";
import Trade from "./Trade";

const DisplayContainer = styled.div`
  width: 1250px;
  height: 500px;
  border: 1px solid red;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1.5fr 1fr 1fr;
`;

function Display() {
  return (
    <>
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
