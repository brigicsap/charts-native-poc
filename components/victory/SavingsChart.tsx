import { DashPathEffect, useFont } from "@shopify/react-native-skia";
import {
	Dimensions,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { Area, CartesianChart, Line } from "victory-native";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/savingsMock.json";
import { legendStyles, parseSavingsData } from "./utils";

const data = parseSavingsData(rawData);

// extract the 2 datasets and map x to numeric indices for Victory
const chartData = data.map((d) => ({
	time: d.index,
	notOptimised: d.notOptimised,
	used: d.used,
}));

// x-axis tick positions and labels for each interval
const tickValues = data.map((d) => d.index);
const tickLabels = data.map((d) => d.label);

// show most recent values in legend by default
const lastNotOpt = data[data.length - 1]?.notOptimised ?? 0;
const lastUsed = data[data.length - 1]?.used ?? 0;

// chart dimensions
const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function SavingsChart({ theme }: { theme: ChartTheme }) {
	const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 11);

	return (
		<View style={styles.chartWrapper}>
			{/* static legend row with latest values */}
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Not Optimised £{lastNotOpt.toFixed(2)}
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
						Used Strategy £{lastUsed.toFixed(2)}
					</RNText>
				</RNView>
			</RNView>
			{/* dual area+line chart: not-optimised strategy vs used strategy */}
			<CartesianChart
				data={chartData}
				xKey="time"
				yKeys={["notOptimised", "used"]}
				domainPadding={{ top: 20, left: 10, right: 10 }}
				padding={{ left: 10, right: 10, top: 30, bottom: 5 }}
				xAxis={{
					tickValues,
					formatXLabel: (value) => tickLabels[Number(value)] ?? "",
					labelColor: theme.referenceLine,
					lineColor: "transparent",
					lineWidth: 0,
					font,
				}}
				yAxis={[
					{
						formatYLabel: (value) => `£${value}`,
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
				{/* render filled areas first, then stroke lines on top */}
				{({ points, chartBounds }) => (
					<>
						<Area
							points={points.notOptimised}
							y0={chartBounds.bottom}
							color={theme.primary}
							opacity={0.3}
							curveType="natural"
						/>
						<Line
							points={points.notOptimised}
							color={theme.primary}
							strokeWidth={2}
							curveType="natural"
						/>
						<Area
							points={points.used}
							y0={chartBounds.bottom}
							color={theme.tertiary}
							opacity={0.3}
							curveType="natural"
						/>
						<Line
							points={points.used}
							color={theme.tertiary}
							strokeWidth={2}
							curveType="natural"
						/>
					</>
				)}
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
