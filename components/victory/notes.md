# Victory Notes

- Uses `victory-native` v41 with `@shopify/react-native-skia`
- `CartesianChart` doesn't accept string x-axis values — use numeric indices and map to labels via `formatXLabel`
- No touch feedback by default — use `useChartPressState` + `chartPressState` prop with `gestureLongPressDelay={0}` for instant interaction
- `axisOptions.tickValues` pollutes both axes with the same values — use separate `xAxis`/`yAxis` props instead to control ticks independently
- Axis labels silently don't render without a font — pass a Skia `SkFont` via `useFont()` to the `font` prop on `xAxis`/`yAxis`
- No built-in dashed gridline support on `axisOptions` — use `linePathEffect: <DashPathEffect intervals={[4, 4]} />` on the new `xAxis`/`yAxis` props
