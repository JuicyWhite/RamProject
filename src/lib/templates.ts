export interface TemplateWbsItem {
  description: string;
  isGroup: boolean;
  children?: TemplateWbsItem[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  items: TemplateWbsItem[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start with an empty WBS and build your estimate from scratch.",
    items: [],
  },
  {
    id: "2-storey-residential",
    name: "2-Storey Residential Building",
    description: "Standard WBS for a 2-storey house in the Philippines, from site work to finishing.",
    items: [
      {
        description: "I. Site Works & Earthworks",
        isGroup: true,
        children: [
          { description: "Site clearing and grubbing", isGroup: false },
          { description: "Excavation and grading", isGroup: false },
          { description: "Backfilling and compaction", isGroup: false },
        ],
      },
      {
        description: "II. Foundation Works",
        isGroup: true,
        children: [
          { description: "Footing excavation", isGroup: false },
          { description: "Reinforced concrete footings", isGroup: false },
          { description: "Foundation walls / grade beams", isGroup: false },
        ],
      },
      {
        description: "III. Concrete Structural Works",
        isGroup: true,
        children: [
          { description: "Ground floor slab on grade", isGroup: false },
          { description: "Columns (1F)", isGroup: false },
          { description: "Beams and girders (1F)", isGroup: false },
          { description: "2nd floor slab", isGroup: false },
          { description: "Columns (2F)", isGroup: false },
          { description: "Beams and girders (2F)", isGroup: false },
          { description: "Roof deck / Roof beams", isGroup: false },
        ],
      },
      {
        description: "IV. Masonry Works",
        isGroup: true,
        children: [
          { description: "CHB wall laying (1F)", isGroup: false },
          { description: "CHB wall laying (2F)", isGroup: false },
          { description: "Plastering", isGroup: false },
        ],
      },
      {
        description: "V. Roofing Works",
        isGroup: true,
        children: [
          { description: "Roof framing (wood / steel)", isGroup: false },
          { description: "Roofing sheets / tiles", isGroup: false },
          { description: "Gutters and downspouts", isGroup: false },
        ],
      },
      {
        description: "VI. Doors & Windows",
        isGroup: true,
        children: [
          { description: "Door frames and doors", isGroup: false },
          { description: "Window frames and glass", isGroup: false },
        ],
      },
      {
        description: "VII. Electrical Works",
        isGroup: true,
        children: [
          { description: "Rough-in wiring and conduits", isGroup: false },
          { description: "Panel board and breakers", isGroup: false },
          { description: "Outlets, switches, and fixtures", isGroup: false },
        ],
      },
      {
        description: "VIII. Plumbing Works",
        isGroup: true,
        children: [
          { description: "Rough-in pipes (supply)", isGroup: false },
          { description: "Rough-in pipes (drain/sewer)", isGroup: false },
          { description: "Fixtures and fittings", isGroup: false },
        ],
      },
      {
        description: "IX. Tile Works",
        isGroup: true,
        children: [
          { description: "Floor tiles (1F)", isGroup: false },
          { description: "Floor tiles (2F)", isGroup: false },
          { description: "Wall tiles (bathrooms)", isGroup: false },
        ],
      },
      {
        description: "X. Painting & Finishing",
        isGroup: true,
        children: [
          { description: "Interior painting", isGroup: false },
          { description: "Exterior painting", isGroup: false },
          { description: "Ceiling works", isGroup: false },
        ],
      },
      {
        description: "XI. Miscellaneous & Overhead",
        isGroup: true,
        children: [
          { description: "Permits and fees", isGroup: false },
          { description: "Temporary facilities", isGroup: false },
          { description: "Mobilization / Demobilization", isGroup: false },
        ],
      },
    ],
  },
  {
    id: "standard-construction",
    name: "Standard Construction",
    description: "General WBS for building projects in the Philippines, from pre-bidding to warranty.",
    items: [
      {
        description: "A. Pre-Construction",
        isGroup: true,
        children: [
          { description: "Design and engineering fees", isGroup: false },
          { description: "Permits and government fees", isGroup: false },
          { description: "Site survey and soil testing", isGroup: false },
          { description: "Temporary facilities", isGroup: false },
        ],
      },
      {
        description: "B. Site Development",
        isGroup: true,
        children: [
          { description: "Site clearing", isGroup: false },
          { description: "Earthworks and grading", isGroup: false },
          { description: "Temporary access roads", isGroup: false },
        ],
      },
      {
        description: "C. Structural Works",
        isGroup: true,
        children: [
          { description: "Foundation", isGroup: false },
          { description: "Structural concrete", isGroup: false },
          { description: "Structural steel", isGroup: false },
          { description: "Masonry", isGroup: false },
        ],
      },
      {
        description: "D. Architectural Works",
        isGroup: true,
        children: [
          { description: "Roofing", isGroup: false },
          { description: "Doors and windows", isGroup: false },
          { description: "Ceiling works", isGroup: false },
          { description: "Flooring", isGroup: false },
          { description: "Painting", isGroup: false },
        ],
      },
      {
        description: "E. MEP Works",
        isGroup: true,
        children: [
          { description: "Electrical works", isGroup: false },
          { description: "Plumbing works", isGroup: false },
          { description: "HVAC / Mechanical", isGroup: false },
          { description: "Fire protection", isGroup: false },
        ],
      },
      {
        description: "F. Exterior Works",
        isGroup: true,
        children: [
          { description: "Landscaping", isGroup: false },
          { description: "Perimeter fence / gate", isGroup: false },
          { description: "Driveway and parking", isGroup: false },
        ],
      },
      {
        description: "G. Contingency & Overhead",
        isGroup: true,
        children: [
          { description: "Mobilization / Demobilization", isGroup: false },
          { description: "Contingency allowance", isGroup: false },
        ],
      },
    ],
  },
  {
    id: "pre-construction",
    name: "Pre-Construction & Mobilization",
    description: "Project setup, documentation, and site mobilization tasks.",
    items: [
      {
        description: "1. Project Setup",
        isGroup: true,
        children: [
          { description: "Project planning and scheduling", isGroup: false },
          { description: "Contract review and signing", isGroup: false },
          { description: "Design coordination", isGroup: false },
        ],
      },
      {
        description: "2. Permits & Compliance",
        isGroup: true,
        children: [
          { description: "Building permit application", isGroup: false },
          { description: "DPWH / LGU clearances", isGroup: false },
          { description: "Environmental compliance", isGroup: false },
          { description: "Fire safety permit", isGroup: false },
        ],
      },
      {
        description: "3. Site Mobilization",
        isGroup: true,
        children: [
          { description: "Site office setup", isGroup: false },
          { description: "Temporary fencing and signage", isGroup: false },
          { description: "Temporary utilities (power, water)", isGroup: false },
          { description: "Material storage area", isGroup: false },
          { description: "Equipment mobilization", isGroup: false },
        ],
      },
      {
        description: "4. Safety Setup",
        isGroup: true,
        children: [
          { description: "Safety officer assignment", isGroup: false },
          { description: "Safety signage and PPE", isGroup: false },
          { description: "Safety orientation / toolbox talk", isGroup: false },
          { description: "First aid station", isGroup: false },
        ],
      },
    ],
  },
  {
    id: "road-widening",
    name: "Road Widening / Pavement",
    description: "WBS for DPWH-style road widening and pavement projects.",
    items: [
      {
        description: "Part A – Facilities for the Engineer",
        isGroup: true,
        children: [
          { description: "Field office and laboratory", isGroup: false },
          { description: "Survey equipment", isGroup: false },
        ],
      },
      {
        description: "Part B – Other General Requirements",
        isGroup: true,
        children: [
          { description: "Mobilization and demobilization", isGroup: false },
          { description: "Traffic management", isGroup: false },
          { description: "Safety and health", isGroup: false },
        ],
      },
      {
        description: "Part C – Earthworks",
        isGroup: true,
        children: [
          { description: "Clearing and grubbing", isGroup: false },
          { description: "Roadway excavation", isGroup: false },
          { description: "Embankment", isGroup: false },
          { description: "Subgrade preparation", isGroup: false },
        ],
      },
      {
        description: "Part D – Sub-Base and Base Course",
        isGroup: true,
        children: [
          { description: "Aggregate sub-base course", isGroup: false },
          { description: "Aggregate base course", isGroup: false },
        ],
      },
      {
        description: "Part E – Surface Course",
        isGroup: true,
        children: [
          { description: "PCCP (Portland Cement Concrete Pavement)", isGroup: false },
          { description: "Asphalt concrete overlay", isGroup: false },
        ],
      },
      {
        description: "Part F – Drainage and Slope Protection",
        isGroup: true,
        children: [
          { description: "Catch basins and inlets", isGroup: false },
          { description: "Culverts", isGroup: false },
          { description: "Canal lining", isGroup: false },
          { description: "Riprap", isGroup: false },
        ],
      },
      {
        description: "Part G – Miscellaneous Structures",
        isGroup: true,
        children: [
          { description: "Road signs and markings", isGroup: false },
          { description: "Guard rails", isGroup: false },
          { description: "Street lighting", isGroup: false },
        ],
      },
    ],
  },
];
