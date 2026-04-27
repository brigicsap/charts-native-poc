import { useMemo } from "react";
import {
	Dimensions,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
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

// extract the x-axis labels and the 3 datasets
const times = parsed.map((d) => String(d.time));
const solarData = parsed.map((d) => Number(d["solar-consumption"] ?? 0));
const gridData = parsed.map((d) => Number(d["grid-consumption"] ?? 0));
const batteryData = parsed.map((d) => Number(d["battery-consumption"] ?? 0));

// show totals in legend by default
const totals = {
	solar: solarData.reduce((s, v) => s + v, 0).toFixed(2),
	grid: gridData.reduce((s, v) => s + v, 0).toFixed(2),
	battery: batteryData.reduce((s, v) => s + v, 0).toFixed(2),
};

const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function GiftedHomeUsageChart({ theme }: { theme: ChartTheme }) {
	const stackData = useMemo(
		() =>
			times.map((time, i) => ({
				label:
					time === "00:00"
						? "12am"
						: time === "06:00"
							? "6am"
							: time === "12:00"
								? "12pm"
								: time === "18:00"
									? "6pm"
									: "",
				stacks: [
					{ value: solarData[i] ?? 0, color: theme.secondary },
					{ value: gridData[i] ?? 0, color: theme.tertiary },
					{ value: batteryData[i] ?? 0, color: theme.primary },
				],
			})),
		[theme],
	);

	const maxValue = useMemo(
		() =>
			Math.max(
				...solarData.map(
					(v, i) => v + (gridData[i] ?? 0) + (batteryData[i] ?? 0),
				),
			),
		[],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.secondary }]}
					/>
					<RNText style={styles.legendText}>Solar {totals.solar} kWh</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.tertiary }]}
					/>
					<RNText style={styles.legendText}>Grid {totals.grid} kWh</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>
						Battery {totals.battery} kWh
					</RNText>
				</RNView>
			</RNView>
			<BarChart
				stackData={stackData}
				height={230}
				width={E_WIDTH - 30}
				barWidth={6}
				spacing={8}
				initialSpacing={8}
				endSpacing={8}
				maxValue={maxValue <= 0 ? 1 : maxValue}
				noOfSections={4}
				rulesType="dashed"
				rulesColor={theme.grid}
				xAxisColor={theme.referenceLineLight}
				yAxisColor={theme.referenceLineLight}
				yAxisTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
				xAxisLabelTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
				yAxisLabelSuffix=""
				formatYLabel={(label: string) => label}
				hideRules={false}
				showFractionalValues
				roundToDigits={2}
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
