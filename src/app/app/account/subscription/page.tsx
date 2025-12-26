import AuthGate from "../../_auth/AuthGate";
import { SubscriptionPageContent } from "./SubscriptionPageContent";

export default function SubscriptionPage() {
  return (
    <AuthGate>
      <SubscriptionPageContent />
    </AuthGate>
  );
}


