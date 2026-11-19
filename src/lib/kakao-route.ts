import { createServerFn } from "@tanstack/react-start";

export type RouteRequest = { origin: { latitude: number; longitude: number }; destination: { latitude: number; longitude: number }; mode: "public" | "car" };
export type RouteResult = { status: "ok"; duration: number; distance: number; steps: string[]; points: [number, number][] } | { status: "missing_key" | "unavailable" | "no_route" };

export function validateRouteRequest(value: unknown): RouteRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid request");
  const request = value as RouteRequest;
  const valid = (p: RouteRequest["origin"]) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= 33 && p.latitude <= 39 && p.longitude >= 124 && p.longitude <= 132;
  if (!valid(request.origin) || !valid(request.destination) || !["public", "car"].includes(request.mode)) throw new Error("Invalid request");
  return request;
}

export const getKakaoRoute = createServerFn({ method: "POST" }).validator(validateRouteRequest).handler(async ({ data }): Promise<RouteResult> => {
  const { requestKakaoRoute } = await import("./kakao-route.server");
  return requestKakaoRoute(data);
});
