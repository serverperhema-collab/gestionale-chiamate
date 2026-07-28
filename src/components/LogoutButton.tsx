"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Esci
    </button>
  );
}
