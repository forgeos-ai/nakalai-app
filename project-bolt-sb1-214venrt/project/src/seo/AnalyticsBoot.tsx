'use client';

import { useEffect } from 'react';
import { initAnalyticsIntegrations } from '../analytics';

/** Boots free GSC / GA4 / Bing hooks on the client only. */
export default function AnalyticsBoot() {
  useEffect(() => {
    initAnalyticsIntegrations();
  }, []);
  return null;
}
