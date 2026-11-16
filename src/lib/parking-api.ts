import { createServerFn } from "@tanstack/react-start";

export const getParkingOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { readParkingOverview } = await import("./parking-api.server");
  return readParkingOverview();
});
