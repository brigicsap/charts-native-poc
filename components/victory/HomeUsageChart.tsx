import {
	DashPathEffect,
	RoundedRect,
	Line as SkiaLine,
	useFont,
	vec,
} from "@shopify/react-native-skia";
import { useState } from "react";
import {
	Dimensions,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { CartesianChart, StackedBar, useChartPressState } from "victory-native";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/homeUsageMockDay.json";

// parse the raw data into a more convenient format for charting
const parsed = rawData.datapoints.map((dp) => {
	const time = dp.from.slice(11, 16);
	const map: Record<string, number | string> = { time };
	for (const c of dp.constituentDatapoints) {
		map[c.type] = c.energy;
	}
	return map;
});

// extract the 3 datasets and map x to numeric indices for Victory
const chartData = parsed.map((d, i) => ({
	time: i,
	solar: Number(d["solar-consumption"] ?? 0),
	grid: Number(d["grid-consumption"] ?? 0),
	battery: Number(d["battery-consumption"] ?? 0),
}));

const timeLabels = parsed.map((d) => String(d.time));
// we want 8 x-axis ticks (every 3 hours), but only 4 labels are rendered
const xTickIndices = [
	"00:00",
	"03:00",
	"06:00",
	"09:00",
	"12:00",
	"15:00",
	"18:00",
	"21:00",
]
	.map((t) => timeLabels.indexOf(t))
	.filter((i) => i >= 0);

// show total values in legend by default when not interacting
const totals = {
	solar: chartData.reduce((s, d) => s + d.solar, 0).toFixed(2),
	grid: chartData.reduce((s, d) => s + d.grid, 0).toFixed(2),
	battery: chartData.reduce((s, d) => s + d.battery, 0).toFixed(2),
};

// format only the 4 major x-axis labels
const xTickFormat = (idx: number) => {
	const t = timeLabels[idx];
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

export default function HomeUsageChart({ theme }: { theme: ChartTheme }) {
	const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 11);
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
			const d = chartData[cur.idx];
			if (d) {
				runOnJS(setTooltip)({
					time: timeLabels[cur.idx] ?? "",
					solar: d.solar,
					grid: d.grid,
					battery: d.battery,
				});
			}
		},
	);

	return (
		<View style={styles.chartWrapper}>
			{/* static legend row; values switch between totals and selected point */}
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.secondary }]}
					/>
					<RNText style={styles.legendText}>
						Solar{" "}
						{tooltip
							? `${tooltip.solar.toFixed(2)} kWh`
							: `${totals.solar} kWh`}
					</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.tertiary }]}
					/>
					<RNText style={styles.legendText}>
						Grid{" "}
						{tooltip ? `${tooltip.grid.toFixed(2)} kWh` : `${totals.grid} kWh`}
					</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>
						Battery{" "}
						{tooltip
							? `${tooltip.battery.toFixed(2)} kWh`
							: `${totals.battery} kWh`}
					</RNText>
				</RNView>
			</RNView>
			{/* stacked bar chart with frame, gridlines, and custom x-axis ticks */}
			<CartesianChart
				data={chartData}
				xKey="time"
				yKeys={["solar", "grid", "battery"]}
				domain={{ y: [0, 0.3] }}
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
						{xTickIndices.map((idx) => {
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
