import React from 'react';
import { TabPlaceholder } from './TabPlaceholder';

export function ProfileSettingsTabScreen() {
  return (
    <TabPlaceholder
      title="Profile Settings"
      subtitle="Manage account, preferences, security, and notification settings."
      icon="person-circle-outline"
      hint="Next integration: Firebase auth, profile editing, language, and alerts preferences."
      ctaLabel="Manage profile"
    />
  );
}
