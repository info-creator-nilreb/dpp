/**
 * Template-Helper für Preflight: Required Fields
 * 
 * HINWEIS: getRequiredFieldsForCategory wurde entfernt, da die Preflight-API-Routen
 * aktuell Standard-Felder verwenden und keine Datenbankabfragen benötigen.
 * Wenn in Zukunft kategoriespezifische Felder benötigt werden, kann diese Funktion
 * wieder hinzugefügt werden.
 */

/**
 * Map DPP Field Names zu Template Field Keys
 * 
 * Diese Funktion mappt die Feldnamen aus dem DPP-Schema zu den
 * Template-Feld-Keys, die von der AI erwartet werden.
 */
export function mapDppFieldToTemplateKey(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    "name": "name",
    "description": "description",
    "sku": "sku",
    "gtin": "gtin",
    "brand": "brand",
    "countryOfOrigin": "countryOfOrigin",
    "materials": "materials",
    "materialSource": "materialSource",
    "careInstructions": "careInstructions",
    "isRepairable": "isRepairable",
    "sparePartsAvailable": "sparePartsAvailable",
    "lifespan": "lifespan",
    "conformityDeclaration": "conformityDeclaration",
    "disposalInfo": "disposalInfo",
    "takebackOffered": "takebackOffered",
    "takebackContact": "takebackContact",
    "secondLifeInfo": "secondLifeInfo",
  }
  
  return fieldMap[fieldName] || fieldName
}

