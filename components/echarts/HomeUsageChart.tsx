import SvgChart, { SVGRenderer } from "@wuba/react-native-echarts/svgChart";
import { BarChart } from "echarts/charts";
import {
	GridComponent,
	LegendComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import type { ChartTheme } from "../../app/chartTheme";
import dayRawData from "../../app/mockData/homeUsageMockDay.json";
import weekRawData from "../../app/mockData/homeUsageMockWeek.json";
import {
	computeTotals,
	formatTime12h,
	parseHomeUsageData,
	toggleStyles,
} from "./utils";

echarts.use([
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	SVGRenderer,
	BarChart,
]);

const GAP = 0.005;

function parseRawData(
	raw: typeof dayRawData | typeof weekRawData,
	isWeek: boolean,
) {
	const { labels, solar, grid, battery } = parseHomeUsageData(raw, isWeek);
	const gap1 = solar.map((v) => (v > 0 ? GAP : 0));
	const gap2 = grid.map((v) => (v > 0 ? GAP : 0));
	const totals = computeTotals({ Solar: solar, Grid: grid, Battery: battery });
	return { labels, solar, grid, battery, gap1, gap2, totals };
}

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
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [period, setPeriod] = useState<"day" | "week">("day");

	const data = useMemo(
		() =>
			parseRawData(
				period === "day" ? dayRawData : weekRawData,
				period === "week",
			),
		[period],
	);

	const defaultLegendFormatter = useMemo(
		() => (name: string) =>
			data.totals[name as keyof typeof data.totals]
				? `${name}  ${data.totals[name as keyof typeof data.totals]} kWh`
				: name,
		[data.totals],
	);

	const defaultFormatterRef = useRef(defaultLegendFormatter);
	defaultFormatterRef.current = defaultLegendFormatter;

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
						formatter: defaultFormatterRef.current,
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

		const isWeek = period === "week";

		// opacity and shadow on active bar for better visibility
		const opacity = (i: number) =>
			activeIndex === null || activeIndex === i ? 1 : 0.3;
		const shadow = (i: number) =>
			activeIndex === i
				? { shadowBlur: 16, shadowColor: "rgba(0,0,0,0.18)", shadowOffsetY: 0 }
				: {};

		chart.setOption(
			{
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
										valMap[name] != null
											? `${name}  ${valMap[name]} kWh`
											: name,
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
					data: data.labels,
					axisLine: { show: false },
					axisLabel: {
						interval: 0,
						formatter: isWeek
							? (v: string) => v
							: (v: string) => formatTime12h(v),
					},
					axisTick: isWeek
						? { alignWithLabel: true }
						: {
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
						barMaxWidth: isWeek ? 40 : 4,
						color: theme.secondary,
						data: data.solar.map((v, i) => ({
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
						barMaxWidth: isWeek ? 40 : 4,
						data: data.gap1,
						itemStyle: { color: "transparent" },
						tooltip: { show: false },
						legendHoverLink: false,
					},
					{
						name: "Grid",
						type: "bar",
						stack: "usage",
						barMaxWidth: isWeek ? 40 : 4,
						color: theme.tertiary,
						data: data.grid.map((v, i) => ({
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
						barMaxWidth: isWeek ? 40 : 4,
						data: data.gap2,
						itemStyle: { color: "transparent" },
						tooltip: { show: false },
						legendHoverLink: false,
					},
					{
						name: "Battery",
						type: "bar",
						stack: "usage",
						barMaxWidth: isWeek ? 40 : 4,
						color: theme.primary,
						data: data.battery.map((v, i) => ({
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
			},
			{ notMerge: true },
		);
	}, [activeIndex, theme, data, period, defaultLegendFormatter]);

	// reset chart state when parent detects a tap outside the chart (resetKey increments on each outside tap)
	useEffect(() => {
		if (resetKey === 0) return;
		setActiveIndex(null);
		chartInstanceRef.current?.setOption({
			legend: { formatter: defaultFormatterRef.current },
		});
	}, [resetKey]);

	return (
		<View onStartShouldSetResponder={() => true}>
			<View style={toggleStyles.toggleRow}>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnLeft,
						period === "day" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("day")}
				>
					<Text
						style={[
							toggleStyles.toggleText,
							period === "day" && toggleStyles.toggleTextActive,
						]}
					>
						Day
					</Text>
				</Pressable>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnRight,
						period === "week" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("week")}
				>
					<Text
						style={[
							toggleStyles.toggleText,
							period === "week" && toggleStyles.toggleTextActive,
						]}
					>
						Week
					</Text>
				</Pressable>
			</View>
			<SvgChart ref={chartRef} />
		</View>
	);
}

const styles = StyleSheet.create({});
