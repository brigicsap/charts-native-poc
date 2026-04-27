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
import rawData from "../../app/mockData/exportImportDay.json";

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

// extract the x-axis labels and the 2 datasets
const times = parsed.map((d) => d.time);
const importData = parsed.map((d) => d["grid-import"] ?? 0);
const exportData = parsed.map((d) => d["grid-export"] ?? 0);

// we want to show the total for each series in the legend by default, so we prepare those values here
const totals = {
	Import: importData.reduce<number>((s, v) => s + Number(v), 0).toFixed(2),
	Export: exportData.reduce<number>((s, v) => s + Number(v), 0).toFixed(2),
};
// default legend formatter when not pressing - show series name + total
const defaultLegendFormatter = (name: string) =>
	totals[name as keyof typeof totals]
		? `${name}  £${totals[name as keyof typeof totals]}`
		: name;

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function ExportImportChart({
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
						valMap[p.seriesName] = (Number(p.value) || 0).toFixed(2);
					}
					setTimeout(() => {
						chartInstanceRef.current?.setOption({
							legend: {
								formatter: (name: string) =>
									valMap[name] != null ? `${name}  £${valMap[name]}` : name,
							},
						});
					}, 0);
					return "";
				},
			},
			// legend settings
			legend: {
				data: ["Import", "Export"],
				top: 0,
				right: 0,
				formatter: defaultLegendFormatter,
			},
			// grid dimensions - no border (axis lines handle edges)
			grid: {
				show: true,
				top: 40,
				bottom: 30,
				left: 50,
				right: 20,
				borderColor: "transparent",
			},
			// x-axis: 4 labels only, ticks at 4 positions, axis line sits at y=0 for negative bars, ticks stay at chart bottom
			xAxis: {
				type: "category",
				data: times,
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
				axisLine: { onZero: true },
				axisTick: {
					onZero: false,
					alignWithLabel: true,
					interval: (_: number, v: string) =>
						v === "00:00" || v === "06:00" || v === "12:00" || v === "18:00",
				},
			},
			// y-axis: £ prefix on labels, left axis line visible
			yAxis: {
				type: "value",
				name: "£",
				axisLine: { show: true },
				splitLine: {
					lineStyle: {
						type: "dashed",
					},
				},
			},
			// the 2 datasets: import and export
			series: [
				{
					name: "Import",
					type: "bar",
					stack: "ie",
					barMaxWidth: 6,
					color: theme.primary,
					data: importData.map((v, i) => ({
						value: v,
						itemStyle: {
							color: theme.primary,
							borderRadius: [0, 0, 6, 6],
							opacity: opacity(i),
							...shadow(i),
						},
					})),
				},
				{
					name: "Export",
					type: "bar",
					stack: "ie",
					barMaxWidth: 6,
					color: theme.secondary,
					data: exportData.map((v, i) => ({
						value: v,
						itemStyle: {
							color: theme.secondary,
							borderRadius: [6, 6, 0, 0],
							opacity: opacity(i),
							...shadow(i),
						},
					})),
					barCategoryGap: "10%",
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
