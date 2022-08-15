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
import { useFetchMarketCode, useUpbitWebSocket } from "use-upbit-api";

const getTodayDate = () => {
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = (todayDate.getMonth() + 1).toString().padStart(2, "0");
  const date = todayDate.getDate().toString().padStart(2, "0");
  const dateStr = year + "-" + month + "-" + date;
  return dateStr;
};

const updateCandle = (currentCandle: CandlestickData, tradePrice: number) => {
  if (currentCandle.high < tradePrice) {
    currentCandle.high = tradePrice;
  }
  if (currentCandle.low > tradePrice) {
    currentCandle.low = tradePrice;
  }
  currentCandle.close = tradePrice;
  return currentCandle;
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

interface ITicker {
  type: string;
  code: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  acc_trade_price: number;
  change: string;
  change_price: number;
  signed_change_price: number;
  change_rate: number;
  signed_change_rate: number;
  ask_bid: string;
  trade_volume: number;
  acc_trade_volume: number;
  trade_date: string;
  trade_time: string;
  trade_timestamp: number;
  acc_ask_volume: number;
  acc_bid_volume: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  market_state: string;
  is_trading_suspended: boolean;
  delisting_date: null;
  market_warning: string;
  timestamp: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  stream_type: string;
}

interface IUseUpbitWebSocket {
  socket: WebSocket | null;
  isConnected: boolean;
  socketData?: ITicker[];
}

interface IChartComponent {
  processedData?: CandlestickData[];
  updatedCandle?: CandlestickData[];
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
      newSeries.current?.update(updatedCandle[0]);
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

  const { socket, isConnected, socketData }: IUseUpbitWebSocket =
    useUpbitWebSocket(selectedCoin, "ticker", {
      throttle_time: 100,
      max_length_queue: 100,
    });
  const [updatedData, setUpdatedData] = useState<CandlestickData[]>();
  const lastFetchedTimestamp = useRef<UTCTimestamp>();
  const lastFetchedCandle = useRef<CandlestickData>();
  const lastRecievedTimestamp = useRef<UTCTimestamp>();
  const oneMinuteCandle = useRef<CandlestickData>({} as CandlestickData);

  useEffect(() => {
    fetchMinuteCandle(selectedCoin);
  }, [selectedCoin]);

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
    <ChartComponent processedData={convertedData} updatedCandle={updatedData} />
  );
}

function App() {
  return (
    <RecoilRoot>
      <Contents />
    </RecoilRoot>
  );
}

export default App;
