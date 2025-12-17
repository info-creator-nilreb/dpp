import QRCode from "qrcode"

/**
 * QR-Code-Generierung für DPP-Versionen
 * 
 * Generiert SVG-QR-Code als Base64 Data-URL für direkte Verwendung
 * Wird in der Datenbank gespeichert (Vercel-compatible)
 */
export async function generateQrCode(publicUrl: string, dppId: string, version: number): Promise<string> {
  console.log("generateQrCode called with:", { publicUrl, dppId, version })
  
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

    // Konvertiere SVG zu Base64 Data-URL für direkte Verwendung
    // Funktioniert auf Vercel (kein Filesystem-Zugriff nötig)
    const base64Svg = Buffer.from(qrCodeSvg).toString("base64")
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`
    
    console.log("QR code Data URL generated, length:", dataUrl.length)

    return dataUrl
  } catch (error: any) {
    console.error("Error generating QR code:", error)
    console.error("Error stack:", error.stack)
    throw new Error(`Fehler bei der QR-Code-Generierung: ${error.message || String(error)}`)
  }
}

