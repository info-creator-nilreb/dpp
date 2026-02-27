"use client"

/**
 * Social Links Block Editor
 *
 * Kanäle: Instagram, Facebook, TikTok, Pinterest, YouTube, LinkedIn.
 * Styling (Hintergrund weiß, Rahmen Akzent, Icons dunkel) erfolgt systemisch im Frontend.
 * Lädt Organisations-Defaults (Firmendaten), wenn der Block leer ist.
 */

import { useState, useEffect, useRef } from "react"

const CHANNELS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
] as const

const ORG_TO_CONTENT_KEYS: Record<string, (typeof CHANNELS)[number]["key"]> = {
  socialInstagram: "instagram",
  socialFacebook: "facebook",
  socialTiktok: "tiktok",
  socialPinterest: "pinterest",
  socialYoutube: "youtube",
  socialLinkedin: "linkedin",
}

interface SocialLinksBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
}

export default function SocialLinksBlockEditor({
  content,
  onChange,
}: SocialLinksBlockEditorProps) {
  const [localContent, setLocalContent] = useState({
    instagram: content.instagram ?? "",
    facebook: content.facebook ?? "",
    tiktok: content.tiktok ?? "",
    pinterest: content.pinterest ?? "",
    youtube: content.youtube ?? "",
    linkedin: content.linkedin ?? "",
  })
  const defaultsLoaded = useRef(false)
  const [prefilledFromOrg, setPrefilledFromOrg] = useState(false)

  // Org-Defaults laden: nur wenn Block leer, und onChange nicht während setState aufrufen (vermeidet setState-in-render)
  useEffect(() => {
    const hasAnyUrl = CHANNELS.some((c) => (content[c.key] ?? "").toString().trim() !== "")
    if (hasAnyUrl || defaultsLoaded.current) {
      setLocalContent((prev) => ({
        ...prev,
        instagram: content.instagram ?? prev.instagram,
        facebook: content.facebook ?? prev.facebook,
        tiktok: content.tiktok ?? prev.tiktok,
        pinterest: content.pinterest ?? prev.pinterest,
        youtube: content.youtube ?? prev.youtube,
        linkedin: content.linkedin ?? prev.linkedin,
      }))
      return
    }
    defaultsLoaded.current = true
    fetch("/api/app/organization/company-details", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const companyDetails = data?.companyDetails
        if (!companyDetails) return
        const org = companyDetails as Record<string, string>
        const next = {
          instagram: ((content.instagram ?? "").toString().trim() || org.socialInstagram?.trim()) ?? "",
          facebook: ((content.facebook ?? "").toString().trim() || org.socialFacebook?.trim()) ?? "",
          tiktok: ((content.tiktok ?? "").toString().trim() || org.socialTiktok?.trim()) ?? "",
          pinterest: ((content.pinterest ?? "").toString().trim() || org.socialPinterest?.trim()) ?? "",
          youtube: ((content.youtube ?? "").toString().trim() || org.socialYoutube?.trim()) ?? "",
          linkedin: ((content.linkedin ?? "").toString().trim() || org.socialLinkedin?.trim()) ?? "",
        }
        const anyFilled = CHANNELS.some((c) => (next[c.key] ?? "").toString().trim() !== "")
        setLocalContent(next)
        if (anyFilled) {
          setPrefilledFromOrg(true)
          setTimeout(() => onChange(next), 0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fromContent = {
      instagram: content.instagram ?? "",
      facebook: content.facebook ?? "",
      tiktok: content.tiktok ?? "",
      pinterest: content.pinterest ?? "",
      youtube: content.youtube ?? "",
      linkedin: content.linkedin ?? "",
    }
    setLocalContent((prev) => {
      if (
        prev.instagram === (fromContent.instagram ?? "") &&
        prev.facebook === (fromContent.facebook ?? "") &&
        prev.tiktok === (fromContent.tiktok ?? "") &&
        prev.pinterest === (fromContent.pinterest ?? "") &&
        prev.youtube === (fromContent.youtube ?? "") &&
        prev.linkedin === (fromContent.linkedin ?? "")
      ) {
        return prev
      }
      return { ...prev, ...fromContent }
    })
  }, [content.instagram, content.facebook, content.tiktok, content.pinterest, content.youtube, content.linkedin])

  function update(field: string, value: string) {
    const next = { ...localContent, [field]: value }
    setLocalContent(next)
    onChange(next)
  }

  function isValidUrl(val: string): boolean {
    const s = (val ?? "").trim()
    if (!s) return true
    return s.startsWith("http://") || s.startsWith("https://")
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #CDCDCD",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box" as const,
  }
  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    color: "#0A0A0A",
    fontWeight: "500",
    fontSize: "0.9rem",
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "1rem" }}>
        Nur Kanäle mit eingetragener Adresse werden im DPP angezeigt. Sind in den Firmendaten der Organisation Profile hinterlegt, werden sie hier als Voreinstellung übernommen; Änderungen wirken nur in diesem Block.
      </p>
      {prefilledFromOrg && (
        <p style={{ fontSize: "0.8125rem", color: "#24c598", marginBottom: "1rem", fontWeight: "500" }}>
          Vorausgefüllt aus Firmendaten. Sie können die Einträge hier anpassen oder entfernen.
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {CHANNELS.map(({ key, label, placeholder }) => {
          const val = localContent[key] ?? ""
          const showUrlWarning = val.trim() !== "" && !isValidUrl(val)
          return (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type="url"
                value={val}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle, ...(showUrlWarning ? { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" } : {}) }}
              />
              {showUrlWarning && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#B45309" }}>
                  Bitte eine gültige URL angeben (z. B. https://…)
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
