import {
	Circle,
	DashPathEffect,
	Rect,
	RoundedRect,
	useFont,
} from "@shopify/react-native-skia";
import { useState } from "react";
import {
	Dimensions,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/batteryHistoryMockDay.json";

// generate all 96 15-minute slots for a full day
const allSlots = Array.from({ length: 96 }, (_, i) => {
	const h = String(Math.floor(i / 4)).padStart(2, "0");
	const m = String((i % 4) * 15).padStart(2, "0");
	return `${h}:${m}`;
});

// build a lookup map from time string to battery percentage
const dataMap = new Map(
	rawData.datapoints.map((dp) => [
		dp.timestamp.slice(11, 16),
		dp.batteryPercentage,
	]),
);

// null regions are tracked so we can split the line and shade missing data
const nullIndices: number[] = [];
const chartData = allSlots.map((time, i) => {
	const val = dataMap.get(time);
	if (val == null) nullIndices.push(i);
	return { time: i, battery: val ?? 0 };
});
const NULL_START = nullIndices[0] ?? -1;
const NULL_END = nullIndices[nullIndices.length - 1] ?? -1;

// compute average of non-null values to show in legend by default
const validBatteryValues = chartData.filter(
	(_d, i) => !nullIndices.includes(i),
);
const batteryAvg =
	validBatteryValues.length > 0
		? (
				validBatteryValues.reduce((s, d) => s + d.battery, 0) /
				validBatteryValues.length
			).toFixed(2)
		: "—";

// only show the 4 major x-axis positions
const xTickIndices = ["00:00", "06:00", "12:00", "18:00"]
	.map((t) => allSlots.indexOf(t))
	.filter((i) => i >= 0);

// format x-axis labels as 12h clock text
const xTickFormat = (idx: number) => {
	const t = allSlots[idx];
	if (!t) return "";
	if (t === "00:00") return "12am";
	if (t === "06:00") return "6am";
	if (t === "12:00") return "12pm";
	if (t === "18:00") return "6pm";
	return "";
};

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function BatteryHistoryChart({ theme }: { theme: ChartTheme }) {
	const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 11);
	// chartPressState drives focus line/dot + legend value updates while pressing
	const { state, isActive } = useChartPressState({
		x: 0,
		y: { battery: 0 },
	});
	// current selected point value shown in legend during interaction
	const [tooltip, setTooltip] = useState<{
		time: string;
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
			const d = chartData[cur.idx];
			if (d) {
				runOnJS(setTooltip)({
					time: allSlots[cur.idx] ?? "",
					battery: d.battery,
				});
			}
		},
	);

	return (
		<View style={styles.chartWrapper}>
			{/* static legend row; value switches between average and selected point */}
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>
						Battery{" "}
						{tooltip ? `${tooltip.battery.toFixed(2)}%` : `${batteryAvg}%`}
					</RNText>
				</RNView>
			</RNView>
			{/* line chart with null-gap handling and focused point visuals */}
			<CartesianChart
				data={chartData}
				xKey="time"
				yKeys={["battery"]}
				domain={{ y: [0, 100] }}
				domainPadding={{ top: 20, left: 10, right: 10 }}
				padding={{ left: 10, right: 10, top: 30, bottom: 5 }}
				chartPressState={state}
				gestureLongPressDelay={0}
				xAxis={{
					tickValues: xTickIndices,
					formatXLabel: (value) => xTickFormat(Number(value)),
					labelColor: theme.referenceLine,
					lineColor: "transparent",
					lineWidth: 0,
					font,
				}}
				yAxis={[
					{
						formatYLabel: (value) => `${value}%`,
						labelColor: theme.referenceLine,
						lineColor: theme.grid,
						lineWidth: 1,
						linePathEffect: <DashPathEffect intervals={[4, 4]} />,
						font,
					},
				]}
				frame={{
					lineColor: theme.referenceLine,
					lineWidth: { left: 1, bottom: 1, top: 0, right: 0 },
				}}
			>
				{/* shade null range, split line around nulls, and draw focus indicators */}
				{({ points, chartBounds }) => {
					const pts = points.battery;
					const step = pts.length > 1 ? pts[1].x - pts[0].x : 0;
					const nullX = NULL_START >= 0 ? pts[NULL_START].x - step / 2 : 0;
					const nullW =
						NULL_START >= 0 ? pts[NULL_END].x - pts[NULL_START].x + step : 0;

					const before = NULL_START > 0 ? pts.slice(0, NULL_START) : [];
					const after =
						NULL_END >= 0 && NULL_END < pts.length - 1
							? pts.slice(NULL_END + 1)
							: [];

					return (
						<>
							{NULL_START >= 0 && (
								<Rect
									x={nullX}
									y={chartBounds.top}
									width={nullW}
									height={chartBounds.bottom - chartBounds.top}
									color={theme.referenceArea}
									opacity={0.45}
								/>
							)}
							{before.length > 0 && (
								<Line
									points={before}
									color={theme.primary}
									strokeWidth={2}
									curveType="natural"
								/>
							)}
							{after.length > 0 && (
								<Line
									points={after}
									color={theme.primary}
									strokeWidth={2}
									curveType="natural"
								/>
							)}
							{isActive && (
								<>
									<RoundedRect
										x={state.x.position}
										y={chartBounds.top}
										width={0}
										height={chartBounds.bottom - chartBounds.top}
										r={0}
										color={theme.cursorStroke}
										strokeWidth={2}
										style="stroke"
									>
										<DashPathEffect intervals={[6, 4]} />
									</RoundedRect>
									<Circle
										cx={state.x.position}
										cy={state.y.battery.position}
										r={6}
										color={theme.primary}
									/>
									<Circle
										cx={state.x.position}
										cy={state.y.battery.position}
										r={3}
										color={theme.activeDotInner}
									/>
								</>
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
	legendRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
		paddingHorizontal: 8,
		paddingBottom: 4,
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	legendDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	legendText: {
		fontSize: 11,
		color: "#333",
	},
});
