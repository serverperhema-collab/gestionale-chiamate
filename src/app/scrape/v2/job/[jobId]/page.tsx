import DashboardClient from './DashboardClient';
import { getServerSession, DefaultSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function ScrapeV2JobPage({ params }: { params: { jobId: string } }) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } & DefaultSession['user'];
    if (!session || (user?.role !== 'TEAM_LEADER' && user?.role !== 'ADMIN')) {
        redirect('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            <DashboardClient jobId={params.jobId} />
        </div>
    );
}
