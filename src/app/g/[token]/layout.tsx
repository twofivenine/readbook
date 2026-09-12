import { GroupShell } from "@/components/Shell";

export default async function GroupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GroupShell token={token}>{children}</GroupShell>;
}
