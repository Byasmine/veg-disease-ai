import React from 'react';
import { TabPlaceholder } from './TabPlaceholder';

export function AnalyzeTabScreen() {
  return (
    <TabPlaceholder
      title="Analyze"
      subtitle="AI-powered plant disease diagnosis from leaf photos, with confidence and reasoning."
      icon="scan-outline"
      hint="Next integration: camera scan, model prediction, AI analysis, and treatment recommendations."
      ctaLabel="Start analysis"
    />
  );
}
