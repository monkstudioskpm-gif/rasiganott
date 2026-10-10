import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

const router = Router();

export function toNameKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// GET /api/admin/people/suggest?q=&limit=8
router.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '8', 10)));

    if (!q) {
      res.json({ people: [] });
      return;
    }

    const searchKey = toNameKey(q);

    const people = await prisma.person.findMany({
      where: {
        OR: [
          { nameKey: { contains: searchKey } },
          { name: { contains: q } },
        ],
      },
      take: limit,
      include: {
        _count: {
          select: { cast: true, crew: true },
        },
      },
    });

    const formatted = people.map((p) => ({
      id: p.id,
      name: p.name,
      nameKey: p.nameKey,
      photoUrl: p.photoUrl,
      bio: p.bio,
      titlesCount: p._count.cast + p._count.crew,
    }));

    res.json({ people: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/people?q=&filter=&sort=&page=&limit=24
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const filter = (req.query.filter as string) || 'all'; // all | missing-photo | missing-bio | unused
    const sort = (req.query.sort as string) || 'name'; // name | recent | titles
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '24', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      const searchKey = toNameKey(q);
      where.OR = [
        { nameKey: { contains: searchKey } },
        { name: { contains: q } },
      ];
    }

    if (filter === 'missing-photo') {
      where.photoUrl = null;
    } else if (filter === 'missing-bio') {
      where.bio = null;
    } else if (filter === 'unused') {
      where.cast = { none: {} };
      where.crew = { none: {} };
    }

    let orderBy: any = { name: 'asc' };
    if (sort === 'recent') orderBy = { createdAt: 'desc' };

    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cast: { include: { title: { select: { id: true, title: true } } } },
          crew: { include: { title: { select: { id: true, title: true } } } },
        },
      }),
      prisma.person.count({ where }),
    ]);

    const formatted = people.map((p) => {
      const rolesSet = new Set<string>();
      if (p.cast.length > 0) rolesSet.add('Actor');
      p.crew.forEach((c) => rolesSet.add(c.role === 'OTHER' ? (c.customRole || 'Crew') : c.role));

      return {
        id: p.id,
        name: p.name,
        nameKey: p.nameKey,
        photoUrl: p.photoUrl,
        bio: p.bio,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        titlesCount: p.cast.length + p.crew.length,
        rolesUsed: Array.from(rolesSet),
      };
    });

    if (sort === 'titles') {
      formatted.sort((a, b) => b.titlesCount - a.titlesCount);
    }

    res.json({
      people: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/people/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personId = (req.params as any).id as string;
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        cast: {
          include: {
            title: { select: { id: true, title: true, slug: true, posterUrl: true, kind: true } },
          },
        },
        crew: {
          include: {
            title: { select: { id: true, title: true, slug: true, posterUrl: true, kind: true } },
          },
        },
      },
    });

    if (!person) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Person not found' } });
      return;
    }

    const appearsInMap = new Map<string, { titleId: string; title: string; slug: string; posterUrl: string; kind: string; roles: string[] }>();

    person.cast.forEach((c) => {
      const existing = appearsInMap.get(c.titleId) || {
        titleId: c.title.id,
        title: c.title.title,
        slug: c.title.slug,
        posterUrl: c.title.posterUrl,
        kind: c.title.kind,
        roles: [],
      };
      existing.roles.push(c.characterName ? `Plays ${c.characterName}` : 'Actor');
      appearsInMap.set(c.titleId, existing);
    });

    person.crew.forEach((c) => {
      const existing = appearsInMap.get(c.titleId) || {
        titleId: c.title.id,
        title: c.title.title,
        slug: c.title.slug,
        posterUrl: c.title.posterUrl,
        kind: c.title.kind,
        roles: [],
      };
      existing.roles.push(c.role === 'OTHER' ? (c.customRole || 'Crew') : c.role);
      appearsInMap.set(c.titleId, existing);
    });

    res.json({
      person: {
        id: person.id,
        name: person.name,
        nameKey: person.nameKey,
        photoUrl: person.photoUrl,
        bio: person.bio,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
        titlesCount: appearsInMap.size,
        appearsIn: Array.from(appearsInMap.values()),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/people
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, photoUrl, bio, allowDuplicate } = req.body;
    if (!name || name.trim().length < 2 || name.trim().length > 80) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Name is required (2-80 chars)' } });
      return;
    }

    const nameKey = toNameKey(name);

    if (!allowDuplicate) {
      const existing = await prisma.person.findFirst({ where: { nameKey } });
      if (existing) {
        res.status(200).json({ person: existing, isDuplicateMatch: true });
        return;
      }
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        nameKey,
        photoUrl: photoUrl || null,
        bio: bio ? bio.slice(0, 300) : null,
      },
    });

    res.status(201).json({ person });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/people/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const personId = decodeURIComponent(rawId);
    const { name, photoUrl, bio } = req.body;

    const existing = await prisma.person.findFirst({
      where: {
        OR: [
          { id: personId },
          { nameKey: toNameKey(personId) },
          { name: { equals: personId } },
        ],
      },
    });
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Person not found' } });
      return;
    }

    const updateData: any = {};
    if (name) {
      updateData.name = name.trim();
      updateData.nameKey = toNameKey(name);
    }
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
    if (bio !== undefined) updateData.bio = bio ? bio.slice(0, 300) : null;

    const updated = await prisma.person.update({
      where: { id: existing.id },
      data: updateData,
    });

    res.json({ person: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/people/:id?force=true
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const personId = decodeURIComponent(rawId);
    const force = req.query.force === 'true';

    const person = await prisma.person.findFirst({
      where: {
        OR: [
          { id: personId },
          { nameKey: toNameKey(personId) },
          { name: { equals: personId } },
        ],
      },
      include: {
        _count: { select: { cast: true, crew: true } },
      },
    });

    if (!person) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Person not found' } });
      return;
    }

    const targetId = person.id;
    const totalTitles = person._count.cast + person._count.crew;

    if (totalTitles > 0 && !force) {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `Used in ${totalTitles} titles — remove from all titles and delete?`,
        },
        count: totalTitles,
      });
      return;
    }

    await prisma.$transaction([
      prisma.titleCast.deleteMany({ where: { personId: targetId } }),
      prisma.titleCrew.deleteMany({ where: { personId: targetId } }),
      prisma.person.delete({ where: { id: targetId } }),
    ]);

    res.json({ success: true, deletedId: targetId });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/people/:id/merge
router.post('/:id/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personId = (req.params as any).id as string;
    const { intoId } = req.body;

    if (!intoId || intoId === personId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Valid target person intoId required' } });
      return;
    }

    const [source, target] = await Promise.all([
      prisma.person.findUnique({ where: { id: personId } }),
      prisma.person.findUnique({ where: { id: intoId } }),
    ]);

    if (!source || !target) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Source or target person not found' } });
      return;
    }

    const sourceCast = await prisma.titleCast.findMany({ where: { personId: personId } });
    const sourceCrew = await prisma.titleCrew.findMany({ where: { personId: personId } });

    await prisma.$transaction(async (tx) => {
      // Reassign Cast
      for (const castRecord of sourceCast) {
        const existingTargetCast = await tx.titleCast.findUnique({
          where: { titleId_personId: { titleId: castRecord.titleId, personId: intoId } },
        });
        if (!existingTargetCast) {
          await tx.titleCast.create({
            data: {
              titleId: castRecord.titleId,
              personId: intoId,
              order: castRecord.order,
              characterName: castRecord.characterName,
            },
          });
        }
      }

      // Reassign Crew
      for (const crewRecord of sourceCrew) {
        const existingTargetCrew = await tx.titleCrew.findUnique({
          where: { titleId_personId_role: { titleId: crewRecord.titleId, personId: intoId, role: crewRecord.role } },
        });
        if (!existingTargetCrew) {
          await tx.titleCrew.create({
            data: {
              titleId: crewRecord.titleId,
              personId: intoId,
              role: crewRecord.role,
              customRole: crewRecord.customRole,
            },
          });
        }
      }

      // Delete source person & old relations
      await tx.titleCast.deleteMany({ where: { personId: personId } });
      await tx.titleCrew.deleteMany({ where: { personId: personId } });
      await tx.person.delete({ where: { id: personId } });
    });

    res.json({ success: true, mergedId: personId, intoId });
  } catch (err) {
    next(err);
  }
});

export default router;
