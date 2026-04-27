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
import {
	computeTotals,
	formatTime12h,
	legendStyles,
	parseExportImportData,
} from "./utils";

const { times, importData, exportData } = parseExportImportData(rawData);

// map to Victory-friendly numeric-index structure
const chartData = times.map((_, i) => ({
	time: i,
	import: importData[i],
	export: exportData[i],
}));

const timeLabels = times;
const xTickIndices = ["00:00", "06:00", "12:00", "18:00"]
	.map((t) => timeLabels.indexOf(t))
	.filter((i) => i >= 0);

const totals = computeTotals({ import: importData, export: exportData });

const xTickFormat = (idx: number) => {
	const t = timeLabels[idx];
	return t ? formatTime12h(t) : "";
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
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Import{" "}
						{tooltip ? `£${tooltip.import.toFixed(2)}` : `£${totals.import}`}
					</RNText>
				</RNView>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[
							legendStyles.legendDot,
							{ backgroundColor: theme.secondary },
						]}
					/>
					<RNText style={legendStyles.legendText}>
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
});
