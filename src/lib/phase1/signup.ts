/**
 * Phase 1: Signup Flow
 * 
 * Signup erfasst nur:
 * - firstName
 * - lastName
 * - email
 * - password
 * - organizationAction: create_new_organization | request_to_join_organization
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { createOrganizationWithFirstUser } from "./organization"
import { createJoinRequest } from "./join-requests"
import { acceptInvitation } from "./invitations"

export type OrganizationAction = "create_new_organization" | "request_to_join_organization"

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationAction: OrganizationAction
  organizationName?: string // Nur bei create_new_organization
  invitationToken?: string // Erforderlich bei request_to_join_organization, optional bei create_new_organization
}

/**
 * Erstellt einen neuen User mit Organisation
 */
export async function signupUser(data: SignupData): Promise<{
  userId: string
  organizationId: string
  role: string
  verificationToken: string
  email: string
  name: string
}> {
  // Prüfe ob E-Mail bereits existiert (nur bei Join Request, bei create_new_organization wird User in createOrganizationWithFirstUser erstellt)
  if (data.organizationAction === "request_to_join_organization") {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    })

    if (existingUser) {
      throw new Error("Email already registered")
    }
  }

  // Hash Passwort
  const hashedPassword = await bcrypt.hash(data.password, 10)

  // Generiere Verifizierungs-Token
  const verificationToken = randomBytes(32).toString("hex")
  const verificationTokenExpires = new Date()
  verificationTokenExpires.setDate(verificationTokenExpires.getDate() + 1) // 24 Stunden

  return await prisma.$transaction(async (tx) => {
    let organizationId: string
    let role: string
    let userId: string

    // 2. Organisation erstellen ODER Join Request erstellen
    if (data.organizationAction === "create_new_organization") {
      if (!data.organizationName) {
        throw new Error("Organization name required")
      }

      // Erstelle Organisation mit E-Mail als erstem Nutzer (innerhalb der gleichen Transaction)
      // createOrganizationWithFirstUser erstellt den User automatisch oder verwendet existierenden
      const result = await createOrganizationWithFirstUser(
        data.email,
        data.organizationName,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
        },
        tx // Wichtig: Transaction weitergeben
      )
      organizationId = result.organizationId
      userId = result.userId
      role = "ORG_ADMIN"
      
      // User-Status wird bereits in createOrganizationWithFirstUser auf "active" gesetzt
      // Setze Verifizierungs-Token für den User
      await tx.user.update({
        where: { id: userId },
        data: {
          verificationToken,
          verificationTokenExpires,
        },
      })
    } else if (data.organizationAction === "request_to_join_organization") {
      // Beitritt nur über Einladung möglich
      if (!data.invitationToken) {
        throw new Error("Invitation token required to join an organization")
      }

      // 1. User erstellen (für Join Request)
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`, // Legacy-Feld
          status: "invited", // Wird auf "active" gesetzt, wenn Einladung akzeptiert
          emailVerified: false,
          verificationToken,
          verificationTokenExpires,
          preferredLanguage: "en",
        },
      })

      // Akzeptiere Einladung (innerhalb der gleichen Transaction)
      const invitationResult = await acceptInvitation(
        data.invitationToken,
        user.id,
        tx // Wichtig: Transaction weitergeben
      )
      if (!invitationResult) {
        throw new Error("Invalid or expired invitation token")
      }

      organizationId = invitationResult.organizationId
      userId = user.id
      role = invitationResult.role
      
      // User-Status wird bereits in acceptInvitation auf "active" gesetzt
    } else {
      throw new Error("Invalid organization action")
    }

    // Lade User-Daten für Rückgabe
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    })

    return {
      userId,
      organizationId,
      role,
      verificationToken,
      email: user?.email || data.email,
      name: user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : `${data.firstName} ${data.lastName}`,
    }
  })
}

/**
 * Prüft ob E-Mail bereits registriert ist
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  return user !== null
}

