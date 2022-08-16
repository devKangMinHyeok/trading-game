import { useEffect, useState } from "react";

import {
  IFetchedMinuteCandleData,
  IMarketCodes,
} from "../interfaces/interfaces";

function useFetchMinuteCandle(selectedCoin: IMarketCodes[]) {
  const [fetchedData, setFetchedData] = useState<IFetchedMinuteCandleData[]>();

  const options = { method: "GET", headers: { Accept: "application/json" } };

  async function fetchMinuteCandle(marketCode: IMarketCodes[]) {
    const response = await fetch(
      `https://api.upbit.com/v1/candles/minutes/1?market=${marketCode[0]?.market}&count=200`,
      options
    );
    const json: IFetchedMinuteCandleData[] = await response.json();
    setFetchedData(json);
  }

  useEffect(() => {
    fetchMinuteCandle(selectedCoin);
  }, [selectedCoin]);

  return [fetchedData];
}

export default useFetchMinuteCandle;
