import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

// ---------------------------------------------------------------------------
// Route data collection
// ---------------------------------------------------------------------------
// route-data.json is a single object (not an array), so we wrap it as one
// entry with id 'route' using a custom parser.

const routeData = defineCollection({
  loader: file('public/data/100mi/route-data.json', {
    parser: (text) => {
      const data = JSON.parse(text);
      return [{ id: 'route', ...data }];
    },
  }),
  schema: z.object({
    id: z.string(),
    points: z.array(
      z.object({
        lat: z.number(),
        lon: z.number(),
        ele: z.number(),
        miles: z.number(),
      })
    ),
    meta: z.object({
      totalMiles: z.number(),
      elevationGainMeters: z.number(),
      elevationGainFeet: z.number(),
      pointCount: z.number(),
      originalPointCount: z.number(),
      simplificationTolerance: z.number(),
      elevationThresholdMeters: z.number(),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Annotations collection
// ---------------------------------------------------------------------------
// annotations.json is already a flat array of objects with unique id fields,
// so the default file() loader works directly.

const annotations = defineCollection({
  loader: file('public/data/100mi/annotations.json'),
  schema: z.discriminatedUnion('type', [
    z.object({
      id: z.string(),
      type: z.literal('sector'),
      name: z.string(),
      startMile: z.number(),
      endMile: z.number(),
      lengthMiles: z.number(),
      startLat: z.number(),
      startLon: z.number(),
      endLat: z.number(),
      endLon: z.number(),
      startIdx: z.number(),
      endIdx: z.number(),
      difficulty: z.enum(['easy', 'moderate', 'hard']),
      stars: z.number().int().min(1).max(5),
    }),
    z.object({
      id: z.string(),
      type: z.literal('restock'),
      name: z.string(),
      mile: z.number(),
      lat: z.number(),
      lon: z.number(),
      ele: z.number(),
      snapIdx: z.number(),
    }),
  ]),
});

// ---------------------------------------------------------------------------
// Sector elevations collection
// ---------------------------------------------------------------------------
// sector-elevations.json is an array of per-sector elevation data objects
// produced by compute-sector-elevations.js in the pipeline.

const sectorElevations = defineCollection({
  loader: file('public/data/100mi/sector-elevations.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    difficulty: z.enum(['easy', 'moderate', 'hard']),
    startMile: z.number(),
    endMile: z.number(),
    elevationPoints: z.array(
      z.object({
        miles: z.number(),
        ele: z.number(),
      })
    ),
    eleMin: z.number(),
    eleMax: z.number(),
    eleGainMeters: z.number(),
    eleLossMeters: z.number(),
  }),
});

// ---------------------------------------------------------------------------
// Photos collection (stub for Phase 7)
// ---------------------------------------------------------------------------
// photos.json does not exist yet — the parser falls back to an empty array
// so the build does not fail until Phase 7 produces the file.

const photos = defineCollection({
  loader: file('public/data/photos.json', {
    parser: (text) => {
      try {
        return JSON.parse(text);
      } catch {
        return [];
      }
    },
  }),
  schema: z.object({
    id: z.string(),
    filename: z.string(),
    thumb: z.string(),
    mile: z.number(),
    lat: z.number().optional(),
    lon: z.number().optional(),
  }),
});

export const collections = { routeData, annotations, sectorElevations, photos };
