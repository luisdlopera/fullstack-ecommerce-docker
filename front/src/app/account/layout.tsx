import { UserAccountShell } from '@/components/layout/UserAccountShell';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
	return <UserAccountShell>{children}</UserAccountShell>;
}
