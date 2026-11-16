import { describe, expect, it } from "vitest";
import {
  createNaverMapAndroidIntentUrl,
  createNaverMapAppUrl,
  createNaverMapWebUrl,
  isIOSDevice,
} from "@/routes/directions";

describe("네이버지도 길찾기 연결", () => {
  it("검색어가 아니라 목적지 좌표로 네이버지도 앱 길찾기를 연다", () => {
    const url = createNaverMapAppUrl({
      latitude: 37.5205553754,
      longitude: 127.1150515712,
      destinationName: "올림픽공원 피크닉 광장",
      mode: "public",
      appName: "https://the-check.example",
    });

    expect(url).toContain("nmap://route/public?");
    expect(url).toContain("dlat=37.5205553754");
    expect(url).toContain("dlng=127.1150515712");
    expect(url).toContain("dname=%EC%98%AC%EB%A6%BC%ED%94%BD%EA%B3%B5%EC%9B%90+%ED%94%BC%ED%81%AC%EB%8B%89+%EA%B4%91%EC%9E%A5");
  });

  it("안드로이드에서는 네이버지도 앱 인텐트와 웹 폴백을 함께 제공한다", () => {
    const appUrl = createNaverMapAppUrl({
      latitude: 37.5169907,
      longitude: 127.1302628,
      destinationName: "올림픽공원 만남의 광장",
      mode: "car",
      appName: "https://the-check.example",
    });
    const webUrl = createNaverMapWebUrl("올림픽공원 만남의 광장");
    const intentUrl = createNaverMapAndroidIntentUrl(appUrl, webUrl);

    expect(intentUrl).toContain("intent://route/car?");
    expect(intentUrl).toContain("package=com.nhn.android.nmap");
    expect(intentUrl).toContain("S.browser_fallback_url=");
  });

  it("recognizes an iPhone home-screen app even with a desktop user agent", () => {
    expect(
      isIOSDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 5,
        standalone: true,
      }),
    ).toBe(true);
  });

  it("does not treat a desktop Mac as an iOS device", () => {
    expect(
      isIOSDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
        standalone: false,
      }),
    ).toBe(false);
  });
});
