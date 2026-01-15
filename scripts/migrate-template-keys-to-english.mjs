/**
 * Migration Script: Template Field Keys zu Englisch
 * 
 * Migriert bestehende Template-Feld-Keys von deutschen zu englischen Keys.
 * Dies stellt Konsistenz mit DPP-Spalten-Keys her und macht das Mapping überflüssig.
 * 
 * VORSICHT: Diese Migration ändert bestehende Template-Feld-Keys!
 * 
 * Mapping:
 * - "produktname" → "name"
 * - "beschreibung" → "description"
 * - "herstellungsland" → "countryOfOrigin"
 * - "ean" → "gtin"
 * - "produktbild" → bleibt wie es ist (neues Feld, hat bereits Key)
 * - "konformiataetserklaerung" → "conformityDeclaration"
 * - "reparierbarkeit" → "isRepairable"
 * - "ruecknahme_angeboten" → "takebackOffered"
 * 
 * Ausführung:
 * node scripts/migrate-template-keys-to-english.mjs
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Mapping von deutschen Keys zu englischen Keys
const keyMapping: Record<string, string> = {
  // Basis- & Produktdaten
  "produktname": "name",
  "beschreibung": "description",
  "herstellungsland": "countryOfOrigin",
  "ean": "gtin",
  // Materialien & Zusammensetzung
  "materialliste": "materials",
  "materialien": "materials",
  "datenquelle": "materialSource",
  "materialquelle": "materialSource",
  // Nutzung, Pflege & Lebensdauer
  "pflegehinweise": "careInstructions",
  "lebensdauer": "lifespan",
  "reparierbarkeit": "isRepairable",
  "reparierbar": "isRepairable",
  "ersatzteile_verfuegbar": "sparePartsAvailable",
  "ersatzteile verfügbar": "sparePartsAvailable",
  // Rechtliches & Konformität
  "konformiataetserklaerung": "conformityDeclaration",
  "konformitätserklärung": "conformityDeclaration",
  "entsorgungsinformationen": "disposalInfo",
  // Rücknahme & Second Life
  "ruecknahme_angeboten": "takebackOffered",
  "rücknahme angeboten": "takebackOffered",
  "ruecknahmekontakt": "takebackContact",
  "rücknahmekontakt": "takebackContact",
  "second_life_informationen": "secondLifeInfo",
  "second life informationen": "secondLifeInfo"
}

async function main() {
  console.log("🔄 Starte Migration: Template-Feld-Keys zu Englisch...")
  
  try {
    // Lade alle Templates
    const templates = await prisma.template.findMany({
      include: {
        blocks: {
          include: {
            fields: true
          }
        }
      }
    })
    
    console.log(`📦 Gefundene Templates: ${templates.length}`)
    
    let totalFieldsUpdated = 0
    let totalTemplatesUpdated = 0
    
    for (const template of templates) {
      let templateNeedsUpdate = false
      const updates: Array<{ fieldId: string, oldKey: string, newKey: string }> = []
      
      // Prüfe alle Felder dieses Templates
      for (const block of template.blocks) {
        for (const field of block.fields) {
          const oldKey = field.key.toLowerCase()
          
          // Prüfe ob Key gemappt werden muss
          if (keyMapping[oldKey]) {
            const newKey = keyMapping[oldKey]
            
            // Prüfe ob Key bereits korrekt ist
            if (field.key !== newKey) {
              // Prüfe ob der neue Key bereits existiert (Konflikt vermeiden)
              const conflictingField = block.fields.find(
                f => f.id !== field.id && f.key.toLowerCase() === newKey.toLowerCase()
              )
              
              if (conflictingField) {
                console.warn(`⚠️  Template "${template.name}" (${template.id}): Key-Konflikt für "${newKey}" - Feld "${field.label}" (${field.id}) übersprungen. Existierendes Feld: "${conflictingField.label}"`)
                continue
              }
              
              updates.push({
                fieldId: field.id,
                oldKey: field.key,
                newKey: newKey
              })
              templateNeedsUpdate = true
            }
          }
        }
      }
      
      // Führe Updates aus
      if (templateNeedsUpdate) {
        console.log(`\n📝 Template "${template.name}" (${template.id}):`)
        console.log(`   Updates: ${updates.length} Felder`)
        
        for (const update of updates) {
          try {
            await prisma.templateField.update({
              where: { id: update.fieldId },
              data: { key: update.newKey }
            })
            console.log(`   ✅ "${update.oldKey}" → "${update.newKey}"`)
            totalFieldsUpdated++
          } catch (error) {
            console.error(`   ❌ Fehler beim Update von Feld ${update.fieldId}:`, error)
          }
        }
        
        totalTemplatesUpdated++
      }
    }
    
    console.log(`\n✅ Migration abgeschlossen!`)
    console.log(`   Templates aktualisiert: ${totalTemplatesUpdated}`)
    console.log(`   Felder aktualisiert: ${totalFieldsUpdated}`)
    
    // WARNUNG: Diese Migration ändert auch dppContent.blocks.data Keys!
    // Die Keys in dppContent müssen separat migriert werden
    console.log(`\n⚠️  WICHTIG: Diese Migration ändert nur Template-Feld-Keys.`)
    console.log(`   DPP-Content (dppContent.blocks.data) muss separat migriert werden!`)
    console.log(`   Verwende: node scripts/migrate-dpp-content-keys-to-english.mjs`)
    
  } catch (error) {
    console.error("❌ Fehler bei der Migration:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error("❌ Unbehandelter Fehler:", error)
    process.exit(1)
  })

