const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow importing .md files as JS modules that export the raw string
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "md"];
config.transformer.babelTransformerPath = path.resolve(
	__dirname,
	"md-transformer.js",
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === "tslib") {
		return {
			filePath: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
			type: "sourceFile",
		};
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
