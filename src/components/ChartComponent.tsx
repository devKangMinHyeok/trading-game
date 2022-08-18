import {
  createChart,
  CrosshairMode,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  PriceLineOptions,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { IChartComponent } from "../interfaces/interfaces";

function ChartComponent({
  processedData,
  updatedCandle,
  liquidPrice,
  positionOpenPrice,
}: IChartComponent) {
  const backgroundColor = "white";
  const textColor = "black";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const newSeries = useRef<ISeriesApi<"Candlestick">>();

  useEffect(() => {
    if (processedData) {
      const handleResize = () => {
        chart.current?.applyOptions({
          width: chartContainerRef.current?.clientWidth,
          height: chartContainerRef.current?.clientHeight,
        });
      };
      if (chartContainerRef.current) {
        chart.current = createChart(chartContainerRef.current, {
          layout: {
            backgroundColor,
            textColor,
          },
          width: chartContainerRef.current?.clientWidth,
          height: 240,
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
            rightOffset: 10,
            lockVisibleTimeRangeOnResize: true,
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

  useEffect(() => {
    const priceLine = newSeries.current?.createPriceLine({
      price: liquidPrice,
      color: "#8400ff",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "청산가",
    } as PriceLineOptions);

    return () => {
      if (priceLine) newSeries.current?.removePriceLine(priceLine);
    };
  }, [liquidPrice]);

  useEffect(() => {
    const priceLine = newSeries.current?.createPriceLine({
      price: positionOpenPrice,
      color: "#00d890",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "평단가",
    } as PriceLineOptions);

    return () => {
      if (priceLine) newSeries.current?.removePriceLine(priceLine);
    };
  }, [positionOpenPrice]);

  return <div ref={chartContainerRef}></div>;
}

export default ChartComponent;