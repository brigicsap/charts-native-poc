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

// null where data is missing
const batteryData = allSlots.map((time) => dataMap.get(time) ?? null);

// compute average of non-null values to show in legend by default
const validBattery = batteryData.filter((v): v is number => v != null);
const batteryAvg =
	validBattery.length > 0
		? (validBattery.reduce((s, v) => s + v, 0) / validBattery.length).toFixed(2)
		: "—";

const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function GiftedBatteryHistoryChart({
	theme,
}: {
	theme: ChartTheme;
}) {
	const lineData = useMemo(
		() =>
			batteryData.map((v, i) => ({
				value: v ?? 0,
				label:
					allSlots[i] === "00:00"
						? "12am"
						: allSlots[i] === "06:00"
							? "6am"
							: allSlots[i] === "12:00"
								? "12pm"
								: allSlots[i] === "18:00"
									? "6pm"
									: "",
				hideDataPoint: true,
				color: v == null ? theme.referenceLineLight : theme.primary,
			})),
		[theme],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={styles.legendRow}>
				<RNView style={styles.legendItem}>
					<RNView
						style={[styles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={styles.legendText}>Battery {batteryAvg}%</RNText>
				</RNView>
			</RNView>
			<LineChart
				data={lineData}
				height={230}
				width={E_WIDTH - 30}
				curved
				thickness={2}
				color={theme.primary}
				hideDataPoints
				initialSpacing={8}
				endSpacing={8}
				spacing={10}
				noOfSections={4}
				maxValue={100}
				yAxisLabelSuffix="%"
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
