import type { Loader } from 'astro/loaders';

function extractFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: markdown };
  
  const frontmatterString = match[1];
  const body = match[2];
  
  const data: Record<string, any> = {};
  frontmatterString.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  });
  
  return { data, body };
}

import { createMarkdownProcessor } from '@astrojs/markdown-remark';

export function githubLoader(): Loader {
  return {
    name: 'github-loader',
    load: async ({ store, logger, parseData }) => {
      logger.info('Fetching DayLogs from GitHub...');
      const repoUrl = 'https://api.github.com/repos/deepeshx9/project-volterra/contents/DayLogs';
      
      const res = await fetch(repoUrl);
      if (!res.ok) {
        logger.error(`Failed to fetch directories: ${res.statusText}`);
        return;
      }
      
      const items = await res.json();
      const dirs = items.filter((item: any) => item.type === 'dir' && /^\d{2}-\d{2}-\d{4}$/.test(item.name));
      
      const processor = await createMarkdownProcessor();

      for (const dir of dirs) {
        const fileUrl = `https://raw.githubusercontent.com/deepeshx9/project-volterra/main/DayLogs/${dir.name}/log.md`;
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
          logger.warn(`Failed to fetch log.md for ${dir.name}`);
          continue;
        }
        
        const text = await fileRes.text();
        const { data: rawData, body } = extractFrontmatter(text);
        
        // Ensure date is a Date object if it's a string, or fallback to folder name
        if (rawData.date) {
            rawData.date = new Date(rawData.date);
        } else {
            // Parse date from folder name DD-MM-YYYY
            const [day, month, year] = dir.name.split('-');
            rawData.date = new Date(`${year}-${month}-${day}`);
        }
        
        if (!rawData.title) {
            rawData.title = `Log ${dir.name}`;
        }
        
        const data = await parseData({ id: dir.name, data: rawData });
        
        // Convert Markdown body to HTML using Astro's built-in processor
        const result = await processor.render(body);
        
        store.set({
          id: dir.name,
          data,
          body,
          rendered: {
            html: result.code,
          }
        });
      }
      // Fetch the pinned DEVLOG
      try {
        logger.info('Fetching pinned DEVLOG...');
        const devlogUrl = 'https://raw.githubusercontent.com/deepeshx9/lenovo-yoga-slim7x-audio-linux/main/.github/DEVLOG.md';
        const devlogRes = await fetch(devlogUrl);
        if (devlogRes.ok) {
          const body = await devlogRes.text();
          const rawData = {
            title: 'lenovo-yoga-slim7x-audio-linux DEVLOG',
            date: new Date('2026-04-06'), // Date of the findings
            status: 'PINNED',
            pinned: true
          };
          
          const data = await parseData({ id: 'lenovo-yoga-devlog', data: rawData });
          const result = await processor.render(body);
          
          store.set({
            id: 'lenovo-yoga-devlog',
            data,
            body,
            rendered: {
              html: result.code,
            }
          });
          logger.info('Successfully loaded pinned DEVLOG.');
        } else {
          logger.warn(`Failed to fetch pinned DEVLOG: ${devlogRes.statusText}`);
        }
      } catch (err) {
        logger.error(`Error fetching pinned DEVLOG: ${err}`);
      }

      logger.info(`Successfully loaded ${dirs.length} DayLogs from GitHub.`);
    }
  };
}
