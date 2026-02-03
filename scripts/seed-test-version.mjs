#!/usr/bin/env node

/**
 * Legt eine Test-Version für einen bestehenden DPP an (lokal testen der Versionsansicht).
 *
 * So testest du die Änderungen an der Versionsdetailseite (Domain, nur URL/QR/Download):
 *
 * 1. Mindestens einen DPP anlegen (z. B. unter /app/create/new), falls noch keiner existiert.
 * 2. Skript ausführen:
 *      node scripts/seed-test-version.mjs
 *    oder für einen bestimmten DPP:
 *      node scripts/seed-test-version.mjs <dppId>
 * 3. Im Browser: /app/dpps/<dppId>/versions aufrufen, dann auf die angelegte Version klicken
 *    (oder direkt /app/dpps/<dppId>/versions/1).
 *
 * Du siehst dann: URL (mit easyproductpass.com wenn NEXT_PUBLIC_APP_URL gesetzt),
 * QR-Code, Download und „Öffentliche Ansicht öffnen“ – ohne die Pflichtdaten-Blöcke.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dppId = process.argv[2]

  let dpp
  if (dppId) {
    dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: { organization: { select: { id: true } } },
    })
    if (!dpp) {
      console.error('❌ DPP nicht gefunden:', dppId)
      process.exit(1)
    }
  } else {
    dpp = await prisma.dpp.findFirst({
      include: { organization: { select: { id: true } } },
    })
    if (!dpp) {
      console.error('❌ Kein DPP in der Datenbank. Bitte zuerst einen DPP anlegen (z. B. unter /app/create/new).')
      process.exit(1)
    }
    console.log('ℹ️  Keine dppId übergeben – verwende ersten DPP:', dpp.id, dpp.name || '(ohne Namen)')
  }

  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ Kein User in der Datenbank.')
    process.exit(1)
  }

  const existing = await prisma.dppVersion.findFirst({
    where: { dppId: dpp.id },
    orderBy: { version: 'desc' },
  })
  const nextVersion = existing ? existing.version + 1 : 1
  const publicPath = `/public/dpp/${dpp.id}/v/${nextVersion}`

  await prisma.dppVersion.create({
    data: {
      dppId: dpp.id,
      version: nextVersion,
      name: dpp.name || 'Test-Produkt',
      description: dpp.description ?? null,
      category: dpp.category || 'OTHER',
      sku: dpp.sku ?? null,
      gtin: dpp.gtin ?? null,
      brand: dpp.brand ?? null,
      countryOfOrigin: dpp.countryOfOrigin ?? null,
      materials: null,
      materialSource: null,
      careInstructions: null,
      isRepairable: null,
      sparePartsAvailable: null,
      lifespan: null,
      conformityDeclaration: null,
      disposalInfo: null,
      takebackOffered: null,
      takebackContact: null,
      secondLifeInfo: null,
      publicUrl: publicPath,
      createdByUserId: user.id,
    },
  })

  console.log('✅ Test-Version angelegt.')
  console.log('   DPP:', dpp.id, '| Version:', nextVersion)
  console.log('   URL im App: http://localhost:3001/app/dpps/' + dpp.id + '/versions/' + nextVersion)
  console.log('   Public-URL (relativ):', publicPath)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
