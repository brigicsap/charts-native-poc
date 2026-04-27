import { useMemo } from "react";
import {
	Dimensions,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import rawData from "../../app/mockData/savingsMock.json";

// convert the monetary units/nanos format to a plain GBP float
function toGBP(s: { units: number; nanos: number }) {
	return s.units + s.nanos / 1_000_000_000;
}

// parse the raw data into a more convenient format for charting
const data = rawData.intervalSavings.map((d) => {
	const date = new Date(d.start);
	const label = `${date.getDate()}/${date.getMonth() + 1}`;
	return {
		label,
		notOptimised: Math.round(toGBP(d.notOptimisedStrategySavings) * 100) / 100,
		used: Math.round(toGBP(d.usedStrategySavings) * 100) / 100,
	};
});

// show latest values in legend by default
const latestNotOptimised = data[data.length - 1]?.notOptimised ?? 0;
const latestUsed = data[data.length - 1]?.used ?? 0;

const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function GiftedSavingsChart({ theme }: { theme: ChartTheme }) {
	const lineData1 = useMemo(
		() =>
			data.map((d) => ({
				value: d.notOptimised,
				label: d.label,
				hideDataPoint: true,
			})),
		[],
	);
	const lineData2 = useMemo(
		() => data.map((d) => ({ value: d.used, hideDataPoint: true })),
		[],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>
						Not Optimised £{latestNotOptimised.toFixed(2)}
					</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.tertiary }]}
					/>
					<RNText style={styles.legendText}>
						Used Strategy £{latestUsed.toFixed(2)}
					</RNText>
				</RNView>
			</RNView>
			<LineChart
				data={lineData1}
				data2={lineData2}
				height={230}
				width={E_WIDTH - 30}
				curved
				thickness={2}
				thickness2={2}
				color={theme.primary}
				color2={theme.tertiary}
				areaChart
				areaChart2
				startFillColor={theme.primary}
				endFillColor={theme.primary}
				startOpacity={0.25}
				endOpacity={0.05}
				startFillColor2={theme.tertiary}
				endFillColor2={theme.tertiary}
				startOpacity2={0.25}
				endOpacity2={0.05}
				hideDataPoints
				initialSpacing={10}
				endSpacing={10}
				spacing={50}
				noOfSections={4}
				yAxisLabelPrefix="£"
				rulesType="dashed"
				rulesColor={theme.grid}
				xAxisColor={theme.referenceLineLight}
				yAxisColor={theme.referenceLineLight}
				yAxisTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
				xAxisLabelTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
				isAnimated
				animationDuration={450}
			/>
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
		paddingBottom: 6,
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
