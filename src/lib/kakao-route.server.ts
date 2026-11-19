import type { RouteRequest, RouteResult } from "./kakao-route";

export async function requestKakaoRoute(request: RouteRequest): Promise<RouteResult> {
  const key = process.env["KAKAO_REST_API_KEY"]?.trim();
  if (!key) return { status: "missing_key" };
  const { origin, destination, mode } = request;
  const url = new URL(mode === "public" ? "https://dapi.kakao.com/v2/routing/publictraffic" : "https://apis-navi.kakaomobility.com/v1/directions");
  if (mode === "public") {
    for (const [name, value] of Object.entries({ start_x: origin.longitude, start_y: origin.latitude, end_x: destination.longitude, end_y: destination.latitude })) url.searchParams.set(name, String(value));
  } else {
    url.searchParams.set("origin", `${origin.longitude},${origin.latitude}`);
    url.searchParams.set("destination", `${destination.longitude},${destination.latitude}`);
    url.searchParams.set("summary", "false");
  }
  try {
    const response = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return { status: "unavailable" };
    const body = await response.json();
    const route = body.routes?.[0];
    if (!route || (mode === "public" && body.status !== "OK") || (mode === "car" && route.result_code !== 0)) return { status: "no_route" };
    const summary = mode === "public" ? route.properties : route.summary;
    const duration = mode === "public" ? summary?.totalTime : summary?.duration;
    const distance = mode === "public" ? summary?.totalDistance : summary?.distance;
    if (!Number.isFinite(duration) || !Number.isFinite(distance)) return { status: "unavailable" };
    const steps: string[] = mode === "public" ? (route.steps ?? []).map((step: any) => step.properties?.guidance).filter((step: unknown): step is string => typeof step === "string") : [];
    const transitSteps = Array.isArray(route.steps) ? route.steps : [];
    const completeTransitPath = transitSteps.length > 0 && transitSteps.every((step: any) => Array.isArray(step.path?.points) && step.path.points.length >= 2);
    const rawPoints: unknown[] = mode === "public" ? (completeTransitPath ? transitSteps.flatMap((step: any) => step.path.points) : []) : (route.sections ?? []).flatMap((section: any) => (section.roads ?? []).flatMap((road: any) => { const vertices = road.vertexes ?? []; const pairs = []; for (let i = 0; i + 1 < vertices.length; i += 2) pairs.push([vertices[i], vertices[i + 1]]); return pairs; }));
    const points = rawPoints.filter((point): point is [number, number] => Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] >= 124 && point[0] <= 132 && point[1] >= 33 && point[1] <= 39).slice(0, 10000);
    return { status: "ok", duration, distance, steps: steps.slice(0, 50), points };
  } catch { return { status: "unavailable" }; }
}
