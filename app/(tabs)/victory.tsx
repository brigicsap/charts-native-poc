import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import NotesBox from "@/components/NotesBox";
import { Text, View } from "@/components/Themed";
import VictoryBatteryHistoryChart from "@/components/victory/BatteryHistoryChart";
import VictoryExportImportChart from "@/components/victory/ExportImportChart";
import VictoryHomeUsageChart from "@/components/victory/HomeUsageChart";
import victoryNotes from "@/components/victory/notes.md";
import VictorySavingsChart from "@/components/victory/SavingsChart";
import {
	type ChartTheme,
	type ChartThemeName,
	chartThemes,
} from "../chartTheme";

const CHARTS = [
	{ key: "homeUsage", label: "Home Usage" },
	{ key: "importExport", label: "Import / Export" },
	{ key: "batteryHistory", label: "Battery History" },
	{ key: "savings", label: "Savings" },
] as const;

type ChartKey = (typeof CHARTS)[number]["key"];

export default function VictoryScreen() {
	const [themeName, setThemeName] = useState<ChartThemeName>("default");
	const theme: ChartTheme = chartThemes[themeName];
	const [selectedChart, setSelectedChart] = useState<ChartKey>("homeUsage");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(true);
	}, []);

	const selectedLabel =
		CHARTS.find((c) => c.key === selectedChart)?.label ?? "Select Chart";

	if (!ready) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Victory Charts</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.scrollContent}>
			<View style={styles.container}>
				<View style={styles.buttonRow}>
					<Pressable
						style={[
							styles.button,
							themeName === "default" && styles.buttonActive,
						]}
						onPress={() => setThemeName("default")}
					>
						<Text
							style={[
								styles.buttonText,
								themeName === "default" && styles.buttonTextActive,
							]}
						>
							Default
						</Text>
					</Pressable>
					<Pressable
						style={[
							styles.button,
							themeName === "invert" && styles.buttonActive,
						]}
						onPress={() => setThemeName("invert")}
					>
						<Text
							style={[
								styles.buttonText,
								themeName === "invert" && styles.buttonTextActive,
							]}
						>
							Invert
						</Text>
					</Pressable>
				</View>
				<View style={styles.dropdownContainer}>
					<Pressable
						style={styles.dropdownTrigger}
						onPress={() => setDropdownOpen((o) => !o)}
					>
						<Text style={styles.dropdownTriggerText}>{selectedLabel}</Text>
						<Text style={styles.dropdownArrow}>{dropdownOpen ? "▲" : "▼"}</Text>
					</Pressable>
					{dropdownOpen && (
						<View style={styles.dropdownMenu}>
							{CHARTS.map((chart) => (
								<Pressable
									key={chart.key}
									style={[
										styles.dropdownItem,
										selectedChart === chart.key && styles.dropdownItemActive,
									]}
									onPress={() => {
										setSelectedChart(chart.key);
										setDropdownOpen(false);
									}}
								>
									<Text
										style={[
											styles.dropdownItemText,
											selectedChart === chart.key &&
												styles.dropdownItemTextActive,
										]}
									>
										{chart.label}
									</Text>
								</Pressable>
							))}
						</View>
					)}
				</View>
				{selectedChart === "homeUsage" && (
					<VictoryHomeUsageChart theme={theme} />
				)}
				{selectedChart === "importExport" && (
					<VictoryExportImportChart theme={theme} />
				)}
				{selectedChart === "batteryHistory" && (
					<VictoryBatteryHistoryChart theme={theme} />
				)}
				{selectedChart === "savings" && <VictorySavingsChart theme={theme} />}
				<NotesBox content={victoryNotes} />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
	},
	container: {
		flex: 1,
		alignItems: "center",
		paddingTop: 16,
		paddingBottom: 32,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 12,
	},
	buttonRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 12,
	},
	button: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
	},
	buttonActive: {
		backgroundColor: "#2D3B42",
		borderColor: "#2D3B42",
	},
	buttonText: {
		fontSize: 14,
		color: "#333",
	},
	buttonTextActive: {
		color: "#fff",
	},
	dropdownContainer: {
		width: "80%",
		marginBottom: 16,
		zIndex: 10,
	},
	dropdownTrigger: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#fff",
	},
	dropdownTriggerText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	dropdownArrow: {
		fontSize: 12,
		color: "#666",
	},
	dropdownMenu: {
		position: "absolute",
		top: 50,
		left: 0,
		right: 0,
		marginTop: 4,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#fff",
		overflow: "hidden",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	dropdownItem: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	dropdownItemActive: {
		backgroundColor: "#f0f0f0",
	},
	dropdownItemText: {
		fontSize: 15,
		color: "#333",
	},
	dropdownItemTextActive: {
		fontWeight: "600",
	},
});
