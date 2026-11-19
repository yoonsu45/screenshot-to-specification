import { useEffect, useRef, useState } from "react";

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (element: HTMLElement, options: { center: unknown; level: number }) => { setCenter: (position: unknown) => void; setBounds: (bounds: unknown) => void; relayout: () => void };
  Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void; setPosition: (position: unknown) => void };
  Polyline: new (options: { path: unknown[]; strokeWeight: number; strokeColor: string; strokeOpacity: number }) => { setMap: (map: unknown) => void };
  LatLngBounds: new () => { extend: (point: unknown) => void };
};

declare global {
  interface Window { kakao?: { maps: KakaoMaps } }
}

let sdkPromise: Promise<KakaoMaps> | undefined;

function loadKakaoMaps(key: string): Promise<KakaoMaps> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("Map loading timed out")); }, 10000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("Map loading failed")); };
    script.onload = () => {
      if (!window.kakao?.maps) { window.clearTimeout(timer); script.remove(); reject(new Error("Map unavailable")); return; }
      window.kakao.maps.load(() => { window.clearTimeout(timer); resolve(window.kakao!.maps); });
    };
    document.head.appendChild(script);
  }).catch((error) => { sdkPromise = undefined; throw error; });
  return sdkPromise;
}

export function KakaoLocationMap({ latitude, longitude, name, fallbackUrl, routePoints }: { latitude: number; longitude: number; name: string; fallbackUrl: string; routePoints?: [number, number][] | undefined }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const key = import.meta.env["VITE_KAKAO_MAP_JS_KEY"]?.trim();

  useEffect(() => {
    if (!key || !container.current) return;
    let cancelled = false;
    setFailed(false);
    loadKakaoMaps(key).then((maps) => {
      if (cancelled || !container.current) return;
      const position = new maps.LatLng(latitude, longitude);
      const map = new maps.Map(container.current, { center: position, level: 4 });
      new maps.Marker({ position }).setMap(map);
      map.relayout();
      map.setCenter(position);
      if (routePoints && routePoints.length > 1) {
        const path = routePoints.map(([lng, lat]) => new maps.LatLng(lat, lng));
        const bounds = new maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        bounds.extend(position);
        new maps.Polyline({ path, strokeWeight: 5, strokeColor: "#1649a1", strokeOpacity: 0.85 }).setMap(map);
        map.setBounds(bounds);
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [key, latitude, longitude, routePoints]);

  if (!key || failed) return <><iframe src={fallbackUrl} title={`${name} 위치 지도`} loading="lazy" className="h-64 w-full rounded-xl border-0 bg-card sm:h-80" />{routePoints && routePoints.length > 1 && <p className="mt-2 text-xs">카카오맵을 불러오지 못해 경로 선을 표시할 수 없습니다.</p>}</>;
  return <div ref={container} role="img" aria-label={`${name} 위치 지도`} className="h-64 w-full rounded-xl bg-card sm:h-80" />;
}
