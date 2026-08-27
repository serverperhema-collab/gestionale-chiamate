"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function SessionEnforcer() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;
    const role = (session.user as any).role;
    if (role !== "OPERATORE") return;

    let intervalId: NodeJS.Timeout;

    const checkSession = async () => {
      // 1. Controllo Slogout Orario (13:05 e 17:05)
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      const is1305 = hours === 13 && minutes >= 5 && minutes <= 7;
      const is1705 = hours === 17 && minutes >= 5 && minutes <= 7;

      if (is1305 || is1705) {
        const today = now.toLocaleDateString('it-IT');
        const timeKey = is1305 ? '1305' : '1705';
        const lastLogout = localStorage.getItem('lastAutoLogout');
        
        if (lastLogout !== `${today}-${timeKey}`) {
          localStorage.setItem('lastAutoLogout', `${today}-${timeKey}`);
          toast.error("Disconnessione automatica per fine turno", { duration: 5000 });
          await signOut({ callbackUrl: "/login" });
          return;
        }
      }

      // 2. Controllo Disconnessione Forzata dal TL
      try {
        const res = await fetch("/api/user/status");
        if (res.ok) {
          const data = await res.json();
          if (data.forceLogout) {
            toast.error("Sei stato disconnesso dal Team Leader", { duration: 5000 });
            await signOut({ callbackUrl: "/login" });
          }
        }
      } catch (err) {}
    };

    // Esegui subito e poi ogni 30 secondi
    checkSession();
    intervalId = setInterval(checkSession, 30000);

    return () => clearInterval(intervalId);
  }, [session]);

  return null;
}
