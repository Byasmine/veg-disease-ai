# Feedback process & images (Cloudinary)

## How feedback works

1. **User gets a prediction**  
   The app calls `POST /predict-with-reasoning` with the leaf image. The backend returns a diagnosis (e.g. `Septoria_leaf_spot`), confidence, AI reasoning, and treatment.

2. **User can correct the result**  
   On the Result screen, if the user taps **“No, report”**, they go to the **Feedback** screen. There they:
   - Choose the **correct disease** from a dropdown (options come from `artifacts/labels.json` via `GET /labels`).
   - Optionally add a **comment**.
   - Tap **Send feedback**.

3. **What the app sends**  
   - **When the user has an image** (e.g. came from Result → Feedback):  
     The app calls `POST /feedback/with-image` with the leaf image and the same fields. The image is uploaded to **Cloudinary** (when configured), and the case is stored with `image_url` set to the Cloudinary URL.

   - **When there is no image:**  
     The app calls `POST /feedback` with JSON only: `predicted_label`, `correct_label`, `confidence`, `user_comment`. No image is sent; `image_url` stays `null` in the case.

4. **Where feedback is stored**  
   - **On the server:**  
     Each feedback is saved as a JSON file under `data/feedback_cases/` with:  
     `case_id`, `timestamp`, `predicted_label`, `correct_label`, `confidence`, `comment`, `status` (e.g. `pending_review`), and optionally `image_id` and `image_url` (when using feedback-with-image).

5. **Review and retraining**  
   - An admin can call `GET /review-queue` to list cases with `status: pending_review`.  
   - For each case they can call `POST /review-case` with an action:  
     `approve_prediction`, `correct_label`, `mark_for_retraining`, or `reject_case`.  
   - Cases marked for retraining are added to `data/retraining_candidates/` and can be exported for model retraining via `POST /admin/export-retraining-dataset`.

## Are images stored in Cloudinary?

- **`POST /feedback` (JSON only)**  
  **No.** Only the text payload is stored. `image_url` stays `null`.

- **`POST /feedback/with-image`**  
  **Yes.** When this endpoint is used, the uploaded image is sent to Cloudinary (folder `veg-disease/feedback`, tag `feedback`) if Cloudinary is configured in `.env`. The returned `secure_url` is saved in the case as `image_url`.

The mobile app **does** use feedback-with-image when the user has an image (e.g. the same leaf photo from the Result screen). That image is uploaded to Cloudinary and linked to the feedback case for review and retraining.

---

# Scan history (mobile)

Scan history is stored **only on the device** (no backend or Cloudinary).

- After each successful scan, the app saves a **history entry** locally (e.g. via AsyncStorage):  
  `timestamp`, `prediction`, `confidence`, `status`, and optionally a local `imageUri` for the thumbnail.
- A **History** screen in the app lists past scans (newest first). Tapping an entry can show the same result layout (prediction, confidence, etc.) if desired.
- History is per device; clearing app data removes it. There is no user account or server-side history.
