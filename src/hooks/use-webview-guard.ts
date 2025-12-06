"use client";

import { useEffect, useState } from "react";

const detectWebView = (ua: string) =>
  /FBAN|FBAV|Instagram|KAKAOTALK|NAVER|Line|WebView|wv/i.test(ua);

export function useWebViewGuard() {
  const [isWebView, setIsWebView] = useState(false);
  const [userAgent, setUserAgent] = useState("");

  useEffect(() => {
    const ua = typeof window !== "undefined" ? navigator.userAgent : "";
    setUserAgent(ua);
    setIsWebView(detectWebView(ua));
  }, []);

  const openExternal = () => {
    const url =
      typeof window !== "undefined" ? window.location.href.replace(/^http:/, "https:") : "";

    if (/android/i.test(userAgent) && url) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      setTimeout(() => {
        window.location.href = url;
      }, 800);
      return;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return { isWebView, openExternal, userAgent };
}
