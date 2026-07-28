"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { UserMinus } from "lucide-react";

export default function TLGlobalAlerts() {
  useEffect(() => {
    // 1. SSE per i lock
    let eventSource: EventSource | null = null;
    const connect = () => {
      eventSource = new EventSource("/api/events");
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type === "LOCK") {
            toast.error(
              `ATTENZIONE: L'operatore ${data.operatorName} è stato bloccato!\nMotivo: ${data.reason}`,
              { duration: 10000 }
            );
          }
        } catch (err) {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(connect, 5000);
      };
    };
    connect();



    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  return null;
}
