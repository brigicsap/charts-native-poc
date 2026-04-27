# charts-native-poc

React Native (Expo) proof of concept for charting libraries, including:

- ECharts (`@wuba/react-native-echarts`)
- Victory Native (`victory-native` + Skia)
- React Native Gifted Charts (`react-native-gifted-charts`)

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- pnpm 10+
- Xcode (for iOS simulator on macOS)
- Android Studio (for Android emulator)

## Install

From the repository root:

```bash
pnpm install
```

## Run

Start Expo dev server:

```bash
pnpm start
```

Run directly on a platform:

```bash
pnpm ios
pnpm android
pnpm web
```

## How to Use

1. Launch the app with one of the commands above.
2. Open the tab you want to test:
   - ECharts
   - Victory
   - Gifted
3. Use the chart dropdown to switch chart types.
4. Use the theme toggle to switch between default and invert themes.

## Project Notes

- Expo SDK: `~54`
- React Native: `0.81.5`
- Routing: `expo-router`
- Metro is configured to load Markdown notes and custom module resolution.

## Common Issues

- If iOS or Android fails to launch, verify simulator/emulator is running.
- If Metro cache causes stale behavior, restart with a clean cache:

```bash
npx expo start -c
```

- If native dependencies appear out of sync, reinstall modules:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```
