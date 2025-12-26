/**
 * Seed Script für Feature Registry
 * 
 * Erstellt die Standard-Features für das Subscription & Trial System
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFeatureRegistry() {
  console.log('Seeding Feature Registry...');

  // Storytelling Blocks
  await prisma.featureRegistry.upsert({
    where: { key: 'storytelling_blocks' },
    update: {},
    create: {
      key: 'storytelling_blocks',
      name: 'Storytelling Blocks',
      description: 'Advanced content blocks for storytelling',
      category: 'content',
      capabilityKey: 'storytelling_blocks',
      minimumPlan: 'pro',
      requiresActiveSubscription: true,
      requiresPublishingCapability: false,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: false,
      configSchema: JSON.stringify({
        type: 'object',
        properties: {
          maxBlocks: { type: 'number' },
        },
      }),
    },
  });
  console.log('✓ Storytelling Blocks created');

  // Interaction Blocks
  await prisma.featureRegistry.upsert({
    where: { key: 'interaction_blocks' },
    update: {},
    create: {
      key: 'interaction_blocks',
      name: 'Interaction Blocks',
      description: 'Interactive elements (quizzes, forms, etc.)',
      category: 'interaction',
      capabilityKey: 'interaction_blocks',
      minimumPlan: 'premium',
      requiresActiveSubscription: true,
      requiresPublishingCapability: true,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: false,
      configSchema: JSON.stringify({
        type: 'object',
        properties: {
          maxInteractions: { type: 'number' },
        },
      }),
    },
  });
  console.log('✓ Interaction Blocks created');

  // Publishing
  await prisma.featureRegistry.upsert({
    where: { key: 'publishing' },
    update: {},
    create: {
      key: 'publishing',
      name: 'Publishing',
      description: 'Ability to publish DPPs publicly',
      category: 'publishing',
      capabilityKey: 'publishing',
      minimumPlan: 'basic',
      requiresActiveSubscription: true,
      requiresPublishingCapability: true,
      visibleInTrial: false,
      usableInTrial: false,
      enabled: true,
      defaultForNewDpps: true,
    },
  });
  console.log('✓ Publishing created');

  // CMS Access
  await prisma.featureRegistry.upsert({
    where: { key: 'cms_access' },
    update: {},
    create: {
      key: 'cms_access',
      name: 'CMS Access',
      description: 'Access to content management system',
      category: 'core',
      capabilityKey: 'cms_access',
      minimumPlan: 'basic',
      requiresActiveSubscription: false, // Available in trial
      requiresPublishingCapability: false,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: true,
    },
  });
  console.log('✓ CMS Access created');

  // Block Editor
  await prisma.featureRegistry.upsert({
    where: { key: 'block_editor' },
    update: {},
    create: {
      key: 'block_editor',
      name: 'Block Editor',
      description: 'Visual block-based content editor',
      category: 'core',
      capabilityKey: 'block_editor',
      minimumPlan: 'basic',
      requiresActiveSubscription: false, // Available in trial
      requiresPublishingCapability: false,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: true,
    },
  });
  console.log('✓ Block Editor created');

  // Styling Controls
  await prisma.featureRegistry.upsert({
    where: { key: 'styling_controls' },
    update: {},
    create: {
      key: 'styling_controls',
      name: 'Styling Controls',
      description: 'Advanced styling options for content',
      category: 'styling',
      capabilityKey: 'styling_controls',
      minimumPlan: 'pro',
      requiresActiveSubscription: true,
      requiresPublishingCapability: false,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: false,
    },
  });
  console.log('✓ Styling Controls created');

  console.log('\n✅ Feature Registry seeded successfully!');
}

seedFeatureRegistry()
  .catch((e) => {
    console.error('Error seeding feature registry:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


