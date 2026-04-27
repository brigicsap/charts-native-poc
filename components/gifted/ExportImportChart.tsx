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

// extract the x-axis labels and the 2 datasets
const times = parsed.map((d) => String(d.time));
const importData = parsed.map((d) => Number(d["grid-import"] ?? 0));
const exportData = parsed.map((d) => Number(d["grid-export"] ?? 0));

// show totals in legend by default
const totals = {
	import: importData.reduce((s, v) => s + v, 0).toFixed(2),
	export: exportData.reduce((s, v) => s + v, 0).toFixed(2),
};

const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function GiftedExportImportChart({
	theme,
}: {
	theme: ChartTheme;
}) {
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
					{ value: importData[i] ?? 0, color: theme.primary },
					{ value: exportData[i] ?? 0, color: theme.secondary },
				],
			})),
		[theme],
	);

	const maxAbs = useMemo(
		() =>
			Math.max(
				Math.max(...importData.map((v) => Math.abs(v))),
				Math.max(...exportData.map((v) => Math.abs(v))),
			),
		[],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>Import £{totals.import}</RNText>
				</RNView>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.secondary }]}
					/>
					<RNText style={styles.legendText}>Export £{totals.export}</RNText>
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
				maxValue={maxAbs <= 0 ? 1 : maxAbs}
				mostNegativeValue={maxAbs <= 0 ? -1 : -maxAbs}
				noOfSections={3}
				noOfSectionsBelowXAxis={3}
				rulesType="dashed"
				rulesColor={theme.grid}
				xAxisColor={theme.referenceLineLight}
				yAxisColor={theme.referenceLineLight}
				yAxisTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
				xAxisLabelTextStyle={{ color: theme.referenceLine, fontSize: 11 }}
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
