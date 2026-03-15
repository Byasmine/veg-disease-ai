# App icons & logo (Agilicis)

To use **Agilicis** branding:

1. **App icon & favicon**  
   Replace the placeholder images with Agilicis assets:
   - `icon.png` – main app icon (1024×1024 px recommended for Expo).
   - `favicon.jpg` – web favicon (see `app.json`; 48×48 or 32×32 px recommended).
   - For Android adaptive icon: `android-icon-foreground.png`, `android-icon-background.png`, and optionally `android-icon-monochrome.png` (see `app.json`).

2. **Welcome screen logo**  
   To show the Agilicis logo on the welcome screen instead of the leaf icon, add:
   - `logo.png` – e.g. 200×200 px (or your logo aspect ratio).

   Then in `src/screens/WelcomeScreen.tsx`, use the logo image in the header area, for example:

   ```tsx
   import { Image } from 'react-native';
   // ...
   <Image source={require('../../assets/logo.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
   ```

   (You can keep the leaf icon as fallback when `logo.png` is missing.)

After adding or replacing files, run `npx expo start` again so the bundler picks up the new assets.
