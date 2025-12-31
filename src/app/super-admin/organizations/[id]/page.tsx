/**
 * SUPER ADMIN ORGANIZATION DETAIL PAGE
 * 
 * View and manage a specific organization
 * Requires: support_admin or super_admin role (read permission)
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requirePermission } from "@/lib/super-admin-rbac"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import OrganizationDetailContent from "./OrganizationDetailContent"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SuperAdminOrganizationDetailPage({ params }: PageProps) {
  // Check auth and permission
  const session = await getSuperAdminSession()
  if (!session) {
    redirect("/super-admin/login")
  }
  
  if (!requirePermission(session, "organization", "read")) {
    redirect("/super-admin/dashboard")
  }
  
  const { id } = await params

  // Get organization with details (Phase 1.7: include subscription for tier display)
  const organization = await prisma.organization.findUnique({
    where: { id },
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
        orderBy: { createdAt: "asc" },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      },
      subscription: {
        select: {
          id: true,
          status: true,
          planId: true,
          subscriptionModelId: true,
          trialExpiresAt: true,
          subscriptionModel: {
            include: {
              pricingPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          dpps: true
        }
      }
    }
  })

  if (!organization) {
    notFound()
  }

  return (
    <div style={{ 
      maxWidth: "100%", 
      margin: "0 auto", 
      padding: "clamp(1rem, 2vw, 2rem)",
      boxSizing: "border-box",
      width: "100%",
      overflowX: "hidden"
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/super-admin/organizations"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
            marginBottom: "0.5rem",
            display: "block"
          }}
        >
          ← Zurück zu Organisationen
        </Link>
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          margin: 0,
          wordBreak: "break-word"
        }}>
          {organization.name}
        </h1>
      </div>

      <OrganizationDetailContent
        organization={organization}
        canEdit={session.role === "super_admin" || session.role === "support_admin"}
      />
    </div>
  )
}

