  
  export const dynamic = "force-dynamic";

import { NotificationProvider } from "@/components/NotificationProvider";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { AppDataProvider } from "@/contexts/AppDataContext";
import AppLayoutClient from "@/components/app/AppLayoutClient";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <AppDataProvider>
        <NotificationProvider>
          <AutoLogoutProvider />
          <AppLayoutClient>
            <div style={{
              maxWidth: "1400px",
              margin: "0 auto",
              width: "100%",
            }}>
              {children}
            </div>
          </AppLayoutClient>
        </NotificationProvider>
      </AppDataProvider>
    </SessionProviderWrapper>
  );
}
