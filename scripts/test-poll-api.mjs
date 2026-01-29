/**
 * Test Script für Poll API Endpoints
 * 
 * Testet die Backend-Implementierung der Multi-Question Poll API
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testPollAPI() {
  console.log('🧪 Teste Poll API Endpoints...\n')

  // Test-Daten
  const testDppId = 'test-dpp-id'
  const testPollBlockId = 'cms-multi-poll-1'
  const testSessionId = `test-session-${Date.now()}`

  // Test 1: Poll-Antwort absenden
  console.log('📤 Test 1: Poll-Antwort absenden')
  try {
    const submitResponse = await fetch(`${BASE_URL}/api/polls/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pollBlockId: testPollBlockId,
        dppId: testDppId,
        responses: [
          { questionIndex: 0, answer: 'Sehr wichtig' },
          { questionIndex: 1, answer: 'Regelmäßig' },
          { questionIndex: 2, answer: 'Umweltschutz' }
        ],
        sessionId: testSessionId
      })
    })

    const submitData = await submitResponse.json()
    
    if (submitResponse.ok) {
      console.log('✅ Erfolgreich:', submitData)
    } else {
      console.log('❌ Fehler:', submitData)
    }
  } catch (error) {
    console.log('❌ Fehler beim Absenden:', error.message)
  }

  console.log('\n')

  // Test 2: Duplikat-Prävention (gleiche Session-ID)
  console.log('📤 Test 2: Duplikat-Prävention (gleiche Session-ID)')
  try {
    const duplicateResponse = await fetch(`${BASE_URL}/api/polls/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pollBlockId: testPollBlockId,
        dppId: testDppId,
        responses: [
          { questionIndex: 0, answer: 'Wichtig' }
        ],
        sessionId: testSessionId // Gleiche Session-ID
      })
    })

    const duplicateData = await duplicateResponse.json()
    
    if (duplicateResponse.status === 409) {
      console.log('✅ Duplikat korrekt abgelehnt:', duplicateData)
    } else {
      console.log('⚠️  Unerwartetes Verhalten:', duplicateData)
    }
  } catch (error) {
    console.log('❌ Fehler:', error.message)
  }

  console.log('\n')

  // Test 3: Weitere Antworten mit verschiedenen Session-IDs
  console.log('📤 Test 3: Weitere Antworten (verschiedene Sessions)')
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/polls/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollBlockId: testPollBlockId,
          dppId: testDppId,
          responses: [
            { questionIndex: 0, answer: ['Sehr wichtig', 'Wichtig', 'Eher unwichtig'][i] },
            { questionIndex: 1, answer: ['Regelmäßig', 'Gelegentlich', 'Selten'][i] },
            { questionIndex: 2, answer: ['Umweltschutz', 'Faire Arbeitsbedingungen', 'Langlebigkeit'][i] }
          ],
          sessionId: `test-session-${Date.now()}-${i}`
        })
      })

      if (response.ok) {
        console.log(`✅ Antwort ${i + 1} erfolgreich gespeichert`)
      } else {
        const data = await response.json()
        console.log(`❌ Antwort ${i + 1} fehlgeschlagen:`, data)
      }
    } catch (error) {
      console.log(`❌ Fehler bei Antwort ${i + 1}:`, error.message)
    }
  }

  console.log('\n')

  // Test 4: Ergebnisse abrufen (benötigt Login - wird wahrscheinlich fehlschlagen)
  console.log('📥 Test 4: Ergebnisse abrufen')
  console.log('⚠️  Hinweis: Dieser Test benötigt eine authentifizierte Session')
  console.log('   Für vollständigen Test: In Browser einloggen und dann testen\n')

  try {
    const resultsResponse = await fetch(
      `${BASE_URL}/api/polls/results?pollBlockId=${testPollBlockId}&dppId=${testDppId}`
    )

    const resultsData = await resultsResponse.json()
    
    if (resultsResponse.ok) {
      console.log('✅ Ergebnisse erfolgreich abgerufen:')
      console.log(JSON.stringify(resultsData, null, 2))
    } else {
      console.log('⚠️  Ergebnisse nicht verfügbar (erwartet ohne Login):', resultsData)
    }
  } catch (error) {
    console.log('❌ Fehler beim Abrufen:', error.message)
  }

  console.log('\n✅ API-Tests abgeschlossen!')
  console.log('\n📊 Nächste Schritte:')
  console.log('   1. Prüfe die Datenbank: SELECT * FROM poll_responses;')
  console.log('   2. Teste mit authentifizierter Session im Browser')
  console.log('   3. Prüfe Dashboard: /app/dashboard')
}

// Führe Tests aus
testPollAPI().catch(console.error)
