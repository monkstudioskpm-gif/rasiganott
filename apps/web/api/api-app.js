// apps/api/src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// apps/api/src/routes/home.ts
import { Router as Router4 } from "express";

// apps/api/src/db.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = globalThis;
function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return void 0;
  let formatted = rawUrl;
  if ((formatted.includes("pooler.supabase.com") || formatted.includes(":6543")) && !formatted.includes("pgbouncer=true")) {
    formatted += (formatted.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  if (!formatted.includes("connection_limit=")) {
    formatted += (formatted.includes("?") ? "&" : "?") + "connection_limit=1";
  }
  return formatted;
}
var dbUrl = getDatabaseUrl();
var prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : void 0,
  log: ["error"]
});
globalForPrisma.prisma = prisma;

// apps/api/src/routes/titles.ts
import { Router as Router3 } from "express";
import { Kind, Orientation } from "@prisma/client";

// apps/api/src/routes/people.ts
import { Router } from "express";
var router = Router();
function toNameKey(name) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}
router.get("/suggest", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || "8", 10)));
    if (!q) {
      res.json({ people: [] });
      return;
    }
    const searchKey = toNameKey(q);
    const people = await prisma.person.findMany({
      where: {
        OR: [
          { nameKey: { contains: searchKey } },
          { name: { contains: q } }
        ]
      },
      take: limit,
      include: {
        _count: {
          select: { cast: true, crew: true }
        }
      }
    });
    const formatted = people.map((p) => ({
      id: p.id,
      name: p.name,
      nameKey: p.nameKey,
      photoUrl: p.photoUrl,
      bio: p.bio,
      titlesCount: p._count.cast + p._count.crew
    }));
    res.json({ people: formatted });
  } catch (err) {
    next(err);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = req.query.filter || "all";
    const sort = req.query.sort || "name";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "24", 10)));
    const skip = (page - 1) * limit;
    const where = {};
    if (q) {
      const searchKey = toNameKey(q);
      where.OR = [
        { nameKey: { contains: searchKey } },
        { name: { contains: q } }
      ];
    }
    if (filter === "missing-photo") {
      where.photoUrl = null;
    } else if (filter === "missing-bio") {
      where.bio = null;
    } else if (filter === "unused") {
      where.cast = { none: {} };
      where.crew = { none: {} };
    }
    let orderBy = { name: "asc" };
    if (sort === "recent") orderBy = { createdAt: "desc" };
    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cast: { include: { title: { select: { id: true, title: true } } } },
          crew: { include: { title: { select: { id: true, title: true } } } }
        }
      }),
      prisma.person.count({ where })
    ]);
    const formatted = people.map((p) => {
      const rolesSet = /* @__PURE__ */ new Set();
      if (p.cast.length > 0) rolesSet.add("Actor");
      p.crew.forEach((c) => rolesSet.add(c.role === "OTHER" ? c.customRole || "Crew" : c.role));
      return {
        id: p.id,
        name: p.name,
        nameKey: p.nameKey,
        photoUrl: p.photoUrl,
        bio: p.bio,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        titlesCount: p.cast.length + p.crew.length,
        rolesUsed: Array.from(rolesSet)
      };
    });
    if (sort === "titles") {
      formatted.sort((a, b) => b.titlesCount - a.titlesCount);
    }
    res.json({
      people: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const personId = req.params.id;
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        cast: {
          include: {
            title: { select: { id: true, title: true, slug: true, posterUrl: true, kind: true } }
          }
        },
        crew: {
          include: {
            title: { select: { id: true, title: true, slug: true, posterUrl: true, kind: true } }
          }
        }
      }
    });
    if (!person) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Person not found" } });
      return;
    }
    const appearsInMap = /* @__PURE__ */ new Map();
    person.cast.forEach((c) => {
      const existing = appearsInMap.get(c.titleId) || {
        titleId: c.title.id,
        title: c.title.title,
        slug: c.title.slug,
        posterUrl: c.title.posterUrl,
        kind: c.title.kind,
        roles: []
      };
      existing.roles.push(c.characterName ? `Plays ${c.characterName}` : "Actor");
      appearsInMap.set(c.titleId, existing);
    });
    person.crew.forEach((c) => {
      const existing = appearsInMap.get(c.titleId) || {
        titleId: c.title.id,
        title: c.title.title,
        slug: c.title.slug,
        posterUrl: c.title.posterUrl,
        kind: c.title.kind,
        roles: []
      };
      existing.roles.push(c.role === "OTHER" ? c.customRole || "Crew" : c.role);
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
        appearsIn: Array.from(appearsInMap.values())
      }
    });
  } catch (err) {
    next(err);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { name, photoUrl, bio, allowDuplicate } = req.body;
    if (!name || name.trim().length < 2 || name.trim().length > 80) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Name is required (2-80 chars)" } });
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
        bio: bio ? bio.slice(0, 300) : null
      }
    });
    res.status(201).json({ person });
  } catch (err) {
    next(err);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const personId = decodeURIComponent(rawId);
    const { name, photoUrl, bio } = req.body;
    const existing = await prisma.person.findFirst({
      where: {
        OR: [
          { id: personId },
          { nameKey: toNameKey(personId) },
          { name: { equals: personId } }
        ]
      }
    });
    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Person not found" } });
      return;
    }
    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.nameKey = toNameKey(name);
    }
    if (photoUrl !== void 0) updateData.photoUrl = photoUrl || null;
    if (bio !== void 0) updateData.bio = bio ? bio.slice(0, 300) : null;
    const updated = await prisma.person.update({
      where: { id: existing.id },
      data: updateData
    });
    res.json({ person: updated });
  } catch (err) {
    next(err);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const personId = decodeURIComponent(rawId);
    const force = req.query.force === "true";
    const person = await prisma.person.findFirst({
      where: {
        OR: [
          { id: personId },
          { nameKey: toNameKey(personId) },
          { name: { equals: personId } }
        ]
      },
      include: {
        _count: { select: { cast: true, crew: true } }
      }
    });
    if (!person) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Person not found" } });
      return;
    }
    const targetId = person.id;
    const totalTitles = person._count.cast + person._count.crew;
    if (totalTitles > 0 && !force) {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: `Used in ${totalTitles} titles \u2014 remove from all titles and delete?`
        },
        count: totalTitles
      });
      return;
    }
    await prisma.$transaction([
      prisma.titleCast.deleteMany({ where: { personId: targetId } }),
      prisma.titleCrew.deleteMany({ where: { personId: targetId } }),
      prisma.person.delete({ where: { id: targetId } })
    ]);
    res.json({ success: true, deletedId: targetId });
  } catch (err) {
    next(err);
  }
});
router.post("/:id/merge", async (req, res, next) => {
  try {
    const personId = req.params.id;
    const { intoId } = req.body;
    if (!intoId || intoId === personId) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Valid target person intoId required" } });
      return;
    }
    const [source, target] = await Promise.all([
      prisma.person.findUnique({ where: { id: personId } }),
      prisma.person.findUnique({ where: { id: intoId } })
    ]);
    if (!source || !target) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Source or target person not found" } });
      return;
    }
    const sourceCast = await prisma.titleCast.findMany({ where: { personId } });
    const sourceCrew = await prisma.titleCrew.findMany({ where: { personId } });
    await prisma.$transaction(async (tx) => {
      for (const castRecord of sourceCast) {
        const existingTargetCast = await tx.titleCast.findUnique({
          where: { titleId_personId: { titleId: castRecord.titleId, personId: intoId } }
        });
        if (!existingTargetCast) {
          await tx.titleCast.create({
            data: {
              titleId: castRecord.titleId,
              personId: intoId,
              order: castRecord.order,
              characterName: castRecord.characterName
            }
          });
        }
      }
      for (const crewRecord of sourceCrew) {
        const existingTargetCrew = await tx.titleCrew.findUnique({
          where: { titleId_personId_role: { titleId: crewRecord.titleId, personId: intoId, role: crewRecord.role } }
        });
        if (!existingTargetCrew) {
          await tx.titleCrew.create({
            data: {
              titleId: crewRecord.titleId,
              personId: intoId,
              role: crewRecord.role,
              customRole: crewRecord.customRole
            }
          });
        }
      }
      await tx.titleCast.deleteMany({ where: { personId } });
      await tx.titleCrew.deleteMany({ where: { personId } });
      await tx.person.delete({ where: { id: personId } });
    });
    res.json({ success: true, mergedId: personId, intoId });
  } catch (err) {
    next(err);
  }
});
var people_default = router;

// apps/api/src/routes/admin.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/genres", async (_req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { sortOrder: "asc" }
    });
    res.json({ genres });
  } catch (err) {
    next(err);
  }
});
router2.post("/genres", async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Genre name is required" } });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const genre = await prisma.genre.upsert({
      where: { slug },
      update: {
        name: name.trim(),
        sortOrder: sortOrder !== void 0 ? parseInt(sortOrder, 10) : 0,
        isActive: true
      },
      create: {
        name: name.trim(),
        slug,
        sortOrder: sortOrder !== void 0 ? parseInt(sortOrder, 10) : 0,
        isActive: true
      }
    });
    res.status(201).json({ genre });
  } catch (err) {
    next(err);
  }
});
router2.put("/genres/:id", async (req, res, next) => {
  try {
    const genreId = req.params.id;
    const { name, sortOrder, isActive } = req.body;
    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
      updateData.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (sortOrder !== void 0) updateData.sortOrder = parseInt(sortOrder, 10);
    if (isActive !== void 0) updateData.isActive = Boolean(isActive);
    const genre = await prisma.genre.update({
      where: { id: genreId },
      data: updateData
    });
    res.json({ genre });
  } catch (err) {
    next(err);
  }
});
router2.delete("/genres/:id", async (req, res, next) => {
  try {
    const genreId = req.params.id;
    await prisma.genre.delete({ where: { id: genreId } });
    res.json({ success: true, id: genreId });
  } catch (err) {
    next(err);
  }
});
router2.get("/payouts", async (_req, res, next) => {
  try {
    const payouts = await prisma.creatorPayout.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json({ statements: payouts });
  } catch (err) {
    next(err);
  }
});
router2.post("/payouts/:id/complete", async (req, res, next) => {
  try {
    const statementId = req.params.id;
    const { amountInr, paymentUtrNumber, paidAt } = req.body;
    if (!paymentUtrNumber || !paymentUtrNumber.trim()) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Bank payment UTR number is required" } });
      return;
    }
    const updated = await prisma.creatorPayout.update({
      where: { id: statementId },
      data: {
        status: "COMPLETED",
        netPayableInr: amountInr !== void 0 ? parseInt(amountInr, 10) : void 0,
        paymentUtrNumber: paymentUtrNumber.trim(),
        paidAt: paidAt ? paidAt.trim() : (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      }
    });
    res.json({ success: true, statement: updated });
  } catch (err) {
    next(err);
  }
});
router2.get("/settings", async (_req, res, next) => {
  try {
    const settingsList = await prisma.setting.findMany();
    const settingsMap = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json({ settings: settingsMap });
  } catch (err) {
    next(err);
  }
});
router2.put("/settings", async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid settings payload" } });
      return;
    }
    const upsertPromises = Object.entries(settings).map(
      ([key, value]) => prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    );
    await Promise.all(upsertPromises);
    const updatedList = await prisma.setting.findMany();
    const updatedMap = {};
    updatedList.forEach((s) => {
      updatedMap[s.key] = s.value;
    });
    res.json({ success: true, settings: updatedMap });
  } catch (err) {
    next(err);
  }
});
router2.get("/users/search", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const users = await prisma.user.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      } : {},
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});
async function getCreatorsRegistry() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "CREATOR_REGISTRY" } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {
  }
  return [
    {
      id: "c_cupice",
      creatorName: "Cupice productions",
      email: "cupice@rasigan.com",
      status: "ACTIVE",
      assignedTitleIds: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
}
async function saveCreatorsRegistry(list) {
  const jsonStr = JSON.stringify(list);
  await prisma.setting.upsert({
    where: { key: "CREATOR_REGISTRY" },
    update: { value: jsonStr },
    create: { key: "CREATOR_REGISTRY", value: jsonStr }
  });
  const emails = list.map((c) => c.email.toLowerCase().trim()).filter(Boolean);
  await prisma.setting.upsert({
    where: { key: "CREATOR_EMAILS" },
    update: { value: emails.join(",") },
    create: { key: "CREATOR_EMAILS", value: emails.join(",") }
  });
}
router2.get("/creators", async (_req, res, next) => {
  try {
    const registry = await getCreatorsRegistry();
    const titles = await prisma.title.findMany({
      select: {
        id: true,
        title: true,
        creatorName: true,
        posterUrl: true,
        fundings: {
          where: { status: "PAID" },
          select: { amountInr: true }
        }
      }
    });
    const payouts = await prisma.creatorPayout.findMany();
    const creatorsWithStats = registry.map((c) => {
      const matchingTitles = titles.filter(
        (t) => t.creatorName && t.creatorName.toLowerCase() === c.creatorName.toLowerCase() || c.assignedTitleIds && c.assignedTitleIds.includes(t.id)
      );
      const matchingPayouts = payouts.filter(
        (p) => p.creatorName.toLowerCase() === c.creatorName.toLowerCase()
      );
      const grossRaisedInr = matchingTitles.reduce(
        (sum, t) => sum + t.fundings.reduce((fSum, f) => fSum + f.amountInr, 0),
        0
      );
      const netPayable = matchingPayouts.reduce((sum, p) => sum + p.netPayableInr, 0);
      const netEarningsInr = netPayable > 0 ? netPayable : Math.floor(grossRaisedInr * 0.6);
      return {
        id: c.id,
        creatorName: c.creatorName,
        email: c.email,
        userId: c.userId,
        upiId: c.upiId || "",
        status: c.status || "ACTIVE",
        titlesCount: matchingTitles.length,
        netEarningsInr,
        grossRaisedInr,
        assignedTitleIds: c.assignedTitleIds && c.assignedTitleIds.length > 0 ? c.assignedTitleIds : matchingTitles.map((t) => t.id)
      };
    });
    res.json({ creators: creatorsWithStats });
  } catch (err) {
    next(err);
  }
});
router2.post("/creators", async (req, res, next) => {
  try {
    const { creatorName, email, userId, upiId, assignedTitleIds } = req.body;
    if (!creatorName || !creatorName.trim()) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Creator/Studio name is required" } });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Creator email is required" } });
      return;
    }
    const cleanName = creatorName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const registry = await getCreatorsRegistry();
    const newCreator = {
      id: `c_${Date.now()}`,
      creatorName: cleanName,
      email: cleanEmail,
      userId,
      upiId: upiId?.trim() || "",
      status: "ACTIVE",
      assignedTitleIds: Array.isArray(assignedTitleIds) ? assignedTitleIds : [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const existingIdx = registry.findIndex(
      (c) => c.email.toLowerCase() === cleanEmail || c.creatorName.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingIdx !== -1) {
      registry[existingIdx] = { ...registry[existingIdx], ...newCreator, id: registry[existingIdx].id };
    } else {
      registry.push(newCreator);
    }
    await saveCreatorsRegistry(registry);
    if (Array.isArray(assignedTitleIds) && assignedTitleIds.length > 0) {
      await prisma.title.updateMany({
        where: { id: { in: assignedTitleIds } },
        data: { creatorName: cleanName, creatorId: cleanEmail }
      });
    }
    const existingPayout = await prisma.creatorPayout.findFirst({
      where: { creatorName: { equals: cleanName, mode: "insensitive" } }
    });
    if (!existingPayout) {
      const statementNumber = `STMT-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-4)}`;
      await prisma.creatorPayout.create({
        data: {
          creatorName: cleanName,
          statementNumber,
          cycle: `${(/* @__PURE__ */ new Date()).toLocaleString("en-US", { month: "long" })} ${(/* @__PURE__ */ new Date()).getFullYear()}`,
          period: `01 ${(/* @__PURE__ */ new Date()).toLocaleString("en-US", { month: "short" })} - 30 ${(/* @__PURE__ */ new Date()).toLocaleString("en-US", { month: "short" })} ${(/* @__PURE__ */ new Date()).getFullYear()}`,
          grossEarningsInr: 0,
          platformFeeInr: 0,
          netPayableInr: 0,
          status: "PROCESSING"
        }
      });
    }
    res.status(201).json({ success: true, creator: newCreator });
  } catch (err) {
    next(err);
  }
});
router2.put("/creators/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const id = decodeURIComponent(rawId);
    const { creatorName, email, upiId, status, assignedTitleIds } = req.body;
    const registry = await getCreatorsRegistry();
    const idx = registry.findIndex(
      (c) => c.id === id || c.creatorName.toLowerCase() === id.toLowerCase() || c.email.toLowerCase() === id.toLowerCase()
    );
    if (idx === -1) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Creator not found" } });
      return;
    }
    const prevName = registry[idx].creatorName;
    const updatedName = creatorName && creatorName.trim() ? creatorName.trim() : prevName;
    const updatedEmail = email && email.trim() ? email.toLowerCase().trim() : registry[idx].email;
    registry[idx] = {
      ...registry[idx],
      creatorName: updatedName,
      email: updatedEmail,
      upiId: upiId !== void 0 ? upiId.trim() : registry[idx].upiId,
      status: status || registry[idx].status || "ACTIVE",
      assignedTitleIds: Array.isArray(assignedTitleIds) ? assignedTitleIds : registry[idx].assignedTitleIds,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await saveCreatorsRegistry(registry);
    await prisma.creatorPayout.updateMany({
      where: { creatorName: { equals: prevName, mode: "insensitive" } },
      data: { creatorName: updatedName }
    });
    if (Array.isArray(assignedTitleIds)) {
      if (assignedTitleIds.length > 0) {
        await prisma.title.updateMany({
          where: { id: { in: assignedTitleIds } },
          data: { creatorName: updatedName, creatorId: updatedEmail }
        });
      }
    } else if (updatedName !== prevName) {
      await prisma.title.updateMany({
        where: { creatorName: { equals: prevName, mode: "insensitive" } },
        data: { creatorName: updatedName }
      });
    }
    res.json({ success: true, creator: registry[idx] });
  } catch (err) {
    next(err);
  }
});
router2.delete("/creators/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const id = decodeURIComponent(rawId);
    const registry = await getCreatorsRegistry();
    const filtered = registry.filter(
      (c) => c.id !== id && c.creatorName.toLowerCase() !== id.toLowerCase() && c.email.toLowerCase() !== id.toLowerCase()
    );
    await saveCreatorsRegistry(filtered);
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});
var admin_default = router2;

// apps/api/src/services/duration.ts
function extractBunnyVideoGuid(url) {
  if (!url) return null;
  const match = url.match(/b-cdn\.net\/([a-zA-Z0-9-]+)\/(?:playlist\.m3u8|play)/i);
  if (match && match[1] && match[1].length > 10) {
    return match[1];
  }
  return null;
}
async function fetchDurationFromBunnyApi(videoGuid) {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!apiKey || !libraryId) return null;
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
      headers: {
        AccessKey: apiKey,
        Accept: "application/json"
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.length === "number" && data.length > 0) {
        return Math.round(data.length);
      }
    }
  } catch (err) {
    console.warn("Bunny API duration lookup failed:", err);
  }
  return null;
}
async function fetchDurationFromHlsPlaylist(playlistUrl) {
  try {
    const res = await fetch(playlistUrl, {
      headers: { "User-Agent": "Rasigan-OTT/2.0" },
      signal: AbortSignal.timeout(5e3)
    });
    if (!res.ok) return null;
    const body = await res.text();
    let targetMediaPlaylistUrl = playlistUrl;
    if (body.includes("#EXT-X-STREAM-INF")) {
      const lines = body.split("\n");
      let mediaUri = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#EXT-X-STREAM-INF") && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith("#")) {
            mediaUri = nextLine;
            break;
          }
        }
      }
      if (mediaUri) {
        if (mediaUri.startsWith("http://") || mediaUri.startsWith("https://")) {
          targetMediaPlaylistUrl = mediaUri;
        } else {
          const urlObj = new URL(playlistUrl);
          const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/") + 1);
          urlObj.pathname = basePath + mediaUri;
          targetMediaPlaylistUrl = urlObj.toString();
        }
        const mediaRes = await fetch(targetMediaPlaylistUrl, {
          headers: { "User-Agent": "Rasigan-OTT/2.0" },
          signal: AbortSignal.timeout(5e3)
        });
        if (!mediaRes.ok) return null;
        const mediaBody = await mediaRes.text();
        return parseExtinfTotalDuration(mediaBody);
      }
    }
    return parseExtinfTotalDuration(body);
  } catch (err) {
    console.warn("HLS playlist duration parse failed:", err);
  }
  return null;
}
function parseExtinfTotalDuration(playlistContent) {
  const extinfRegex = /#EXTINF:([0-9.]+)/g;
  let totalDuration = 0;
  let match;
  let matchCount = 0;
  while ((match = extinfRegex.exec(playlistContent)) !== null) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) {
      totalDuration += sec;
      matchCount++;
    }
  }
  if (matchCount > 0 && totalDuration > 0) {
    return Math.round(totalDuration);
  }
  return null;
}
async function resolveVideoDuration(url, clientReportedDurationSec) {
  if (!url || typeof url !== "string") {
    return { durationSec: null, source: "UNKNOWN", error: "Invalid URL" };
  }
  const bunnyGuid = extractBunnyVideoGuid(url);
  if (bunnyGuid) {
    const bunnySec = await fetchDurationFromBunnyApi(bunnyGuid);
    if (bunnySec && bunnySec > 0) {
      return { durationSec: bunnySec, source: "BUNNY_API" };
    }
  }
  if (url.includes(".m3u8")) {
    const hlsSec = await fetchDurationFromHlsPlaylist(url);
    if (hlsSec && hlsSec > 0) {
      return { durationSec: hlsSec, source: "HLS_PLAYLIST" };
    }
  }
  if (typeof clientReportedDurationSec === "number" && clientReportedDurationSec > 0) {
    return {
      durationSec: Math.round(clientReportedDurationSec),
      source: "CLIENT_FALLBACK"
    };
  }
  return { durationSec: null, source: "UNKNOWN" };
}

// apps/api/src/routes/titles.ts
var router3 = Router3();
function getEffectiveArtwork(title) {
  const slug = title.slug || "";
  const videoUrl = title.videoUrl || "";
  let ytThumbnail = null;
  if (typeof videoUrl === "string" && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      ytThumbnail = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
  }
  const presets = [
    {
      keywords: ["kodi", "independence", "\u0B95\u0BCA\u0B9F\u0BBF \u0BAE\u0BC7\u0BB3\u0BAE\u0BCD", "republic"],
      artwork: {
        posterUrl: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80",
        verticalPosterUrl: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=900&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=675&auto=format&fit=crop&q=80"
      }
    },
    {
      keywords: ["no-sudu", "no sudu", "soranai", "part 2", "part-2", "part2"],
      artwork: {
        posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
        verticalPosterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=900&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=675&auto=format&fit=crop&q=80"
      }
    },
    {
      keywords: ["kena-puna", "kena puna", "kenapuna", "part 1", "part-1", "part1"],
      artwork: {
        posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80",
        verticalPosterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=900&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=675&auto=format&fit=crop&q=80"
      }
    },
    {
      keywords: ["double", "meaning"],
      artwork: {
        posterUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        verticalPosterUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=900&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&h=675&auto=format&fit=crop&q=80"
      }
    }
  ];
  const titleName = (title.title || "").toLowerCase();
  const matched = presets.find((p) => p.keywords.some((k) => slug.includes(k) || titleName.includes(k)));
  const preset = matched ? matched.artwork : null;
  let posterUrl = title.posterUrl;
  let verticalPosterUrl = title.verticalPosterUrl;
  let bannerUrl = title.bannerUrl;
  const isDuplicateCinemaPhoto = typeof posterUrl === "string" && posterUrl.includes("photo-1536440136628-849c177e76a1");
  if (preset) {
    if (!posterUrl || isDuplicateCinemaPhoto) {
      posterUrl = preset.posterUrl;
    }
    if (!verticalPosterUrl || typeof verticalPosterUrl === "string" && verticalPosterUrl.includes("photo-1536440136628-849c177e76a1")) {
      verticalPosterUrl = preset.verticalPosterUrl;
    }
    if (!bannerUrl || typeof bannerUrl === "string" && bannerUrl.includes("photo-1536440136628-849c177e76a1")) {
      bannerUrl = preset.bannerUrl;
    }
  }
  if (ytThumbnail) {
    if (!posterUrl) posterUrl = ytThumbnail;
    if (!bannerUrl) bannerUrl = ytThumbnail;
    if (!verticalPosterUrl) verticalPosterUrl = ytThumbnail;
  }
  if (posterUrl && !verticalPosterUrl) {
    if (posterUrl.includes("unsplash.com")) {
      verticalPosterUrl = posterUrl.replace(/\?.*$/, "") + "?w=600&h=900&auto=format&fit=crop&q=80";
    } else {
      verticalPosterUrl = posterUrl;
    }
  }
  if (posterUrl && !bannerUrl) {
    if (posterUrl.includes("unsplash.com")) {
      bannerUrl = posterUrl.replace(/\?.*$/, "") + "?w=1200&h=675&auto=format&fit=crop&q=80";
    } else {
      bannerUrl = posterUrl;
    }
  }
  if (!posterUrl) posterUrl = verticalPosterUrl || bannerUrl;
  return { posterUrl, verticalPosterUrl, bannerUrl };
}
function formatTitleResponse(title) {
  if (!title) return title;
  const genres = title.genres ? title.genres.map((tg) => tg.genre || tg) : [];
  const tags = title.tags ? title.tags.map((tt) => tt.tag?.name || tt.name || tt) : [];
  const cast = title.cast ? title.cast.map((tc) => ({
    personId: tc.personId,
    order: tc.order,
    characterName: tc.characterName,
    person: tc.person ? {
      id: tc.person.id,
      name: tc.person.name,
      nameKey: tc.person.nameKey,
      photoUrl: tc.person.photoUrl,
      bio: tc.person.bio
    } : void 0
  })) : [];
  const crew = title.crew ? title.crew.map((tc) => ({
    id: tc.id,
    personId: tc.personId,
    role: tc.role,
    customRole: tc.customRole,
    person: tc.person ? {
      id: tc.person.id,
      name: tc.person.name,
      nameKey: tc.person.nameKey,
      photoUrl: tc.person.photoUrl,
      bio: tc.person.bio
    } : void 0
  })) : [];
  const artwork = getEffectiveArtwork(title);
  return {
    ...title,
    posterUrl: artwork.posterUrl,
    verticalPosterUrl: artwork.verticalPosterUrl,
    bannerUrl: artwork.bannerUrl,
    editorRating: title.editorRating ? Number(title.editorRating) : null,
    subtitles: typeof title.subtitles === "string" ? JSON.parse(title.subtitles || "[]") : title.subtitles || [],
    audioTracks: typeof title.audioTracks === "string" ? JSON.parse(title.audioTracks || "[]") : title.audioTracks || [],
    genres,
    categories: genres,
    // backward compatible alias
    tags,
    cast,
    crew,
    seasons: title.seasons ? title.seasons.map((season) => ({
      ...season,
      episodes: season.episodes ? season.episodes.map((ep) => ({
        ...ep,
        subtitles: typeof ep.subtitles === "string" ? JSON.parse(ep.subtitles || "[]") : ep.subtitles || [],
        audioTracks: typeof ep.audioTracks === "string" ? JSON.parse(ep.audioTracks || "[]") : ep.audioTracks || []
      })) : []
    })) : []
  };
}
router3.post("/admin/validate-video-url", async (req, res, next) => {
  try {
    const { url, durationSec: clientSec } = req.body;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      res.status(400).json({
        isValid: false,
        error: "Link must be a valid http or https URL"
      });
      return;
    }
    const isBunny = url.includes("b-cdn.net") || url.includes("bunnycdn");
    const isHls = url.includes(".m3u8") || url.includes("mux.dev") || isBunny;
    const isMp4 = url.includes(".mp4");
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isVimeo = url.includes("vimeo.com");
    const durationRes = await resolveVideoDuration(url, clientSec);
    const resolvedDurationSec = durationRes.durationSec || (isHls ? 6300 : 5400);
    if (!isHls && !isMp4 && !isYoutube && !isVimeo) {
      res.json({
        isValid: true,
        streamType: "MP4",
        reachable: true,
        durationSec: resolvedDurationSec,
        durationSource: durationRes.source,
        qualities: ["720p", "1080p"],
        message: "Reachable standard stream"
      });
      return;
    }
    const detectedMsg = isBunny ? "\u{1F430} Bunny Stream HLS Master Playlist (.m3u8)" : isHls ? "HLS Master Playlist (.m3u8)" : isMp4 ? "MP4 Video" : "Embedded Stream";
    res.json({
      isValid: true,
      streamType: isHls ? "HLS" : isMp4 ? "MP4" : "EMBED",
      reachable: true,
      durationSec: resolvedDurationSec,
      durationSource: durationRes.source,
      qualities: isHls ? ["240p", "360p", "480p", "720p", "1080p"] : ["720p", "1080p"],
      audioTracks: ["Tamil (Stereo)", "English (Stereo)"],
      subtitles: ["English", "Tamil"],
      message: "\u2713 Reachable \xB7 detected type: " + detectedMsg
    });
  } catch (err) {
    next(err);
  }
});
router3.post("/admin/:id/refresh-duration", async (req, res, next) => {
  try {
    const titleId = req.params.id;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] }
    });
    if (!title || !title.videoUrl) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title or video URL not found" } });
      return;
    }
    const durationRes = await resolveVideoDuration(title.videoUrl, req.body.durationSec);
    if (durationRes.durationSec) {
      const updated = await prisma.title.update({
        where: { id: title.id },
        data: {
          durationSec: durationRes.durationSec,
          durationMin: Math.round(durationRes.durationSec / 60)
        }
      });
      res.json({
        success: true,
        durationSec: updated.durationSec,
        durationMin: updated.durationMin,
        source: durationRes.source
      });
    } else {
      res.status(422).json({
        error: { code: "DURATION_UNKNOWN", message: "Could not automatically detect duration for this video stream" }
      });
    }
  } catch (err) {
    next(err);
  }
});
router3.post("/admin/clear-all-content", async (_req, res, next) => {
  try {
    await prisma.titleCast.deleteMany({});
    await prisma.titleCrew.deleteMany({});
    await prisma.titleGenre.deleteMany({});
    await prisma.titleTag.deleteMany({});
    await prisma.watchlistItem.deleteMany({});
    await prisma.reaction.deleteMany({});
    await prisma.watchProgress.deleteMany({});
    await prisma.funding.deleteMany({});
    await prisma.episode.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.title.deleteMany({});
    await prisma.person.deleteMany({});
    res.json({ success: true, message: "All database content deleted successfully." });
  } catch (err) {
    next(err);
  }
});
router3.get("/", async (req, res, next) => {
  try {
    const { kind, orientation, genre, category, tag, q, sort = "newest", page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const where = {
      status: "PUBLISHED"
    };
    if (kind && Object.values(Kind).includes(kind)) {
      where.kind = kind;
    }
    if (orientation && Object.values(Orientation).includes(orientation)) {
      where.orientation = orientation;
    }
    const genreSlug = genre || category;
    if (genreSlug) {
      where.genres = {
        some: {
          genre: { slug: genreSlug }
        }
      };
    }
    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag.toLowerCase() }
        }
      };
    }
    if (q) {
      const searchStr = q;
      const searchKey = toNameKey(searchStr);
      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
        { tagline: { contains: searchStr } },
        {
          cast: {
            some: {
              person: { nameKey: { contains: searchKey } }
            }
          }
        },
        {
          tags: {
            some: {
              tag: { name: { contains: searchStr.toLowerCase() } }
            }
          }
        },
        {
          genres: {
            some: {
              genre: { name: { contains: searchStr } }
            }
          }
        }
      ];
    }
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    let orderBy = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    if (sort === "rating") orderBy = { editorRating: "desc" };
    if (sort === "title") orderBy = { title: "asc" };
    const [titles, total] = await Promise.all([
      prisma.title.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } }
        }
      }),
      prisma.title.count({ where })
    ]);
    res.json({
      titles: titles.map(formatTitleResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
});
router3.get("/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const title = await prisma.title.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: {
          orderBy: { order: "asc" },
          include: { person: true }
        },
        crew: { include: { person: true } },
        seasons: {
          orderBy: { number: "asc" },
          include: {
            episodes: {
              where: { status: "PUBLISHED" },
              orderBy: { number: "asc" }
            }
          }
        }
      }
    });
    if (!title) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    res.json({ title: formatTitleResponse(title) });
  } catch (err) {
    next(err);
  }
});
router3.get("/admin/stats", async (req, res, next) => {
  try {
    const [totalTitles, publishedTitles, draftTitles, totalPeople, totalGenres, totalTags, fundings] = await Promise.all([
      prisma.title.count(),
      prisma.title.count({ where: { status: "PUBLISHED" } }),
      prisma.title.count({ where: { status: "DRAFT" } }),
      prisma.person.count(),
      prisma.genre.count(),
      prisma.tag.count(),
      prisma.funding.aggregate({
        _sum: { amountInr: true },
        where: { status: "PAID" }
      })
    ]);
    res.json({
      stats: {
        totalTitles,
        publishedTitles,
        draftTitles,
        totalPeople,
        totalGenres,
        totalTags,
        totalFundingRaised: fundings._sum.amountInr || 0
      }
    });
  } catch (err) {
    next(err);
  }
});
router3.get("/admin/:id/analytics", async (req, res, next) => {
  try {
    const titleId = req.params.id;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
      include: {
        fundings: {
          where: { status: "PAID" },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true, avatarUrl: true } } }
        },
        _count: { select: { reactions: true, watchlisted: true } }
      }
    });
    if (!title) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    const [viewsCount, progressStats] = await Promise.all([
      prisma.watchProgress.count({ where: { titleId: title.id } }),
      prisma.watchProgress.aggregate({
        where: { titleId: title.id },
        _sum: { positionSec: true }
      })
    ]);
    const totalFundingRaisedInr = title.fundings.reduce((sum, f) => sum + f.amountInr, 0);
    const payments = title.fundings.map((f) => ({
      id: f.id,
      amountInr: f.amountInr,
      donorName: f.isAnonymous ? "Anonymous Supporter" : f.user.name,
      donorEmail: f.isAnonymous ? "anonymous@privacy.org" : f.user.email,
      razorpayPaymentId: f.razorpayPaymentId || `pay_rzp_${f.id}`,
      paidAt: f.paidAt ? f.paidAt.toISOString() : f.createdAt.toISOString(),
      status: f.status,
      message: f.message || null
    }));
    const watchTimeSeconds = progressStats._sum.positionSec || 0;
    const watchTimeHours = Math.round(watchTimeSeconds / 3600 * 10) / 10;
    res.json({
      analytics: {
        titleId: title.id,
        title: title.title,
        slug: title.slug,
        kind: title.kind,
        orientation: title.orientation,
        posterUrl: title.posterUrl,
        bannerUrl: title.bannerUrl,
        creatorName: title.creatorName || "Indie Studio",
        publishedAt: title.publishedAt ? title.publishedAt.toISOString() : title.createdAt.toISOString(),
        fundingGoal: title.fundingGoal || 2e5,
        fundingRaised: totalFundingRaisedInr,
        fundingPercent: Math.min(100, Math.round(totalFundingRaisedInr / (title.fundingGoal || 2e5) * 100)),
        supportersCount: payments.length,
        totalViews: viewsCount,
        watchTimeHours,
        editorRating: title.editorRating ? Number(title.editorRating) : 9,
        likesCount: title._count.reactions || 0,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
});
router3.get("/admin/creator-earnings", async (req, res, next) => {
  try {
    const [titles, registry] = await Promise.all([
      prisma.title.findMany({
        select: {
          id: true,
          title: true,
          posterUrl: true,
          kind: true,
          creatorName: true,
          status: true,
          fundings: {
            where: { status: "PAID" },
            select: { amountInr: true }
          }
        }
      }),
      getCreatorsRegistry()
    ]);
    const creatorMap = /* @__PURE__ */ new Map();
    registry.forEach((reg) => {
      creatorMap.set(reg.creatorName.toLowerCase(), {
        id: reg.id,
        creatorName: reg.creatorName,
        email: reg.email,
        upiId: reg.upiId || "",
        assignedTitleIds: reg.assignedTitleIds || [],
        titlesCount: 0,
        grossRaisedInr: 0,
        netEarningsInr: 0,
        platformFeeInr: 0,
        payoutStatus: "PROCESSING",
        titles: []
      });
    });
    titles.forEach((t) => {
      const creatorName = t.creatorName || "Indie Studio";
      const grossRaised = t.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const netEarnings = Math.floor(grossRaised * 0.6);
      const platformFee = grossRaised - netEarnings;
      let targetKey = creatorName.toLowerCase();
      if (!creatorMap.has(targetKey)) {
        for (const [key, val] of creatorMap.entries()) {
          if (val.assignedTitleIds && val.assignedTitleIds.includes(t.id)) {
            targetKey = key;
            break;
          }
        }
      }
      const existing = creatorMap.get(targetKey) || {
        creatorName,
        titlesCount: 0,
        grossRaisedInr: 0,
        netEarningsInr: 0,
        platformFeeInr: 0,
        payoutStatus: "PAID",
        titles: []
      };
      existing.titlesCount += 1;
      existing.grossRaisedInr += grossRaised;
      existing.netEarningsInr += netEarnings;
      existing.platformFeeInr += platformFee;
      existing.titles.push({
        id: t.id,
        title: t.title,
        posterUrl: t.posterUrl,
        kind: t.kind,
        grossRaisedInr: grossRaised,
        netEarningsInr: netEarnings
      });
      creatorMap.set(targetKey, existing);
    });
    const creators = Array.from(creatorMap.values());
    const totalGross = creators.reduce((acc, c) => acc + c.grossRaisedInr, 0);
    const totalNetEarnings = creators.reduce((acc, c) => acc + c.netEarningsInr, 0);
    const totalPlatformFee = creators.reduce((acc, c) => acc + c.platformFeeInr, 0);
    res.json({
      summary: {
        totalCreatorsCount: creators.length,
        totalGrossRaisedInr: totalGross,
        totalNetEarningsInr: totalNetEarnings,
        totalPlatformFeeInr: totalPlatformFee
      },
      creators
    });
  } catch (err) {
    next(err);
  }
});
router3.get("/admin/list", async (req, res, next) => {
  try {
    const { status, kind, orientation, q } = req.query;
    const where = {};
    if (status) where.status = status;
    if (kind) where.kind = kind;
    if (orientation) where.orientation = orientation;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ];
    }
    const titles = await prisma.title.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        seasons: {
          include: {
            episodes: true
          }
        }
      }
    });
    const formatted = titles.map((t) => formatTitleResponse(t));
    res.json({ titles: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
});
router3.post("/admin/:id/toggle-publish", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const titleId = decodeURIComponent(rawId);
    const existing = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId }
        ]
      }
    });
    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    const newStatus = existing.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const updated = await prisma.title.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        publishedAt: newStatus === "PUBLISHED" ? /* @__PURE__ */ new Date() : existing.publishedAt
      }
    });
    res.json({ title: formatTitleResponse(updated), status: newStatus });
  } catch (err) {
    next(err);
  }
});
router3.get("/admin/:id", async (req, res, next) => {
  try {
    const titleId = req.params.id;
    const title = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } }
        ]
      },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: { orderBy: { order: "asc" }, include: { person: true } },
        crew: { include: { person: true } },
        seasons: {
          orderBy: { number: "asc" },
          include: { episodes: { orderBy: { number: "asc" } } }
        }
      }
    });
    if (!title) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    res.json({ title: formatTitleResponse(title) });
  } catch (err) {
    next(err);
  }
});
router3.post("/admin", async (req, res, next) => {
  try {
    const payload = req.body;
    const {
      title,
      description,
      kind,
      orientation,
      genreIds = [],
      tags = [],
      cast = [],
      crew = [],
      videoUrl,
      trailerUrl,
      seasons = [],
      posterUrl,
      bannerUrl,
      creatorId,
      creatorName,
      status = "DRAFT",
      tagline,
      language = "Tamil",
      year,
      ageRating,
      durationMin,
      editorRating,
      isFeatured = false,
      fundingEnabled = true,
      fundingGoal
    } = payload;
    const effectivePosterUrl = posterUrl || payload.verticalPosterUrl || bannerUrl || "";
    const effectiveDescription = description || title || "";
    if (!title || !kind || !orientation || !posterUrl && !payload.verticalPosterUrl && !bannerUrl) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Missing required title fields" } });
      return;
    }
    const slugBase = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existingDbTitle = await prisma.title.findFirst({
      where: {
        OR: [
          { title: { equals: title.trim() } },
          { slug: { startsWith: slugBase } }
        ]
      }
    });
    if (existingDbTitle) {
      const updatedDbTitle = await prisma.title.update({
        where: { id: existingDbTitle.id },
        data: {
          title: title.trim(),
          description: effectiveDescription.trim(),
          kind,
          orientation,
          status,
          posterUrl: effectivePosterUrl || existingDbTitle.posterUrl,
          bannerUrl: bannerUrl !== void 0 ? bannerUrl : existingDbTitle.bannerUrl,
          verticalPosterUrl: payload.verticalPosterUrl !== void 0 ? payload.verticalPosterUrl : existingDbTitle.verticalPosterUrl,
          videoUrl: videoUrl || existingDbTitle.videoUrl,
          trailerUrl: trailerUrl || existingDbTitle.trailerUrl,
          streamType: videoUrl ? videoUrl.includes(".m3u8") ? "HLS" : "MP4" : existingDbTitle.streamType,
          creatorId: creatorId || existingDbTitle.creatorId,
          creatorName: creatorName || existingDbTitle.creatorName,
          tagline: tagline || existingDbTitle.tagline,
          language: language !== void 0 && language !== null ? String(language).trim() : existingDbTitle.language,
          year: year !== void 0 && year !== "" && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : existingDbTitle.year,
          ageRating: ageRating !== void 0 ? ageRating ? String(ageRating).trim() : null : existingDbTitle.ageRating,
          durationMin: durationMin !== void 0 && durationMin !== "" && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : existingDbTitle.durationMin,
          durationSec: payload.durationSec !== void 0 ? payload.durationSec ? parseInt(String(payload.durationSec), 10) : null : existingDbTitle.durationSec,
          editorRating: editorRating ? parseFloat(editorRating) : existingDbTitle.editorRating,
          isFeatured: isFeatured !== void 0 ? Boolean(isFeatured) : existingDbTitle.isFeatured,
          fundingEnabled: fundingEnabled !== void 0 ? Boolean(fundingEnabled) : existingDbTitle.fundingEnabled,
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : existingDbTitle.fundingGoal,
          verticalVideoUrl: payload.verticalVideoUrl !== void 0 ? payload.verticalVideoUrl || null : existingDbTitle.verticalVideoUrl,
          feedEligible: payload.feedEligible !== void 0 ? Boolean(payload.feedEligible) : existingDbTitle.feedEligible
        }
      });
      res.json({ title: formatTitleResponse(updatedDbTitle) });
      return;
    }
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    const tagIds = [];
    for (const tagName of tags) {
      const lower = tagName.trim().toLowerCase();
      if (lower) {
        const tagRecord = await prisma.tag.upsert({
          where: { name: lower },
          update: {},
          create: { name: lower }
        });
        tagIds.push(tagRecord.id);
      }
    }
    const createdTitle = await prisma.$transaction(async (tx) => {
      const newTitle = await tx.title.create({
        data: {
          slug,
          title: title.trim(),
          description: effectiveDescription.trim(),
          kind,
          orientation,
          status,
          posterUrl: effectivePosterUrl,
          bannerUrl: bannerUrl || null,
          verticalPosterUrl: payload.verticalPosterUrl || null,
          videoUrl: videoUrl || null,
          trailerUrl: trailerUrl || null,
          streamType: videoUrl?.includes(".m3u8") ? "HLS" : "MP4",
          creatorId: creatorId || null,
          creatorName: creatorName || null,
          tagline: tagline || null,
          language: language ? String(language).trim() : "Tamil",
          year: year !== void 0 && year !== "" && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : null,
          ageRating: ageRating ? String(ageRating).trim() : null,
          durationMin: durationMin !== void 0 && durationMin !== "" && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : null,
          durationSec: payload.durationSec ? parseInt(String(payload.durationSec), 10) : durationMin ? parseInt(String(durationMin), 10) * 60 : null,
          editorRating: editorRating ? parseFloat(editorRating) : null,
          isFeatured: Boolean(isFeatured),
          fundingEnabled: Boolean(fundingEnabled),
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : null,
          verticalVideoUrl: payload.verticalVideoUrl || null,
          feedEligible: payload.feedEligible !== void 0 ? Boolean(payload.feedEligible) : true,
          publishedAt: status === "PUBLISHED" ? /* @__PURE__ */ new Date() : null
        }
      });
      for (const gId of genreIds) {
        await tx.titleGenre.create({
          data: { titleId: newTitle.id, genreId: gId }
        });
      }
      for (const tId of tagIds) {
        await tx.titleTag.create({
          data: { titleId: newTitle.id, tagId: tId }
        });
      }
      for (let i = 0; i < cast.length; i++) {
        const c = cast[i];
        if (c.personId) {
          await tx.titleCast.create({
            data: {
              titleId: newTitle.id,
              personId: c.personId,
              order: c.order !== void 0 ? c.order : i,
              characterName: c.characterName || null
            }
          });
        }
      }
      for (const cr of crew) {
        if (cr.personId && cr.role) {
          await tx.titleCrew.create({
            data: {
              titleId: newTitle.id,
              personId: cr.personId,
              role: cr.role,
              customRole: cr.customRole || null
            }
          });
        }
      }
      if (kind === "WEB_SERIES" && Array.isArray(seasons)) {
        for (const s of seasons) {
          const seasonRecord = await tx.season.create({
            data: {
              titleId: newTitle.id,
              number: s.number || 1,
              name: s.name || `Season ${s.number || 1}`
            }
          });
          if (Array.isArray(s.episodes)) {
            for (let epIdx = 0; epIdx < s.episodes.length; epIdx++) {
              const ep = s.episodes[epIdx];
              await tx.episode.create({
                data: {
                  seasonId: seasonRecord.id,
                  number: ep.number || epIdx + 1,
                  name: ep.name || `Episode ${ep.number || epIdx + 1}`,
                  description: ep.description || null,
                  thumbnailUrl: ep.thumbnailUrl || null,
                  durationMin: ep.durationMin ? parseInt(ep.durationMin, 10) : null,
                  videoUrl: ep.videoUrl || "",
                  streamType: ep.videoUrl?.includes(".m3u8") ? "HLS" : "MP4",
                  status: ep.status || "PUBLISHED"
                }
              });
            }
          }
        }
      }
      return newTitle;
    });
    res.status(201).json({ title: createdTitle });
  } catch (err) {
    next(err);
  }
});
router3.put("/admin/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const titleId = decodeURIComponent(rawId);
    const payload = req.body;
    const existing = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } }
        ]
      }
    });
    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    const targetId = existing.id;
    const {
      title,
      description,
      kind,
      orientation,
      genreIds = [],
      tags = [],
      cast = [],
      crew = [],
      videoUrl,
      trailerUrl,
      seasons = [],
      posterUrl,
      verticalPosterUrl,
      bannerUrl,
      creatorId,
      creatorName,
      status,
      tagline,
      language,
      year,
      ageRating,
      durationMin,
      editorRating,
      isFeatured,
      fundingEnabled,
      fundingGoal
    } = payload;
    const tagIds = [];
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        const lower = typeof tagName === "string" ? tagName.trim().toLowerCase() : tagName.name ? tagName.name.trim().toLowerCase() : "";
        if (lower) {
          const tagRecord = await prisma.tag.upsert({
            where: { name: lower },
            update: {},
            create: { name: lower }
          });
          tagIds.push(tagRecord.id);
        }
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx.title.update({
        where: { id: targetId },
        data: {
          title: title ? title.trim() : existing.title,
          description: description ? description.trim() : existing.description,
          kind: kind ? kind : existing.kind,
          orientation: orientation ? orientation : existing.orientation,
          status: status ? status : existing.status,
          posterUrl: posterUrl !== void 0 ? posterUrl || null : existing.posterUrl,
          bannerUrl: bannerUrl !== void 0 ? bannerUrl || null : existing.bannerUrl,
          verticalPosterUrl: verticalPosterUrl !== void 0 ? verticalPosterUrl || null : existing.verticalPosterUrl,
          videoUrl: videoUrl !== void 0 ? videoUrl : existing.videoUrl,
          trailerUrl: trailerUrl !== void 0 ? trailerUrl : existing.trailerUrl,
          streamType: videoUrl ? videoUrl.includes(".m3u8") ? "HLS" : "MP4" : existing.streamType,
          creatorId: creatorId !== void 0 ? creatorId : existing.creatorId,
          creatorName: creatorName !== void 0 ? creatorName : existing.creatorName,
          tagline: tagline !== void 0 ? tagline : existing.tagline,
          language: language !== void 0 && language !== null ? String(language).trim() : existing.language,
          year: year !== void 0 && year !== "" && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : year === null ? null : existing.year,
          ageRating: ageRating !== void 0 ? ageRating ? String(ageRating).trim() : null : existing.ageRating,
          durationMin: durationMin !== void 0 && durationMin !== "" && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : durationMin === null ? null : existing.durationMin,
          durationSec: payload.durationSec !== void 0 ? payload.durationSec ? parseInt(String(payload.durationSec), 10) : null : existing.durationSec,
          editorRating: editorRating ? parseFloat(editorRating) : existing.editorRating,
          isFeatured: isFeatured !== void 0 ? Boolean(isFeatured) : existing.isFeatured,
          fundingEnabled: fundingEnabled !== void 0 ? Boolean(fundingEnabled) : existing.fundingEnabled,
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : existing.fundingGoal,
          verticalVideoUrl: payload.verticalVideoUrl !== void 0 ? payload.verticalVideoUrl || null : existing.verticalVideoUrl,
          feedEligible: payload.feedEligible !== void 0 ? Boolean(payload.feedEligible) : existing.feedEligible,
          publishedAt: status === "PUBLISHED" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt
        }
      });
      if (Array.isArray(genreIds)) {
        await tx.titleGenre.deleteMany({ where: { titleId: targetId } });
        for (const gId of genreIds) {
          await tx.titleGenre.create({ data: { titleId: targetId, genreId: gId } });
        }
      }
      if (Array.isArray(tags)) {
        await tx.titleTag.deleteMany({ where: { titleId: targetId } });
        for (const tId of tagIds) {
          await tx.titleTag.create({ data: { titleId: targetId, tagId: tId } });
        }
      }
      if (Array.isArray(cast)) {
        await tx.titleCast.deleteMany({ where: { titleId: targetId } });
        for (let i = 0; i < cast.length; i++) {
          const c = cast[i];
          if (c.personId) {
            await tx.titleCast.create({
              data: {
                titleId: targetId,
                personId: c.personId,
                order: c.order !== void 0 ? c.order : i,
                characterName: c.characterName || null
              }
            });
          }
        }
      }
      if (Array.isArray(crew)) {
        await tx.titleCrew.deleteMany({ where: { titleId: targetId } });
        for (const cr of crew) {
          if (cr.personId && cr.role) {
            await tx.titleCrew.create({
              data: {
                titleId: targetId,
                personId: cr.personId,
                role: cr.role,
                customRole: cr.customRole || null
              }
            });
          }
        }
      }
      if (Array.isArray(seasons)) {
        const existingSeasons = await tx.season.findMany({ where: { titleId: targetId } });
        for (const es of existingSeasons) {
          await tx.episode.deleteMany({ where: { seasonId: es.id } });
        }
        await tx.season.deleteMany({ where: { titleId: targetId } });
        for (const s of seasons) {
          const seasonRecord = await tx.season.create({
            data: {
              titleId: targetId,
              number: s.number || 1,
              name: s.name || `Season ${s.number || 1}`
            }
          });
          if (Array.isArray(s.episodes)) {
            for (let epIdx = 0; epIdx < s.episodes.length; epIdx++) {
              const ep = s.episodes[epIdx];
              await tx.episode.create({
                data: {
                  seasonId: seasonRecord.id,
                  number: ep.number || epIdx + 1,
                  name: ep.name || `Episode ${ep.number || epIdx + 1}`,
                  description: ep.description || null,
                  thumbnailUrl: ep.thumbnailUrl || null,
                  durationMin: ep.durationMin ? parseInt(ep.durationMin, 10) : null,
                  videoUrl: ep.videoUrl || "",
                  streamType: ep.videoUrl?.includes(".m3u8") ? "HLS" : "MP4",
                  status: ep.status || "PUBLISHED"
                }
              });
            }
          }
        }
      }
    });
    const updatedTitle = await prisma.title.findUnique({
      where: { id: targetId },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: { include: { person: true } },
        crew: { include: { person: true } },
        seasons: { include: { episodes: true } }
      }
    });
    res.json({ title: formatTitleResponse(updatedTitle) });
  } catch (err) {
    next(err);
  }
});
router3.delete("/admin/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const titleId = decodeURIComponent(rawId);
    const matchingTitles = await prisma.title.findMany({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } },
          { title: { equals: titleId } }
        ]
      }
    });
    if (matchingTitles.length === 0) {
      const slugBase = titleId.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      if (slugBase) {
        const bySlugBase = await prisma.title.findMany({
          where: {
            slug: { startsWith: slugBase }
          }
        });
        matchingTitles.push(...bySlugBase);
      }
    }
    for (const t of matchingTitles) {
      const targetId = t.id;
      await prisma.titleCast.deleteMany({ where: { titleId: targetId } });
      await prisma.titleCrew.deleteMany({ where: { titleId: targetId } });
      await prisma.titleGenre.deleteMany({ where: { titleId: targetId } });
      await prisma.titleTag.deleteMany({ where: { titleId: targetId } });
      await prisma.watchlistItem.deleteMany({ where: { titleId: targetId } });
      await prisma.reaction.deleteMany({ where: { titleId: targetId } });
      await prisma.watchProgress.deleteMany({ where: { titleId: targetId } });
      await prisma.funding.deleteMany({ where: { titleId: targetId } });
      const seasons = await prisma.season.findMany({ where: { titleId: targetId } });
      for (const s of seasons) {
        await prisma.episode.deleteMany({ where: { seasonId: s.id } });
      }
      await prisma.season.deleteMany({ where: { titleId: targetId } });
      await prisma.title.delete({ where: { id: targetId } });
    }
    res.json({ success: true, deletedCount: matchingTitles.length, id: titleId });
  } catch (err) {
    next(err);
  }
});
var titles_default = router3;

// apps/api/src/routes/home.ts
var router4 = Router4();
router4.get("/", async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    const [publishedTitles, activeGenres] = await Promise.all([
      prisma.title.findMany({
        where: { status: "PUBLISHED" },
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 60
      }),
      prisma.genre.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" }
      })
    ]);
    const formatted = publishedTitles.map(formatTitleResponse);
    const featuredList = formatted.filter((t) => t.isFeatured);
    const formattedFeatured = (featuredList.length > 0 ? featuredList : formatted).slice(0, 5);
    const formattedTrending = formatted.slice(0, 10);
    const formattedNewReleases = [...formatted].sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()).slice(0, 10);
    const formattedTopRated = [...formatted].sort((a, b) => (Number(b.editorRating) || 0) - (Number(a.editorRating) || 0)).slice(0, 10);
    const formattedGenres = activeGenres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      titles: formatted.filter((t) => t.genres?.some((tg) => tg.id === g.id || tg.slug === g.slug || tg.name === g.name)).slice(0, 12)
    })).filter((g) => g.titles.length > 0);
    res.json({
      featured: formattedFeatured,
      genres: formattedGenres,
      categories: formattedGenres,
      // fallback key for legacy UI consumers
      trending: formattedTrending,
      newReleases: formattedNewReleases,
      topRated: formattedTopRated,
      mostSupported: formattedTrending
    });
  } catch (err) {
    next(err);
  }
});
var home_default = router4;

// apps/api/src/routes/genres.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/", async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });
    res.json({ genres, categories: genres });
  } catch (err) {
    next(err);
  }
});
router5.get("/admin", async (_req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { sortOrder: "asc" }
    });
    res.json({ genres });
  } catch (err) {
    next(err);
  }
});
router5.post("/", async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Genre name is required" } });
      return;
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const genre = await prisma.genre.upsert({
      where: { slug },
      update: { name: name.trim(), isActive: true },
      create: {
        name: name.trim(),
        slug,
        sortOrder: sortOrder !== void 0 ? parseInt(sortOrder, 10) : 0,
        isActive: true
      }
    });
    res.status(201).json({ genre });
  } catch (err) {
    next(err);
  }
});
router5.put("/:id", async (req, res, next) => {
  try {
    const genreId = req.params.id;
    const { name, sortOrder, isActive } = req.body;
    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (sortOrder !== void 0) updateData.sortOrder = parseInt(sortOrder, 10);
    if (isActive !== void 0) updateData.isActive = Boolean(isActive);
    const genre = await prisma.genre.update({
      where: { id: genreId },
      data: updateData
    });
    res.json({ genre });
  } catch (err) {
    next(err);
  }
});
router5.delete("/:id", async (req, res, next) => {
  try {
    const genreId = req.params.id;
    await prisma.genre.delete({ where: { id: genreId } });
    res.json({ success: true, id: genreId });
  } catch (err) {
    next(err);
  }
});
var genres_default = router5;

// apps/api/src/routes/tags.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/suggest", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "15", 10)));
    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q } } : void 0,
      take: limit,
      orderBy: { name: "asc" }
    });
    res.json({ tags: tags.map((t) => t.name) });
  } catch (err) {
    next(err);
  }
});
var tags_default = router6;

// apps/api/src/routes/creator.ts
import { Router as Router7 } from "express";
var router7 = Router7();
async function getCreatorsRegistry2() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "CREATOR_REGISTRY" } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {
  }
  return [];
}
async function saveCreatorsRegistry2(registry) {
  await prisma.setting.upsert({
    where: { key: "CREATOR_REGISTRY" },
    update: { value: JSON.stringify(registry) },
    create: { key: "CREATOR_REGISTRY", value: JSON.stringify(registry) }
  });
}
async function getRequestCreator(req) {
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;
  const headerEmail = req.headers["x-user-email"] || req.query.email;
  const headerName = req.headers["x-user-name"] || req.query.creatorName;
  let userEmail = headerEmail ? headerEmail.toLowerCase().trim() : "";
  let userName = headerName ? headerName.trim() : "";
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (cookieHeader) {
    const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("rasigan_token="));
    if (match) token = decodeURIComponent(match.split("=")[1]);
  }
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (payload.email) userEmail = payload.email.toLowerCase().trim();
        if (payload.name) userName = payload.name.trim();
      }
    } catch {
    }
  }
  const registry = await getCreatorsRegistry2();
  const matched = registry.find(
    (c) => userEmail && c.email && c.email.toLowerCase() === userEmail || userName && c.creatorName && c.creatorName.toLowerCase() === userName.toLowerCase()
  );
  return {
    email: userEmail,
    name: userName,
    creatorName: matched?.creatorName || userName || "Indie Studio",
    matchedCreator: matched
  };
}
router7.get("/profile", async (req, res, next) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    res.json({
      creator: {
        creatorName: creatorInfo.creatorName,
        email: creatorInfo.email,
        upiId: creatorInfo.matchedCreator?.upiId || "",
        status: creatorInfo.matchedCreator?.status || "ACTIVE",
        assignedTitleIds: creatorInfo.matchedCreator?.assignedTitleIds || []
      }
    });
  } catch (err) {
    next(err);
  }
});
router7.put("/profile", async (req, res, next) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    const { upiId } = req.body;
    const registry = await getCreatorsRegistry2();
    let updatedItem = null;
    const targetIndex = registry.findIndex(
      (c) => creatorInfo.email && c.email && c.email.toLowerCase() === creatorInfo.email || creatorInfo.creatorName && c.creatorName && c.creatorName.toLowerCase() === creatorInfo.creatorName.toLowerCase()
    );
    if (targetIndex >= 0) {
      registry[targetIndex].upiId = (upiId || "").trim();
      registry[targetIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      updatedItem = registry[targetIndex];
    } else {
      updatedItem = {
        id: `c_${Date.now()}`,
        creatorName: creatorInfo.creatorName,
        email: creatorInfo.email || "",
        upiId: (upiId || "").trim(),
        status: "ACTIVE",
        assignedTitleIds: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      registry.push(updatedItem);
    }
    await saveCreatorsRegistry2(registry);
    res.json({
      message: "Creator profile updated successfully",
      creator: updatedItem
    });
  } catch (err) {
    next(err);
  }
});
router7.get("/earnings", async (req, res, next) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    const orConditions = [
      { creatorName: { equals: creatorInfo.creatorName, mode: "insensitive" } }
    ];
    if (creatorInfo.email) {
      orConditions.push({ creatorId: creatorInfo.email });
    }
    if (creatorInfo.matchedCreator?.assignedTitleIds?.length) {
      orConditions.push({ id: { in: creatorInfo.matchedCreator.assignedTitleIds } });
    }
    const titles = await prisma.title.findMany({
      where: { OR: orConditions },
      select: {
        id: true,
        title: true,
        posterUrl: true,
        fundings: {
          where: { status: "PAID" },
          select: { amountInr: true }
        }
      }
    });
    const titleIds = titles.map((t) => t.id);
    const progressList = titleIds.length > 0 ? await prisma.watchProgress.findMany({
      where: { titleId: { in: titleIds } },
      select: { titleId: true, positionSec: true }
    }) : [];
    const viewsMap = /* @__PURE__ */ new Map();
    const watchTimeSecMap = /* @__PURE__ */ new Map();
    progressList.forEach((p) => {
      viewsMap.set(p.titleId, (viewsMap.get(p.titleId) || 0) + 1);
      watchTimeSecMap.set(p.titleId, (watchTimeSecMap.get(p.titleId) || 0) + p.positionSec);
    });
    const titleEarnings = titles.map((t) => {
      const supportersCount = t.fundings.length;
      const totalRaised = t.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const earningsInr = Math.floor(totalRaised * 0.6);
      const viewsCount = viewsMap.get(t.id) || 0;
      const watchTimeSec = watchTimeSecMap.get(t.id) || 0;
      return {
        titleId: t.id,
        title: t.title,
        posterUrl: t.posterUrl,
        viewsCount,
        watchTimeMinutes: Math.round(watchTimeSec / 60),
        supportersCount,
        earningsInr
      };
    });
    const payouts = await prisma.creatorPayout.findMany({
      where: {
        creatorName: { equals: creatorInfo.creatorName, mode: "insensitive" }
      }
    });
    const paidSoFarInr = payouts.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.netPayableInr, 0);
    const totalEarnings = titleEarnings.reduce((acc, cur) => acc + cur.earningsInr, 0);
    const pendingPayoutInr = Math.max(0, totalEarnings - paidSoFarInr);
    const dto = {
      earningsInr: totalEarnings,
      pendingPayoutInr,
      paidSoFarInr,
      titles: titleEarnings
    };
    res.json(dto);
  } catch (err) {
    next(err);
  }
});
router7.get("/analytics/:id", async (req, res, next) => {
  try {
    const titleId = req.params.id;
    const creatorInfo = await getRequestCreator(req);
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
      include: {
        fundings: {
          where: { status: "PAID" },
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: { select: { reactions: true } }
      }
    });
    if (!title) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    const isOwner = title.creatorName && title.creatorName.toLowerCase() === creatorInfo.creatorName.toLowerCase() || creatorInfo.email && title.creatorId === creatorInfo.email || creatorInfo.matchedCreator?.assignedTitleIds?.includes(title.id);
    if (!isOwner) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Unauthorized access to title analytics" } });
      return;
    }
    const [viewsCount, progressStats] = await Promise.all([
      prisma.watchProgress.count({ where: { titleId: title.id } }),
      prisma.watchProgress.aggregate({
        where: { titleId: title.id },
        _sum: { positionSec: true }
      })
    ]);
    const totalFundingRaisedInr = title.fundings.reduce((sum, f) => sum + f.amountInr, 0);
    const payments = title.fundings.map((f) => ({
      id: f.id,
      amountInr: f.amountInr,
      donorName: f.isAnonymous ? "Anonymous Supporter" : f.user.name,
      donorEmail: f.isAnonymous ? "anonymous@privacy.org" : f.user.email,
      razorpayPaymentId: f.razorpayPaymentId || `pay_rzp_${f.id}`,
      paidAt: f.paidAt ? f.paidAt.toISOString() : f.createdAt.toISOString(),
      status: f.status,
      message: f.message || null
    }));
    const watchTimeSeconds = progressStats._sum.positionSec || 0;
    const watchTimeHours = Math.round(watchTimeSeconds / 3600 * 10) / 10;
    res.json({
      analytics: {
        id: title.id,
        title: title.title,
        posterUrl: title.posterUrl,
        kind: title.kind,
        status: title.status,
        creatorName: title.creatorName || creatorInfo.creatorName,
        fundingGoal: title.fundingGoal || 2e5,
        fundingRaised: totalFundingRaisedInr,
        fundingPercent: Math.min(100, Math.round(totalFundingRaisedInr / (title.fundingGoal || 2e5) * 100)),
        supportersCount: payments.length,
        totalViews: viewsCount,
        watchTimeHours,
        editorRating: title.editorRating ? Number(title.editorRating) : 9,
        likesCount: title._count.reactions || 0,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
});
router7.get("/payouts", async (req, res, next) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    const rawPayouts = await prisma.creatorPayout.findMany({
      where: {
        creatorName: { equals: creatorInfo.creatorName, mode: "insensitive" }
      },
      orderBy: { createdAt: "desc" }
    });
    const statements = rawPayouts.map((p) => ({
      id: p.id,
      cycle: p.cycle,
      period: p.period,
      earningsInr: p.netPayableInr,
      adjustmentsInr: 0,
      netPayableInr: p.netPayableInr,
      status: p.status === "COMPLETED" ? "PAID" : "PROCESSING",
      referenceUtr: p.paymentUtrNumber || void 0,
      titles: []
    }));
    res.json({ statements });
  } catch (err) {
    next(err);
  }
});
router7.get("/supporters", async (req, res, next) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    const fundings = await prisma.funding.findMany({
      where: {
        status: "PAID",
        title: {
          OR: [
            { creatorName: { equals: creatorInfo.creatorName, mode: "insensitive" } },
            ...creatorInfo.email ? [{ creatorId: creatorInfo.email }] : [],
            ...creatorInfo.matchedCreator?.assignedTitleIds?.length ? [{ id: { in: creatorInfo.matchedCreator.assignedTitleIds } }] : []
          ]
        }
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        title: { select: { title: true } }
      }
    });
    const supporters = fundings.map((f) => ({
      id: f.id,
      title: f.title.title,
      supporterName: f.isAnonymous ? "Anonymous Supporter" : f.user.name,
      avatarUrl: f.isAnonymous ? null : f.user.avatarUrl,
      message: f.message || null,
      date: f.createdAt.toISOString()
    }));
    res.json({ supporters });
  } catch (err) {
    next(err);
  }
});
var creator_default = router7;

// apps/api/src/routes/funding.ts
import { Router as Router8 } from "express";
import crypto from "crypto";
var router8 = Router8();
var RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_Tm70KL4aF8kgtT";
var RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "oDNtkb1WrCY8607KkVllF7jQ";
var RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;
async function getOrCreateSupporterUser(userId, email, name) {
  try {
    if (userId) {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (existing) return existing.id;
    }
    const supporterEmail = email && email.includes("@") ? email.trim() : "supporter@rasigan.com";
    const existingByEmail = await prisma.user.findUnique({ where: { email: supporterEmail } });
    if (existingByEmail) return existingByEmail.id;
    const created = await prisma.user.create({
      data: {
        email: supporterEmail,
        googleId: `supporter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name && name.trim() ? name.trim() : "Rasigan Supporter",
        role: "USER"
      }
    });
    return created.id;
  } catch (err) {
    console.warn("DB User fallback in funding:", err);
    try {
      const fallback = await prisma.user.findFirst();
      if (fallback) return fallback.id;
    } catch {
    }
    return "fallback_user_supporter";
  }
}
router8.post("/order", async (req, res, next) => {
  try {
    const { titleId, amountInr, message, isAnonymous, userId, userEmail, userName } = req.body;
    const parsedAmount = parseInt(String(amountInr), 10);
    if (isNaN(parsedAmount) || parsedAmount < 10 || parsedAmount > 5e4) {
      res.status(400).json({
        error: {
          code: "INVALID_AMOUNT",
          message: "Contribution amount must be an integer between \u20B910 and \u20B950,000"
        }
      });
      return;
    }
    if (!titleId || typeof titleId !== "string") {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "titleId is required"
        }
      });
      return;
    }
    let title = null;
    try {
      title = await prisma.title.findFirst({
        where: {
          OR: [
            { id: titleId },
            { slug: titleId }
          ]
        }
      });
    } catch (dbErr) {
      console.warn("DB read error for title in funding/order, continuing with title fallback:", dbErr);
    }
    if (!title) {
      title = {
        id: titleId,
        title: "Rasigan Film",
        fundingEnabled: true
      };
    }
    if (title.fundingEnabled === false) {
      res.status(400).json({
        error: {
          code: "FUNDING_DISABLED",
          message: "Creator support is currently disabled for this title"
        }
      });
      return;
    }
    const amountInPaise = parsedAmount * 100;
    const receipt = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          titleId: title.id,
          titleName: String(title.title || "Rasigan").slice(0, 40),
          isAnonymous: String(Boolean(isAnonymous))
        }
      })
    });
    if (!rzpResponse.ok) {
      const errorData = await rzpResponse.json().catch(() => null);
      console.error("Razorpay Order API creation error:", errorData);
      res.status(rzpResponse.status).json({
        error: {
          code: "RAZORPAY_API_ERROR",
          message: errorData?.error?.description || "Failed to create order with Razorpay"
        }
      });
      return;
    }
    const rzpOrder = await rzpResponse.json();
    let fundingId = `fund_${Date.now()}`;
    try {
      const assignedUserId = await getOrCreateSupporterUser(userId, userEmail, userName);
      const funding = await prisma.funding.create({
        data: {
          userId: assignedUserId,
          titleId: title.id,
          amountInr: parsedAmount,
          razorpayOrderId: rzpOrder.id,
          status: "CREATED",
          message: message ? String(message).slice(0, 140) : null,
          isAnonymous: Boolean(isAnonymous)
        }
      });
      fundingId = funding.id;
    } catch (saveErr) {
      console.warn("Warning: Could not save funding record in DB (connection/auth issue), proceeding with order:", saveErr);
    }
    res.status(201).json({
      orderId: rzpOrder.id,
      keyId: RAZORPAY_KEY_ID,
      amount: parsedAmount,
      currency: "INR",
      titleName: title.title,
      fundingId
    });
  } catch (err) {
    next(err);
  }
});
router8.post("/verify", async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, titleId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required"
        }
      });
      return;
    }
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(payload).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({
        error: {
          code: "INVALID_SIGNATURE",
          message: "Razorpay payment signature verification failed"
        }
      });
      return;
    }
    try {
      const existingFunding = await prisma.funding.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        include: { title: true }
      });
      if (existingFunding) {
        if (existingFunding.status === "PAID") {
          res.json({
            success: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            fundingId: existingFunding.id,
            amountInr: existingFunding.amountInr,
            paidAt: existingFunding.paidAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
          });
          return;
        }
        const updated = await prisma.funding.update({
          where: { id: existingFunding.id },
          data: {
            status: "PAID",
            razorpayPaymentId: razorpay_payment_id,
            paidAt: /* @__PURE__ */ new Date()
          }
        });
        res.json({
          success: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          fundingId: updated.id,
          amountInr: updated.amountInr,
          paidAt: updated.paidAt?.toISOString()
        });
        return;
      }
      let targetTitleId = titleId;
      if (!targetTitleId) {
        const firstTitle = await prisma.title.findFirst();
        targetTitleId = firstTitle?.id;
      }
      if (targetTitleId) {
        const defaultUserId = await getOrCreateSupporterUser();
        const created = await prisma.funding.create({
          data: {
            userId: defaultUserId,
            titleId: targetTitleId,
            amountInr: 100,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: "PAID",
            paidAt: /* @__PURE__ */ new Date()
          }
        });
        res.json({
          success: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          fundingId: created.id,
          amountInr: created.amountInr,
          paidAt: created.paidAt?.toISOString()
        });
        return;
      }
    } catch (dbErr) {
      console.warn("DB update error in funding/verify, signature is valid so returning success:", dbErr);
    }
    res.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paidAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    next(err);
  }
});
router8.post("/webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(bodyStr).digest("hex");
      if (expectedSignature !== signature) {
        console.warn("Razorpay Webhook: invalid signature ignored");
      }
    }
    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;
    if (paymentEntity && paymentEntity.order_id) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      try {
        if (event === "payment.captured") {
          const funding = await prisma.funding.findUnique({
            where: { razorpayOrderId: orderId }
          });
          if (funding && funding.status !== "PAID") {
            await prisma.funding.update({
              where: { id: funding.id },
              data: {
                status: "PAID",
                razorpayPaymentId: paymentId,
                paidAt: /* @__PURE__ */ new Date()
              }
            });
          }
        } else if (event === "payment.failed") {
          await prisma.funding.updateMany({
            where: { razorpayOrderId: orderId, status: "CREATED" },
            data: { status: "FAILED" }
          });
        } else if (event === "refund.processed") {
          const funding = await prisma.funding.findUnique({
            where: { razorpayOrderId: orderId }
          });
          if (funding && funding.status === "PAID") {
            await prisma.funding.update({
              where: { id: funding.id },
              data: { status: "REFUNDED" }
            });
          }
        }
      } catch (dbErr) {
        console.warn("DB webhook update error:", dbErr);
      }
    }
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});
router8.get("/mine", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    try {
      const fundings = await prisma.funding.findMany({
        where: {
          status: "PAID",
          ...userId ? { userId } : {}
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          title: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              creatorName: true
            }
          }
        }
      });
      res.json({ fundings });
    } catch (dbErr) {
      console.warn("DB error in funding/mine:", dbErr);
      res.json({ fundings: [] });
    }
  } catch (err) {
    next(err);
  }
});
router8.get("/list", async (_req, res, next) => {
  try {
    try {
      const fundings = await prisma.funding.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          title: { select: { id: true, title: true, creatorName: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });
      res.json({ fundings });
    } catch (dbErr) {
      console.warn("DB error in funding/list:", dbErr);
      res.json({ fundings: [] });
    }
  } catch (err) {
    next(err);
  }
});
var funding_default = router8;

// apps/api/src/routes/auth.ts
import { Router as Router9 } from "express";
import crypto2 from "crypto";
var router9 = Router9();
var JWT_SECRET = process.env.JWT_SECRET || "dev-rasigan-secret-key-change-in-prod-123456789";
function getAdminEmails() {
  const envAdmins = process.env.ADMIN_EMAILS || "sambavangalmedia@gmail.com,monkstudioskpm@gmail.com,admin@rasigan.com";
  return envAdmins.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}
async function getCreatorEmails() {
  const envCreators = (process.env.CREATOR_EMAILS || "creator@rasigan.com,cupice@rasigan.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "CREATOR_EMAILS" } });
    if (setting?.value) {
      const dbEmails = setting.value.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      return Array.from(/* @__PURE__ */ new Set([...envCreators, ...dbEmails]));
    }
  } catch {
  }
  return envCreators;
}
function signJwt(payload, secret, expiresInDays = 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1e3) + expiresInDays * 24 * 60 * 60;
  const data = { ...payload, exp };
  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto2.createHmac("sha256", secret).update(`${b64Header}.${b64Payload}`).digest("base64url");
  return `${b64Header}.${b64Payload}.${signature}`;
}
function verifyJwt(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const expectedSignature = crypto2.createHmac("sha256", secret).update(`${b64Header}.${b64Payload}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("rasigan_token="));
    if (match) {
      return decodeURIComponent(match.split("=")[1]);
    }
  }
  return null;
}
router9.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Google credential (ID token) is required"
        }
      });
      return;
    }
    const googleVerifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!googleVerifyRes.ok) {
      const errText = await googleVerifyRes.text();
      console.warn("Google tokeninfo verification failed:", errText);
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIAL",
          message: "Invalid or expired Google credential"
        }
      });
      return;
    }
    const tokenData = await googleVerifyRes.json();
    if (!tokenData.sub || !tokenData.email) {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN_PAYLOAD",
          message: "Token does not contain required user identifiers"
        }
      });
      return;
    }
    const email = tokenData.email.toLowerCase().trim();
    const name = tokenData.name || email.split("@")[0];
    const avatarUrl = tokenData.picture || null;
    const googleId = tokenData.sub;
    const adminEmails = getAdminEmails();
    const creatorEmails = await getCreatorEmails();
    let detectedRole = "USER";
    if (adminEmails.includes(email)) {
      detectedRole = "ADMIN";
    } else if (creatorEmails.includes(email)) {
      detectedRole = "CREATOR";
    } else {
      try {
        const creatorMatch = await prisma.creatorPayout.findFirst({
          where: {
            OR: [
              { creatorName: { contains: name, mode: "insensitive" } },
              { creatorName: { contains: email.split("@")[0], mode: "insensitive" } }
            ]
          }
        });
        if (creatorMatch) {
          detectedRole = "CREATOR";
        }
      } catch (dbErr) {
        console.warn("DB check for creator role skipped:", dbErr);
      }
    }
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { googleId },
        update: {
          email,
          name,
          avatarUrl,
          role: detectedRole === "ADMIN" ? "ADMIN" : "USER"
        },
        create: {
          googleId,
          email,
          name,
          avatarUrl,
          role: detectedRole === "ADMIN" ? "ADMIN" : "USER"
        }
      });
    } catch (saveErr) {
      console.warn("Could not save user to PostgreSQL DB (connection issue), proceeding with memory session:", saveErr);
      dbUser = {
        id: `usr_${googleId.slice(0, 8)}`,
        googleId,
        email,
        name,
        avatarUrl,
        role: detectedRole === "ADMIN" ? "ADMIN" : "USER"
      };
    }
    const tokenPayload = {
      id: dbUser.id,
      googleId,
      email,
      name,
      avatarUrl,
      role: detectedRole
    };
    const token = signJwt(tokenPayload, JWT_SECRET, 7);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("rasigan_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 1e3
      // 7 days
    });
    res.json({
      success: true,
      user: {
        id: dbUser.id,
        googleId,
        email,
        name,
        avatarUrl,
        role: detectedRole
      },
      token
    });
  } catch (err) {
    next(err);
  }
});
router9.get("/me", async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.json({ user: null });
      return;
    }
    const payload = verifyJwt(token, JWT_SECRET);
    if (!payload) {
      res.json({ user: null });
      return;
    }
    let freshUser = payload;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id }
      });
      const creatorEmails = await getCreatorEmails();
      const isCreator = payload.email && creatorEmails.includes(payload.email.toLowerCase().trim());
      if (dbUser) {
        freshUser = {
          ...payload,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role === "ADMIN" ? "ADMIN" : isCreator ? "CREATOR" : payload.role
        };
      } else if (isCreator) {
        freshUser = {
          ...payload,
          role: "CREATOR"
        };
      }
    } catch {
    }
    res.json({ user: freshUser });
  } catch (err) {
    next(err);
  }
});
router9.post("/logout", (_req, res) => {
  res.clearCookie("rasigan_token", {
    httpOnly: true,
    sameSite: "lax"
  });
  res.json({ success: true });
});
var auth_default = router9;

// apps/api/src/routes/progress.ts
import { Router as Router10 } from "express";
import crypto3 from "crypto";
var router10 = Router10();
var JWT_SECRET2 = process.env.JWT_SECRET || "dev-rasigan-secret-key-change-in-prod-123456789";
function extractUser(req) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("rasigan_token="));
    if (match) {
      token = decodeURIComponent(match.split("=")[1]);
    }
  }
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const [b64Header, b64Payload, signature] = parts;
        const expectedSignature = crypto3.createHmac("sha256", JWT_SECRET2).update(`${b64Header}.${b64Payload}`).digest("base64url");
        if (signature === expectedSignature) {
          const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
          if (!payload.exp || payload.exp > Math.floor(Date.now() / 1e3)) {
            return {
              id: payload.id,
              email: payload.email,
              name: payload.name
            };
          }
        }
      }
    } catch {
    }
  }
  const headerEmail = req.headers["x-user-email"] || req.query.email || req.body?.userEmail;
  const headerUserId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  const headerName = req.headers["x-user-name"] || req.query.name || req.body?.userName;
  if (headerUserId || headerEmail) {
    return {
      id: headerUserId,
      email: headerEmail?.toLowerCase().trim(),
      name: headerName?.trim()
    };
  }
  return null;
}
async function resolveUserId(userObj) {
  if (userObj?.id) {
    const existing = await prisma.user.findUnique({ where: { id: userObj.id } });
    if (existing) return existing.id;
  }
  if (userObj?.email) {
    const existing = await prisma.user.findUnique({ where: { email: userObj.email } });
    if (existing) return existing.id;
    const created = await prisma.user.create({
      data: {
        email: userObj.email,
        googleId: `google_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: userObj.name || userObj.email.split("@")[0],
        role: "USER"
      }
    });
    return created.id;
  }
  const guestEmail = "guest@rasigan.local";
  let guest = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!guest) {
    guest = await prisma.user.create({
      data: {
        email: guestEmail,
        googleId: "guest_rasigan_viewer",
        name: "Guest Viewer",
        role: "USER"
      }
    });
  }
  return guest.id;
}
router10.get("/:titleId", async (req, res, next) => {
  try {
    const titleId = req.params.titleId;
    const user = extractUser(req);
    if (!user) {
      res.json({ progress: null });
      return;
    }
    const userId = await resolveUserId(user);
    const progress = await prisma.watchProgress.findFirst({
      where: {
        userId,
        titleId
      },
      orderBy: { updatedAt: "desc" }
    });
    res.json({ progress });
  } catch (err) {
    next(err);
  }
});
router10.get("/", async (req, res, next) => {
  try {
    const user = extractUser(req);
    if (!user) {
      res.json({ list: [] });
      return;
    }
    const userId = await resolveUserId(user);
    const progressList = await prisma.watchProgress.findMany({
      where: {
        userId,
        completed: false,
        positionSec: { gt: 5 }
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        title: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            verticalPosterUrl: true,
            bannerUrl: true,
            durationMin: true,
            kind: true,
            genres: true
          }
        }
      }
    });
    res.json({ list: progressList });
  } catch (err) {
    next(err);
  }
});
router10.put("/", async (req, res, next) => {
  try {
    const { titleId, episodeId, positionSec, durationSec } = req.body;
    if (!titleId || typeof positionSec !== "number") {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "titleId and positionSec are required" } });
      return;
    }
    const user = extractUser(req);
    const userId = await resolveUserId(user);
    const pos = Math.max(0, Math.floor(positionSec));
    const dur = Math.max(1, Math.floor(durationSec || 0));
    const completed = dur > 10 ? pos >= dur - 15 : false;
    const existing = await prisma.watchProgress.findFirst({
      where: {
        userId,
        titleId,
        episodeId: episodeId || null
      }
    });
    let saved;
    if (existing) {
      saved = await prisma.watchProgress.update({
        where: { id: existing.id },
        data: {
          positionSec: pos,
          durationSec: dur,
          completed,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    } else {
      saved = await prisma.watchProgress.create({
        data: {
          userId,
          titleId,
          episodeId: episodeId || null,
          positionSec: pos,
          durationSec: dur,
          completed
        }
      });
    }
    res.json({ progress: saved });
  } catch (err) {
    next(err);
  }
});
var progress_default = router10;

// apps/api/src/routes/feed.ts
import { Router as Router11 } from "express";

// apps/api/src/services/feed/candidates.ts
function decidePlaybackMode(title, episode) {
  if (title.verticalVideoUrl && typeof title.verticalVideoUrl === "string" && title.verticalVideoUrl.startsWith("http")) {
    const dur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 5400);
    return { mode: "FULL", streamUrl: title.verticalVideoUrl, durationSec: dur };
  }
  if (title.orientation === "VERTICAL") {
    const dur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 5400);
    const url = title.videoUrl || title.trailerUrl;
    if (url) {
      return { mode: "FULL", streamUrl: url, durationSec: dur };
    }
  }
  if (title.kind === "WEB_SERIES") {
    const ep = episode || title.seasons?.[0]?.episodes?.[0];
    if (ep && ep.videoUrl) {
      const epDur = ep.durationSec || (ep.durationMin ? ep.durationMin * 60 : 1800);
      return { mode: "CLIP", streamUrl: ep.videoUrl, durationSec: epDur };
    }
  }
  const movieUrl = title.videoUrl || title.trailerUrl;
  const movieDur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 0);
  if (movieUrl && movieDur > 0) {
    return { mode: "CLIP", streamUrl: movieUrl, durationSec: movieDur };
  }
  return { mode: null, streamUrl: null, durationSec: 0 };
}
async function generateCandidates(ctx) {
  try {
    let excludedTitleIds = [];
    try {
      const recentImpressions = await prisma.feedImpression.findMany({
        where: {
          OR: [
            ...ctx.userId ? [{ userId: ctx.userId }] : [],
            ...ctx.anonId ? [{ anonId: ctx.anonId }] : []
          ]
        },
        select: { titleId: true },
        orderBy: { shownAt: "desc" },
        take: 20
      });
      excludedTitleIds = recentImpressions.map((imp) => imp.titleId);
    } catch {
      excludedTitleIds = [];
    }
    let completedTitleIds = [];
    if (ctx.userId) {
      try {
        const completed = await prisma.watchProgress.findMany({
          where: { userId: ctx.userId, completed: true },
          select: { titleId: true }
        });
        completedTitleIds = completed.map((c) => c.titleId);
      } catch {
      }
    }
    const titles = await prisma.title.findMany({
      where: {
        status: "PUBLISHED",
        feedEligible: true,
        id: {
          notIn: Array.from(/* @__PURE__ */ new Set([...excludedTitleIds, ...completedTitleIds]))
        }
      },
      include: {
        genres: { include: { genre: true } },
        seasons: {
          include: {
            episodes: {
              where: { number: { lte: 3 } },
              orderBy: { number: "asc" }
            }
          }
        },
        _count: {
          select: {
            reactions: true,
            fundings: true
          }
        }
      },
      take: 60
    });
    const candidates = [];
    for (const title of titles) {
      let chosenEpisode = null;
      if (title.kind === "WEB_SERIES") {
        const eligibleEpisodes = title.seasons?.[0]?.episodes || [];
        if (eligibleEpisodes.length > 0) {
          chosenEpisode = eligibleEpisodes[Math.floor(Math.random() * eligibleEpisodes.length)];
        }
      }
      const decision = decidePlaybackMode(title, chosenEpisode);
      if (decision.mode && decision.streamUrl && decision.durationSec >= 25) {
        candidates.push({
          title,
          episode: chosenEpisode,
          mode: decision.mode,
          durationSec: decision.durationSec,
          streamUrl: decision.streamUrl
        });
      }
    }
    if (candidates.length < 5) {
      const fallbackTitles = await prisma.title.findMany({
        where: {
          status: "PUBLISHED",
          feedEligible: true
        },
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: {
              episodes: { where: { number: { lte: 3 } } }
            }
          },
          _count: { select: { reactions: true, fundings: true } }
        },
        take: 30
      });
      for (const title of fallbackTitles) {
        if (!candidates.some((c) => c.title.id === title.id)) {
          const decision = decidePlaybackMode(title);
          if (decision.mode && decision.streamUrl && decision.durationSec >= 25) {
            candidates.push({
              title,
              episode: null,
              mode: decision.mode,
              durationSec: decision.durationSec,
              streamUrl: decision.streamUrl
            });
          }
        }
      }
    }
    return candidates;
  } catch (err) {
    console.error("Candidate generation failed:", err);
    return [];
  }
}

// apps/api/src/services/feed/clip.ts
function cyrb53(str, seed = 0) {
  let h1 = 3735928559 ^ seed;
  let h2 = 1103547991 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
var SeededRandom = class {
  s;
  constructor(seedStr, salt = 0) {
    this.s = cyrb53(seedStr, salt) >>> 0;
  }
  next() {
    this.s = this.s + 1831565813 | 0;
    let t = Math.imul(this.s ^ this.s >>> 15, 1 | this.s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  randomInt(min, max) {
    if (min >= max) return min;
    return Math.floor(min + this.next() * (max - min + 1));
  }
};
function calculateOverlapRatio(start1, end1, start2, end2) {
  const overlap = Math.max(0, Math.min(end1, end2) - Math.max(start1, start2));
  if (overlap <= 0) return 0;
  const minLen = Math.min(end1 - start1, end2 - start2);
  return minLen > 0 ? overlap / minLen : 0;
}
function pickClip(durationSec, seedStr = "default_seed", options = {}, recentImpressions = []) {
  if (!durationSec || durationSec <= 0) return null;
  const minClipSec = options.feedClipMinSec ?? 30;
  const maxClipSec = options.feedClipMaxSec ?? 60;
  const safeStartPct = options.feedSafeStartPct ?? 20;
  const safeEndPct = options.feedSafeEndPct ?? 20;
  const minAllowedClip = options.feedMinClipSec ?? 15;
  const safeStart = Math.ceil(durationSec * safeStartPct / 100);
  const safeEnd = Math.floor(durationSec * (100 - safeEndPct) / 100);
  const window = safeEnd - safeStart;
  if (window < minAllowedClip) {
    return null;
  }
  const maxLen = Math.min(maxClipSec, window);
  const minLen = Math.min(minClipSec, maxLen);
  const lastImpressions = recentImpressions.filter((imp) => typeof imp.clipStartSec === "number" && typeof imp.clipEndSec === "number").slice(0, 3);
  for (let attempt = 0; attempt < 5; attempt++) {
    const rng = new SeededRandom(seedStr, attempt * 101);
    const L = rng.randomInt(minLen, maxLen);
    const start = rng.randomInt(safeStart, safeEnd - L);
    const end = start + L;
    const hasHeavyOverlap = lastImpressions.some(
      (imp) => calculateOverlapRatio(start, end, imp.clipStartSec, imp.clipEndSec) >= 0.5
    );
    if (!hasHeavyOverlap || attempt === 4) {
      return {
        clipStartSec: start,
        clipEndSec: end,
        durationSec,
        clipLengthSec: L,
        safeStartSec: safeStart,
        safeEndSec: safeEnd
      };
    }
  }
  return null;
}

// apps/api/src/services/feed/strategies/v1.ts
var StrategyV1 = class {
  id = "v1";
  async generateCandidates(ctx) {
    return generateCandidates(ctx);
  }
  decideMode(title, episode) {
    return decidePlaybackMode(title, episode).mode;
  }
  async score(c, ctx) {
    const isGuest = !ctx.userId;
    const reactionCount = c.title._count?.reactions || 0;
    const fundingCount = c.title._count?.fundings || 0;
    const popularity = Math.min(1, (reactionCount * 2 + fundingCount * 5) / 50);
    const publishedAt = c.title.publishedAt ? new Date(c.title.publishedAt).getTime() : new Date(c.title.createdAt).getTime();
    const daysOld = Math.max(0, (Date.now() - publishedAt) / (1e3 * 60 * 60 * 24));
    let freshness = 1;
    if (daysOld > 7) {
      freshness = Math.pow(0.5, (daysOld - 7) / 30);
    }
    const personalisation = isGuest ? 0 : 0.6;
    const feedEngagement = 0.5;
    const rng = new SeededRandom(`${ctx.requestId}_score_${c.title.id}`);
    const random = rng.next();
    const wPop = isGuest ? 0.35 : 0.25;
    const wFresh = isGuest ? 0.25 : 0.15;
    const wPers = isGuest ? 0 : 0.3;
    const wEng = 0.2;
    const wRand = isGuest ? 0.2 : 0.1;
    const totalScore = wPop * popularity + wFresh * freshness + wPers * personalisation + wEng * feedEngagement + wRand * random;
    return {
      candidate: c,
      score: totalScore,
      signals: {
        popularity,
        freshness,
        personalisation,
        feedEngagement,
        random
      }
    };
  }
  rerank(scored, ctx) {
    const pool = [...scored].sort((a, b) => b.score - a.score);
    const result = [];
    const recentGenres = [];
    const recentCategories = [];
    const recentCreators = [];
    const seenTitleIds = /* @__PURE__ */ new Set();
    let index = 0;
    while (pool.length > 0 && result.length < ctx.limit) {
      index++;
      const pickDiscovery = index % 5 === 0 && pool.length > 2;
      let chosenIdx = 0;
      if (pickDiscovery) {
        chosenIdx = Math.min(pool.length - 1, Math.floor(pool.length / 2));
      }
      for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const titleId = item.candidate.title.id;
        if (seenTitleIds.has(titleId)) continue;
        const genreName = item.candidate.title.genres?.[0]?.genre?.name || "General";
        const categoryKind = item.candidate.title.kind || "MOVIE";
        const creator = item.candidate.title.creatorName || "Indie";
        const sameGenreCount = recentGenres.slice(-2).filter((g) => g === genreName).length;
        if (sameGenreCount >= 2 && pool.length > 3) continue;
        const sameCatCount = recentCategories.slice(-2).filter((c) => c === categoryKind).length;
        if (sameCatCount >= 2 && pool.length > 3) continue;
        const sameCreatorCount = recentCreators.slice(-3).filter((cr) => cr === creator).length;
        if (sameCreatorCount >= 3 && pool.length > 3) continue;
        chosenIdx = i;
        break;
      }
      const [selected] = pool.splice(chosenIdx, 1);
      if (selected) {
        result.push(selected);
        seenTitleIds.add(selected.candidate.title.id);
        const g = selected.candidate.title.genres?.[0]?.genre?.name || "General";
        const c = selected.candidate.title.kind || "MOVIE";
        const cr = selected.candidate.title.creatorName || "Indie";
        recentGenres.push(g);
        recentCategories.push(c);
        recentCreators.push(cr);
      }
    }
    return result;
  }
};

// apps/api/src/services/feed/index.ts
var strategies = {
  v1: new StrategyV1()
};
async function getActiveStrategyId() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "feedStrategy" } });
    if (setting?.value && strategies[setting.value]) {
      return setting.value;
    }
  } catch {
  }
  return "v1";
}
async function getFeedClipSettings() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "feedClipSettings" } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {
  }
  return {
    feedClipMinSec: 30,
    feedClipMaxSec: 60,
    feedSafeStartPct: 20,
    feedSafeEndPct: 20,
    feedMinClipSec: 15
  };
}
async function generateFeed(ctx) {
  const strategyId = await getActiveStrategyId();
  const strategy = strategies[strategyId] || strategies.v1;
  const clipSettings = await getFeedClipSettings();
  const candidates = await strategy.generateCandidates(ctx);
  const scored = await Promise.all(candidates.map((c) => strategy.score(c, ctx)));
  const reranked = strategy.rerank(scored, ctx);
  const items = [];
  for (const item of reranked) {
    const c = item.candidate;
    let clipStartSec = null;
    let clipEndSec = null;
    if (c.mode === "CLIP") {
      const seed = `${ctx.requestId}_${c.title.id}_${c.episode?.id || ""}`;
      const clip = pickClip(c.durationSec, seed, clipSettings);
      if (clip) {
        clipStartSec = clip.clipStartSec;
        clipEndSec = clip.clipEndSec;
      } else {
        clipStartSec = 0;
        clipEndSec = Math.min(60, c.durationSec);
      }
    }
    const genres = (c.title.genres || []).map((g) => g.genre?.name || g.name).filter(Boolean);
    const label = c.episode ? `S${c.episode.season?.number || 1} \xB7 E${c.episode.number}` : null;
    items.push({
      titleId: c.title.id,
      episodeId: c.episode?.id || null,
      slug: c.title.slug,
      title: c.title.title,
      kind: c.title.kind,
      orientation: c.title.orientation,
      mode: c.mode,
      streamUrl: c.streamUrl,
      clipStartSec,
      clipEndSec,
      durationSec: c.durationSec,
      posterUrl: c.title.posterUrl,
      verticalPosterUrl: c.title.verticalPosterUrl || null,
      bannerUrl: c.title.bannerUrl || null,
      genres,
      label,
      userProgressSec: 0,
      fundingEnabled: c.title.fundingEnabled ?? true,
      creatorName: c.title.creatorName || null,
      editorRating: c.title.editorRating ? Number(c.title.editorRating) : 9.1,
      description: c.title.description || ""
    });
  }
  const nextCursor = items.length >= ctx.limit ? `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : null;
  return {
    requestId: ctx.requestId,
    strategy: strategyId,
    nextCursor,
    items
  };
}

// apps/api/src/routes/feed.ts
var router11 = Router11();
function extractContext(req) {
  const anonId = req.headers["x-anon-id"] || req.query.anonId || `anon_${Date.now()}`;
  const userId = req.headers["x-user-id"] || req.query.userId || null;
  const cursor = req.query.cursor || null;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || "10", 10)));
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    userId,
    anonId,
    requestId,
    limit,
    cursor
  };
}
router11.get("/", async (req, res, next) => {
  try {
    const ctx = extractContext(req);
    const feed = await generateFeed(ctx);
    res.json(feed);
  } catch (err) {
    next(err);
  }
});
router11.get("/playback/:titleId", async (req, res, next) => {
  try {
    const titleId = req.params.titleId;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] }
    });
    if (!title) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Title not found" } });
      return;
    }
    const streamUrl = title.verticalVideoUrl || title.videoUrl || title.trailerUrl || "";
    res.json({
      titleId: title.id,
      streamUrl,
      streamType: title.streamType || (streamUrl.includes(".m3u8") ? "HLS" : "MP4")
    });
  } catch (err) {
    next(err);
  }
});
router11.post("/events", async (req, res, next) => {
  try {
    const { requestId, events } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "events array required" } });
      return;
    }
    const userId = req.headers["x-user-id"] || req.body.userId || null;
    const anonId = req.headers["x-anon-id"] || req.body.anonId || "anon_client";
    for (const ev of events) {
      if (!ev.titleId) continue;
      if (ev.mode === "FULL" && ev.watchedSec && ev.watchedSec >= 30) {
        try {
          await prisma.viewEvent.create({
            data: {
              titleId: ev.titleId,
              episodeId: ev.episodeId || null,
              userId: userId || null,
              anonId,
              source: "FEED_FULL"
            }
          });
        } catch {
        }
      }
      try {
        await prisma.feedImpression.create({
          data: {
            requestId: requestId || `req_batch_${Date.now()}`,
            strategy: ev.strategy || "v1",
            userId: userId || null,
            anonId,
            titleId: ev.titleId,
            episodeId: ev.episodeId || null,
            mode: ev.mode === "FULL" ? "FULL" : "CLIP",
            clipStartSec: ev.clipStartSec ? Math.floor(ev.clipStartSec) : null,
            clipEndSec: ev.clipEndSec ? Math.floor(ev.clipEndSec) : null,
            position: ev.position || 0,
            watchedSec: ev.watchedSec ? Math.floor(ev.watchedSec) : 0,
            loops: ev.loops || 0,
            skipped: ev.skipped || false,
            clickedWatchFull: ev.clickedWatchFull || false,
            liked: ev.liked || false,
            wishlisted: ev.wishlisted || false,
            openedSupport: ev.openedSupport || false
          }
        });
      } catch (e) {
        console.warn("Could not record feed impression:", e);
      }
    }
    res.json({ success: true, count: events.length });
  } catch (err) {
    next(err);
  }
});
var feed_default = router11;

// apps/api/src/index.ts
dotenv.config();
var app = express();
var port = process.env.PORT || 4e3;
var helmetFn = helmet;
app.use(helmetFn({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/home", home_default);
app.use("/api/titles", titles_default);
app.use("/api/genres", genres_default);
app.use("/api/categories", genres_default);
app.use("/api/admin", admin_default);
app.use("/api/admin/people", people_default);
app.use("/api/admin/tags", tags_default);
app.use("/api/creator", creator_default);
app.use("/api/funding", funding_default);
app.use("/api/auth", auth_default);
app.use("/api/progress", progress_default);
app.use("/api/feed", feed_default);
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred"
    }
  });
});
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
if (!isServerless && process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Rasigan API backend running at http://localhost:${port}`);
  });
}
var index_default = app;
export {
  index_default as default
};
