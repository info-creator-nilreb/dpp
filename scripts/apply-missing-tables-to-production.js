#!/usr/bin/env node

/**
 * Script zum Anwenden der fehlenden Tabellen auf die Produktionsdatenbank
 * 
 * Verwendung:
 *   DATABASE_URL="postgresql://..." node scripts/apply-missing-tables-to-production.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('FEHLER: DATABASE_URL Umgebungsvariable ist nicht gesetzt.');
    console.error('');
    console.error('Bitte setze die DATABASE_URL für die Produktionsdatenbank:');
    console.error('  DATABASE_URL="postgresql://..." node scripts/apply-missing-tables-to-production.js');
    process.exit(1);
  }

  // Maskiere das Passwort in der Ausgabe
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log('==========================================');
  console.log('Migration: Fehlende Tabellen zur Produktionsdatenbank hinzufügen');
  console.log('==========================================');
  console.log('');
  console.log(`Verwende DATABASE_URL: ${maskedUrl}`);
  console.log('');

  // Lese das SQL-Script
  const sqlPath = path.join(__dirname, 'apply-missing-tables-to-production.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Erstelle Prisma Client mit der angegebenen DATABASE_URL
  // Füge SSL-Parameter für Supabase hinzu
  const prismaUrl = databaseUrl.includes('supabase.com') 
    ? databaseUrl + '?sslmode=require'
    : databaseUrl;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: prismaUrl
      }
    }
  });

  try {
    console.log('Wende Migration an...');
    console.log('');

    // Führe das gesamte SQL-Script als ein Statement aus
    // Prisma kann mehrere Statements in einem $executeRawUnsafe ausführen
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (error) {
      // Wenn das gesamte Script fehlschlägt, versuche es Statement für Statement
      console.log('Vollständiges Script fehlgeschlagen, versuche Statement für Statement...');
      console.log('');
      
      // Teile das SQL-Script in einzelne Statements auf
      // Behandle DO $$ ... END $$ Blöcke als einzelne Statements
      const statements = [];
      let currentStatement = '';
      let inDoBlock = false;
      let doBlockDepth = 0;
      
      const lines = sql.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Ignoriere Kommentare und leere Zeilen
        if (trimmed.startsWith('--') || trimmed.length === 0) {
          continue;
        }
        
        currentStatement += line + '\n';
        
        // Erkenne DO $$ Blöcke
        if (trimmed.startsWith('DO $$')) {
          inDoBlock = true;
          doBlockDepth = 1;
        } else if (inDoBlock) {
          if (trimmed.includes('$$')) {
            doBlockDepth += (trimmed.match(/\$\$/g) || []).length;
            if (trimmed.includes('END $$')) {
              doBlockDepth -= 2;
              if (doBlockDepth <= 0) {
                inDoBlock = false;
                statements.push(currentStatement.trim());
                currentStatement = '';
              }
            }
          }
        } else if (trimmed.endsWith(';') && !inDoBlock) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
      }

      // Führe jedes Statement aus
      for (const statement of statements) {
        if (statement.trim().length === 0) continue;
        
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Ignoriere Fehler, wenn die Tabelle/der Index bereits existiert
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('IF NOT EXISTS') ||
              error.message.includes('already exists')) {
            // Das ist OK, die Tabelle/der Index existiert bereits
            continue;
          }
          // Andere Fehler weiterwerfen
          throw error;
        }
      }
    }

    console.log('==========================================');
    console.log('Migration erfolgreich abgeschlossen!');
    console.log('==========================================');
    console.log('');
    console.log('Die folgenden Tabellen wurden erstellt (falls sie nicht bereits existierten):');
    console.log('  - feature_registry');
    console.log('  - block_types');
    console.log('  - dpp_content');
    console.log('');
    console.log('Bitte prüfe die Tabellenstruktur mit:');
    console.log('  npx prisma studio --schema prisma/schema.prisma');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('FEHLER bei der Migration:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Unerwarteter Fehler:');
    console.error(error);
    process.exit(1);
  });

