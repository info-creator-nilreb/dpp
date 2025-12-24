/**
 * Seed Script für Initiale Templates
 * 
 * Erstellt zwei Templates:
 * - FURNITURE (Möbel)
 * - TEXTILE (Textilien)
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Templates...")

  // Template: Möbel (FURNITURE)
  // MVP: Overwrite Version 1 if it exists (no productive DPPs yet)
  const existingFurniture = await prisma.template.findFirst({
    where: {
      category: "FURNITURE",
      version: 1
    },
    include: {
      blocks: {
        include: {
          fields: true
        }
      }
    }
  })

  // MVP: Delete existing Version 1 blocks and fields if they exist, then recreate
  let furnitureTemplate
  if (existingFurniture) {
    // Delete all fields first (cascade might not work in reverse)
    for (const block of existingFurniture.blocks) {
      await prisma.templateField.deleteMany({
        where: { blockId: block.id }
      })
    }
    // Delete all blocks
    await prisma.templateBlock.deleteMany({
      where: { templateId: existingFurniture.id }
    })
    // Update template
    furnitureTemplate = await prisma.template.update({
      where: { id: existingFurniture.id },
      data: {
        name: "Möbel Template",
        status: "active",
        description: "Template für Möbelprodukte",
        effectiveFrom: new Date(),
        supersedesVersion: null
      }
    })
  } else {
    // Schritt 1: Template erstellen
    furnitureTemplate = await prisma.template.create({
      data: {
        name: "Möbel Template",
        category: "FURNITURE",
        industry: "furniture",
        version: 1,
        status: "active",
        description: "Template für Möbelprodukte",
        effectiveFrom: new Date(),
        supersedesVersion: null
      }
    })
  }
  
  // Schritt 2: Blocks erstellen (5 kanonische Blöcke) - immer, auch wenn Template existierte
  if (furnitureTemplate) {
    const existingBlocks = await prisma.templateBlock.findMany({
      where: { templateId: furnitureTemplate.id }
    })
    
    if (existingBlocks.length === 0) {
      // Schritt 2: Blocks erstellen (5 kanonische Blöcke)
    const block1 = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Basis- & Produktdaten",
        order: 0
      }
    })

    const block2 = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Materialien & Zusammensetzung",
        order: 1
      }
    })

    const block3 = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Nutzung, Pflege & Lebensdauer",
        order: 2
      }
    })

    const block4 = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Rechtliches & Konformität",
        order: 3
      }
    })

    const block5 = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Rücknahme & Second Life",
        order: 4
      }
    })

      // Schritt 3: Fields erstellen (basierend auf DppEditor Struktur)
      await prisma.templateField.createMany({
        data: [
          // Block 1: Basis- & Produktdaten
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "Produktkategorie", key: "category", type: "select", required: true, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "TEXTILE", label: "Textil" }, { value: "FURNITURE", label: "Möbel" }, { value: "OTHER", label: "Sonstiges" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "Produktname", key: "name", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "Beschreibung", key: "description", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "SKU / Interne ID", key: "sku", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "GTIN / EAN", key: "gtin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 4 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "Marke / Hersteller", key: "brand", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 5 },
          { templateId: furnitureTemplate.id, blockId: block1.id, label: "Herstellungsland", key: "countryOfOrigin", type: "select", required: true, regulatoryRequired: false, config: JSON.stringify({ type: "country" }), introducedInVersion: 1, deprecatedInVersion: null, order: 6 },
          // Block 2: Materialien & Zusammensetzung
          { templateId: furnitureTemplate.id, blockId: block2.id, label: "Materialliste", key: "materials", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: furnitureTemplate.id, blockId: block2.id, label: "Datenquelle (z. B. Lieferant)", key: "materialSource", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          // Block 3: Nutzung, Pflege & Lebensdauer
          { templateId: furnitureTemplate.id, blockId: block3.id, label: "Pflegehinweise", key: "careInstructions", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: furnitureTemplate.id, blockId: block3.id, label: "Reparierbarkeit", key: "isRepairable", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "", label: "Bitte wählen" }, { value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          { templateId: furnitureTemplate.id, blockId: block3.id, label: "Ersatzteile verfügbar", key: "sparePartsAvailable", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "", label: "Bitte wählen" }, { value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
          { templateId: furnitureTemplate.id, blockId: block3.id, label: "Lebensdauer", key: "lifespan", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 },
          // Block 4: Rechtliches & Konformität
          { templateId: furnitureTemplate.id, blockId: block4.id, label: "Konformitätserklärung", key: "conformityDeclaration", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: furnitureTemplate.id, blockId: block4.id, label: "Entsorgungsinformationen", key: "disposalInfo", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          // Block 5: Rücknahme & Second Life
          { templateId: furnitureTemplate.id, blockId: block5.id, label: "Rücknahme angeboten", key: "takebackOffered", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "", label: "Bitte wählen" }, { value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: furnitureTemplate.id, blockId: block5.id, label: "Rücknahmekontakt", key: "takebackContact", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          { templateId: furnitureTemplate.id, blockId: block5.id, label: "Second Life Informationen", key: "secondLifeInfo", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 }
        ]
      })

      console.log("✅ Furniture Template Blöcke erstellt/aktualisiert")
    }
    
    if (existingFurniture) {
      console.log("✅ Furniture Template Version 1 aktualisiert (MVP):", furnitureTemplate.id)
    } else {
      console.log("✅ Furniture Template erstellt:", furnitureTemplate.id)
    }
  }

  // Template: Textilien (TEXTILE)
  // MVP: Overwrite Version 1 if it exists (no productive DPPs yet)
  const existingTextile = await prisma.template.findFirst({
    where: {
      category: "TEXTILE",
      version: 1
    },
    include: {
      blocks: {
        include: {
          fields: true
        }
      }
    }
  })

  // MVP: Delete existing Version 1 blocks and fields if they exist, then recreate
  let textileTemplate
  if (existingTextile) {
    // Delete all fields first (cascade might not work in reverse)
    for (const block of existingTextile.blocks) {
      await prisma.templateField.deleteMany({
        where: { blockId: block.id }
      })
    }
    // Delete all blocks
    await prisma.templateBlock.deleteMany({
      where: { templateId: existingTextile.id }
    })
    // Update template
    textileTemplate = await prisma.template.update({
      where: { id: existingTextile.id },
      data: {
        name: "Textilien Template",
        status: "active",
        description: "Template für Textilprodukte",
        effectiveFrom: new Date(),
        supersedesVersion: null
      }
    })
  } else {
    // Schritt 1: Template erstellen
    textileTemplate = await prisma.template.create({
      data: {
        name: "Textilien Template",
        category: "TEXTILE",
        industry: "textile",
        version: 1,
        status: "active",
        description: "Template für Textilprodukte",
        effectiveFrom: new Date(),
        supersedesVersion: null
      }
    })
  }
  
  // Schritt 2: Blocks erstellen (5 kanonische Blöcke) - immer, auch wenn Template existierte
  if (textileTemplate) {
    const existingBlocks = await prisma.templateBlock.findMany({
      where: { templateId: textileTemplate.id }
    })
    
    if (existingBlocks.length === 0) {
      const block1 = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Basis- & Produktdaten",
        order: 0
      }
    })

    const block2 = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Materialien & Zusammensetzung",
        order: 1
      }
    })

    const block3 = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Nutzung, Pflege & Lebensdauer",
        order: 2
      }
    })

    const block4 = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Rechtliches & Konformität",
        order: 3
      }
    })

    const block5 = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Rücknahme & Second Life",
        order: 4
      }
    })

      // Schritt 3: Fields erstellen (basierend auf DppEditor Struktur)
      await prisma.templateField.createMany({
        data: [
          // Block 1: Basis- & Produktdaten
          { templateId: textileTemplate.id, blockId: block1.id, label: "Produktkategorie", key: "category", type: "select", required: true, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "TEXTILE", label: "Textil" }, { value: "FURNITURE", label: "Möbel" }, { value: "OTHER", label: "Sonstiges" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "Produktname", key: "name", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "Beschreibung", key: "description", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "SKU / Interne ID", key: "sku", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "GTIN / EAN", key: "gtin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 4 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "Marke / Hersteller", key: "brand", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 5 },
          { templateId: textileTemplate.id, blockId: block1.id, label: "Herstellungsland", key: "countryOfOrigin", type: "select", required: true, regulatoryRequired: false, config: JSON.stringify({ type: "country" }), introducedInVersion: 1, deprecatedInVersion: null, order: 6 },
          // Block 2: Materialien & Zusammensetzung
          { templateId: textileTemplate.id, blockId: block2.id, label: "Materialliste", key: "materials", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: textileTemplate.id, blockId: block2.id, label: "Datenquelle (z. B. Lieferant)", key: "materialSource", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          // Block 3: Nutzung, Pflege & Lebensdauer
          { templateId: textileTemplate.id, blockId: block3.id, label: "Pflegehinweise", key: "careInstructions", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: textileTemplate.id, blockId: block3.id, label: "Lebensdauer", key: "lifespan", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          // Block 4: Rechtliches & Konformität
          { templateId: textileTemplate.id, blockId: block4.id, label: "Konformitätserklärung", key: "conformityDeclaration", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: textileTemplate.id, blockId: block4.id, label: "Entsorgungsinformationen", key: "disposalInfo", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          // Block 5: Rücknahme & Second Life
          { templateId: textileTemplate.id, blockId: block5.id, label: "Rücknahme angeboten", key: "takebackOffered", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "", label: "Bitte wählen" }, { value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
          { templateId: textileTemplate.id, blockId: block5.id, label: "Rücknahmekontakt", key: "takebackContact", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
          { templateId: textileTemplate.id, blockId: block5.id, label: "Second Life Informationen", key: "secondLifeInfo", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 }
        ]
      })
      
      console.log("✅ Textile Template Blöcke erstellt/aktualisiert")
    }
    
    if (existingTextile) {
      console.log("✅ Textile Template Version 1 aktualisiert (MVP):", textileTemplate.id)
    } else {
      console.log("✅ Textile Template erstellt:", textileTemplate.id)
    }
  }

  console.log("✨ Seeding abgeschlossen!")
}

main()
  .catch((e) => {
    console.error("❌ Fehler beim Seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
