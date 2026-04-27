import {
	DashPathEffect,
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
import { CartesianChart, StackedBar, useChartPressState } from "victory-native";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/exportImportDay.json";

// parse the raw data into a more convenient format for charting
const parsed = rawData.datapoints.map((dp) => {
	const time = dp.from.slice(11, 16);
	const map: Record<string, number | string> = { time };
	for (const c of dp.constituentDatapoints) {
		map[c.type] = c.energy;
	}
	return map;
});

// extract the 2 datasets and map x to numeric indices for Victory
const chartData = parsed.map((d, i) => ({
	time: i,
	import: Number(d["grid-import"] ?? 0),
	export: Number(d["grid-export"] ?? 0),
}));

const timeLabels = parsed.map((d) => String(d.time));
// only show the 4 major x-axis positions
const xTickIndices = ["00:00", "06:00", "12:00", "18:00"]
	.map((t) => timeLabels.indexOf(t))
	.filter((i) => i >= 0);

// show total values in legend by default when not interacting
const totals = {
	import: chartData.reduce((s, d) => s + d.import, 0).toFixed(2),
	export: chartData.reduce((s, d) => s + d.export, 0).toFixed(2),
};

// format x-axis labels as 12h clock text
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

export default function ExportImportChart({ theme }: { theme: ChartTheme }) {
	const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 11);
	// chartPressState drives highlight + legend value updates while pressing
	const { state, isActive } = useChartPressState({
		x: 0,
		y: { import: 0, export: 0 },
	});
	// current selected point values shown in legend during interaction
	const [tooltip, setTooltip] = useState<{
		time: string;
		import: number;
		export: number;
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
					import: d.import,
					export: d.export,
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
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>
						Import{" "}
						{tooltip ? `£${tooltip.import.toFixed(2)}` : `£${totals.import}`}
					</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.secondary }]}
					/>
					<RNText style={styles.legendText}>
						Export{" "}
						{tooltip ? `£${tooltip.export.toFixed(2)}` : `£${totals.export}`}
					</RNText>
				</RNView>
			</RNView>
			{/* stacked bar chart with symmetric domain for positive/negative values */}
			<CartesianChart
				data={chartData}
				xKey="time"
				yKeys={["import", "export"]}
				domain={{ y: [-0.3, 0.3] }}
				domainPadding={{ top: 20, bottom: 20, left: 10, right: 10 }}
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
					lineColor: theme.referenceLine,
					lineWidth: { left: 1, bottom: 1, top: 0, right: 0 },
				}}
			>
				{/* render stacked import/export bars and active-column highlight */}
				{({ points, chartBounds }) => {
					const pts = points.import;
					const step = pts.length > 1 ? pts[1].x - pts[0].x : 0;
					return (
						<>
							<StackedBar
								chartBounds={chartBounds}
								points={[points.import, points.export]}
								colors={[theme.primary, theme.secondary]}
								innerPadding={0.3}
								barOptions={({ isTop, isBottom }) => ({
									roundedCorners: isTop
										? { topLeft: 3, topRight: 3 }
										: isBottom
											? { bottomLeft: 3, bottomRight: 3 }
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
