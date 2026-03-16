import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import type { PredictionResponse } from '../types/api';
import { API_BASE_URL } from '../config';

// ─── Constants ───────────────────────────────────────────────────────────────

const IMAGE_MAX_WIDTH = 480;
const IMAGE_COMPRESS = 0.75;
const IMAGE_MAX_DATA_URI_BYTES = 800_000;
const TEXT_MAX_LENGTH = 2_500;
const TREATMENT_MAX_LENGTH = 2_000;

const C = {
  brand: '#6B7A3A',
  brandDark: '#4E5929',
  brandLight: '#F2F4E8',
  accent: '#8C7C63',
  accentLight: '#f0efe9',
  text: '#1E1E1E',
  textMuted: '#7A7060',
  border: 'rgba(107, 122, 58, 0.2)',
  successBg: '#E8F5EF',
  successText: '#1E6B4A',
  warnBg: '#FDF3DC',
  warnText: '#7A5C00',
  errorBg: '#FBE9E9',
  errorText: '#8B2020',
  white: '#FFFFFF',
  pageBg: '#F9F8F5',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

function safeTruncate(s: string, max: number = TEXT_MAX_LENGTH): string {
  if (!s || s.length <= max) return s;
  return s.slice(0, max).trimEnd() + '\u2026';
}

function confidenceLabel(pct: number): string {
  if (pct >= 85) return 'High confidence';
  if (pct >= 60) return 'Moderate confidence';
  return 'Low confidence';
}

function statusStyle(status: string): { bg: string; text: string; icon: string } {
  if (status === 'Success') return { bg: C.successBg, text: C.successText, icon: '&#10003;' };
  if (status === 'Uncertain') return { bg: C.warnBg, text: C.warnText, icon: '&#9888;' };
  return { bg: C.errorBg, text: C.errorText, icon: '&#10005;' };
}

// ─── Image loader ─────────────────────────────────────────────────────────────

async function getImageDataUri(uri: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (!uri.startsWith('blob:') && !uri.startsWith('http')) return null;
      const blob = await fetch(uri).then((r) => r.blob());
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    }

    let pathToRead = uri;
    let tempCreated = false;

    if (uri.startsWith('content://')) {
      const tempPath = `${FileSystem.cacheDirectory}rpt_leaf_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: tempPath });
      pathToRead = tempPath;
      tempCreated = true;
    } else if (!uri.startsWith('file://')) {
      pathToRead = `file://${uri.startsWith('/') ? uri : `/${uri}`}`;
    }

    try {
      const result = await ImageManipulator.manipulateAsync(
        pathToRead,
        [{ resize: { width: IMAGE_MAX_WIDTH } }],
        { base64: true, compress: IMAGE_COMPRESS, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (result.base64) return `data:image/jpeg;base64,${result.base64}`;
    } catch {
      // fall through
    }

    const base64 = await FileSystem.readAsStringAsync(pathToRead, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (tempCreated) {
      FileSystem.deleteAsync(pathToRead, { idempotent: true }).catch(() => null);
    }

    return base64 && base64.length >= 100 ? `data:image/jpeg;base64,${base64}` : null;
  } catch {
    return null;
  }
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildReportHtml(
  result: PredictionResponse,
  imageDataUri: string | null,
  dateStr: string
): string {
  const dr = result.diagnostic_report ?? {};
  const llm = result.llm_reasoning;

  const reasoningText = safeTruncate((llm?.reasoning ?? dr.summary ?? '').trim());
  const recommendationText = safeTruncate(
    (llm?.recommendation ?? result.agent_decision?.next_action ?? '').trim()
  );
  const treatment = safeTruncate((dr.recommended_treatment ?? '').trim(), TREATMENT_MAX_LENGTH);
  const treatmentBullets = treatment
    ? treatment.split(/[.;\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const top3 = (result.top_k ?? []).slice(0, 3);
  const prediction = formatLabel(result.prediction ?? 'Unknown');
  const confidencePct = Math.round((result.confidence ?? 0) * 100);
  const status = result.status ?? '—';
  const ss = statusStyle(status);
  const confLabel = confidenceLabel(confidencePct);

  const safeImage =
    imageDataUri && imageDataUri.length < IMAGE_MAX_DATA_URI_BYTES ? imageDataUri : null;

  // ── Sections ────────────────────────────────────────────────────────────────

  const imageSection = safeImage
    ? `<div class="hero">
        <p class="hero-label">Scanned Leaf</p>
        <img src="${safeImage}" alt="Scanned leaf photo" class="hero-img" />
       </div>`
    : `<div class="hero placeholder">
        <p class="hero-label">No Image Included</p>
        <div class="hero-empty">&#127807; No leaf image was attached to this report.</div>
       </div>`;

  const bulletsHtml =
    treatmentBullets.length > 0
      ? `<ul class="bullets">${treatmentBullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : treatment
        ? `<p class="body-text">${escapeHtml(treatment)}</p>`
        : '';

  const topKRows = top3
    .map((t, i) => {
      const pct = Math.round(t.confidence * 100);
      return `<tr class="${i < top3.length - 1 ? 'row-border' : ''}">
        <td class="topk-label">${escapeHtml(formatLabel(t.label))}</td>
        <td class="topk-bar-cell">
          <div class="topk-bar-wrap"><div class="topk-bar" style="width:${pct}%"></div></div>
        </td>
        <td class="topk-pct">${pct}%</td>
      </tr>`;
    })
    .join('');

  const diagnosisSection = `
    <div class="card diagnosis-card">
      <div class="diagnosis-header">
        <div class="diagnosis-info">
          <p class="section-label inv">Primary Diagnosis</p>
          <p class="diagnosis-name">${escapeHtml(prediction)}</p>
        </div>
        <div class="conf-circle">
          <span class="conf-num">${confidencePct}<span class="conf-sup">%</span></span>
        </div>
      </div>
      <div class="conf-bar-wrap">
        <div class="conf-bar" style="width:${confidencePct}%"></div>
      </div>
      <div class="diagnosis-footer">
        <span class="conf-label">${escapeHtml(confLabel)}</span>
        <span class="status-badge" style="background:${ss.bg};color:${ss.text};">
          ${ss.icon}&nbsp;${escapeHtml(String(status))}
        </span>
      </div>
    </div>`;

  const analysisSection = reasoningText
    ? `<div class="card">
        <p class="section-label">AI Analysis</p>
        <p class="body-text">${escapeHtml(reasoningText)}</p>
       </div>`
    : '';

  const recommendationSection = recommendationText
    ? `<div class="card rec-card">
        <p class="section-label rec-label">Recommendation</p>
        <p class="body-text italic rec-text">${escapeHtml(recommendationText)}</p>
       </div>`
    : '';

  const treatmentSection = treatment
    ? `<div class="card">
        <p class="section-label">Recommended Action</p>
        ${bulletsHtml}
       </div>`
    : '';

  const topKSection =
    top3.length > 0
      ? `<div class="card">
          <p class="section-label">Top Possible Diseases</p>
          <table class="topk-table"><tbody>${topKRows}</tbody></table>
         </div>`
      : '';

  // ── CSS ─────────────────────────────────────────────────────────────────────

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${C.pageBg};
      color: ${C.text};
      font-size: 14px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 580px;
      margin: 0 auto;
      padding: 32px 28px 40px;
      background: ${C.white};
      min-height: 100vh;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 2px solid ${C.brand};
      margin-bottom: 6px;
    }
    .brand-name { font-size: 17px; font-weight: 800; color: ${C.brand}; letter-spacing: 0.3px; }
    .brand-tagline { font-size: 11px; color: ${C.accent}; margin-top: 2px; }
    .header-badge {
      background: ${C.brandLight};
      color: ${C.brandDark};
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid ${C.border};
    }
    .report-date { font-size: 11.5px; color: ${C.textMuted}; margin: 10px 0 22px; }
    .hero {
      text-align: center;
      margin-bottom: 22px;
      padding: 18px 18px 14px;
      background: linear-gradient(170deg, ${C.accentLight} 0%, ${C.white} 100%);
      border-radius: 14px;
      border: 1px solid ${C.border};
    }
    .hero-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: ${C.textMuted};
      margin-bottom: 12px;
      font-weight: 600;
    }
    .hero-img {
      width: 240px;
      max-width: 100%;
      height: auto;
      max-height: 230px;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.10);
    }
    .hero.placeholder .hero-empty {
      padding: 22px;
      background: ${C.accentLight};
      border-radius: 8px;
      color: ${C.textMuted};
      font-size: 13px;
    }
    .card {
      background: ${C.white};
      border: 1px solid ${C.border};
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .section-label {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: ${C.brand};
      font-weight: 700;
      margin-bottom: 10px;
    }
    .section-label.inv { color: rgba(255,255,255,0.7); }
    .body-text { color: ${C.text}; font-size: 13.5px; }
    .italic { font-style: italic; }
    .diagnosis-card {
      background: linear-gradient(140deg, ${C.brand} 0%, ${C.brandDark} 100%);
      border: none;
      box-shadow: 0 4px 16px rgba(107,122,58,0.25);
    }
    .diagnosis-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .diagnosis-info { flex: 1; }
    .diagnosis-name {
      font-size: 21px;
      font-weight: 800;
      color: ${C.white};
      line-height: 1.25;
    }
    .conf-circle {
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 14px;
      text-align: center;
      padding-top: 14px;
    }
    .conf-num {
      font-size: 18px;
      font-weight: 800;
      color: ${C.white};
      line-height: 1;
    }
    .conf-sup { font-size: 10px; font-weight: 600; vertical-align: super; }
    .conf-bar-wrap {
      background: rgba(255,255,255,0.25);
      border-radius: 999px;
      height: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .conf-bar { height: 100%; background: ${C.white}; border-radius: 999px; }
    .diagnosis-footer { display: flex; justify-content: space-between; align-items: center; }
    .conf-label { font-size: 12px; color: rgba(255,255,255,0.8); }
    .status-badge {
      display: inline-block;
      padding: 4px 11px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .rec-card { background: ${C.brandLight}; border-color: rgba(107,122,58,0.3); }
    .rec-label { color: ${C.brandDark}; }
    .rec-text { color: ${C.brandDark}; }
    .bullets { padding-left: 18px; }
    .bullets li { margin: 7px 0; font-size: 13.5px; color: ${C.text}; }
    .topk-table { width: 100%; border-collapse: collapse; }
    .topk-label { font-size: 13px; color: ${C.text}; padding: 9px 0; width: 44%; vertical-align: middle; }
    .topk-bar-cell { padding: 9px 12px; vertical-align: middle; }
    .topk-bar-wrap { background: ${C.accentLight}; border-radius: 999px; height: 7px; overflow: hidden; }
    .topk-bar { height: 100%; background: ${C.brand}; border-radius: 999px; }
    .topk-pct { text-align: right; font-weight: 700; font-size: 13px; color: ${C.brand}; padding: 9px 0; white-space: nowrap; }
    .row-border td { border-bottom: 1px solid rgba(140,124,99,0.15); }
    .footer-api { font-size: 10px; color: ${C.textMuted}; margin-top: 6px; display: block; }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid rgba(140,124,99,0.2);
      font-size: 11px;
      color: ${C.textMuted};
      text-align: center;
      line-height: 1.6;
    }
    @page { margin: 20px; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plant Disease Diagnosis Report</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <p class="brand-name">Plant Health Scanner</p>
        <p class="brand-tagline">AI-Powered Leaf Disease Diagnosis</p>
      </div>
      <span class="header-badge">Diagnosis Report</span>
    </div>
    <p class="report-date">Generated on ${escapeHtml(dateStr)}</p>
    ${imageSection}
    ${diagnosisSection}
    ${analysisSection}
    ${recommendationSection}
    ${treatmentSection}
    ${topKSection}
    <p class="footer">
      This report was generated by Plant Health Scanner and is powered by AI.<br/>
      It is not a substitute for professional agronomic or phytopathological advice.<br/>
      <span class="footer-api">API: ${escapeHtml(API_BASE_URL)}</span>
    </p>
  </div>
</body>
</html>`;
}

// ─── Minimal fallback ─────────────────────────────────────────────────────────

function buildMinimalHtml(result: PredictionResponse, dateStr: string): string {
  const prediction = formatLabel(result.prediction ?? 'Unknown');
  const pct = Math.round((result.confidence ?? 0) * 100);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Report</title></head>
<body style="font-family:sans-serif;padding:28px;color:#1E1E1E;">
  <h1 style="color:#6B7A3A;font-size:20px;margin-bottom:4px;">Plant Health Scanner</h1>
  <p style="color:#7A7060;font-size:12px;margin-bottom:20px;">${escapeHtml(dateStr)}</p>
  <p><strong>Diagnosis:</strong> ${escapeHtml(prediction)}</p>
  <p><strong>Confidence:</strong> ${pct}%</p>
  <p><strong>Status:</strong> ${escapeHtml(result.status ?? '—')}</p>
  <p style="margin-top:28px;font-size:11px;color:#7A7060;">
    Generated by Plant Health Scanner. Not a substitute for professional advice.<br/>
    <span style="font-size:10px;">API: ${escapeHtml(API_BASE_URL)}</span>
  </p>
</body></html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a PDF diagnosis report and opens the system share sheet.
 *
 * Attempt order (most → least reliable):
 *   1. Full report without image  — fastest, avoids large data URI issues
 *   2. Full report with image     — upgrade if image loaded cleanly
 *   3. Minimal text-only report   — absolute last resort
 */
export async function generateAndShareReportPdf(
  result: PredictionResponse,
  imageUri: string | null
): Promise<void> {
  const dateStr = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const printHtml = (html: string) =>
    Print.printToFileAsync({ html, width: 612, height: 792 });

  // Kick off image loading in parallel with the first (no-image) print pass
  const imagePromise = imageUri ? getImageDataUri(imageUri) : Promise.resolve(null);

  // 1) Full report, no image (reliable baseline)
  let pdfUri: string | undefined;
  try {
    const out = await printHtml(buildReportHtml(result, null, dateStr));
    pdfUri = out?.uri;
  } catch {
    pdfUri = undefined;
  }

  // 2) Upgrade to include image if available
  const imageDataUri = await imagePromise;
  if (imageDataUri) {
    try {
      const out = await printHtml(buildReportHtml(result, imageDataUri, dateStr));
      if (out?.uri) pdfUri = out.uri;
    } catch {
      // retain the no-image PDF from step 1
    }
  }

  // 3) Minimal fallback
  if (!pdfUri) {
    try {
      const out = await printHtml(buildMinimalHtml(result, dateStr));
      pdfUri = out?.uri;
    } catch {
      throw new Error(
        'PDF generation is not supported on this device. Try using the print option instead.'
      );
    }
  }

  if (!pdfUri) return;

  // On web, blob URLs show as blob:http://localhost:8081/... in the address bar.
  // Trigger a direct download with a clean filename so the user gets "Report.pdf" without seeing the blob URL.
  if (Platform.OS === 'web' && pdfUri.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = pdfUri;
    link.download = `Plant-Health-Scanner-Report-${dateStr.replace(/[/:,\s]/g, '-')}.pdf`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or share your diagnosis report',
    });
  }
}