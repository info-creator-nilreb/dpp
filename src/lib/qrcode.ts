import QRCode from "qrcode"

/**
 * QR-Code-Generierung für DPP-Versionen
 * 
<<<<<<< HEAD
 * Generiert SVG-QR-Code on-demand (Vercel-compatible, kein Filesystem-Zugriff)
=======
 * Generiert SVG-QR-Code als Base64 Data-URL für direkte Verwendung
 * Wird in der Datenbank gespeichert (Vercel-compatible)
>>>>>>> 3ab206b54c871eaaaa4130317bf03f948965e9fc
 */

/**
 * Generiert QR-Code als SVG-String
 * 
 * @param publicUrl - Vollständige öffentliche URL (z.B. https://dpp-kappa.vercel.app/public/dpp/...)
 * @returns SVG-String des QR-Codes
 */
export async function generateQrCodeSvg(publicUrl: string): Promise<string> {
  console.log("generateQrCodeSvg called with:", { publicUrl })
  
  try {
    // Generiere QR-Code als SVG (bevorzugt, da skalierbar)
    console.log("Generating QR code SVG...")
    const qrCodeSvg = await QRCode.toString(publicUrl, {
      type: "svg",
      width: 300,
      margin: 2,
      color: {
        dark: "#0A0A0A", // Schwarze QR-Code-Module
        light: "#FFFFFF"  // Weißer Hintergrund
      }
    })

    console.log("QR code SVG generated, length:", qrCodeSvg.length)
<<<<<<< HEAD
    return qrCodeSvg
=======

    // Konvertiere SVG zu Base64 Data-URL für direkte Verwendung
    // Funktioniert auf Vercel (kein Filesystem-Zugriff nötig)
    const base64Svg = Buffer.from(qrCodeSvg).toString("base64")
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`
    
    console.log("QR code Data URL generated, length:", dataUrl.length)

    return dataUrl
>>>>>>> 3ab206b54c871eaaaa4130317bf03f948965e9fc
  } catch (error: any) {
    console.error("Error generating QR code:", error)
    console.error("Error stack:", error.stack)
    throw new Error(`Fehler bei der QR-Code-Generierung: ${error.message || String(error)}`)
  }
}

/**
 * @deprecated Verwende generateQrCodeSvg() statt dessen. Diese Funktion wird nur für Kompatibilität beibehalten.
 */
export async function generateQrCode(publicUrl: string, dppId: string, version: number): Promise<string> {
  // Legacy-Funktion: Wird nicht mehr verwendet, QR-Codes werden on-demand generiert
  throw new Error("generateQrCode is deprecated. QR codes are generated on-demand via API routes.")
}
