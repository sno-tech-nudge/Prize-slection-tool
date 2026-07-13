import { getCurrentUser, listUsers } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, users] = await Promise.all([getCurrentUser(), listUsers()]);

  return (
    <AppShell user={user} users={users}>
      {children}
    </AppShell>
  );
}
