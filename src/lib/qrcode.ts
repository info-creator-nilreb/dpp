import QRCode from "qrcode"
import path from "path"
import fs from "fs"

/**
 * QR-Code-Generierung für DPP-Versionen
 * 
 * Generiert SVG-QR-Code und speichert ihn im Storage
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

    // Dateiname für QR-Code
    const fileName = `qrcode-${dppId}-v${version}.svg`
    const filePath = path.join(process.cwd(), "public", "uploads", "qrcodes", fileName)

    console.log("QR code file path:", filePath)

    // Stelle sicher, dass das Verzeichnis existiert
    const qrCodeDir = path.dirname(filePath)
    if (!fs.existsSync(qrCodeDir)) {
      console.log("Creating QR code directory:", qrCodeDir)
      fs.mkdirSync(qrCodeDir, { recursive: true })
    }

    // Speichere QR-Code als Datei
    console.log("Writing QR code file...")
    fs.writeFileSync(filePath, qrCodeSvg)
    console.log("QR code file written successfully")

    // Verifiziere, dass die Datei existiert
    if (!fs.existsSync(filePath)) {
      throw new Error("QR-Code-Datei wurde nicht erstellt")
    }

    // URL für den QR-Code (relativ zum public-Verzeichnis)
    const qrCodeUrl = `/uploads/qrcodes/${fileName}`
    console.log("QR code URL:", qrCodeUrl)

    return qrCodeUrl
  } catch (error: any) {
    console.error("Error generating QR code:", error)
    console.error("Error stack:", error.stack)
    throw new Error(`Fehler bei der QR-Code-Generierung: ${error.message || String(error)}`)
  }
}

