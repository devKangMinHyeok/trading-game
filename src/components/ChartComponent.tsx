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
  longLiquidPrice,
  longPositionOpenPrice,
  shortLiquidPrice,
  shortPositionOpenPrice,
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
    const longLiquidLine = newSeries.current?.createPriceLine({
      price: longLiquidPrice,
      color: "#8400ff",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "Long 청산가",
    } as PriceLineOptions);

    return () => {
      if (longLiquidLine) newSeries.current?.removePriceLine(longLiquidLine);
    };
  }, [longLiquidPrice]);

  useEffect(() => {
    const shortLiquidLine = newSeries.current?.createPriceLine({
      price: shortLiquidPrice,
      color: "#ff8800",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "Short 청산가",
    } as PriceLineOptions);

    return () => {
      if (shortLiquidLine) newSeries.current?.removePriceLine(shortLiquidLine);
    };
  }, [shortLiquidPrice]);

  useEffect(() => {
    const longOpenPriceLine = newSeries.current?.createPriceLine({
      price: longPositionOpenPrice,
      color: "#00d890",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "Long 평단가",
    } as PriceLineOptions);

    return () => {
      if (longOpenPriceLine)
        newSeries.current?.removePriceLine(longOpenPriceLine);
    };
  }, [longPositionOpenPrice]);

  useEffect(() => {
    const shortOpenPriceLine = newSeries.current?.createPriceLine({
      price: shortPositionOpenPrice,
      color: "#d8009e",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "Short 평단가",
    } as PriceLineOptions);

    return () => {
      if (shortOpenPriceLine)
        newSeries.current?.removePriceLine(shortOpenPriceLine);
    };
  }, [shortPositionOpenPrice]);

  return <div ref={chartContainerRef}></div>;
}

export default ChartComponent;
