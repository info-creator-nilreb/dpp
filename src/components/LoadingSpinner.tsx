"use client";

import { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  message?: string;
}

const loadingMessages = [
  "Wir bereiten alles für Sie vor",
  "Es geht gleich los",
  "Fast fertig",
  "Einen Moment bitte",
  "Wir laden Ihre Daten",
  "Bitte warten Sie",
];

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const [currentMessage, setCurrentMessage] = useState(
    message || loadingMessages[0]
  );

  useEffect(() => {
    if (message) return; // Wenn eine feste Nachricht übergeben wurde, nicht wechseln

    const interval = setInterval(() => {
      setCurrentMessage(
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        minHeight: "200px",
      }}
    >
      {/* 4 Mint-Punkte */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="loading-dot"
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "#24c598",
              animation: `pulse 1.4s ease-in-out ${index * 0.2}s infinite both`,
            }}
          />
        ))}
      </div>

      {/* Nachricht */}
      <p
        style={{
          color: "#7A7A7A",
          fontSize: "1rem",
          margin: 0,
          textAlign: "center",
        }}
      >
        {currentMessage}
      </p>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.7);
          }
        }

        .loading-dot {
          box-shadow: 0 0 8px rgba(36, 197, 152, 0.5);
        }
      `}</style>
    </div>
  );
}

