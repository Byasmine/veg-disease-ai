# Vegetable Disease Detection – Mobile (Expo)

React Native + Expo MVP: capture or pick a leaf image, get prediction and treatment advice.

## Run

1. **Start the backend** (from project root):
   ```bash
   cd ..   # if you're in mobile/
   uvicorn app.main:app --reload
   ```

2. **Start the app**:
   ```bash
   npm run web      # Browser (Windows-friendly; needs: npx expo install react-dom react-native-web)
   npm run android  # Android emulator
   npm start        # Then scan QR with Expo Go on your iPhone
   ```

   **Expo Go on iPhone:** If you see "Project is incompatible with this version of Expo Go", update **Expo Go** to the latest version from the App Store. This project uses Expo SDK 55.

## API URL

Edit **`config.js`** and set `API_BASE_URL`:

- **Web (same PC):** `http://localhost:8000`
- **Android emulator:** `http://10.0.2.2:8000`
- **Real iPhone (same Wi‑Fi):** `http://YOUR_PC_IP:8000` (e.g. from `ipconfig`)

## Flow

1. **Take photo** or **Pick from gallery**
2. Image is sent to `POST /predict-with-reasoning`
3. Result screen shows: status, prediction, confidence, summary, treatment, next step, and AI reasoning (if Groq/OpenAI is configured).
