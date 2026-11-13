export type UsageDetails = {
  device_model: string;
  environment: 'device' | 'simulator';
  os_version: string;
  app_version: string;
  display_mode: 'unfolded' | 'folded' | 'transition';
  result: 'works' | 'issues';
  observed_on: string;
};

export type UsageReport = {
  id: string;
  appId: string;
  body: string;
  evidenceUrl: string | null;
  usage: UsageDetails;
  locale: 'ko' | 'en';
  publishedAt: string;
  hasScreenshot: boolean;
};
