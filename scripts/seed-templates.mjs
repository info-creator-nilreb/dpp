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
  const existingFurniture = await prisma.template.findFirst({
    where: {
      category: "FURNITURE",
      status: "active"
    }
  })

  if (!existingFurniture) {
    // Schritt 1: Template erstellen
    const furnitureTemplate = await prisma.template.create({
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

    // Schritt 2: Blocks erstellen
    const productBlock = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Produktinformationen",
        order: 0
      }
    })

    const materialBlock = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Materialien",
        order: 1
      }
    })

    const careBlock = await prisma.templateBlock.create({
      data: {
        templateId: furnitureTemplate.id,
        name: "Pflege & Lebensdauer",
        order: 2
      }
    })

    // Schritt 3: Fields erstellen
    await prisma.templateField.createMany({
      data: [
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "Produktname", key: "productName", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "Beschreibung", key: "description", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "SKU", key: "sku", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "GTIN/EAN", key: "gtin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 },
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "Marke", key: "brand", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 4 },
        { templateId: furnitureTemplate.id, blockId: productBlock.id, label: "Herstellungsland", key: "countryOfOrigin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 5 },
        { templateId: furnitureTemplate.id, blockId: materialBlock.id, label: "Materialliste", key: "materials", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: furnitureTemplate.id, blockId: materialBlock.id, label: "Materialquelle", key: "materialSource", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
        { templateId: furnitureTemplate.id, blockId: careBlock.id, label: "Pflegehinweise", key: "careInstructions", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: furnitureTemplate.id, blockId: careBlock.id, label: "Reparierbarkeit", key: "isRepairable", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
        { templateId: furnitureTemplate.id, blockId: careBlock.id, label: "Ersatzteile verfügbar", key: "sparePartsAvailable", type: "select", required: false, regulatoryRequired: false, config: JSON.stringify({ options: [{ value: "YES", label: "Ja" }, { value: "NO", label: "Nein" }] }), introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
        { templateId: furnitureTemplate.id, blockId: careBlock.id, label: "Lebensdauer", key: "lifespan", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 }
      ]
    })

    console.log("✅ Furniture Template erstellt:", furnitureTemplate.id)
  } else {
    console.log("ℹ️  Furniture Template bereits vorhanden:", existingFurniture.id)
  }

  // Template: Textilien (TEXTILE)
  const existingTextile = await prisma.template.findFirst({
    where: {
      category: "TEXTILE",
      status: "active"
    }
  })

  if (!existingTextile) {
    // Schritt 1: Template erstellen
    const textileTemplate = await prisma.template.create({
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

    // Schritt 2: Blocks erstellen
    const productBlock = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Produktinformationen",
        order: 0
      }
    })

    const materialBlock = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Materialien & Zusammensetzung",
        order: 1
      }
    })

    const careBlock = await prisma.templateBlock.create({
      data: {
        templateId: textileTemplate.id,
        name: "Pflege & Lebensdauer",
        order: 2
      }
    })

    // Schritt 3: Fields erstellen
    await prisma.templateField.createMany({
      data: [
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "Produktname", key: "productName", type: "text", required: true, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "Beschreibung", key: "description", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "SKU", key: "sku", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 2 },
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "GTIN/EAN", key: "gtin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 3 },
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "Marke", key: "brand", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 4 },
        { templateId: textileTemplate.id, blockId: productBlock.id, label: "Herstellungsland", key: "countryOfOrigin", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 5 },
        { templateId: textileTemplate.id, blockId: materialBlock.id, label: "Materialliste", key: "materials", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: textileTemplate.id, blockId: materialBlock.id, label: "Materialquelle", key: "materialSource", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 },
        { templateId: textileTemplate.id, blockId: careBlock.id, label: "Pflegehinweise", key: "careInstructions", type: "textarea", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 0 },
        { templateId: textileTemplate.id, blockId: careBlock.id, label: "Lebensdauer", key: "lifespan", type: "text", required: false, regulatoryRequired: false, introducedInVersion: 1, deprecatedInVersion: null, order: 1 }
      ]
    })

    console.log("✅ Textile Template erstellt:", textileTemplate.id)
  } else {
    console.log("ℹ️  Textile Template bereits vorhanden:", existingTextile.id)
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
