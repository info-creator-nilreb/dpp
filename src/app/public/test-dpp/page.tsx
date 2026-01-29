/**
 * Test DPP Page - Exemplarischer Produktpass
 * 
 * Diese Seite zeigt das Editorial DPP Redesign mit Mock-Daten
 * für Testzwecke, wenn keine veröffentlichten DPPs vorhanden sind.
 * 
 * Zeigt ALLE Feldtypen und CMS-Blocktypen exemplarisch mit vollständigen Dummy-Daten.
 */

"use client"

import React from 'react'
import EditorialDppViewRedesign from '@/components/editorial/EditorialDppViewRedesign'
import { UnifiedContentBlock } from '@/lib/content-adapter'

export default function TestDppPage() {
  // Mock-Daten für exemplarischen Produktpass - Vollständig mit allen Feldern, Bildern und Zertifikaten
  const mockBlocks: UnifiedContentBlock[] = [
    // Editorial Spine Block (order = 0)
    {
      id: 'spine-1',
      blockKey: 'spine-1',
      displayName: 'Basis- & Produktdaten',
      order: 0,
      content: {
        fields: {
          name: {
            value: 'Nachhaltige Bio-Baumwoll Jeans',
            type: 'text',
            label: 'Produktname',
            key: 'name'
          },
          description: {
            value: 'Diese Premium-Jeans wurde aus 100% biologisch angebauter Baumwolle hergestellt. Sie kombiniert zeitloses Design mit nachhaltiger Produktion und fairer Arbeitsbedingungen. Die Jeans ist langlebig, reparierbar und wurde unter strengen Umweltstandards produziert.',
            type: 'textarea',
            label: 'Beschreibung',
            key: 'description'
          },
          heroImage: {
            value: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=800&fit=crop',
            type: 'file-image',
            label: 'Produktbild',
            key: 'heroImage'
          }
        }
      },
      presentation: {
        layer: 'spine',
        defaultCollapsed: false,
        summary: '3 Felder • 1 Bild',
        density: 'normal',
        allowedInEditorialSpine: true
      },
      versionInfo: {
        version: 1,
        createdAt: new Date('2024-01-15')
      }
    },
    
    // Data Section 1: Materialien & Zusammensetzung (mit verschiedenen Feldtypen)
    {
      id: 'data-1',
      blockKey: 'data-1',
      displayName: 'Materialien & Zusammensetzung',
      order: 1,
      content: {
        fields: {
          materials: {
            value: '100% Bio-Baumwolle (GOTS zertifiziert), recycelte Baumwollfasern',
            type: 'text',
            label: 'Materialien',
            key: 'materials'
          },
          materialPercentage: {
            value: 100,
            type: 'number',
            label: 'Materialanteil (%)',
            key: 'materialPercentage'
          },
          materialComposition: {
            value: '85% Bio-Baumwolle, 15% recycelte Baumwollfasern',
            type: 'textarea',
            label: 'Materialzusammensetzung',
            key: 'materialComposition'
          },
          materialSource: {
            value: 'Indien, Türkei',
            type: 'select',
            label: 'Herkunft der Materialien',
            key: 'materialSource'
          },
          certifications: {
            value: ['GOTS', 'Fair Trade', 'OEKO-TEX Standard 100', 'Cradle to Cradle'],
            type: 'multi-select',
            label: 'Zertifizierungen',
            key: 'certifications'
          },
          isOrganic: {
            value: true,
            type: 'boolean',
            label: 'Bio-zertifiziert',
            key: 'isOrganic'
          },
          weight: {
            value: 450,
            type: 'number',
            label: 'Gewicht (g)',
            key: 'weight'
          },
          materialVideo: {
            value: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            type: 'file-video',
            label: 'Material-Herstellungsprozess (Video)',
            key: 'materialVideo'
          },
          materialGallery: {
            value: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=600&fit=crop',
            type: 'file-image',
            label: 'Material-Galerie',
            key: 'materialGallery'
          },
          gotsCertificate: {
            value: 'https://example.com/gots-certificate.pdf',
            type: 'file-document',
            label: 'GOTS Zertifikat (PDF)',
            key: 'gotsCertificate'
          },
          oekoTexCertificate: {
            value: 'https://example.com/oeko-tex-certificate.pdf',
            type: 'file-document',
            label: 'OEKO-TEX Zertifikat (PDF)',
            key: 'oekoTexCertificate'
          },
          fairTradeCertificate: {
            value: 'https://example.com/fair-trade-certificate.pdf',
            type: 'file-document',
            label: 'Fair Trade Zertifikat (PDF)',
            key: 'fairTradeCertificate'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: '12 Felder • 4 Bilder • 1 Video • 3 Zertifikate',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // Data Section 2: Produktion & Herkunft (mit weiteren Feldtypen)
    {
      id: 'data-2',
      blockKey: 'data-2',
      displayName: 'Produktion & Herkunft',
      order: 2,
      content: {
        fields: {
          countryOfOrigin: {
            value: 'Portugal',
            type: 'country',
            label: 'Herkunftsland',
            key: 'countryOfOrigin'
          },
          brand: {
            value: 'EcoFashion',
            type: 'text',
            label: 'Marke',
            key: 'brand'
          },
          productionDate: {
            value: '2024-01-15',
            type: 'date',
            label: 'Produktionsdatum',
            key: 'productionDate'
          },
          factory: {
            value: 'Fair Wear Foundation zertifiziert, ISO 14001 zertifiziert',
            type: 'textarea',
            label: 'Produktionsstätte',
            key: 'factory'
          },
          productionLocation: {
            value: 'Lissabon, Portugal',
            type: 'text',
            label: 'Produktionsstandort',
            key: 'productionLocation'
          },
          workersCount: {
            value: 45,
            type: 'number',
            label: 'Anzahl Beschäftigte',
            key: 'workersCount'
          },
          website: {
            value: 'https://www.ecofashion.com',
            type: 'url',
            label: 'Website',
            key: 'website'
          },
          productionVideo: {
            value: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            type: 'file-video',
            label: 'Produktionsprozess (Video)',
            key: 'productionVideo'
          },
          productionGallery: {
            value: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop',
            type: 'file-image',
            label: 'Produktions-Galerie',
            key: 'productionGallery'
          },
          fairWearCertificate: {
            value: 'https://example.com/fair-wear-certificate.pdf',
            type: 'file-document',
            label: 'Fair Wear Zertifikat (PDF)',
            key: 'fairWearCertificate'
          },
          isoCertificate: {
            value: 'https://example.com/iso-14001-certificate.pdf',
            type: 'file-document',
            label: 'ISO 14001 Zertifikat (PDF)',
            key: 'isoCertificate'
          },
          reference: {
            value: 'REF-2024-001',
            type: 'reference',
            label: 'Referenznummer',
            key: 'reference'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: '12 Felder • 3 Bilder • 1 Video • 2 Zertifikate',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // Data Section 3: Nutzung, Pflege & Lebensdauer
    {
      id: 'data-3',
      blockKey: 'data-3',
      displayName: 'Nutzung, Pflege & Lebensdauer',
      order: 3,
      content: {
        fields: {
          lifespan: {
            value: '10+ Jahre bei ordnungsgemäßer Pflege',
            type: 'text',
            label: 'Lebensdauer',
            key: 'lifespan'
          },
          careInstructions: {
            value: 'Bei 30°C im Schonwaschgang waschen, nicht bleichen, bügeln bei mittlerer Temperatur (max. 150°C), nicht chemisch reinigen. Trocknen im Schatten, nicht im Trockner.',
            type: 'textarea',
            label: 'Pflegehinweise',
            key: 'careInstructions'
          },
          isRepairable: {
            value: true,
            type: 'boolean',
            label: 'Reparierbar',
            key: 'isRepairable'
          },
          sparePartsAvailable: {
            value: true,
            type: 'boolean',
            label: 'Ersatzteile verfügbar',
            key: 'sparePartsAvailable'
          },
          repairService: {
            value: 'Kostenloser Reparatur-Service für 2 Jahre verfügbar. Kontakt: reparatur@ecofashion.com',
            type: 'textarea',
            label: 'Reparatur-Service',
            key: 'repairService'
          },
          careVideo: {
            value: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            type: 'file-video',
            label: 'Pflege-Anleitung (Video)',
            key: 'careVideo'
          },
          careGallery: {
            value: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop',
            type: 'file-image',
            label: 'Pflege-Galerie',
            key: 'careGallery'
          },
          careGuide: {
            value: 'https://example.com/care-guide.pdf',
            type: 'file-document',
            label: 'Pflegeanleitung (PDF)',
            key: 'careGuide'
          },
          warrantyPeriod: {
            value: 24,
            type: 'number',
            label: 'Garantiezeit (Monate)',
            key: 'warrantyPeriod'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: '9 Felder • 3 Bilder • 1 Video • 1 Dokument',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // Data Section 4: Konformitätserklärung
    {
      id: 'data-4',
      blockKey: 'data-4',
      displayName: 'Konformitätserklärung & Compliance',
      order: 4,
      content: {
        fields: {
          conformityDeclaration: {
            value: 'CE-Kennzeichnung, REACH-konform, GOTS zertifiziert. Dieses Produkt entspricht allen geltenden EU-Richtlinien und Verordnungen für Textilprodukte. Konform mit Verordnung (EU) 2019/1020 und Richtlinie 2001/95/EG.',
            type: 'textarea',
            label: 'Konformitätserklärung',
            key: 'conformityDeclaration'
          },
          complianceStandards: {
            value: ['CE', 'REACH', 'GOTS', 'OEKO-TEX Standard 100', 'Cradle to Cradle'],
            type: 'multi-select',
            label: 'Compliance-Standards',
            key: 'complianceStandards'
          },
          notifiedBody: {
            value: 'TÜV SÜD Product Service GmbH',
            type: 'text',
            label: 'Benannte Stelle',
            key: 'notifiedBody'
          },
          complianceDate: {
            value: '2024-01-10',
            type: 'date',
            label: 'Konformitätsdatum',
            key: 'complianceDate'
          },
          ceCertificate: {
            value: 'https://example.com/ce-certificate.pdf',
            type: 'file-document',
            label: 'CE-Konformitätserklärung (PDF)',
            key: 'ceCertificate'
          },
          reachCertificate: {
            value: 'https://example.com/reach-certificate.pdf',
            type: 'file-document',
            label: 'REACH Zertifikat (PDF)',
            key: 'reachCertificate'
          },
          complianceGallery: {
            value: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
            type: 'file-image',
            label: 'Compliance-Dokumentation',
            key: 'complianceGallery'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: '7 Felder • 2 Bilder • 2 Zertifikate',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // Data Section 5: Rücknahme & Second Life
    {
      id: 'data-5',
      blockKey: 'data-5',
      displayName: 'Rücknahme & Second Life',
      order: 5,
      content: {
        fields: {
          takebackOffered: {
            value: true,
            type: 'boolean',
            label: 'Rücknahme angeboten',
            key: 'takebackOffered'
          },
          takebackContact: {
            value: 'rücknahme@ecofashion.com, +49 30 12345678',
            type: 'text',
            label: 'Kontakt für Rücknahme',
            key: 'takebackContact'
          },
          takebackUrl: {
            value: 'https://www.ecofashion.com/ruecknahme',
            type: 'url',
            label: 'Rücknahme-Website',
            key: 'takebackUrl'
          },
          recyclingRate: {
            value: 95,
            type: 'number',
            label: 'Recycling-Quote (%)',
            key: 'recyclingRate'
          },
          secondLifeInfo: {
            value: 'Die Jeans kann nach Gebrauch zurückgegeben werden und wird recycelt oder für Second-Life-Projekte verwendet. Wir arbeiten mit lokalen Partnern zusammen, um eine nachhaltige Weiterverwendung zu gewährleisten. Aus recycelten Materialien entstehen neue Produkte oder werden für soziale Projekte gespendet.',
            type: 'textarea',
            label: 'Second Life Informationen',
            key: 'secondLifeInfo'
          },
          disposalInfo: {
            value: 'Bitte nicht im Hausmüll entsorgen. Nutzen Sie unsere kostenlose Rücknahme oder geben Sie das Produkt in eine Textilsammlung. 95% des Materials können recycelt werden. Bei Rückgabe erhalten Sie einen Gutschein für Ihren nächsten Einkauf.',
            type: 'textarea',
            label: 'Entsorgungsinformationen',
            key: 'disposalInfo'
          },
          recyclingVideo: {
            value: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            type: 'file-video',
            label: 'Recycling-Prozess (Video)',
            key: 'recyclingVideo'
          },
          recyclingGallery: {
            value: 'https://images.unsplash.com/photo-1611909023030-5c37ab5e5c4a?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop',
            type: 'file-image',
            label: 'Recycling-Galerie',
            key: 'recyclingGallery'
          },
          recyclingCertificate: {
            value: 'https://example.com/recycling-certificate.pdf',
            type: 'file-document',
            label: 'Recycling-Zertifikat (PDF)',
            key: 'recyclingCertificate'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: '9 Felder • 3 Bilder • 1 Video • 1 Zertifikat',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // CMS Block: Timeline
    {
      id: 'cms-timeline-1',
      blockKey: 'timeline',
      displayName: 'Produktgeschichte',
      order: 9,
      content: {
        fields: {
          events: {
            value: [
              { date: '2024-01-15', title: 'Produktion abgeschlossen', description: 'Die Jeans wurde in Portugal fertiggestellt und alle Qualitätskontrollen bestanden' },
              { date: '2024-01-10', title: 'Qualitätskontrolle', description: 'Alle Qualitätsstandards wurden erfüllt und das Produkt ist bereit für den Versand' },
              { date: '2024-01-05', title: 'Materiallieferung', description: 'Bio-Baumwolle aus Indien und Türkei eingetroffen und für die Produktion vorbereitet' },
              { date: '2023-12-20', title: 'Design finalisiert', description: 'Das Design wurde nachhaltig optimiert und für die Produktion freigegeben' }
            ],
            type: 'timeline',
            label: 'Timeline',
            key: 'events'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: 'Timeline',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // CMS Block: Akkordion
    {
      id: 'cms-accordion-1',
      blockKey: 'accordion',
      displayName: 'Häufige Fragen',
      order: 10,
      content: {
        fields: {
          items: {
            value: [
              { question: 'Wie wird die Jeans gewaschen?', answer: 'Bei 30°C im Schonwaschgang, nicht bleichen' },
              { question: 'Ist die Jeans reparierbar?', answer: 'Ja, wir bieten einen kostenlosen Reparaturservice für 2 Jahre an' },
              { question: 'Wo wird die Jeans produziert?', answer: 'In Portugal unter fairen Arbeitsbedingungen und strengen Umweltstandards' },
              { question: 'Kann ich die Jeans zurückgeben?', answer: 'Ja, wir bieten eine kostenlose Rücknahme an. Kontaktieren Sie uns unter rücknahme@ecofashion.com' }
            ],
            type: 'accordion',
            label: 'FAQ',
            key: 'items'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: 'FAQ',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    },
    
    // CMS Block: Multi-Question Poll (NEU)
    {
      id: 'cms-multi-poll-1',
      blockKey: 'multi_question_poll',
      displayName: 'Ihre Meinung',
      order: 11,
      content: {
        fields: {
          config: {
            value: {
              questions: [
                {
                  question: 'Wie wichtig ist Ihnen Nachhaltigkeit bei Kleidung?',
                  options: ['Sehr wichtig', 'Wichtig', 'Eher unwichtig']
                },
                {
                  question: 'Wie oft kaufen Sie nachhaltige Produkte?',
                  options: ['Regelmäßig', 'Gelegentlich', 'Selten', 'Nie']
                },
                {
                  question: 'Was ist Ihnen bei nachhaltigen Produkten am wichtigsten?',
                  options: ['Umweltschutz', 'Faire Arbeitsbedingungen', 'Langlebigkeit', 'Recycling-Fähigkeit']
                }
              ],
              completionMessage: 'Vielen Dank für Ihre Teilnahme! Ihre Meinung hilft uns, nachhaltigere Produkte zu entwickeln.'
            },
            type: 'object',
            label: 'Konfiguration',
            key: 'config'
          }
        }
      },
      presentation: {
        layer: 'data',
        defaultCollapsed: true,
        summary: 'Multi-Question Poll',
        density: 'normal',
        allowedInEditorialSpine: false
      }
    }
  ]
  
  // Füge dppId zu Multi-Question Poll Blocks hinzu (für API-Calls)
  const blocksWithDppId = mockBlocks.map(block => {
    if (block.blockKey === 'multi_question_poll') {
      return { ...block, dppId: 'test-dpp-id' }
    }
    return block
  })

  return (
    <EditorialDppViewRedesign
      blocks={blocksWithDppId}
      dppId="test-dpp-id"
      dppName="Nachhaltige Bio-Baumwoll Jeans"
      brandName="EcoFashion"
      organizationName="EcoFashion GmbH"
      organizationLogoUrl="https://via.placeholder.com/150x50/24c598/FFFFFF?text=EcoFashion"
      organizationWebsite="https://www.ecofashion.com"
      heroImageUrl="https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=800&fit=crop"
      versionInfo={{
        version: 1,
        createdAt: new Date('2024-01-15')
      }}
      basicData={{
        sku: 'TSH-001',
        gtin: '1234567890123',
        countryOfOrigin: 'Deutschland'
      }}
    />
  )
}
