"use client";

import Script from "next/script";

const PIXEL_ID = "1348971833969278";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function fbq(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    if (params) {
      window.fbq("track", event, params);
    } else {
      window.fbq("track", event);
    }
  }
}

export function MetaPixel() {
  return (
    <>
      <Script
        id="meta-pixel"
        // lazyOnload: tracking must survive, but fbevents.js parsing
        // competes with hydration for main-thread time on low-end devices.
        // Deferring it to after the page has settled removes that contention
        // without losing the PageView event. The <noscript> pixel below still
        // covers users with JS disabled.
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
