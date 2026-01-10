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
 * REGELN:
 * - Die E-Mail-Adresse, mit der eine Organisation erstellt wird, IST automatisch der erste Nutzer
 * - Dieser erste Nutzer erhält immer die Rolle "ORG_ADMIN"
 * - Der Organisationseigentümer ist ein normaler Nutzer und wird in allen Statistiken mitgezählt
 * - Membership ist die EINZIGE Quelle der Wahrheit für Organisationsmitgliedschaften
 * 
 * @param email - E-Mail-Adresse des ersten Nutzers (wird erstellt oder wiederverwendet)
 * @param organizationName - Name der neuen Organisation
 * @param userData - Optional: Zusätzliche User-Daten (firstName, lastName, password)
 * @param tx - Optional: Prisma Transaction Client. Falls nicht angegeben, wird eine neue Transaction gestartet
 */
export async function createOrganizationWithFirstUser(
  email: string,
  organizationName: string,
  userData?: {
    firstName?: string
    lastName?: string
    password?: string
  },
  tx?: any // Prisma Transaction Client
): Promise<{ organizationId: string; membershipId: string; userId: string }> {
  // Wenn keine Transaction übergeben wurde, starte eine neue
  if (!tx) {
    return await prisma.$transaction(async (transactionClient) => {
      return createOrganizationWithFirstUser(email, organizationName, userData, transactionClient)
    })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // 1. Prüfe ob User bereits existiert
  let user = await tx.user.findUnique({
    where: { email: normalizedEmail },
  })

  // 2. User erstellen oder aktualisieren
  if (!user) {
    if (!userData?.password) {
      throw new Error("Password is required when creating a new user")
    }
    
    // Prüfe ob Passwort bereits gehasht ist (bcrypt Hashes beginnen mit $2a$, $2b$ oder $2y$)
    // Wenn nicht, hash es jetzt. Dies verhindert Doppel-Hashing.
    let hashedPassword: string
    if (userData.password.startsWith("$2a$") || userData.password.startsWith("$2b$") || userData.password.startsWith("$2y$")) {
      // Passwort ist bereits gehasht - verwende es direkt
      hashedPassword = userData.password
    } else {
      // Passwort ist noch nicht gehasht - hash es jetzt
      const bcrypt = await import("bcryptjs")
      hashedPassword = await bcrypt.hash(userData.password, 10)
    }
    
    user = await tx.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : null,
        status: "active",
        emailVerified: false,
        // WICHTIG: verificationToken wird nach dem User-Create in signup.ts gesetzt
        // Hier wird es NICHT gesetzt, da es erst nach createOrganizationWithFirstUser
        // in der signup-Funktion gesetzt wird
        preferredLanguage: "en",
      },
    })
  } else {
    // User existiert bereits - aktualisiere Status falls nötig
    // WICHTIG: verificationToken wird NICHT hier überschrieben, da es in signup.ts gesetzt wird
    if (user.status !== "active") {
      await tx.user.update({
        where: { id: user.id },
        data: { status: "active" },
      })
    }
  }

  // 3. Organisation erstellen
  const organization = await tx.organization.create({
    data: {
      name: organizationName,
      status: "active",
    },
  })

  // 4. Prüfe ob bereits eine Membership für diese Organisation existiert
  const existingMembership = await tx.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
  })

  if (existingMembership) {
    // Membership existiert bereits - aktualisiere Rolle zu ORG_ADMIN falls nötig
    if (existingMembership.role !== FIRST_USER_ROLE) {
      await tx.membership.update({
        where: { id: existingMembership.id },
        data: { role: FIRST_USER_ROLE },
      })
    }
    return {
      organizationId: organization.id,
      membershipId: existingMembership.id,
      userId: user.id,
    }
  }

  // 5. Membership erstellen (EINZIGE QUELLE DER WAHRHEIT)
  const membership = await tx.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: FIRST_USER_ROLE, // Automatisch ORG_ADMIN
    },
  })

  // 6. User.organizationId als Cache aktualisieren (optional, für Performance)
  // WICHTIG: Dies ist NUR ein Cache, Membership ist die Quelle der Wahrheit
  await tx.user.update({
    where: { id: user.id },
    data: {
      organizationId: organization.id, // Cache-Feld
    },
  })

  return {
    organizationId: organization.id,
    membershipId: membership.id,
    userId: user.id,
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

