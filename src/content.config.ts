import { defineCollection, z } from 'astro:content';
// 1. Import the new glob loader
import { glob } from 'astro/loaders';

const devlogCollection = defineCollection({
  // 2. Tell Astro exactly where to load the markdown files from
  loader: glob({ pattern: '**/*.md', base: './src/content/devlog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    status: z.string().default('ONLINE'),
  }),
});

export const collections = {
  'devlog': devlogCollection,
};