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
import { legendStyles, parseSavingsData } from "./utils";

const data = parseSavingsData(rawData);

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
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Not Optimised £{latestNotOptimised.toFixed(2)}
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
});
