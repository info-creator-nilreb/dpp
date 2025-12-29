"use client";

import { useEffect } from "react";

interface LoginSplitLayoutProps {
  children: React.ReactNode;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  quote?: {
    text: string;
    author: string;
  };
}

const defaultImageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80";
const defaultTitle = "Hallo!";
const defaultSubtitle = "Willkommen zurück.";
const defaultQuote = {
  text: "Produktivität ist weniger das, was du tust, sondern mehr das, was du vollendest.",
  author: "David Allen"
};

const motivationalQuotes = [
  {
    text: "Produktivität ist weniger das, was du tust, sondern mehr das, was du vollendest.",
    author: "David Allen"
  },
  {
    text: "Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die nächstbeste Zeit ist jetzt.",
    author: "Chinesisches Sprichwort"
  },
  {
    text: "Erfolg ist die Summe kleiner Anstrengungen, die Tag für Tag wiederholt werden.",
    author: "Robert Collier"
  },
  {
    text: "Der Weg zur Exzellenz hat kein Ende.",
    author: "Bruce Lee"
  }
];

export function LoginSplitLayout({
  children,
  imageUrl = defaultImageUrl,
  title = defaultTitle,
  subtitle = defaultSubtitle,
  quote = defaultQuote,
}: LoginSplitLayoutProps) {
  // Preload das Bild für schnelleres Laden
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imageUrl;
    document.head.appendChild(link);

    // Preload auch mit einem Image-Objekt für Browser-Kompatibilität
    const img = new Image();
    img.src = imageUrl;

    return () => {
      // Cleanup: Entferne das Link-Element beim Unmount
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [imageUrl]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
    }}>
      {/* Left Side - Image with Overlay */}
      <div
        style={{
          display: "none", // Hidden on mobile
          width: "50%",
          position: "relative",
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1E293B",
        }}
        className="login-split-left"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(30, 41, 59, 0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "3rem",
            color: "#FFFFFF",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: "700",
              marginBottom: "0.5rem",
              lineHeight: "1.2",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              marginBottom: "2rem",
              opacity: 0.95,
            }}
          >
            {subtitle}
          </p>
          {quote && (
            <div
              style={{
                marginTop: "2rem",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p
                style={{
                  fontSize: "1.1rem",
                  fontStyle: "italic",
                  marginBottom: "0.5rem",
                  opacity: 0.9,
                }}
              >
                "{quote.text}"
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.7,
                }}
              >
                — {quote.author}
              </p>
            </div>
          )}
          <div
            style={{
              marginTop: "2rem",
              fontSize: "0.85rem",
              opacity: 0.6,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Unsplash</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(1rem, 3vw, 2rem)",
          backgroundColor: "#F5F5F5",
          overflowX: "hidden",
          overflowY: "auto",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
        className="login-split-right"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            boxSizing: "border-box",
            padding: "0 clamp(0.5rem, 2vw, 0)",
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .login-split-left {
            display: block !important;
          }
          .login-split-right {
            width: 50% !important;
          }
        }
      `}</style>
    </div>
  );
}


