import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ParkingHistoryGuide } from "@/components/app/ParkingHistoryGuide";

afterEach(cleanup);

it("shows venue-specific historical records without claiming current availability", () => {
  render(<ParkingHistoryGuide parkingName="P2 · 올림픽홀 지하주차장" />);
  expect(screen.getByText(/P2 · 만차/)).toBeInTheDocument();
  expect(screen.getByText(/2026-06-06 00:06:06/)).toBeInTheDocument();
  expect(screen.getByText(/현재 빈자리나 도착 시점/)).toBeInTheDocument();
  expect(screen.getByText(/215,528건/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("월별 주차 통계 연도"), { target: { value: "2023" } });
  expect(screen.getByText("55,937")).toBeInTheDocument();
});
