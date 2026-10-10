import { prisma } from '../src/db.js';
import { resolveVideoDuration } from '../src/services/duration.js';

async function backfillDurations() {
  console.log('--- Starting Video Durations Backfill Job (SPEC_ADDENDUM_C §C4) ---');

  // 1. Backfill Titles
  const titles = await prisma.title.findMany({
    where: {
      videoUrl: { not: null },
      durationSec: null,
    },
  });

  console.log(`Found ${titles.length} titles needing durationSec backfill.`);

  let titlesUpdated = 0;
  for (const t of titles) {
    if (!t.videoUrl) continue;
    try {
      const res = await resolveVideoDuration(t.videoUrl);
      const finalSec = res.durationSec || (t.durationMin ? t.durationMin * 60 : null);
      if (finalSec) {
        await prisma.title.update({
          where: { id: t.id },
          data: {
            durationSec: finalSec,
            durationMin: Math.round(finalSec / 60),
          },
        });
        titlesUpdated++;
        console.log(`✓ Updated title: "${t.title}" -> ${finalSec}s (${res.source})`);
      } else {
        console.warn(`! Could not resolve duration for: "${t.title}"`);
      }
    } catch (err) {
      console.error(`Error processing title ${t.id}:`, err);
    }
  }

  // 2. Backfill Episodes
  const episodes = await prisma.episode.findMany({
    where: {
      videoUrl: { not: '' },
      durationSec: null,
    },
  });

  console.log(`Found ${episodes.length} episodes needing durationSec backfill.`);

  let episodesUpdated = 0;
  for (const ep of episodes) {
    if (!ep.videoUrl) continue;
    try {
      const res = await resolveVideoDuration(ep.videoUrl);
      const finalSec = res.durationSec || (ep.durationMin ? ep.durationMin * 60 : null);
      if (finalSec) {
        await prisma.episode.update({
          where: { id: ep.id },
          data: {
            durationSec: finalSec,
            durationMin: Math.round(finalSec / 60),
          },
        });
        episodesUpdated++;
        console.log(`✓ Updated episode: "${ep.name}" -> ${finalSec}s (${res.source})`);
      }
    } catch (err) {
      console.error(`Error processing episode ${ep.id}:`, err);
    }
  }

  console.log(`--- Finished Backfill: ${titlesUpdated} titles, ${episodesUpdated} episodes updated ---`);
  await prisma.$disconnect();
}

backfillDurations().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
