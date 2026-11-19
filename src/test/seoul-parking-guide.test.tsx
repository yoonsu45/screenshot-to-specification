import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SeoulParkingGuide } from "@/components/app/SeoulParkingGuide";

const search = vi.hoisted(() => vi.fn());
vi.mock("@/lib/naver-map", () => ({ openNaverMapSearch: search }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: { status: "ok", lots: [{ id: "1277145", name: "잠실역 공영주차장(시)", address: "송파구 신천동", latitude: null, longitude: null, capacity: null, occupied: null, updatedAt: null, linked: false }] }, isFetching: false }) }));

describe("서울시 주차정보 지도 검색", () => {
  it("좌표가 없을 때 주소 없이 주차장 이름만 검색한다", () => {
    render(<SeoulParkingGuide onShowParking={vi.fn()} />);
    fireEvent.click(screen.getByText("공원 밖 대체 주차장"));
    fireEvent.click(screen.getByRole("button", { name: "잠실역 공영주차장(시) 지도에서 보기" }));
    expect(search).toHaveBeenCalledWith("잠실역 공영주차장");
  });
});
