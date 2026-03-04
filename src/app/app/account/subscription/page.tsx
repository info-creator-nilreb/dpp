import { redirect } from "next/navigation";

/**
 * Abonnement wurde unter Organisation → Abonnement & Plan verlagert.
 * Alte URLs werden hierher umgeleitet.
 */
export default function AccountSubscriptionPage() {
  redirect("/app/organization/subscription");
}


