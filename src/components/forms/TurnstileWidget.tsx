"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  action?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          action?: string;
        },
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

export function TurnstileWidget({ siteKey, onToken, action }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "cf-turnstile";
    const render = () => {
      if (!ref.current || !window.turnstile) return;
      ref.current.innerHTML = "";
      window.turnstile.render(ref.current, {
        sitekey: siteKey,
        action,
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      render();
      return;
    }
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }
  }, [action, onToken, siteKey]);

  return <div ref={ref} className="min-h-[65px]" />;
}
