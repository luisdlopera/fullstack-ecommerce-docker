import { UserAccountShell } from '@/components/layout/UserAccountShell';

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
	return <UserAccountShell>{children}</UserAccountShell>;
}
