import { StyleSheet } from "react-native";
import type batteryRawData from "../../app/mockData/batteryHistoryMockDay.json";
import type exportImportRawData from "../../app/mockData/exportImportDay.json";
import type dayRawData from "../../app/mockData/homeUsageMockDay.json";
import type weekRawData from "../../app/mockData/homeUsageMockWeek.json";
import type savingsRawData from "../../app/mockData/savingsMock.json";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Format a 24h time string to 12h label for major positions. */
export function formatTime12h(time: string): string {
	if (time === "00:00") return "12am";
	if (time === "06:00") return "6am";
	if (time === "12:00") return "12pm";
	if (time === "18:00") return "6pm";
	return "";
}

/** Convert monetary units/nanos to a plain GBP float. */
export function toGBP(s: { units: number; nanos: number }) {
	return s.units + s.nanos / 1_000_000_000;
}

/** Compute totals as formatted strings from named numeric arrays. */
export function computeTotals(
	arrays: Record<string, number[]>,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, arr] of Object.entries(arrays)) {
		result[key] = arr.reduce((s, v) => s + v, 0).toFixed(2);
	}
	return result;
}

/** Parse home-usage datapoints (day or week) into flat arrays. */
export function parseHomeUsageData(
	raw: typeof dayRawData | typeof weekRawData,
	isWeek: boolean,
) {
	const parsed = raw.datapoints.map((dp) => {
		const label = isWeek
			? DAY_NAMES[new Date(dp.from + "T12:00:00").getDay()]
			: dp.from.slice(11, 16);
		const map: Record<string, number | string> = { label };
		for (const c of dp.constituentDatapoints) {
			map[c.type] = c.energy;
		}
		return map;
	});
	const labels = parsed.map((d) => String(d.label));
	const solar = parsed.map((d) => Number(d["solar-consumption"] ?? 0));
	const grid = parsed.map((d) => Number(d["grid-consumption"] ?? 0));
	const battery = parsed.map((d) => Number(d["battery-consumption"] ?? 0));
	return { labels, solar, grid, battery };
}

/** Parse export/import datapoints into flat arrays. */
export function parseExportImportData(raw: typeof exportImportRawData) {
	const parsed = raw.datapoints.map((dp) => {
		const time = dp.from.slice(11, 16);
		const map: Record<string, number | string> = { time };
		for (const c of dp.constituentDatapoints) {
			map[c.type] = c.energy;
		}
		return map;
	});
	const times = parsed.map((d) => String(d.time));
	const importData = parsed.map((d) => Number(d["grid-import"] ?? 0));
	const exportData = parsed.map((d) => Number(d["grid-export"] ?? 0));
	return { times, importData, exportData };
}

/** Generate 96 × 15-min time slots and map battery data from raw. */
export function parseBatteryHistoryData(raw: typeof batteryRawData) {
	const dataMap = new Map(
		raw.datapoints.map((dp) => [
			dp.timestamp.slice(11, 16),
			dp.batteryPercentage,
		]),
	);
	const allSlots = Array.from({ length: 96 }, (_, i) => {
		const h = String(Math.floor(i / 4)).padStart(2, "0");
		const m = String((i % 4) * 15).padStart(2, "0");
		return `${h}:${m}`;
	});
	const batteryData = allSlots.map((time) => dataMap.get(time) ?? null);
	const validBattery = batteryData.filter((v): v is number => v != null);
	const batteryAvg =
		validBattery.length > 0
			? (validBattery.reduce((s, v) => s + v, 0) / validBattery.length).toFixed(
					2,
				)
			: "—";
	return { allSlots, batteryData, batteryAvg };
}

/** Parse savings data into labelled records with numeric index. */
export function parseSavingsData(raw: typeof savingsRawData) {
	return raw.intervalSavings.map((d, i) => {
		const date = new Date(d.start);
		const label = `${date.getDate()}/${date.getMonth() + 1}`;
		return {
			index: i,
			label,
			notOptimised:
				Math.round(toGBP(d.notOptimisedStrategySavings) * 100) / 100,
			used: Math.round(toGBP(d.usedStrategySavings) * 100) / 100,
		};
	});
}

export const toggleStyles = StyleSheet.create({
	toggleRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 0,
		marginBottom: 8,
	},
	toggleBtn: {
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#fff",
	},
	toggleBtnLeft: {
		borderTopLeftRadius: 8,
		borderBottomLeftRadius: 8,
		borderRightWidth: 0,
	},
	toggleBtnRight: {
		borderTopRightRadius: 8,
		borderBottomRightRadius: 8,
	},
	toggleBtnActive: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	toggleText: {
		fontSize: 13,
		color: "#333",
	},
	toggleTextActive: {
		color: "#fff",
	},
});

export const legendStyles = StyleSheet.create({
	legendRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
		paddingHorizontal: 8,
		paddingBottom: 4,
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
