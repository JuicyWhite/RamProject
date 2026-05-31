import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Org
  const org = await db.organization.upsert({
    where: { slug: "ascend-demo" },
    create: { name: "Ascend Demo Org", slug: "ascend-demo", plan: "pro" },
    update: {},
  });

  // Demo user
  const user = await db.user.upsert({
    where: { email: "demo@ascend.app" },
    create: {
      email: "demo@ascend.app",
      name: "Demo Estimator",
      emailVerified: new Date(),
    },
    update: {},
  });

  await db.orgMembership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    create: { userId: user.id, orgId: org.id, role: "OWNER" },
    update: {},
  });

  // Rate library
  const rates = [
    // Labor
    { code: "LAB-001", description: "Construction Foreman", category: "LABOR" as const, unit: "day", unitRate: 1200 },
    { code: "LAB-002", description: "Skilled Construction Worker", category: "LABOR" as const, unit: "day", unitRate: 900 },
    { code: "LAB-003", description: "Unskilled Laborer", category: "LABOR" as const, unit: "day", unitRate: 600 },
    { code: "LAB-004", description: "Carpenter", category: "LABOR" as const, unit: "day", unitRate: 950 },
    { code: "LAB-005", description: "Mason / Plasterer", category: "LABOR" as const, unit: "day", unitRate: 900 },
    { code: "LAB-006", description: "Welder", category: "LABOR" as const, unit: "day", unitRate: 1100 },
    { code: "LAB-007", description: "Electrician (Journeyman)", category: "LABOR" as const, unit: "day", unitRate: 1050 },
    { code: "LAB-008", description: "Plumber", category: "LABOR" as const, unit: "day", unitRate: 1000 },
    { code: "LAB-009", description: "Painter", category: "LABOR" as const, unit: "day", unitRate: 800 },
    { code: "LAB-010", description: "Steel Bar Bender / Layer", category: "LABOR" as const, unit: "day", unitRate: 900 },

    // Materials
    { code: "MAT-001", description: "Portland Cement (40 kg bag)", category: "MATERIAL" as const, unit: "bag", unitRate: 285 },
    { code: "MAT-002", description: "Sand (Washed River Sand)", category: "MATERIAL" as const, unit: "m3", unitRate: 1200 },
    { code: "MAT-003", description: "Gravel (3/4\" crushed stone)", category: "MATERIAL" as const, unit: "m3", unitRate: 1400 },
    { code: "MAT-004", description: "Deformed Bar 10mm (6m)", category: "MATERIAL" as const, unit: "pcs", unitRate: 280 },
    { code: "MAT-005", description: "Deformed Bar 12mm (6m)", category: "MATERIAL" as const, unit: "pcs", unitRate: 380 },
    { code: "MAT-006", description: "Deformed Bar 16mm (6m)", category: "MATERIAL" as const, unit: "pcs", unitRate: 680 },
    { code: "MAT-007", description: "Deformed Bar 20mm (6m)", category: "MATERIAL" as const, unit: "pcs", unitRate: 1050 },
    { code: "MAT-008", description: "GI Wire #16 (1 kg)", category: "MATERIAL" as const, unit: "kg", unitRate: 110 },
    { code: "MAT-009", description: "Plywood 1/2\" Marine (4x8)", category: "MATERIAL" as const, unit: "sheet", unitRate: 950 },
    { code: "MAT-010", description: "Form Lumber 2\"x3\"x12'", category: "MATERIAL" as const, unit: "pcs", unitRate: 185 },
    { code: "MAT-011", description: "Hollow Block 4\" (CHB)", category: "MATERIAL" as const, unit: "pcs", unitRate: 16 },
    { code: "MAT-012", description: "Hollow Block 6\" (CHB)", category: "MATERIAL" as const, unit: "pcs", unitRate: 22 },
    { code: "MAT-013", description: "Paint (Latex, 4-liter pail)", category: "MATERIAL" as const, unit: "pail", unitRate: 720 },
    { code: "MAT-014", description: "Waterproofing (Elastomeric)", category: "MATERIAL" as const, unit: "L", unitRate: 420 },
    { code: "MAT-015", description: "6\" PVC Pipe (6m length)", category: "MATERIAL" as const, unit: "length", unitRate: 880 },
    { code: "MAT-016", description: "4\" PVC Pipe (6m length)", category: "MATERIAL" as const, unit: "length", unitRate: 440 },
    { code: "MAT-017", description: "Structural Steel (A36) per kg", category: "MATERIAL" as const, unit: "kg", unitRate: 75 },
    { code: "MAT-018", description: "GI Corrugated Sheet G26 (3m)", category: "MATERIAL" as const, unit: "sheet", unitRate: 480 },

    // Equipment
    { code: "EQP-001", description: "One-Bagger Mixer (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 800 },
    { code: "EQP-002", description: "Backhoe / Pay Loader (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 8500 },
    { code: "EQP-003", description: "Dump Truck (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 5500 },
    { code: "EQP-004", description: "Plate Compactor (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 750 },
    { code: "EQP-005", description: "Scaffolding Set (monthly)", category: "EQUIPMENT" as const, unit: "mo", unitRate: 1800 },
    { code: "EQP-006", description: "Concrete Vibrator (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 400 },
    { code: "EQP-007", description: "Bar Cutter & Bender Set", category: "EQUIPMENT" as const, unit: "day", unitRate: 600 },
    { code: "EQP-008", description: "Welding Machine (rental/day)", category: "EQUIPMENT" as const, unit: "day", unitRate: 500 },
  ];

  for (const rate of rates) {
    const existing = await db.rateItem.findFirst({
      where: { orgId: org.id, code: rate.code },
    });
    if (!existing) {
      await db.rateItem.create({
        data: { ...rate, orgId: org.id },
      });
    }
  }

  // Demo project
  const project = await db.project.upsert({
    where: { id: "demo-project-001" },
    create: {
      id: "demo-project-001",
      orgId: org.id,
      code: "PRJ-2024-001",
      name: "DPWH Road Widening — Marikina Access Road",
      client: "Department of Public Works and Highways",
      location: "Marikina City, Metro Manila",
      region: "NCR",
      contractType: "GOVERNMENT",
      philgepsRef: "7891234",
      status: "ACTIVE",
      description:
        "Road widening project covering 2.4 km stretch of the Marikina access road including drainage improvements, road surfacing, and safety signage installation.",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-12-31"),
      budget: 45_000_000,
      contractAmount: 43_200_000,
      overheadPct: 12,
      profitPct: 8,
      vatPct: 12,
    },
    update: {},
  });

  // WBS structure
  const rateMap = new Map<string, string>();
  const allRates = await db.rateItem.findMany({ where: { orgId: org.id } });
  for (const r of allRates) {
    if (r.code) rateMap.set(r.code, r.id);
  }

  const wbsGroups = [
    {
      code: "1",
      description: "General Requirements",
      unit: "ls",
      isGroup: true,
      sortOrder: 0,
      children: [
        {
          code: "1.1",
          description: "Mobilization & Demobilization",
          unit: "ls",
          quantity: 1,
          sortOrder: 0,
          rates: ["LAB-001", "EQP-003"],
        },
        {
          code: "1.2",
          description: "Traffic Management & Safety",
          unit: "mo",
          quantity: 9,
          sortOrder: 1,
          rates: ["LAB-003"],
        },
      ],
    },
    {
      code: "2",
      description: "Earthworks",
      unit: "m3",
      isGroup: true,
      sortOrder: 1,
      children: [
        {
          code: "2.1",
          description: "Clearing & Grubbing",
          unit: "m2",
          quantity: 14400,
          sortOrder: 0,
          rates: ["LAB-003", "EQP-002"],
        },
        {
          code: "2.2",
          description: "Roadway Excavation",
          unit: "m3",
          quantity: 5760,
          sortOrder: 1,
          rates: ["EQP-002", "EQP-003"],
        },
        {
          code: "2.3",
          description: "Embankment from Borrow",
          unit: "m3",
          quantity: 2400,
          sortOrder: 2,
          rates: ["EQP-002", "EQP-004", "LAB-003"],
        },
      ],
    },
    {
      code: "3",
      description: "Subbase & Base Course",
      unit: "m3",
      isGroup: true,
      sortOrder: 2,
      children: [
        {
          code: "3.1",
          description: "Aggregate Subbase Course (ASBC)",
          unit: "m3",
          quantity: 3600,
          sortOrder: 0,
          rates: ["MAT-003", "EQP-004", "LAB-003"],
        },
        {
          code: "3.2",
          description: "Crushed Aggregate Base Course",
          unit: "m3",
          quantity: 2400,
          sortOrder: 1,
          rates: ["MAT-003", "EQP-004", "LAB-002"],
        },
      ],
    },
    {
      code: "4",
      description: "Concrete Works",
      unit: "m3",
      isGroup: true,
      sortOrder: 3,
      children: [
        {
          code: "4.1",
          description: "Portland Cement Concrete Pavement (PCCP) 250mm",
          unit: "m2",
          quantity: 12000,
          sortOrder: 0,
          rates: ["MAT-001", "MAT-002", "MAT-003", "LAB-001", "LAB-002", "LAB-003", "EQP-001", "EQP-006"],
        },
        {
          code: "4.2",
          description: "Concrete Curb & Gutter (Class A)",
          unit: "m",
          quantity: 4800,
          sortOrder: 1,
          rates: ["MAT-001", "MAT-002", "MAT-003", "LAB-005", "LAB-003"],
        },
      ],
    },
    {
      code: "5",
      description: "Drainage Works",
      unit: "ls",
      isGroup: true,
      sortOrder: 4,
      children: [
        {
          code: "5.1",
          description: "Reinforced Concrete Pipe Culvert (RCPC) 900mm dia",
          unit: "m",
          quantity: 120,
          sortOrder: 0,
          rates: ["LAB-002", "LAB-003", "EQP-002"],
        },
        {
          code: "5.2",
          description: "Catch Basin (Standard Type)",
          unit: "pcs",
          quantity: 48,
          sortOrder: 1,
          rates: ["MAT-001", "MAT-002", "MAT-003", "MAT-011", "LAB-005", "LAB-003"],
        },
      ],
    },
  ];

  for (const group of wbsGroups) {
    let parentItem = await db.wbsItem.findFirst({
      where: { projectId: project.id, wbsCode: group.code },
    });

    if (!parentItem) {
      parentItem = await db.wbsItem.create({
        data: {
          projectId: project.id,
          wbsCode: group.code,
          description: group.description,
          unit: group.unit ?? null,
          isGroup: true,
          sortOrder: group.sortOrder,
        },
      });
    }

    for (const child of group.children) {
      let childItem = await db.wbsItem.findFirst({
        where: { projectId: project.id, wbsCode: child.code },
      });

      if (!childItem) {
        childItem = await db.wbsItem.create({
          data: {
            projectId: project.id,
            parentId: parentItem.id,
            wbsCode: child.code,
            description: child.description,
            unit: child.unit,
            quantity: child.quantity,
            isGroup: false,
            sortOrder: child.sortOrder,
          },
        });
      }

      for (let i = 0; i < child.rates.length; i++) {
        const rateCode = child.rates[i];
        const rateId = rateMap.get(rateCode);
        if (!rateId) continue;

        const existing = await db.estimateLineItem.findFirst({
          where: { wbsItemId: childItem.id, rateItemId: rateId },
        });
        if (!existing) {
          await db.estimateLineItem.create({
            data: {
              wbsItemId: childItem.id,
              rateItemId: rateId,
              sortOrder: i,
            },
          });
        }
      }
    }
  }

  console.log("✅ Seed complete");
  console.log("   Demo login: demo@ascend.app");
  console.log("   Use email magic link (configure EMAIL_SERVER in .env)");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
