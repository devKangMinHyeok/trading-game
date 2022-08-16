import { RecoilRoot } from "recoil";
import ChartDisplay from "./main_components/ChartDisplay";
import Display from "./main_components/Display";

function App() {
  return (
    <RecoilRoot>
      <Display />
    </RecoilRoot>
  );
}

export default App;
