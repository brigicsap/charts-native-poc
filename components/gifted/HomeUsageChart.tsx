import { useMemo, useState } from "react";
import {
	Dimensions,
	Pressable,
	Text as RNText,
	View as RNView,
	StyleSheet,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { View } from "@/components/Themed";
import type { ChartTheme } from "../../app/chartTheme";
import dayRawData from "../../app/mockData/homeUsageMockDay.json";
import weekRawData from "../../app/mockData/homeUsageMockWeek.json";
import {
	computeTotals,
	formatTime12h,
	legendStyles,
	parseHomeUsageData,
	toggleStyles,
} from "./utils";

function parseRawData(
	raw: typeof dayRawData | typeof weekRawData,
	isWeek: boolean,
) {
	const { labels, solar, grid, battery } = parseHomeUsageData(raw, isWeek);
	const totals = computeTotals({ solar, grid, battery });
	return { labels, solar, grid, battery, totals };
}

const E_WIDTH = Dimensions.get("window").width - 32;
const E_HEIGHT = 320;

export default function GiftedHomeUsageChart({ theme }: { theme: ChartTheme }) {
	const [period, setPeriod] = useState<"day" | "week">("day");

	const data = useMemo(
		() =>
			parseRawData(
				period === "day" ? dayRawData : weekRawData,
				period === "week",
			),
		[period],
	);

	const stackData = useMemo(
		() =>
			data.labels.map((label, i) => ({
				label: period === "week" ? label : formatTime12h(label),
				stacks: [
					{ value: data.solar[i] ?? 0, color: theme.secondary },
					{ value: data.grid[i] ?? 0, color: theme.tertiary },
					{ value: data.battery[i] ?? 0, color: theme.primary },
				],
			})),
		[theme, data, period],
	);

	const maxValue = useMemo(
		() =>
			Math.max(
				...data.solar.map(
					(v, i) => v + (data.grid[i] ?? 0) + (data.battery[i] ?? 0),
				),
			),
		[data],
	);

	return (
		<View style={styles.chartWrapper}>
			<RNView style={toggleStyles.toggleRow}>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnLeft,
						period === "day" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("day")}
				>
					<RNText
						style={[
							toggleStyles.toggleText,
							period === "day" && toggleStyles.toggleTextActive,
						]}
					>
						Day
					</RNText>
				</Pressable>
				<Pressable
					style={[
						toggleStyles.toggleBtn,
						toggleStyles.toggleBtnRight,
						period === "week" && toggleStyles.toggleBtnActive,
					]}
					onPress={() => setPeriod("week")}
				>
					<RNText
						style={[
							toggleStyles.toggleText,
							period === "week" && toggleStyles.toggleTextActive,
						]}
					>
						Week
					</RNText>
				</Pressable>
			</RNView>
			<RNView style={legendStyles.legendRow}>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[
							legendStyles.legendDot,
							{ backgroundColor: theme.secondary },
						]}
					/>
					<RNText style={legendStyles.legendText}>
						Solar {data.totals.solar} kWh
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
						Grid {data.totals.grid} kWh
					</RNText>
				</RNView>
				<RNView style={legendStyles.legendItem}>
					<RNView
						style={[legendStyles.legendDot, { backgroundColor: theme.primary }]}
					/>
					<RNText style={legendStyles.legendText}>
						Battery {data.totals.battery} kWh
					</RNText>
				</RNView>
			</RNView>
			<BarChart
				stackData={stackData}
				height={230}
				width={E_WIDTH - 30}
				barWidth={period === "week" ? 30 : 6}
				spacing={period === "week" ? 16 : 8}
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
});
