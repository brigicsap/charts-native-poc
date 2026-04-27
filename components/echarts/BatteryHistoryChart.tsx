import SvgChart, { SVGRenderer } from "@wuba/react-native-echarts/svgChart";
import { LineChart } from "echarts/charts";
import {
	GridComponent,
	LegendComponent,
	MarkAreaComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/batteryHistoryMockDay.json";

echarts.use([
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	MarkAreaComponent,
	SVGRenderer,
	LineChart,
]);

// build a lookup map from time string to battery percentage
const dataMap = new Map(
	rawData.datapoints.map((dp) => [
		dp.timestamp.slice(11, 16),
		dp.batteryPercentage,
	]),
);

// generate all 96 15-minute slots for a full day, filling gaps with null
const allSlots = Array.from({ length: 96 }, (_, i) => {
	const h = String(Math.floor(i / 4)).padStart(2, "0");
	const m = String((i % 4) * 15).padStart(2, "0");
	return `${h}:${m}`;
});

// null where data is missing - connectNulls: false will break the line there
const batteryData = allSlots.map((time) => {
	const val = dataMap.get(time);
	return val ?? null;
});

// compute average of non-null values to show in legend by default
const validBattery = batteryData.filter((v): v is number => v != null);
const batteryAvg =
	validBattery.length > 0
		? (validBattery.reduce((s, v) => s + v, 0) / validBattery.length).toFixed(2)
		: "—";

// default legend formatter when not hovering - show series name + average
const defaultLegendFormatter = (name: string) =>
	name === "Battery" ? `${name}  ${batteryAvg}%` : name;

// index range for the warranty reference area shading
const refStart = allSlots.indexOf("05:00");
const refEnd = allSlots.indexOf("07:00");

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function BatteryHistoryChart({
	theme,
	resetKey = 0,
}: {
	theme: ChartTheme;
	resetKey?: number;
}) {
	const chartRef = useRef<React.ComponentRef<typeof SvgChart>>(null);
	const chartInstanceRef = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (chartRef.current) {
			const chart = echarts.init(chartRef.current, "light", {
				renderer: "svg",
				width: E_WIDTH,
				height: E_HEIGHT,
			});
			chartInstanceRef.current = chart;

			// reset legend to average on global out
			chart.on("globalout", () => {
				chart.setOption({
					legend: {
						formatter: defaultLegendFormatter,
					},
				});
			});
		}
		return () => {
			chartInstanceRef.current?.dispose();
			chartInstanceRef.current = null;
		};
	}, []);

	useEffect(() => {
		const chart = chartInstanceRef.current;
		if (!chart) return;

		chart.setOption({
			// we need a tooltip to show the values on hover, but we'll handle the formatting ourselves in the legend while hiding the actual tooltip box
			tooltip: {
				trigger: "axis",
				axisPointer: {
					type: "line",
					lineStyle: { color: theme.secondary, type: "dashed" },
				},
				backgroundColor: "transparent",
				borderWidth: 0,
				padding: 0,
				formatter: (params: any) => {
					const items = Array.isArray(params) ? params : [params];
					if (!chartInstanceRef.current) return "";
					const valMap: Record<string, string> = {};
					for (const p of items) {
						valMap[p.seriesName] =
							p.value != null ? Number(p.value).toFixed(2) : "—";
					}
					setTimeout(() => {
						chartInstanceRef.current?.setOption({
							legend: {
								formatter: (name: string) =>
									valMap[name] != null ? `${name}  ${valMap[name]}%` : name,
							},
						});
					}, 0);
					return "";
				},
			},
			// legend settings
			legend: {
				data: ["Battery"],
				top: 0,
				right: 0,
				formatter: defaultLegendFormatter,
			},
			// grid dimensions
			grid: { top: 40, bottom: 30, left: 50, right: 20 },
			// x-axis: 4 labels only, ticks hidden (line chart doesn't need them)
			xAxis: {
				type: "category",
				data: allSlots,
				axisTick: { show: false },
				axisLabel: {
					interval: (index: number, value: string) => {
						return (
							value === "00:00" ||
							value === "06:00" ||
							value === "12:00" ||
							value === "18:00"
						);
					},
					formatter: (v: string) => {
						const h = parseInt(v.slice(0, 2));
						if (h === 0 && v === "00:00") return "12am";
						if (h === 6 && v === "06:00") return "6am";
						if (h === 12 && v === "12:00") return "12pm";
						if (h === 18 && v === "18:00") return "6pm";
						return "";
					},
				},
			},
			// y-axis: 0-100% range in 25% intervals
			yAxis: {
				type: "value",
				name: "%",
				min: 0,
				max: 100,
				interval: 25,
				axisLine: { show: true },
				splitLine: { lineStyle: { type: "dashed" } },
			},
			// single line series with a shaded warranty reference area
			series: [
				{
					name: "Battery",
					type: "line",
					data: batteryData,
					smooth: true,
					connectNulls: false,
					symbol: "circle",
					showSymbol: false,
					symbolSize: 14,
					emphasis: {
						itemStyle: {
							color: theme.secondary,
							borderColor: theme.activeDotStroke,
							borderWidth: 4,
						},
					},
					lineStyle: { color: theme.primary, width: 2 },
					itemStyle: { color: theme.secondary },
					markArea: {
						silent: true,
						data: [
							[
								{
									xAxis: refStart,
									itemStyle: {
										color: theme.referenceArea,
										opacity: 0.5,
									},
								},
								{ xAxis: refEnd },
							],
						],
					},
				},
			],
		});
	}, [theme]);

	// reset chart state when parent detects a tap outside the chart (resetKey increments on each outside tap)
	useEffect(() => {
		if (resetKey === 0) return;
		chartInstanceRef.current?.setOption({
			legend: { formatter: defaultLegendFormatter },
		});
	}, [resetKey]);

	return (
		<View onStartShouldSetResponder={() => true}>
			<SvgChart ref={chartRef} />
		</View>
	);
}
