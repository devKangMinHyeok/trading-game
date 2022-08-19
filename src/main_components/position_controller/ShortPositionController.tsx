import { useRecoilValue } from "recoil";
import styled from "styled-components";
import { isLongControllerActiveState } from "../../atom";

interface PositionControlProps {
  selected: boolean;
}

const ShortPositionControlBox = styled.div<PositionControlProps>`
  display: ${(props) => (props.selected ? "block" : "none")};
`;

function ShortPositionController() {
  const isLongControllerActive = useRecoilValue(isLongControllerActiveState);

  return (
    <ShortPositionControlBox selected={!isLongControllerActive}>
      ShortPositionController
    </ShortPositionControlBox>
  );
}

export default ShortPositionController;
