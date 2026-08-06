import { defineCollection, z } from 'astro:content';
// 1. Import the new loader
import { githubLoader } from './loaders/github-loader';

const devlogCollection = defineCollection({
  // 2. Tell Astro to load the markdown files from github
  loader: githubLoader(),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    status: z.string().default('ONLINE'),
  }),
});

export const collections = {
  'devlog': devlogCollection,
};