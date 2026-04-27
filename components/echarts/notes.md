# ECharts Notes

- Uses `@wuba/react-native-echarts` with SVG renderer
- Required `metro.config.js` tweak to resolve `tslib` ESM exports
- Downgraded to `echarts@5.x` for compatibility
- `echarts.getInstanceByDom()` doesn't work reliably with `SvgChart` refs — store the chart instance in a `useRef` instead (but then customers won't dynamically switch themes)
- x-axis ticks are a fuss to align with the labels at the bottom

- All chart config lives in `useEffect` hooks — this is the standard pattern for `@wuba/react-native-echarts`. The library provides a ref-based SVG/Canvas container; you imperatively call `echarts.init(ref)` then `chart.setOption(...)`. There is no declarative JSX API, so `useEffect` is the correct place for init (with `dispose()` cleanup) and for updates driven by state/props.
