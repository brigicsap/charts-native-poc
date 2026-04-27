export const chartThemes = {
	default: {
		primary: "#00A487",
		secondary: "#F16745",
		tertiary: "#2D3B42",
		grid: "#d4d4d4",
		referenceArea: "#d4d4d4",
		referenceLine: "#000",
		referenceLineLight: "#9ca3af",
		referenceLineAlert: "red",
		cursorStroke: "#F16745",
		activeDotFill: "#F16745",
		activeDotStroke: "#b3e5de",
		activeDotInner: "#fff",
		barHighlight: "rgba(0,0,0,0.08)",
		areaFill: "#00A487",
		warrantyStroke: "#000",
	},
	invert: {
		primary: "#FF5B78",
		secondary: "#0E98BA",
		tertiary: "#D2C4BD",
		grid: "#2B2B2B",
		referenceArea: "#2B2B2B",
		referenceLine: "#000",
		referenceLineLight: "#6B5C50",
		referenceLineAlert: "#00FF00",
		cursorStroke: "#0E98BA",
		activeDotFill: "#0E98BA",
		activeDotStroke: "#2B2B2B",
		activeDotInner: "#1a1a1a",
		barHighlight: "rgba(255,255,255,0.1)",
		areaFill: "#FF5B78",
		warrantyStroke: "#000",
	},
} as const;

export type ChartThemeName = keyof typeof chartThemes;
export type ChartTheme = (typeof chartThemes)[ChartThemeName];
