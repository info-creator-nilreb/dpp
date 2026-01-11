import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/vat/validate
 * 
 * Validiert eine VAT-ID über die VIES API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vatId } = body

    if (!vatId || typeof vatId !== "string" || vatId.trim().length === 0) {
      return NextResponse.json(
        { error: "VAT-ID ist erforderlich", valid: false },
        { status: 400 }
      )
    }

    // Bereinige VAT-ID (entferne Leerzeichen, entferne Präfixe wie "VAT", "USt-IdNr.", etc.)
    const cleanVatId = vatId.trim().toUpperCase().replace(/^(VAT|UID|USt-IdNr\.?|Umsatzsteuer-ID)\s*/i, "").replace(/\s+/g, "")

    // Validiere Format: Muss aus 2 Buchstaben (Ländercode) und anschließender Nummer bestehen
    const vatIdPattern = /^([A-Z]{2})([A-Z0-9]+)$/
    const match = cleanVatId.match(vatIdPattern)

    if (!match) {
      return NextResponse.json({
        valid: false,
        error: "Ungültiges Format. Bitte im Format 'DE123456789' eingeben.",
        vatId: cleanVatId
      })
    }

    const countryCode = match[1]
    const vatNumber = match[2]

    // Validiere über VIES SOAP API
    // Wichtig: VIES verwendet SOAP 1.1 mit korrektem Format
    // Die VIES API erwartet ein spezifisches Format ohne tns-Präfixe im Body
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`

    try {
      const response = await fetch("https://ec.europa.eu/taxation_customs/vies/services/checkVatService", {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": "urn:ec.europa.eu:taxud:vies:services:checkVat/checkVat",
        },
        body: soapEnvelope,
      })

      const xmlText = await response.text()
      
      // Debug: Log die vollständige Response (immer, damit wir das Problem finden)
      console.log("=== VIES API DEBUG ===")
      console.log("Request Country Code:", countryCode)
      console.log("Request VAT Number:", vatNumber)
      console.log("Response Status:", response.status)
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()))
      console.log("Response XML (first 2000 chars):", xmlText.substring(0, 2000))
      if (xmlText.length > 2000) {
        console.log("Response XML (last 500 chars):", xmlText.substring(xmlText.length - 500))
      }
      console.log("======================")

      // Prüfe auf SOAP-Fehler (mit verschiedenen Namespace-Präfixen)
      const faultMatch = xmlText.match(/<(?:soap:|soapenv:)?Fault>(.*?)<\/(?:soap:|soapenv:)?Fault>/is)
      if (faultMatch) {
        let faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i)
        if (!faultStringMatch) {
          faultStringMatch = xmlText.match(/<faultString[^>]*>(.*?)<\/faultString>/i)
        }
        if (!faultStringMatch) {
          faultStringMatch = xmlText.match(/<fault[^>]*>(.*?)<\/fault>/i)
        }
        const faultString = faultStringMatch ? faultStringMatch[1] : "Unbekannter SOAP-Fehler"
        console.error("VIES SOAP Fault:", faultString)
        return NextResponse.json({
          valid: false,
          error: `VIES-Fehler: ${faultString}`,
          vatId: cleanVatId,
          countryCode,
          vatNumber,
          debug: { xmlResponse: xmlText }
        })
      }

      if (!response.ok) {
        console.error("VIES API HTTP Error:", response.status, xmlText.substring(0, 500))
        return NextResponse.json({
          valid: false,
          error: `VIES API HTTP-Fehler: ${response.status}`,
          vatId: cleanVatId,
          debug: process.env.NODE_ENV === "development" ? { httpStatus: response.status, xmlResponse: xmlText.substring(0, 500) } : undefined
        }, { status: 503 })
      }

      // Parse SOAP Response - robusteres Parsing mit mehreren Strategien
      // VIES gibt typischerweise eine SOAP-Response zurück mit checkVatResponse
      let isValidMatch: RegExpMatchArray | null = null
      let isValidValue: string | null = null

      // Strategie 1: Suche nach <valid>true</valid> oder <valid>false</valid> (ohne Namespace)
      isValidMatch = xmlText.match(/<valid[^>]*>(true|false)<\/valid>/i)
      if (isValidMatch) {
        isValidValue = isValidMatch[1]
      }

      // Strategie 2: Suche mit verschiedenen Namespace-Präfixen
      if (!isValidMatch) {
        const namespacePatterns = [
          /<(?:soapenv:)?valid[^>]*>(true|false)<\/(?:soapenv:)?valid>/i,
          /<(?:urn:)?valid[^>]*>(true|false)<\/(?:urn:)?valid>/i,
          /<(?:tns:)?valid[^>]*>(true|false)<\/(?:tns:)?valid>/i,
          /<(?:soap:)?valid[^>]*>(true|false)<\/(?:soap:)?valid>/i,
        ]
        for (const pattern of namespacePatterns) {
          isValidMatch = xmlText.match(pattern)
          if (isValidMatch) {
            isValidValue = isValidMatch[1]
            break
          }
        }
      }

      // Strategie 3: Suche nach valid mit beliebigen Attributen
      if (!isValidMatch) {
        isValidMatch = xmlText.match(/<valid[^>]*>(true|false)/i)
        if (isValidMatch) {
          isValidValue = isValidMatch[1]
        }
      }

      // Strategie 4: Suche nach valid mit Leerzeichen/Tabs/Newlines
      if (!isValidMatch) {
        isValidMatch = xmlText.match(/<valid[^>]*>\s*(true|false)\s*<\/valid>/is)
        if (isValidMatch) {
          isValidValue = isValidMatch[1]
        }
      }

      // Strategie 5: Suche im checkVatResponse Block
      if (!isValidMatch) {
        const responseBlockMatch = xmlText.match(/<checkVatResponse[^>]*>(.*?)<\/checkVatResponse>/is)
        if (responseBlockMatch) {
          const responseBlock = responseBlockMatch[1]
          isValidMatch = responseBlock.match(/<valid[^>]*>(true|false)<\/valid>/i)
          if (isValidMatch) {
            isValidValue = isValidMatch[1]
          }
        }
      }

      // Strategie 6: Suche nach valid irgendwo im XML (letzte Option)
      if (!isValidMatch) {
        isValidMatch = xmlText.match(/valid[^>]*>\s*(true|false)/i)
        if (isValidMatch) {
          isValidValue = isValidMatch[1]
        }
      }

      if (!isValidMatch || !isValidValue) {
        console.error("Konnte 'valid' in VIES Response nicht finden")
        console.error("Full XML Response:", xmlText)
        console.error("Response Length:", xmlText.length)
        console.error("Response contains 'valid':", xmlText.includes('valid'))
        console.error("Response contains 'checkVat':", xmlText.includes('checkVat'))
        
        // Versuche zumindest zu sehen, ob es eine Response gibt
        const hasResponse = xmlText.includes('checkVatResponse') || xmlText.includes('checkVat')
        const hasFault = xmlText.includes('Fault')
        
        return NextResponse.json({
          valid: false,
          error: hasFault 
            ? "VIES API hat einen Fehler zurückgegeben. Bitte versuchen Sie es später erneut."
            : "Konnte die VIES-Response nicht verarbeiten. Bitte versuchen Sie es erneut.",
          vatId: cleanVatId,
          debug: {
            xmlResponse: xmlText.substring(0, 5000), // Erste 5000 Zeichen
            responseLength: xmlText.length,
            hasResponse,
            hasFault,
            containsValid: xmlText.includes('valid'),
            containsCheckVat: xmlText.includes('checkVat')
          }
        }, { status: 503 })
      }

      const isValid = isValidValue.toLowerCase() === "true"

      if (!isValid) {
        // VAT-ID ist ungültig, aber Request wurde erfolgreich verarbeitet
        let errorMessage = "Die VAT-ID wurde nicht in der VIES-Datenbank gefunden."
        
        // Versuche RequestDate zu finden (wenn vorhanden, war die Anfrage erfolgreich verarbeitet)
        const requestDateMatch = xmlText.match(/<requestDate[^>]*>(.*?)<\/requestDate>/i)
        
        console.log("VAT-ID ist ungültig, aber Request wurde verarbeitet. Request Date:", requestDateMatch?.[1])
        
        return NextResponse.json({
          valid: false,
          error: errorMessage,
          vatId: cleanVatId,
          countryCode,
          vatNumber,
          requestDate: requestDateMatch?.[1] || null
        })
      }

      // Extrahiere zusätzliche Informationen falls verfügbar
      // Versuche zuerst im checkVatResponse Block zu suchen
      const responseBlockMatch = xmlText.match(/<checkVatResponse[^>]*>(.*?)<\/checkVatResponse>/is)
      const searchBlock = responseBlockMatch ? responseBlockMatch[1] : xmlText
      
      let nameMatch = searchBlock.match(/<name[^>]*>(.*?)<\/name>/is)
      if (!nameMatch) {
        nameMatch = searchBlock.match(/<(?:soapenv:|urn:|tns:|soap:)?name[^>]*>(.*?)<\/(?:soapenv:|urn:|tns:|soap:)?name>/is)
      }
      
      let addressMatch = searchBlock.match(/<address[^>]*>(.*?)<\/address>/is)
      if (!addressMatch) {
        addressMatch = searchBlock.match(/<(?:soapenv:|urn:|tns:|soap:)?address[^>]*>(.*?)<\/(?:soapenv:|urn:|tns:|soap:)?address>/is)
      }

      // Entferne CDATA-Wrapper falls vorhanden
      const cleanText = (text: string) => {
        return text
          .trim()
          .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
          .replace(/\\n/g, ", ")
          .replace(/\n/g, ", ")
          .replace(/\s+/g, " ")
      }

      const companyName = nameMatch ? cleanText(nameMatch[1]) : null
      const address = addressMatch ? cleanText(addressMatch[1]) : null

      return NextResponse.json({
        valid: true,
        vatId: cleanVatId,
        countryCode,
        vatNumber,
        companyName,
        address
      })

    } catch (apiError: any) {
      // Wenn die VIES API nicht verfügbar ist, geben wir einen Fehler zurück
      console.error("VIES API error:", apiError.message, apiError.stack)
      return NextResponse.json({
        valid: false,
        error: `Die VAT-ID-Validierung ist derzeit nicht verfügbar: ${apiError.message}`,
        vatId: cleanVatId,
        debug: process.env.NODE_ENV === "development" ? { error: apiError.message } : undefined
      }, { status: 503 })
    }

  } catch (error: any) {
    console.error("VAT validation error:", error)
    return NextResponse.json(
      { error: "Fehler bei der Validierung", valid: false },
      { status: 500 }
    )
  }
}

