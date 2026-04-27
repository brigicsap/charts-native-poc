# ECharts Notes

- Uses `@wuba/react-native-echarts` with SVG renderer
- Required `metro.config.js` tweak to resolve `tslib` ESM exports
- Downgraded to `echarts@5.x` for compatibility
- `echarts.getInstanceByDom()` doesn't work reliably with `SvgChart` refs — store the chart instance in a `useRef` instead (but then customers won't dynamically switch themes)
- x-axis ticks are a fuss to align with the labels at the bottom
