/**
 * Seed Script für Multi-Question Poll BlockType
 * 
 * Erstellt den BlockType für Multi-Question Polls
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMultiQuestionPoll() {
  console.log('Seeding Multi-Question Poll BlockType...');

  // Config Schema für Multi-Question Poll
  const configSchema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            question: { type: 'string', minLength: 1 },
            options: {
              type: 'array',
              minItems: 2,
              maxItems: 5,
              items: { type: 'string', minLength: 1 }
            }
          },
          required: ['question', 'options']
        }
      },
      completionMessage: {
        type: 'string',
        default: 'Vielen Dank für Ihre Teilnahme!'
      }
    },
    required: ['questions']
  };

  // Default Config
  const defaultConfig = {
    questions: [
      {
        question: 'Wie wichtig ist Ihnen Nachhaltigkeit bei Kleidung?',
        options: ['Sehr wichtig', 'Wichtig', 'Eher unwichtig']
      }
    ],
    completionMessage: 'Vielen Dank für Ihre Teilnahme!'
  };

  // Finde Interaction Blocks Feature Registry (falls vorhanden)
  const interactionFeature = await prisma.featureRegistry.findUnique({
    where: { key: 'interaction_blocks' }
  });

  // Erstelle BlockType
  await prisma.blockType.upsert({
    where: { key: 'multi_question_poll' },
    update: {
      name: 'Multi-Question Poll',
      description: 'Umfrage mit bis zu 3 Fragen, die horizontal durchgescrollt werden können',
      category: 'interaction',
      configSchema: JSON.stringify(configSchema),
      defaultConfig: JSON.stringify(defaultConfig),
      supportsStyling: false,
      requiresPublishing: false,
      featureRegistryId: interactionFeature?.id || null,
    },
    create: {
      key: 'multi_question_poll',
      name: 'Multi-Question Poll',
      description: 'Umfrage mit bis zu 3 Fragen, die horizontal durchgescrollt werden können',
      category: 'interaction',
      configSchema: JSON.stringify(configSchema),
      defaultConfig: JSON.stringify(defaultConfig),
      supportsStyling: false,
      requiresPublishing: false,
      featureRegistryId: interactionFeature?.id || null,
    },
  });

  console.log('✓ Multi-Question Poll BlockType created');
}

seedMultiQuestionPoll()
  .catch((e) => {
    console.error('Error seeding Multi-Question Poll:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
