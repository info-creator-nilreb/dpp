"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F5F5F5",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        padding: "2rem",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #CDCDCD"
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Ein Fehler ist aufgetreten
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "1rem",
          marginBottom: "1.5rem"
        }}>
          {error.message || "Ein unerwarteter Fehler ist aufgetreten"}
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}

