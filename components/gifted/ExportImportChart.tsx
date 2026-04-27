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
import {
	computeTotals,
	formatTime12h,
	legendStyles,
	parseExportImportData,
} from "./utils";

const { times, importData, exportData } = parseExportImportData(rawData);
const totals = computeTotals({ import: importData, export: exportData });

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
				label: formatTime12h(time),
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
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Import £{totals.import}
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
						Export £{totals.export}
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
});
