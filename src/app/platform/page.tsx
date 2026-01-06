export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Platform-Übersicht
 * 
 * Zeigt:
 * - Alle Organizations
 * - Alle Users
 * - Statistiken
 */
export default async function PlatformPage() {
  const session = await auth()

  // Alle Organizations laden
  const organizations = await prisma.organization.findMany({
    include: {
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
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Alle Users laden
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Statistiken
  const stats = {
    totalUsers: users.length,
    totalOrganizations: organizations.length,
    platformAdmins: users.filter(u => u.isPlatformAdmin).length
  }

  return (
    <div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Platform-Übersicht
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Willkommen, {session?.user?.email}
      </p>

      {/* Statistiken */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #CDCDCD"
        }}>
          <div style={{ color: "#7A7A7A", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Benutzer
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#0A0A0A" }}>
            {stats.totalUsers}
          </div>
        </div>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #CDCDCD"
        }}>
          <div style={{ color: "#7A7A7A", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Organisationen
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#0A0A0A" }}>
            {stats.totalOrganizations}
          </div>
        </div>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #CDCDCD"
        }}>
          <div style={{ color: "#7A7A7A", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Platform-Admins
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#0A0A0A" }}>
            {stats.platformAdmins}
          </div>
        </div>
      </div>

      {/* Organizations */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Organisationen ({organizations.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {organizations.map((org) => (
            <div key={org.id} style={{
              padding: "1rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              border: "1px solid #CDCDCD"
            }}>
              <div style={{ fontWeight: "600", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                {org.name}
              </div>
              <div style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
                {org.memberships.length} Mitglieder
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Benutzer ({users.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {users.map((user) => (
            <div key={user.id} style={{
              padding: "1rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              border: "1px solid #CDCDCD"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#0A0A0A", marginBottom: "0.25rem" }}>
                    {user.name || user.email}
                  </div>
                  <div style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
                    {user.email}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {user.isPlatformAdmin && (
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#24c598",
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "600"
                    }}>
                      Admin
                    </span>
                  )}
                  <span style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
                    {user.memberships.length} Org.
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

