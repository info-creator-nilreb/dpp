/**
 * Phase 1: Organisation-Management
 * 
 * Helper-Funktionen für Organisation-Operationen
 */

import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { FIRST_USER_ROLE } from "./roles"

/**
 * Erstellt eine neue Organisation mit Erstnutzer
 * 
 * Regel: Der erste User, der eine Organisation erstellt, erhält automatisch ORG_ADMIN
 * 
 * @param userId - ID des Users, der die Organisation erstellt
 * @param organizationName - Name der neuen Organisation
 * @param tx - Optional: Prisma Transaction Client. Falls nicht angegeben, wird eine neue Transaction gestartet
 */
export async function createOrganizationWithFirstUser(
  userId: string,
  organizationName: string,
  tx?: any // Prisma Transaction Client
): Promise<{ organizationId: string; membershipId: string }> {
  // Wenn keine Transaction übergeben wurde, starte eine neue
  if (!tx) {
    return await prisma.$transaction(async (transactionClient) => {
      return createOrganizationWithFirstUser(userId, organizationName, transactionClient)
    })
  }

  // Verwende die übergebene Transaction
  // 1. Organisation erstellen
  const organization = await tx.organization.create({
    data: {
      name: organizationName,
      status: "active",
    },
  })

  // 2. User zur Organisation zuordnen
  await tx.user.update({
    where: { id: userId },
    data: {
      organizationId: organization.id,
      status: "active",
    },
  })

  // 3. Membership erstellen (Legacy-Support + Phase 1)
  const membership = await tx.membership.create({
    data: {
      userId,
      organizationId: organization.id,
      role: FIRST_USER_ROLE, // Automatisch ORG_ADMIN
    },
  })

  return {
    organizationId: organization.id,
    membershipId: membership.id,
  }
}

/**
 * Aktualisiert Company Details einer Organisation
 * 
 * Nur ORG_ADMIN kann Company Details bearbeiten
 */
export async function updateCompanyDetails(
  organizationId: string,
  data: {
    legalName?: string
    companyType?: string
    vatId?: string
    commercialRegisterId?: string
    addressStreet?: string
    addressZip?: string
    addressCity?: string
    addressCountry?: string
    country?: string
  }
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      legalName: data.legalName,
      companyType: data.companyType,
      vatId: data.vatId,
      commercialRegisterId: data.commercialRegisterId,
      addressStreet: data.addressStreet,
      addressZip: data.addressZip,
      addressCity: data.addressCity,
      addressCountry: data.addressCountry,
      country: data.country,
    },
  })
}

/**
 * Aktualisiert Billing Information einer Organisation
 * 
 * Nur ORG_ADMIN kann Billing bearbeiten
 */
export async function updateBillingInfo(
  organizationId: string,
  data: {
    billingEmail?: string
    billingContactUserId?: string
    invoiceAddressStreet?: string
    invoiceAddressZip?: string
    invoiceAddressCity?: string
    invoiceAddressCountry?: string
    billingCountry?: string
  }
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      billingEmail: data.billingEmail,
      billingContactUserId: data.billingContactUserId,
      invoiceAddressStreet: data.invoiceAddressStreet,
      invoiceAddressZip: data.invoiceAddressZip,
      invoiceAddressCity: data.invoiceAddressCity,
      invoiceAddressCountry: data.invoiceAddressCountry,
      billingCountry: data.billingCountry,
    },
  })
}

/**
 * Holt Organisation mit allen Details
 */
export async function getOrganizationWithDetails(organizationId: string) {
  return await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          lastLoginAt: true,
        },
      },
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  })
}

