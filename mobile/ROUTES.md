# App routes (screens)

Navigation is a **stack**: one screen at a time, with back and forward.

| Route    | Screen          | Purpose |
|----------|-----------------|--------|
| **Home** | `HomeScreen`    | Take photo / Pick from gallery → calls API → navigates to Result with `imageUri` and `result`. |
| **Result** | `ResultScreen` | Shows prediction, summary, treatment, next step, AI reasoning. Actions: "Scan another" (go back), "Report wrong result" (navigate to Feedback). |
| **Feedback** | `FeedbackScreen` | Form: correct diagnosis (text), optional comment. Submits to `POST /feedback`, then navigates back to Home. |

## Params

- **Result:** `route.params.imageUri`, `route.params.result` (full API response).
- **Feedback:** `route.params.predicted_label`, `route.params.correct_label`, `route.params.confidence` (and optionally `imageUri` for future use with `/feedback/with-image`).

## Adding a new screen

1. Create `screens/YourScreen.js`.
2. In `navigation/RootNavigator.js`: add `<Stack.Screen name="YourName" component={YourScreen} />`.
3. Navigate with `navigation.navigate('YourName', { ...params })`.
