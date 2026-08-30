import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/login");
  }

  return (
    <div className="flex-1 bg-gray-900 text-white print:bg-white print:text-black">
      <AttendanceClient />
    </div>
  );
}
