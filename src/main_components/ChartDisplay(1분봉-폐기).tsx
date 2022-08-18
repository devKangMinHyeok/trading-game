import { useEffect, useRef, useState } from "react";
import { CandlestickData, UTCTimestamp } from "lightweight-charts";

import { useRecoilValue } from "recoil";
import { useUpbitWebSocket } from "use-upbit-api";
import { selectedCoinState } from "../atom";
import { IUseUpbitWebSocket } from "../interfaces/interfaces";
import { updateCandle } from "../functions/updateCandle";
import ChartComponent from "../components/ChartComponent";
import useFetchMinuteCandle from "../hooks/useFetchMinuteCandle";

function ChartDisplay() {
  const selectedCoin = useRecoilValue(selectedCoinState);

  const [fetchedData] = useFetchMinuteCandle(selectedCoin);
  const [convertedData, setConvertedData] = useState<CandlestickData[]>();

  const { socket, isConnected, socketData }: IUseUpbitWebSocket =
    useUpbitWebSocket(selectedCoin, "ticker", {
      throttle_time: 50,
      max_length_queue: 100,
    });

  const [updatedData, setUpdatedData] = useState<CandlestickData[]>();
  const lastFetchedTimestamp = useRef<UTCTimestamp>();
  const lastFetchedCandle = useRef<CandlestickData>();
  const lastRecievedTimestamp = useRef<UTCTimestamp>();
  const oneMinuteCandle = useRef<CandlestickData>({} as CandlestickData);

  useEffect(() => {
    if (fetchedData) {
      const reversed = [...fetchedData].reverse();
      const converted: CandlestickData[] = reversed.map((ele) => {
        const time = (ele.timestamp / 1000) as UTCTimestamp;
        lastFetchedTimestamp.current = time;
        const newData = {
          time,
          open: ele.opening_price,
          high: ele.high_price,
          low: ele.low_price,
          close: ele.trade_price,
        };

        return newData;
      });
      setConvertedData(converted);
      lastFetchedCandle.current = converted.slice(-1)[0];
    }
  }, [fetchedData]);

  useEffect(() => {
    if (socketData) {
      console.log(socketData);
      const converted = socketData.map((ele) => {
        const remain = Math.ceil(ele.timestamp / 1000) % 60;
        let time = (Math.ceil(ele.timestamp / 1000) - remain) as UTCTimestamp;
        if (
          lastFetchedTimestamp.current &&
          lastFetchedTimestamp.current > time
        ) {
          time = lastFetchedTimestamp.current;
          if (lastFetchedCandle.current)
            oneMinuteCandle.current = updateCandle(
              lastFetchedCandle.current,
              ele.trade_price
            );
        } else if (
          lastRecievedTimestamp.current &&
          lastRecievedTimestamp.current != time
        ) {
          oneMinuteCandle.current = {} as CandlestickData;
          oneMinuteCandle.current = {
            time,
            open: ele.trade_price,
            high: ele.trade_price,
            low: ele.trade_price,
            close: ele.trade_price,
          };
        } else {
          console.log("here");
          oneMinuteCandle.current = updateCandle(
            oneMinuteCandle.current,
            ele.trade_price
          );
        }
        lastRecievedTimestamp.current = time;

        return oneMinuteCandle.current;
      });
      setUpdatedData(converted);
    }
  }, [socketData]);

  return (
    <>
      <div>1분봉 차트 연결 상태 : {isConnected ? "🟢" : "🔴"}</div>
      <ChartComponent
        processedData={convertedData}
        updatedCandle={updatedData}
      />
    </>
  );
}

export default ChartDisplay;
