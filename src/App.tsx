import React, { useEffect, useRef, useState } from "react";
import {
  CandlestickData,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import styled from "styled-components";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";
import { IMarketCodes, selectedCoinState } from "./atom";
import { useFetchMarketCode } from "use-upbit-api";

const getTodayDate = () => {
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = (todayDate.getMonth() + 1).toString().padStart(2, "0");
  const date = todayDate.getDate().toString().padStart(2, "0");
  const dateStr = year + "-" + month + "-" + date;
  return dateStr;
};

interface IFetchedMinuteCandleData {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  unit: number;
}

interface IChartComponent {
  processedData?: CandlestickData[];
  updatedCandle?: CandlestickData;
}

function ChartComponent({ processedData, updatedCandle }: IChartComponent) {
  const backgroundColor = "white";
  const textColor = "black";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const newSeries = useRef<ISeriesApi<"Candlestick">>();

  useEffect(() => {
    if (processedData) console.log({ processedData });
  }, [processedData]);

  useEffect(() => {
    if (processedData) {
      const handleResize = () => {
        chart.current?.applyOptions({
          width: chartContainerRef.current?.clientWidth,
        });
      };
      if (chartContainerRef.current) {
        chart.current = createChart(chartContainerRef.current, {
          layout: {
            backgroundColor,
            textColor,
          },
          width: chartContainerRef.current?.clientWidth,
          height: 300,
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          leftPriceScale: {
            borderVisible: false,
          },
          rightPriceScale: {
            borderVisible: false,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });
      }
      chart.current?.timeScale().fitContent();
      newSeries.current = chart.current?.addCandlestickSeries({
        upColor: "#D24F45",
        wickUpColor: "#D24F45",
        downColor: "#1261C4",
        wickDownColor: "#1261C4",
        borderVisible: false,
      });
      window.addEventListener("resize", handleResize);

      newSeries.current?.setData(processedData);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.current?.remove();
      };
    }
  }, [processedData]);

  useEffect(() => {
    if (updatedCandle) {
      newSeries.current?.update(updatedCandle);
    }
  }, [updatedCandle]);

  return <div ref={chartContainerRef}></div>;
}

function Contents() {
  const { isLoading, marketCodes } = useFetchMarketCode();
  const [selectedCoin, setSelectedCoin] = useRecoilState(selectedCoinState);

  const [fetchedData, setFetchedData] = useState<IFetchedMinuteCandleData[]>();
  const [convertedData, setConvertedData] = useState<CandlestickData[]>();
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

  useEffect(() => {
    if (fetchedData) {
      const converted: CandlestickData[] = fetchedData.map((ele) => {
        // const date = new Date(ele.timestamp);
        // console.log(ele.timestamp);
        // console.log(date.toDateString());
        const newData = {
          time: (ele.timestamp / 1000) as UTCTimestamp,
          open: ele.opening_price,
          high: ele.high_price,
          low: ele.low_price,
          close: ele.trade_price,
        };

        return newData;
      });
      const reversed = [...converted].reverse();
      setConvertedData(reversed);
    }
  }, [fetchedData]);

  return <ChartComponent processedData={convertedData} />;
}

function App() {
  return (
    <RecoilRoot>
      <Contents />
    </RecoilRoot>
  );
}

export default App;
