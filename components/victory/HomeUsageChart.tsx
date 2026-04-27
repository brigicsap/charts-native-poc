import {
	DashPathEffect,
	RoundedRect,
	Line as SkiaLine,
	useFont,
	vec,
} from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import {
	Dimensions,
	Pressable,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { CartesianChart, StackedBar, useChartPressState } from "victory-native";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import dayRawData from "../../app/mockData/homeUsageMockDay.json";
import weekRawData from "../../app/mockData/homeUsageMockWeek.json";
import {
	computeTotals,
	formatTime12h,
	legendStyles,
	parseHomeUsageData,
	toggleStyles,
} from "./utils";

function parseRawData(
	raw: typeof dayRawData | typeof weekRawData,
	isWeek: boolean,
) {
	const { labels, solar, grid, battery } = parseHomeUsageData(raw, isWeek);

	const chartData = labels.map((_, i) => ({
		time: i,
		solar: solar[i],
		grid: grid[i],
		battery: battery[i],
	}));

	const timeLabels = labels;

	const xTickIndices = isWeek
		? chartData.map((_, i) => i)
		: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
				.map((t) => timeLabels.indexOf(t))
				.filter((i) => i >= 0);

	const totals = computeTotals({ solar, grid, battery });

	const maxY = Math.max(...chartData.map((d) => d.solar + d.grid + d.battery));

	return { chartData, timeLabels, xTickIndices, totals, maxY };
}

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function HomeUsageChart({ theme }: { theme: ChartTheme }) {
	const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 11);
	const [period, setPeriod] = useState<"day" | "week">("day");

	const data = useMemo(
		() =>
			parseRawData(
				period === "day" ? dayRawData : weekRawData,
				period === "week",
			),
		[period],
	);

	const xTickFormat = useMemo(
		() => (idx: number) => {
			const t = data.timeLabels[idx];
			if (!t) return "";
			if (period === "week") return t;
			return formatTime12h(t);
		},
		[data.timeLabels, period],
	);

	// chartPressState drives highlight + legend value updates while pressing
	const { state, isActive } = useChartPressState({
		x: 0,
		y: { solar: 0, grid: 0, battery: 0 },
	});
	// current selected point values shown in legend during interaction
	const [tooltip, setTooltip] = useState<{
		time: string;
		solar: number;
		grid: number;
		battery: number;
	} | null>(null);

	// mirror press state into React state so legend text updates on the JS side
	useAnimatedReaction(
		() => ({
			active: state.isActive.value,
			idx: state.matchedIndex.value,
		}),
		(cur) => {
			if (!cur.active || cur.idx < 0) {
				runOnJS(setTooltip)(null);
				return;
			}
			const d = data.chartData[cur.idx];
			if (d) {
				runOnJS(setTooltip)({
					time: data.timeLabels[cur.idx] ?? "",
					solar: d.solar,
					grid: d.grid,
					battery: d.battery,
				});
			}
		},
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={toggleStyles.toggleRow}>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnLeft,
						period === "day" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("day")}
				>
					<RNText
						style={[
							toggleStyles.toggleText,
							period === "day" && toggleStyles.toggleTextActive,
						]}
					>
						Day
					</RNText>
				</Pressable>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnRight,
						period === "week" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("week")}
				>
					<RNText
						style={[
							toggleStyles.toggleText,
							period === "week" && toggleStyles.toggleTextActive,
						]}
					>
						Week
					</RNText>
				</Pressable>
			</RNView>
			{/* static legend row; values switch between totals and selected point */}
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[
							legendStyles.legendDot,
							{ backgroundColor: theme.secondary },
						]}
					/>
					<RNText style={legendStyles.legendText}>
						Solar{" "}
						{tooltip
							? `${tooltip.solar.toFixed(2)} kWh`
							: `${data.totals.solar} kWh`}
					</RNText>
				</RNView>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[
							legendStyles.legendDot,
							{ backgroundColor: theme.tertiary },
						]}
					/>
					<RNText style={legendStyles.legendText}>
						Grid{" "}
						{tooltip
							? `${tooltip.grid.toFixed(2)} kWh`
							: `${data.totals.grid} kWh`}
					</RNText>
				</RNView>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Battery{" "}
						{tooltip
							? `${tooltip.battery.toFixed(2)} kWh`
							: `${data.totals.battery} kWh`}
					</RNText>
				</RNView>
			</RNView>
			{/* stacked bar chart with frame, gridlines, and custom x-axis ticks */}
			<CartesianChart
				data={data.chartData}
				xKey="time"
				yKeys={["solar", "grid", "battery"]}
				domain={{ y: [0, Math.max(data.maxY * 1.1, 0.3)] }}
				domainPadding={{
					top: 20,
					left: period === "week" ? 30 : 10,
					right: period === "week" ? 20 : 10,
				}}
				padding={{ left: 10, right: 10, top: 30, bottom: 5 }}
				chartPressState={state}
				gestureLongPressDelay={0}
				xAxis={{
					tickValues: data.xTickIndices,
					formatXLabel: (value) => xTickFormat(Number(value)),
					labelColor: theme.referenceLine,
					lineColor: "transparent",
					lineWidth: 0,
					font,
				}}
				yAxis={[
					{
						formatYLabel: (value) => `${value}`,
						labelColor: theme.referenceLine,
						lineColor: theme.grid,
						lineWidth: 1,
						linePathEffect: <DashPathEffect intervals={[4, 4]} />,
						font,
					},
				]}
				frame={{
					lineColor: theme.referenceLineLight,
					lineWidth: 1,
				}}
				// draw outward tick marks (Victory doesn't expose short x-tick marks directly)
				renderOutside={({ points, chartBounds }) => (
					<>
						{data.xTickIndices.map((idx) => {
							const x = points.solar[idx]?.x;
							if (x == null) return null;
							return (
								<SkiaLine
									key={`tick-${idx}`}
									p1={vec(x, chartBounds.bottom)}
									p2={vec(x, chartBounds.bottom + 6)}
									color={theme.referenceLine}
									strokeWidth={1}
								/>
							);
						})}
					</>
				)}
			>
				{/* render stacked bars and active-column highlight */}
				{({ points, chartBounds }) => {
					const pts = points.solar;
					const step = pts.length > 1 ? pts[1].x - pts[0].x : 0;
					return (
						<>
							<StackedBar
								chartBounds={chartBounds}
								points={[points.solar, points.grid, points.battery]}
								colors={[theme.secondary, theme.tertiary, theme.primary]}
								innerPadding={0.3}
								barOptions={({ isTop }) => ({
									roundedCorners: isTop
										? { topLeft: 3, topRight: 3 }
										: undefined,
								})}
							/>
							{isActive && (
								<RoundedRect
									x={state.x.position}
									y={chartBounds.top}
									width={step * 0.7}
									height={chartBounds.bottom - chartBounds.top}
									r={4}
									color={theme.barHighlight}
								/>
							)}
						</>
					);
				}}
			</CartesianChart>
		</View>
	);
}

const styles = StyleSheet.create({
	chartWrapper: {
		width: E_WIDTH,
		height: E_HEIGHT,
	},
});
