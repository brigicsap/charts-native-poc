import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { View } from "@/components/Themed";

export default function NotesBox({ content }: { content: string }) {
	return (
		<View style={styles.container}>
			<Markdown style={markdownStyles}>{content}</Markdown>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "90%",
		padding: 16,
		marginTop: 16,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f9f9f9",
	},
});

const markdownStyles = StyleSheet.create({
	heading1: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
		color: "#333",
	},
	heading2: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 6,
		color: "#444",
	},
	body: {
		fontSize: 14,
		color: "#333",
		lineHeight: 22,
	},
	bullet_list: {
		marginTop: 4,
	},
	list_item: {
		marginBottom: 4,
	},
	code_inline: {
		backgroundColor: "#e8e8e8",
		paddingHorizontal: 4,
		borderRadius: 3,
		fontFamily: "monospace",
		fontSize: 13,
	},
});
