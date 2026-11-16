import { createServerFn } from "@tanstack/react-start";

export const getParkingOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { readParkingOverview } = await import("./parking-api.server");
  return readParkingOverview();
});

export const getSeoulParking = createServerFn({ method: "GET" }).handler(async () => {
  const { readSeoulParking } = await import("./seoul-parking.server");
  return readSeoulParking();
});

export const getTsParking = createServerFn({ method: "GET" }).handler(async () => {
  const { readTsParking } = await import("./ts-parking.server");
  return readTsParking();
});
