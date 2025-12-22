"use client"

interface Membership {
  id: string
  role: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface Organization {
  id: string
  name: string
  createdAt: Date
  memberships: Membership[]
  _count: {
    dpps: number
  }
}

interface OrganizationDetailContentProps {
  organization: Organization
  canEdit: boolean
}

/**
 * Organization Detail Content
 * 
 * Shows organization details, members, and actions
 */
export default function OrganizationDetailContent({
  organization,
  canEdit
}: OrganizationDetailContentProps) {
  return (
    <div style={{
      display: "grid",
      gap: "1.5rem"
    }}>
      {/* Basic Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#0A0A0A"
        }}>
          Informationen
        </h2>
        <div style={{
          display: "grid",
          gap: "1rem"
        }}>
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Name
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A",
              fontWeight: "500"
            }}>
              {organization.name}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Erstellt am
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A"
            }}>
              {new Date(organization.createdAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: "0.85rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Anzahl DPPs
            </div>
            <div style={{
              fontSize: "1rem",
              color: "#0A0A0A"
            }}>
              {organization._count.dpps}
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#0A0A0A"
        }}>
          Mitglieder ({organization.memberships.length})
        </h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          {organization.memberships.map((membership) => (
            <div
              key={membership.id}
              style={{
                padding: "1rem",
                backgroundColor: "#F5F5F5",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{
                  fontWeight: "500",
                  color: "#0A0A0A"
                }}>
                  {membership.user.name || membership.user.email}
                </div>
                <div style={{
                  fontSize: "0.85rem",
                  color: "#7A7A7A"
                }}>
                  {membership.user.email}
                </div>
              </div>
              <div style={{
                padding: "0.25rem 0.75rem",
                backgroundColor: "#E8E8E8",
                borderRadius: "4px",
                fontSize: "0.85rem",
                color: "#0A0A0A"
              }}>
                {membership.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "0.75rem",
            color: "#E20074"
          }}>
            Aktionen
          </h2>
          <div style={{
            display: "flex",
            gap: "1rem"
          }}>
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#E20074",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
              onClick={() => {
                // TODO: Implement suspend action
                alert("Suspend-Funktion wird implementiert")
              }}
            >
              Organisation sperren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

