import SvgChart, { SVGRenderer } from "@wuba/react-native-echarts/svgChart";
import { BarChart } from "echarts/charts";
import {
	GridComponent,
	LegendComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/homeUsageMockDay.json";

echarts.use([
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	SVGRenderer,
	BarChart,
]);

// parse the raw data into a more convenient format for charting
const parsed = rawData.datapoints.map((dp) => {
	const time = dp.from.slice(11, 16);
	const map: Record<string, number | string> = { time };
	for (const c of dp.constituentDatapoints) {
		map[c.type] = c.energy;
	}
	return map;
});
// extract the x-axis labels and the 3 datasets
const times = parsed.map((d) => d.time);
const solarData = parsed.map((d) => d["solar-consumption"] ?? 0);
const gridData = parsed.map((d) => d["grid-consumption"] ?? 0);
const batteryData = parsed.map((d) => d["battery-consumption"] ?? 0);
const GAP = 0.005;
const gap1 = solarData.map((v) => (Number(v) > 0 ? GAP : 0));
const gap2 = gridData.map((v) => (Number(v) > 0 ? GAP : 0));

// we want to show the total for each series in the legend on press, so we prepare those values here
const totals = {
	Solar: solarData.reduce<number>((s, v) => s + Number(v), 0).toFixed(2),
	Grid: gridData.reduce<number>((s, v) => s + Number(v), 0).toFixed(2),
	Battery: batteryData.reduce<number>((s, v) => s + Number(v), 0).toFixed(2),
};
// default legend formatter when not pressing - just show the series name
const defaultLegendFormatter = (name: string) =>
	totals[name as keyof typeof totals]
		? `${name}  ${totals[name as keyof typeof totals]} kWh`
		: name;
// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 10;
const E_HEIGHT = 320;

export default function HomeUsageChart({
	theme,
	resetKey = 0,
}: {
	theme: ChartTheme;
	resetKey?: number;
}) {
	const chartRef = useRef<React.ComponentRef<typeof SvgChart>>(null);
	const chartInstanceRef = useRef<echarts.ECharts | null>(null);
	// state to track the currently active bar index for tooltip display
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	useEffect(() => {
		if (chartRef.current) {
			const chart = echarts.init(chartRef.current, "light", {
				renderer: "svg",
				width: E_WIDTH,
				height: E_HEIGHT,
			});
			chartInstanceRef.current = chart;

			// handle bar clicks to show values in legend
			chart.on("click", (params) => {
				const idx = params.dataIndex as number;
				setActiveIndex((prev) => (prev === idx ? null : idx));
			});

			// reset legend and active selection on global out
			chart.on("globalout", () => {
				setActiveIndex(null);
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

		// opacity and shadow on active bar for better visibility
		const opacity = (i: number) =>
			activeIndex === null || activeIndex === i ? 1 : 0.3;
		const shadow = (i: number) =>
			activeIndex === i
				? { shadowBlur: 16, shadowColor: "rgba(0,0,0,0.18)", shadowOffsetY: 0 }
				: {};

		chart.setOption({
			// we need a tooltip to show the values on press, but we'll handle the formatting ourselves in the legend while hiding the actual tooltip box
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "shadow" },
				backgroundColor: "transparent",
				borderWidth: 0,
				padding: 0,
				formatter: (params: any) => {
					if (!Array.isArray(params) || !chartInstanceRef.current) return "";
					const valMap: Record<string, string> = {};
					for (const p of params) {
						if (p.seriesName === "gap1" || p.seriesName === "gap2") continue;
						valMap[p.seriesName] = (Number(p.value) || 0).toFixed(2);
					}
					setTimeout(() => {
						chartInstanceRef.current?.setOption({
							legend: {
								formatter: (name: string) =>
									valMap[name] != null ? `${name}  ${valMap[name]} kWh` : name,
							},
						});
					}, 0);
					return "";
				},
			},
			// legend settings
			legend: {
				data: ["Solar", "Grid", "Battery"],
				top: 0,
				right: 0,
				formatter: defaultLegendFormatter,
			},
			// full grid borders and dimensions
			grid: {
				show: true,
				top: 50,
				bottom: 30,
				left: 50,
				right: 20,
				borderColor: theme.referenceLineLight,
				borderWidth: 1,
			},
			// x-axis settings
			xAxis: {
				type: "category",
				data: times,
				axisLine: { show: false },
				axisLabel: {
					interval: 0,
					formatter: (v: string) => {
						const h = parseInt(v.slice(0, 2));
						if (h === 0 && v === "00:00") return "12am";
						if (h === 6 && v === "06:00") return "6am";
						if (h === 12 && v === "12:00") return "12pm";
						if (h === 18 && v === "18:00") return "6pm";
						return "";
					},
				},
				axisTick: {
					alignWithLabel: true,
					interval: (_: number, v: string) => {
						const h = parseInt(v.slice(0, 2));
						return h % 3 === 0 && v.endsWith(":00");
					},
				},
			},
			// y-axis settings
			yAxis: {
				type: "value",
				name: "kWh",
				axisLine: { show: false },
				splitLine: { lineStyle: { type: "dashed" } },
			},
			// the 3 datasets and their styling
			series: [
				{
					name: "Solar",
					type: "bar",
					stack: "usage",
					barMaxWidth: 4,
					color: theme.secondary,
					data: solarData.map((v, i) => ({
						value: v,
						itemStyle: {
							color: theme.secondary,
							opacity: opacity(i),
							...shadow(i),
						},
					})),
				},
				// hack to get a gap between stacked bars
				{
					name: "gap1",
					type: "bar",
					stack: "usage",
					barMaxWidth: 4,
					data: gap1,
					itemStyle: { color: "transparent" },
					tooltip: { show: false },
					legendHoverLink: false,
				},
				{
					name: "Grid",
					type: "bar",
					stack: "usage",
					barMaxWidth: 4,
					color: theme.tertiary,
					data: gridData.map((v, i) => ({
						value: v,
						itemStyle: {
							color: theme.tertiary,
							borderRadius: [6, 6, 0, 0],
							opacity: opacity(i),
							...shadow(i),
						},
					})),
					barCategoryGap: "10%",
				},
				{
					name: "gap2",
					type: "bar",
					stack: "usage",
					barMaxWidth: 4,
					data: gap2,
					itemStyle: { color: "transparent" },
					tooltip: { show: false },
					legendHoverLink: false,
				},
				{
					name: "Battery",
					type: "bar",
					stack: "usage",
					barMaxWidth: 4,
					color: theme.primary,
					data: batteryData.map((v, i) => ({
						value: v,
						itemStyle: {
							color: theme.primary,
							borderRadius: [6, 6, 0, 0],
							opacity: opacity(i),
							...shadow(i),
						},
					})),
				},
			],
		});
	}, [activeIndex, theme]);

	// reset chart state when parent detects a tap outside the chart (resetKey increments on each outside tap)
	useEffect(() => {
		if (resetKey === 0) return;
		setActiveIndex(null);
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
