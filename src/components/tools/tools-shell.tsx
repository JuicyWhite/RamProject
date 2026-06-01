"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

// ── Unit Converter ──────────────────────────────────────────────────────────

type UnitDef = { value: string; label: string; factor: number };
type UnitCat = { label: string; units: UnitDef[] };

const UNIT_CATS: Record<string, UnitCat> = {
  length: {
    label: "Length",
    units: [
      { value: "mm", label: "Millimeter (mm)", factor: 0.001 },
      { value: "cm", label: "Centimeter (cm)", factor: 0.01 },
      { value: "m", label: "Meter (m)", factor: 1 },
      { value: "km", label: "Kilometer (km)", factor: 1000 },
      { value: "in", label: "Inch (in)", factor: 0.0254 },
      { value: "ft", label: "Foot (ft)", factor: 0.3048 },
      { value: "yd", label: "Yard (yd)", factor: 0.9144 },
      { value: "mi", label: "Mile (mi)", factor: 1609.344 },
    ],
  },
  area: {
    label: "Area",
    units: [
      { value: "mm2", label: "mm²", factor: 1e-6 },
      { value: "cm2", label: "cm²", factor: 1e-4 },
      { value: "m2", label: "m²", factor: 1 },
      { value: "km2", label: "km²", factor: 1e6 },
      { value: "in2", label: "in²", factor: 6.4516e-4 },
      { value: "ft2", label: "ft²", factor: 0.092903 },
      { value: "yd2", label: "yd²", factor: 0.836127 },
      { value: "ac", label: "Acre (ac)", factor: 4046.86 },
      { value: "ha", label: "Hectare (ha)", factor: 10000 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { value: "mm3", label: "mm³", factor: 1e-9 },
      { value: "cm3", label: "cm³ / mL", factor: 1e-6 },
      { value: "L", label: "Liter (L)", factor: 0.001 },
      { value: "m3", label: "m³", factor: 1 },
      { value: "in3", label: "in³", factor: 1.63871e-5 },
      { value: "ft3", label: "ft³", factor: 0.028317 },
      { value: "yd3", label: "yd³", factor: 0.764555 },
      { value: "gal", label: "Gallon US (gal)", factor: 0.003785 },
    ],
  },
  mass: {
    label: "Mass / Weight",
    units: [
      { value: "g", label: "Gram (g)", factor: 0.001 },
      { value: "kg", label: "Kilogram (kg)", factor: 1 },
      { value: "t", label: "Metric Ton (t)", factor: 1000 },
      { value: "oz", label: "Ounce (oz)", factor: 0.028350 },
      { value: "lb", label: "Pound (lb)", factor: 0.453592 },
      { value: "ton_us", label: "Short Ton (US)", factor: 907.185 },
    ],
  },
  pressure: {
    label: "Pressure / Stress",
    units: [
      { value: "Pa", label: "Pascal (Pa)", factor: 1 },
      { value: "kPa", label: "Kilopascal (kPa)", factor: 1000 },
      { value: "MPa", label: "Megapascal (MPa)", factor: 1e6 },
      { value: "GPa", label: "Gigapascal (GPa)", factor: 1e9 },
      { value: "psi", label: "psi (lbf/in²)", factor: 6894.76 },
      { value: "ksi", label: "ksi (kip/in²)", factor: 6894760 },
      { value: "bar", label: "Bar", factor: 100000 },
      { value: "atm", label: "Atmosphere (atm)", factor: 101325 },
    ],
  },
  force: {
    label: "Force",
    units: [
      { value: "N", label: "Newton (N)", factor: 1 },
      { value: "kN", label: "Kilonewton (kN)", factor: 1000 },
      { value: "MN", label: "Meganewton (MN)", factor: 1e6 },
      { value: "lbf", label: "Pound-force (lbf)", factor: 4.44822 },
      { value: "kip", label: "Kip", factor: 4448.22 },
      { value: "tonf", label: "Ton-force (US)", factor: 8896.44 },
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { value: "C", label: "Celsius (°C)", factor: 1 },
      { value: "F", label: "Fahrenheit (°F)", factor: 1 },
      { value: "K", label: "Kelvin (K)", factor: 1 },
    ],
  },
};

function toBase(value: number, unit: string, cat: string): number {
  if (cat === "temperature") {
    if (unit === "C") return value;
    if (unit === "F") return (value - 32) * 5 / 9;
    return value - 273.15;
  }
  const u = UNIT_CATS[cat].units.find((x) => x.value === unit);
  return u ? value * u.factor : NaN;
}

function fromBase(base: number, unit: string, cat: string): number {
  if (cat === "temperature") {
    if (unit === "C") return base;
    if (unit === "F") return base * 9 / 5 + 32;
    return base + 273.15;
  }
  const u = UNIT_CATS[cat].units.find((x) => x.value === unit);
  return u ? base / u.factor : NaN;
}

function UnitConverter() {
  const [cat, setCat] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [input, setInput] = useState("1");

  const units = UNIT_CATS[cat].units;

  function handleCatChange(newCat: string) {
    setCat(newCat);
    setFromUnit(UNIT_CATS[newCat].units[0].value);
    setToUnit(UNIT_CATS[newCat].units[1]?.value ?? UNIT_CATS[newCat].units[0].value);
    setInput("1");
  }

  const result = useMemo(() => {
    const num = parseFloat(input);
    if (isNaN(num)) return "";
    const base = toBase(num, fromUnit, cat);
    const out = fromBase(base, toUnit, cat);
    if (isNaN(out)) return "";
    const abs = Math.abs(out);
    if (abs === 0) return "0";
    if (abs >= 1e-4 && abs < 1e7) return parseFloat(out.toPrecision(8)).toString();
    return out.toExponential(6);
  }, [input, fromUnit, toUnit, cat]);

  const fromLabel = units.find((u) => u.value === fromUnit)?.label ?? fromUnit;
  const toLabel = units.find((u) => u.value === toUnit)?.label ?? toUnit;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(UNIT_CATS).map(([key, c]) => (
            <button
              key={key}
              onClick={() => handleCatChange(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                cat === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter value"
          />
        </div>

        <div className="space-y-1.5">
          <Label>To</Label>
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex h-9 items-center rounded-md border border-border bg-muted/30 px-3 text-sm tabular font-medium">
            {result || <span className="text-muted-foreground">—</span>}
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-md border border-border bg-surface p-3 text-sm">
          <span className="font-semibold tabular">{input}</span>{" "}
          <span className="text-muted-foreground">{fromLabel}</span>{" "}
          <span className="text-muted-foreground mx-1">=</span>{" "}
          <span className="font-semibold tabular text-primary">{result}</span>{" "}
          <span className="text-muted-foreground">{toLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Formula Library ─────────────────────────────────────────────────────────

type Formula = {
  name: string;
  formula: string;
  vars: string;
  category: string;
};

const FORMULAS: Formula[] = [
  // Geometry
  { name: "Rectangle Area", formula: "A = L × W", vars: "A = area, L = length, W = width", category: "Geometry" },
  { name: "Circle Area", formula: "A = π r²", vars: "A = area, r = radius, π = 3.14159", category: "Geometry" },
  { name: "Triangle Area", formula: "A = ½ b h", vars: "A = area, b = base, h = height", category: "Geometry" },
  { name: "Trapezoid Area", formula: "A = ½ (a + b) h", vars: "a, b = parallel sides, h = height", category: "Geometry" },
  { name: "Circle Circumference", formula: "C = 2πr = πD", vars: "r = radius, D = diameter", category: "Geometry" },
  { name: "Rectangular Volume", formula: "V = L × W × H", vars: "V = volume, L = length, W = width, H = height", category: "Geometry" },
  { name: "Cylinder Volume", formula: "V = π r² h", vars: "r = radius, h = height", category: "Geometry" },
  { name: "Sphere Volume", formula: "V = (4/3) π r³", vars: "r = radius", category: "Geometry" },
  { name: "Cone Volume", formula: "V = (1/3) π r² h", vars: "r = base radius, h = height", category: "Geometry" },
  { name: "Pythagorean Theorem", formula: "c² = a² + b²", vars: "c = hypotenuse, a, b = legs", category: "Geometry" },

  // Concrete
  { name: "Modulus of Elasticity (SI)", formula: "Ec = 4700 √f'c", vars: "Ec = MPa, f'c = compressive strength (MPa)", category: "Concrete" },
  { name: "Modulus of Elasticity (US)", formula: "Ec = 57,000 √f'c", vars: "Ec = psi, f'c = compressive strength (psi)", category: "Concrete" },
  { name: "Strength Conversion", formula: "f'c (psi) = f'c (MPa) × 145.04", vars: "Convert MPa to psi", category: "Concrete" },
  { name: "Water-Cement Ratio", formula: "w/c = W / C", vars: "W = weight of water, C = weight of cement", category: "Concrete" },
  { name: "Concrete Unit Weight", formula: "γ = 23.6 kN/m³ = 150 pcf", vars: "Normal weight concrete", category: "Concrete" },

  // Structural / Beams
  { name: "Bending Stress", formula: "σ = M / S = Mc / I", vars: "M = moment, S = section modulus, c = dist to NA, I = moment of inertia", category: "Structural" },
  { name: "Shear Stress (average)", formula: "τ = V / A", vars: "V = shear force, A = cross-sectional area", category: "Structural" },
  { name: "Section Modulus (rect.)", formula: "S = b h² / 6", vars: "b = width, h = depth", category: "Structural" },
  { name: "Moment of Inertia (rect.)", formula: "I = b h³ / 12", vars: "b = width, h = depth", category: "Structural" },
  { name: "Moment of Inertia (circle)", formula: "I = π d⁴ / 64", vars: "d = diameter", category: "Structural" },
  { name: "Max Moment — SS UDL", formula: "Mmax = w L² / 8", vars: "w = uniform load/length, L = span (simply supported)", category: "Structural" },
  { name: "Max Deflection — SS UDL", formula: "δmax = 5wL⁴ / (384EI)", vars: "w = uniform load, L = span, E = modulus, I = inertia", category: "Structural" },
  { name: "Max Moment — Cantilever UDL", formula: "Mmax = w L² / 2", vars: "w = uniform load/length, L = span", category: "Structural" },
  { name: "Max Deflection — Cantilever UDL", formula: "δmax = w L⁴ / (8EI)", vars: "w = uniform load, L = span, E = modulus, I = inertia", category: "Structural" },

  // Columns / Loads
  { name: "Axial Stress", formula: "σ = P / A", vars: "P = axial load, A = cross-sectional area", category: "Loads" },
  { name: "Euler Buckling Load", formula: "Pcr = π² EI / (KL)²", vars: "K = eff. length factor, L = member length, E = modulus, I = inertia", category: "Loads" },
  { name: "Slenderness Ratio", formula: "λ = KL / r", vars: "K = eff. length factor, L = length, r = radius of gyration", category: "Loads" },
  { name: "Radius of Gyration", formula: "r = √(I / A)", vars: "I = moment of inertia, A = area", category: "Loads" },

  // Reinforcement
  { name: "Rebar Unit Weight", formula: "W = 0.00617 d² kg/m", vars: "d = bar diameter in mm", category: "Reinforcement" },
  { name: "Steel Unit Weight", formula: "γs = 77 kN/m³ = 490 pcf", vars: "Structural steel unit weight", category: "Reinforcement" },
  { name: "Common Rebar Yield Strength", formula: "Fy = 415 MPa (Grade 60) = 60,000 psi", vars: "Standard deformed bar", category: "Reinforcement" },

  // Soil & Foundation
  { name: "Overburden Pressure", formula: "σv = γ × z", vars: "γ = unit weight of soil, z = depth", category: "Soil & Foundation" },
  { name: "Factor of Safety (bearing)", formula: "FS = q_ult / q_allow", vars: "q_ult = ultimate bearing capacity", category: "Soil & Foundation" },
  { name: "Soil Unit Weight (typical)", formula: "γ = 16–20 kN/m³", vars: "Range for common soils", category: "Soil & Foundation" },
];

const FORMULA_CATEGORIES = [...new Set(FORMULAS.map((f) => f.category))];

function FormulaLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return FORMULAS.filter((f) => {
      const matchCat = activeCategory === "All" || f.category === activeCategory;
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        f.vars.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Search formulas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["All", ...FORMULA_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No formulas found.</p>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border bg-surface overflow-hidden">
          {filtered.map((f, i) => (
            <div key={i} className="px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="font-mono text-sm text-primary">{f.formula}</p>
                  <p className="text-xs text-muted-foreground">{f.vars}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-2xs">
                  {f.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Construction Calculators ─────────────────────────────────────────────────

function fmt(n: number, dec = 4): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return parseFloat(n.toFixed(dec)).toString();
}

function ConcreteVolumeCalc() {
  const [shape, setShape] = useState<"slab" | "column" | "footing">("slab");
  const [vals, setVals] = useState({ l: "", w: "", h: "", r: "", d: "" });
  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const result = useMemo(() => {
    const n = (k: string) => parseFloat(vals[k as keyof typeof vals]) || 0;
    let m3 = 0;
    if (shape === "slab") m3 = n("l") * n("w") * n("h");
    else if (shape === "column") m3 = Math.PI * Math.pow(n("r"), 2) * n("h");
    else m3 = n("l") * n("w") * n("d");
    const ft3 = m3 / 0.028317;
    const kg = m3 * 2400;
    const bags40 = Math.ceil(m3 * 7.5);
    return { m3, ft3, kg, bags40 };
  }, [vals, shape]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["slab", "column", "footing"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              shape === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shape === "slab" && (
          <>
            <div className="space-y-1"><Label>Length (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.l} onChange={(e) => set("l", e.target.value)} /></div>
            <div className="space-y-1"><Label>Width (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.w} onChange={(e) => set("w", e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Thickness (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.h} onChange={(e) => set("h", e.target.value)} /></div>
          </>
        )}
        {shape === "column" && (
          <>
            <div className="space-y-1"><Label>Radius (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.r} onChange={(e) => set("r", e.target.value)} /></div>
            <div className="space-y-1"><Label>Height (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.h} onChange={(e) => set("h", e.target.value)} /></div>
          </>
        )}
        {shape === "footing" && (
          <>
            <div className="space-y-1"><Label>Length (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.l} onChange={(e) => set("l", e.target.value)} /></div>
            <div className="space-y-1"><Label>Width (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.w} onChange={(e) => set("w", e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Depth (m)</Label><Input type="number" min="0" placeholder="0.00" value={vals.d} onChange={(e) => set("d", e.target.value)} /></div>
          </>
        )}
      </div>

      {result.m3 > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Volume (m³)", value: fmt(result.m3, 4) },
            { label: "Volume (ft³)", value: fmt(result.ft3, 2) },
            { label: "Weight (kg)", value: fmt(result.kg, 0) },
            { label: "40 kg Bags (est.)", value: result.bags40.toString() },
          ].map((r) => (
            <div key={r.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
              <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{r.label}</p>
              <p className="text-sm font-semibold tabular">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RebarCalc() {
  const DIAMETERS = [10, 12, 16, 20, 25, 28, 32];
  const [dia, setDia] = useState("16");
  const [length, setLength] = useState("");
  const [count, setCount] = useState("1");

  const result = useMemo(() => {
    const d = parseFloat(dia);
    const l = parseFloat(length) || 0;
    const n = parseInt(count) || 0;
    const unitWt = 0.00617 * d * d;
    const totalKg = unitWt * l * n;
    const totalLb = totalKg * 2.20462;
    return { unitWt, totalKg, totalLb };
  }, [dia, length, count]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Bar Diameter</Label>
          <Select value={dia} onValueChange={setDia}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIAMETERS.map((d) => (
                <SelectItem key={d} value={String(d)}>{d} mm</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Length per Bar (m)</Label>
          <Input type="number" min="0" placeholder="0.00" value={length} onChange={(e) => setLength(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Number of Bars</Label>
          <Input type="number" min="1" placeholder="1" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
      </div>

      {(parseFloat(length) || 0) > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "Unit Weight", value: `${fmt(result.unitWt, 3)} kg/m` },
            { label: "Total Weight (kg)", value: fmt(result.totalKg, 2) },
            { label: "Total Weight (lb)", value: fmt(result.totalLb, 2) },
          ].map((r) => (
            <div key={r.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
              <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{r.label}</p>
              <p className="text-sm font-semibold tabular">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaintCalc() {
  const [area, setArea] = useState("");
  const [coverage, setCoverage] = useState("10");
  const [coats, setCoats] = useState("2");
  const [canSize, setCanSize] = useState("4");

  const result = useMemo(() => {
    const a = parseFloat(area) || 0;
    const cov = parseFloat(coverage) || 10;
    const c = parseInt(coats) || 1;
    const cs = parseFloat(canSize) || 4;
    const totalLiters = (a / cov) * c;
    const cans = Math.ceil(totalLiters / cs);
    return { totalLiters, cans };
  }, [area, coverage, coats, canSize]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label>Surface Area (m²)</Label>
          <Input type="number" min="0" placeholder="0.00" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Coverage Rate (m²/L)</Label>
          <Input type="number" min="0.1" placeholder="10" value={coverage} onChange={(e) => setCoverage(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Number of Coats</Label>
          <Select value={coats} onValueChange={setCoats}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Can Size (L)</Label>
          <Select value={canSize} onValueChange={setCanSize}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 4, 16, 20].map((n) => <SelectItem key={n} value={String(n)}>{n} L</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(parseFloat(area) || 0) > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Total Paint (L)", value: fmt(result.totalLiters, 2) },
            { label: `Cans (${canSize} L each)`, value: result.cans.toString() },
          ].map((r) => (
            <div key={r.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
              <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{r.label}</p>
              <p className="text-sm font-semibold tabular">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StairCalc() {
  const [totalRise, setTotalRise] = useState("");
  const [riser, setRiser] = useState("175");
  const [tread, setTread] = useState("250");

  const result = useMemo(() => {
    const rise = parseFloat(totalRise) || 0;
    const r = parseFloat(riser) || 175;
    const t = parseFloat(tread) || 250;
    if (rise === 0) return null;
    const steps = Math.round(rise / r);
    const actualRiser = rise / steps;
    const totalRun = steps * t;
    const angle = Math.atan(actualRiser / t) * (180 / Math.PI);
    const riseRunOk = actualRiser + t >= 550 && actualRiser + t <= 700;
    return { steps, actualRiser, totalRun, angle, riseRunOk };
  }, [totalRise, riser, tread]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Total Rise (mm)</Label>
          <Input type="number" min="0" placeholder="3000" value={totalRise} onChange={(e) => setTotalRise(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Target Riser (mm)</Label>
          <Input type="number" min="100" max="220" placeholder="175" value={riser} onChange={(e) => setRiser(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tread Depth (mm)</Label>
          <Input type="number" min="150" max="400" placeholder="250" value={tread} onChange={(e) => setTread(e.target.value)} />
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Number of Steps", value: result.steps.toString() },
              { label: "Actual Riser (mm)", value: fmt(result.actualRiser, 1) },
              { label: "Total Run (mm)", value: fmt(result.totalRun, 0) },
              { label: "Stair Angle (°)", value: fmt(result.angle, 1) },
            ].map((r) => (
              <div key={r.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
                <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{r.label}</p>
                <p className="text-sm font-semibold tabular">{r.value}</p>
              </div>
            ))}
          </div>
          <div
            className={`rounded-md border p-3 text-sm ${
              result.riseRunOk
                ? "border-green-300 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : "border-amber-300 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
            }`}
          >
            Rise + Tread = {fmt(result.actualRiser + parseFloat(tread || "250"), 1)} mm{" "}
            {result.riseRunOk
              ? "✓ Within comfortable range (550–700 mm)"
              : "⚠ Outside comfortable range (550–700 mm)"}
          </div>
        </>
      )}
    </div>
  );
}

type CalcKey = "concrete" | "rebar" | "paint" | "stair";

const CALCS: { key: CalcKey; label: string; desc: string }[] = [
  { key: "concrete", label: "Concrete Volume", desc: "Slabs, columns, footings" },
  { key: "rebar", label: "Rebar Weight", desc: "Bar weight by diameter & length" },
  { key: "paint", label: "Paint Calculator", desc: "Surface area to liters & cans" },
  { key: "stair", label: "Stair Design", desc: "Steps, rise, run & angle check" },
];

function Calculators() {
  const [active, setActive] = useState<CalcKey>("concrete");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CALCS.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={`rounded-md border p-3 text-left transition-colors space-y-0.5 ${
              active === c.key
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-muted/30"
            }`}
          >
            <p className={`text-sm font-medium ${active === c.key ? "text-primary" : ""}`}>{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-3">
          {CALCS.find((c) => c.key === active)?.label}
        </h3>
        {active === "concrete" && <ConcreteVolumeCalc />}
        {active === "rebar" && <RebarCalc />}
        {active === "paint" && <PaintCalc />}
        {active === "stair" && <StairCalc />}
      </div>
    </div>
  );
}

// ── Main Shell ───────────────────────────────────────────────────────────────

export function ToolsShell() {
  return (
    <Tabs defaultValue="converter">
      <TabsList className="mb-4">
        <TabsTrigger value="converter">Unit Converter</TabsTrigger>
        <TabsTrigger value="formulas">Formula Library</TabsTrigger>
        <TabsTrigger value="calculators">Calculators</TabsTrigger>
      </TabsList>

      <TabsContent value="converter">
        <div className="rounded-md border border-border bg-surface p-4 max-w-2xl">
          <h2 className="text-sm font-semibold mb-3">Unit Converter</h2>
          <UnitConverter />
        </div>
      </TabsContent>

      <TabsContent value="formulas">
        <div className="max-w-3xl">
          <FormulaLibrary />
        </div>
      </TabsContent>

      <TabsContent value="calculators">
        <div className="max-w-2xl">
          <Calculators />
        </div>
      </TabsContent>
    </Tabs>
  );
}
