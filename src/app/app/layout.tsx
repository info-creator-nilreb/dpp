export const dynamic = "force-dynamic";

import { NotificationProvider } from "@/components/NotificationProvider";
import AppNavigation from "@/components/AppNavigation";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <NotificationProvider>
        <AutoLogoutProvider />
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
          <AppNavigation />
          <main
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "clamp(1rem, 3vw, 2rem)",
            }}
          >
            {children}
          </main>
        </div>
      </NotificationProvider>
    </SessionProviderWrapper>
  );
}
