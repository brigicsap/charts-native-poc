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
import { formatTime12h, legendStyles, parseBatteryHistoryData } from "./utils";

const { allSlots, batteryData, batteryAvg } = parseBatteryHistoryData(rawData);

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
				label: formatTime12h(allSlots[i]),
				hideDataPoint: true,
				color: v == null ? theme.referenceLineLight : theme.primary,
			})),
		[theme],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>Battery {batteryAvg}%</RNText>
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
});
