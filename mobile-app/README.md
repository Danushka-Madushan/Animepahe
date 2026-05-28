# Anime Stream Mobile App

A React Native mobile application built with Expo for streaming anime content.

## Features

- 🔍 Search for anime series
- 📺 Browse episodes by series
- ▶️ Stream episodes directly in the app
- ⬇️ Download episodes (external player)
- 🌙 Dark mode UI
- 📱 Responsive design for all screen sizes

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Video Player**: expo-av
- **HTTP Client**: Axios

## Project Structure

```
mobile-app/
├── src/
│   ├── @types/          # TypeScript type definitions
│   ├── components/      # Reusable UI components
│   │   ├── SearchBar.tsx
│   │   ├── SearchResultItem.tsx
│   │   └── EpisodeCard.tsx
│   ├── config/          # App configuration
│   │   └── config.ts
│   ├── hooks/           # Custom React hooks
│   │   └── useAxios.ts
│   ├── screens/         # Screen components
│   │   ├── HomeScreen.tsx
│   │   └── EpisodesScreen.tsx
│   └── utils/           # Utility functions
├── App.tsx              # Main app entry point
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (for testing on physical device)

### Installation

1. Navigate to the mobile-app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (macOS only)

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Building for Production

### Android APK

```bash
eas build --platform android --profile preview
```

### iOS IPA

```bash
eas build --platform ios --profile preview
```

## Configuration

Edit `src/config/config.ts` to configure API endpoints:

```typescript
export const KWIK = 'https://access-kwik.apex-cloud.workers.dev';
export const ANIME = 'https://anime.apex-cloud.workers.dev';
export const AUTH_TOKEN = 'your-auth-token';
```

## Streaming Feature

The app supports in-app streaming using the `expo-av` video component. When you select an episode:

1. Tap on any episode card
2. Choose "Stream" to play the video in-app
3. Use the native video controls to play, pause, seek, etc.
4. Choose "Download" to open the link in an external download manager

## License

MIT
