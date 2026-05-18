export type ArenaId = 'park' | 'scrapyard' | 'rooftop';

export type ArenaDefinition = {
  id: ArenaId;
  title: string;
  subtitle: string;
  description: string;
};

export const arenaDefinitions: Record<ArenaId, ArenaDefinition> = {
  park: {
    id: 'park',
    title: 'Park Clash',
    subtitle: 'Bright open arena',
    description: 'Clean, readable park stage with lots of room to test spacing.',
  },
  scrapyard: {
    id: 'scrapyard',
    title: 'Scrapyard Scrap',
    subtitle: 'Rusty industrial pit',
    description: 'Warmer, rougher arena for a different vibe without changing combat rules.',
  },
  rooftop: {
    id: 'rooftop',
    title: 'Rooftop Rumble',
    subtitle: 'City skyline arena',
    description: 'Bright rooftop stage with a clean open floor and playful city backdrop.',
  },
};

export const arenaOrder: ArenaId[] = ['park', 'scrapyard', 'rooftop'];
