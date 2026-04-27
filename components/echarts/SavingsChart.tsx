import SvgChart, { SVGRenderer } from "@wuba/react-native-echarts/svgChart";
import { LineChart } from "echarts/charts";
import {
	GridComponent,
	LegendComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/savingsMock.json";
import { parseSavingsData } from "./utils";

echarts.use([
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	SVGRenderer,
	LineChart,
]);

const data = parseSavingsData(rawData);

// extract the x-axis labels and the 2 datasets
const labels = data.map((d) => d.label);
const notOptimisedData = data.map((d) => d.notOptimised);
const usedData = data.map((d) => d.used);

// show the last (most recent) value in the legend by default
const totals = {
	"Not Optimised": `£${notOptimisedData[notOptimisedData.length - 1]?.toFixed(2)}`,
	"Used Strategy": `£${usedData[usedData.length - 1]?.toFixed(2)}`,
};
// default legend formatter when not hovering - show series name + most recent value
const defaultLegendFormatter = (name: string) =>
	totals[name as keyof typeof totals]
		? `${name}  ${totals[name as keyof typeof totals]}`
		: name;

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function SavingsChart({ theme }: { theme: ChartTheme }) {
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
			// legend settings
			legend: {
				data: ["Not Optimised", "Used Strategy"],
				top: 0,
				right: 0,
				formatter: defaultLegendFormatter,
			},
			// grid dimensions
			grid: { top: 40, bottom: 30, left: 50, right: 20 },
			// x-axis: weekly interval labels, no boundary gap for area chart
			xAxis: {
				type: "category",
				data: labels,
				boundaryGap: false,
			},
			// y-axis: £ prefix on labels, dashed gridlines
			yAxis: {
				type: "value",
				axisLabel: { formatter: (v: number) => `£${v}` },
				axisLine: { show: true },
				splitLine: { lineStyle: { type: "dashed", color: theme.grid } },
			},
			// 2 smooth area+line series: not-optimised strategy vs used strategy
			series: [
				{
					name: "Not Optimised",
					type: "line",
					data: notOptimisedData,
					smooth: true,
					symbol: "none",
					lineStyle: { color: theme.primary, width: 2 },
					itemStyle: { color: theme.primary },
					areaStyle: { color: theme.primary, opacity: 0.3 },
				},
				{
					name: "Used Strategy",
					type: "line",
					data: usedData,
					smooth: true,
					symbol: "none",
					lineStyle: { color: theme.tertiary, width: 2 },
					itemStyle: { color: theme.tertiary },
					areaStyle: { color: theme.tertiary, opacity: 0.3 },
				},
			],
		});
	}, [theme]);

	return (
		<View>
			<SvgChart ref={chartRef} />
		</View>
	);
}
