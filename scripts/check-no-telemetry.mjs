// Constitution II: no analytics, telemetry, crash-reporting or ads SDKs. Fails CI if one appears.
import { readFileSync } from 'node:fs';

const FORBIDDEN = [
  /sentry/i,
  /firebase/i,
  /analytics/i,
  /amplitude/i,
  /segment/i,
  /mixpanel/i,
  /bugsnag/i,
  /datadog/i,
  /posthog/i,
  /appsflyer/i,
  /branch/i,
  /admob|google-mobile-ads/i,
  /expo-insights/i,
];

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const hits = deps.filter((name) => FORBIDDEN.some((re) => re.test(name)));

if (hits.length) {
  console.error(`Telemetry/analytics packages are not allowed (Constitution II): ${hits.join(', ')}`);
  process.exit(1);
}
console.log(`No telemetry: ${deps.length} packages checked.`);
