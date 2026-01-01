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
}> {
  // Prüfe ob E-Mail bereits existiert
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  })

  if (existingUser) {
    throw new Error("Email already registered")
  }

  // Hash Passwort
  const hashedPassword = await bcrypt.hash(data.password, 10)

  // Generiere Verifizierungs-Token
  const verificationToken = randomBytes(32).toString("hex")
  const verificationTokenExpires = new Date()
  verificationTokenExpires.setDate(verificationTokenExpires.getDate() + 1) // 24 Stunden

  return await prisma.$transaction(async (tx) => {
    // 1. User erstellen
    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`, // Legacy-Feld
        status: "invited", // Wird auf "active" gesetzt, wenn Organisation erstellt/Join akzeptiert
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
        preferredLanguage: "en",
      },
    })

    let organizationId: string
    let role: string

    // 2. Organisation erstellen ODER Join Request erstellen
    if (data.organizationAction === "create_new_organization") {
      if (!data.organizationName) {
        throw new Error("Organization name required")
      }

      // Erstelle Organisation mit User als ORG_ADMIN
      const result = await createOrganizationWithFirstUser(
        user.id,
        data.organizationName
      )
      organizationId = result.organizationId
      role = "ORG_ADMIN"

      // User-Status auf active setzen
      await tx.user.update({
        where: { id: user.id },
        data: { status: "active" },
      })
    } else if (data.organizationAction === "request_to_join_organization") {
      // Beitritt nur über Einladung möglich
      if (!data.invitationToken) {
        throw new Error("Invitation token required to join an organization")
      }

      // Akzeptiere Einladung
      const invitationResult = await acceptInvitation(data.invitationToken, user.id)
      if (!invitationResult) {
        throw new Error("Invalid or expired invitation token")
      }

      organizationId = invitationResult.organizationId
      role = invitationResult.role

      // User-Status auf active setzen, da Einladung akzeptiert wurde
      await tx.user.update({
        where: { id: user.id },
        data: { status: "active" },
      })
    } else {
      throw new Error("Invalid organization action")
    }

    return {
      userId: user.id,
      organizationId,
      role,
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

