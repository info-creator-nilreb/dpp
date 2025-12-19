import Link from "next/link"

export default function NotFound() {
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
        border: "1px solid #CDCDCD",
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          404 - Seite nicht gefunden
        </h1>
        <p style={{
          color: "#7A7A7A",
          fontSize: "1rem",
          marginBottom: "1.5rem"
        }}>
          Die angeforderte Seite konnte nicht gefunden werden.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            backgroundColor: "#E20074",
            color: "#FFFFFF",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "1rem",
            fontWeight: "600"
          }}
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}

