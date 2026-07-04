"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/admin-store";

const defaults = {
  title: "Siliguri Fresh Mart \u2014 Fresh Market Delivered in Minutes",
  description: "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri in 10-30 minutes. Free delivery above Rs.299.",
  keywords: "Siliguri,fresh fish delivery Siliguri,chicken delivery Siliguri,fish home delivery,chicken home delivery,online grocery Siliguri,fresh meat delivery,mutton delivery Siliguri,vegetables home delivery,quick commerce Siliguri,fresh mart,buy fish online,buy chicken online",
};

export function DynamicMeta() {
  const { settings } = useAdminStore();

  useEffect(() => {
    const seo = settings.seo;
    if (!seo?.homeTitle && !seo?.homeDescription && !seo?.homeKeywords) return;

    if (seo.homeTitle) {
      document.title = seo.homeTitle;
    }
    if (seo.homeDescription) {
      let el = document.querySelector('meta[name="description"]');
      if (el) el.setAttribute("content", seo.homeDescription);
      else {
        el = document.createElement("meta");
        el.setAttribute("name", "description");
        el.setAttribute("content", seo.homeDescription);
        document.head.appendChild(el);
      }
    }
    if (seo.homeKeywords) {
      let el = document.querySelector('meta[name="keywords"]');
      if (el) el.setAttribute("content", seo.homeKeywords);
      else {
        el = document.createElement("meta");
        el.setAttribute("name", "keywords");
        el.setAttribute("content", seo.homeKeywords);
        document.head.appendChild(el);
      }
    }
  }, [settings.seo]);

  return null;
}
