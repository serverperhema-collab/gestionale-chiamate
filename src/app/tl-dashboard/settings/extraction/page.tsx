"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ExtractionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/extract");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 text-gray-100 p-8 h-full">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-gray-400">Reindirizzamento al nuovo modulo di estrazione avanzato...</p>
      </div>
    </div>
  );
}
