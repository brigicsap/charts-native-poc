const upstreamTransformer = require("@expo/metro-config/babel-transformer");

module.exports.transform = async ({ src, filename, options }) => {
	if (filename.endsWith(".md")) {
		const escaped = JSON.stringify(src);
		return upstreamTransformer.transform({
			src: `export default ${escaped};`,
			filename,
			options,
		});
	}
	return upstreamTransformer.transform({ src, filename, options });
};
