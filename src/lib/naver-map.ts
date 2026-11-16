export type NaverMapDestination = {
  latitude: number;
  longitude: number;
  name: string;
};

type RouteMode = "public" | "car";

function appName() {
  return window.location.origin;
}

export function createNaverMapAppUrl({
  latitude,
  longitude,
  destinationName,
  mode,
  appName,
}: {
  latitude: number;
  longitude: number;
  destinationName: string;
  mode: RouteMode;
  appName: string;
}) {
  const params = new URLSearchParams({
    dlat: String(latitude),
    dlng: String(longitude),
    dname: destinationName,
    appname: appName,
  });
  return `nmap://route/${mode}?${params.toString()}`;
}

export function createNaverMapPlaceUrl(destination: NaverMapDestination, caller = appName()) {
  const params = new URLSearchParams({
    lat: String(destination.latitude),
    lng: String(destination.longitude),
    name: destination.name,
    appname: caller,
  });
  return `nmap://place?${params.toString()}`;
}

export function createNaverMapSearchUrl(query: string, caller = appName()) {
  const params = new URLSearchParams({ query, appname: caller });
  return `nmap://search?${params.toString()}`;
}

export function createNaverMapWebUrl(destinationName: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(destinationName)}`;
}

export function createNaverMapAndroidIntentUrl(appUrl: string, fallbackUrl?: string) {
  const route = appUrl.replace(/^nmap:\/\//, "");
  const fallback = fallbackUrl
    ? `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};`
    : "";
  return `intent://${route}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;${fallback}end`;
}

export function isIOSDevice({
  userAgent,
  platform,
  maxTouchPoints,
  standalone,
}: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone: boolean;
}) {
  const hasIOSUserAgent = /iPhone|iPad|iPod/i.test(userAgent);
  const isTouchAppleDevice =
    maxTouchPoints > 1 && (/Macintosh/i.test(userAgent) || /MacIntel/i.test(platform));

  return hasIOSUserAgent || isTouchAppleDevice || standalone;
}

function launchNaverMap(appUrl: string, webFallback: string) {
  const userAgent = window.navigator.userAgent;
  if (/Android/i.test(userAgent)) {
    // Without a browser fallback Android opens NAVER Map, or its Play Store page
    // when the app is not installed, instead of silently displaying the web map.
    window.location.href = createNaverMapAndroidIntentUrl(appUrl);
    return;
  }

  const isIOS = isIOSDevice({
    userAgent,
    platform: window.navigator.platform,
    maxTouchPoints: window.navigator.maxTouchPoints,
    standalone:
      "standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone),
  });
  if (isIOS) {
    const openedAt = Date.now();
    window.location.href = appUrl;
    window.setTimeout(() => {
      if (document.visibilityState === "visible" && Date.now() - openedAt < 2500) {
        window.location.href = "https://apps.apple.com/kr/app/id311867728";
      }
    }, 1500);
    return;
  }

  window.open(webFallback, "_blank", "noopener,noreferrer");
}

export function openNaverMapPlace(destination: NaverMapDestination) {
  launchNaverMap(
    createNaverMapPlaceUrl(destination),
    createNaverMapWebUrl(destination.name),
  );
}

export function openNaverMapSearch(query: string) {
  launchNaverMap(createNaverMapSearchUrl(query), createNaverMapWebUrl(query));
}

export function openNaverMapRoute(destination: NaverMapDestination, mode: RouteMode) {
  launchNaverMap(
    createNaverMapAppUrl({
      latitude: destination.latitude,
      longitude: destination.longitude,
      destinationName: destination.name,
      mode,
      appName: appName(),
    }),
    createNaverMapWebUrl(destination.name),
  );
}
