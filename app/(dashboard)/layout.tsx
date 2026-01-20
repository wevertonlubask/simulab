import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChangePasswordWrapper } from "@/components/auth/ChangePasswordWrapper";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      user={{
        nome: session.user.nome,
        email: session.user.email!,
        role: session.user.role,
        avatar: session.user.avatar,
      }}
    >
      <ChangePasswordWrapper mustChangePassword={session.user.mustChangePassword}>
        {children}
      </ChangePasswordWrapper>
    </DashboardLayout>
  );
}
