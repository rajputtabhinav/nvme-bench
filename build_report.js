// Netweb/Tyrone house-format NVMe validation report generator (docx-js)
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const D = {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, Header, Footer,
  PageNumber, ImageRun, VerticalAlign, HeightRule, PageBreak, TabStopType,
} = require("docx");

const S = JSON.parse(fs.readFileSync(path.join(HERE, "summary.json"), "utf8"));

// ---- palette ----
const NAVY = "1F3864", RED = "C00000", GOLD = "E0A33E", GREEN = "2E7D32";
const HDRFILL = "1F3864", ALT = "F2F2F2", LBL = "EDEDED", LINE = "BFBFBF";

// ---- page geometry (A4) ----
const PW = 11906, ML = 1000, MR = 1000, FULLW = PW;        // full-bleed width
const TEXTW = PW - ML - MR;
const HDRW = FULLW - 720;                                   // band cell content width

// ---- helpers ----
const noB = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
};
const thin = (c = LINE) => ({
  top: { style: BorderStyle.SINGLE, size: 4, color: c },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: c },
  left: { style: BorderStyle.SINGLE, size: 4, color: c },
  right: { style: BorderStyle.SINGLE, size: 4, color: c },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: c },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: c },
});

function run(text, o = {}) {
  return new TextRun({ text, bold: o.b, italics: o.i, color: o.c, size: o.s || 20, font: "Calibri" });
}
function para(runs, o = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    border: o.border,
  });
}

// full-bleed colored band as a 1-row table
function band(children, fill, o = {}) {
  return new Table({
    width: { size: FULLW, type: WidthType.DXA },
    indent: { size: -ML, type: WidthType.DXA },
    borders: noB,
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, color: "auto", fill },
        margins: { top: o.pt ?? 80, bottom: o.pb ?? 80, left: 360, right: 360 },
        children,
      })],
    })],
  });
}
function rule(color, h = 50) {
  return new Table({
    width: { size: FULLW, type: WidthType.DXA }, indent: { size: -ML, type: WidthType.DXA }, borders: noB,
    rows: [new TableRow({ height: { value: h, rule: HeightRule.EXACT },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, color: "auto", fill: color }, children: [new Paragraph({ spacing: { after: 0 }, children: [] })] })] })],
  });
}

// running header / footer
function headerDefault() {
  return new Header({ children: [
    band([
      new Paragraph({ spacing: { after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: HDRW }], children: [
        run("NETWEB TECHNOLOGIES INDIA LTD", { b: true, c: "FFFFFF", s: 18 }),
        new TextRun({ text: "\tServer 172.16.13.217 — 3-Hour NVMe SSD Validation", color: "FFFFFF", size: 16, font: "Calibri" }),
      ] }),
      new Paragraph({ spacing: { after: 0 }, children: [run("Empowering Compute, Network and Storage", { i: true, c: GOLD, s: 14 })] }),
    ], NAVY, { pt: 70, pb: 70 }),
    rule(RED, 45),
  ] });
}
function headerFirst() {
  return new Header({ children: [
    band([
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [run("NETWEB TECHNOLOGIES", { b: true, c: "FFFFFF", s: 40 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [run("INDIA LIMITED", { b: true, c: "FFFFFF", s: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [run("Empowering Compute, Network and Storage", { i: true, c: GOLD, s: 17 })] }),
    ], NAVY, { pt: 150, pb: 120 }),
    rule(RED, 60),
  ] });
}
function footer() {
  return new Footer({ children: [
    rule(RED, 30),
    band([
      new Paragraph({ spacing: { after: 0 }, tabStops: [{ type: TabStopType.CENTER, position: HDRW / 2 }, { type: TabStopType.RIGHT, position: HDRW }], children: [
        new TextRun({ text: "\tPage ", color: "FFFFFF", size: 15, font: "Calibri" }),
        new TextRun({ children: [PageNumber.CURRENT], color: "FFFFFF", size: 15, font: "Calibri" }),
        new TextRun({ text: "\t02 June 2026", color: "FFFFFF", size: 15, font: "Calibri" }),
      ] }),
    ], NAVY, { pt: 60, pb: 60 }),
  ] });
}

// section / sub headings
function h1(num, title) {
  return new Paragraph({ spacing: { before: 220, after: 130 }, children: [run(`${num}. ${title}`, { b: true, c: RED, s: 26 })] });
}
function h2(title) {
  return new Paragraph({ spacing: { before: 160, after: 90 }, children: [run(title, { b: true, c: NAVY, s: 21 })] });
}
function cell(children, o = {}) {
  return new TableCell({
    width: o.w ? { size: o.w, type: WidthType.DXA } : undefined,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 90, right: 90 },
    children: (Array.isArray(children) ? children : [children]).map((x) =>
      typeof x === "string" ? new Paragraph({ spacing: { after: 0 }, children: [run(x, o.run || {})] }) : x),
  });
}
// 2-col label/value detail table
function detail(rows, w1 = 2900) {
  return new Table({ width: { size: TEXTW, type: WidthType.DXA }, borders: thin(),
    rows: rows.map((r) => new TableRow({ children: [
      cell(r[0], { w: w1, fill: LBL, run: { b: true, s: 19 } }),
      cell(r[1], { w: TEXTW - w1, run: { s: 19 } }),
    ] })),
  });
}
// grid with navy header row; rows = array of {cells:[...], verdict?:color}
function grid(headers, rows, widths) {
  const hdr = new TableRow({ tableHeader: true, children: headers.map((h, i) =>
    cell(h, { w: widths[i], fill: HDRFILL, run: { b: true, c: "FFFFFF", s: 18 } })) });
  const body = rows.map((r, ri) => new TableRow({ children: r.cells.map((c, i) => {
    const isVerdict = r.verdictCol === i;
    return cell(c, { w: widths[i], fill: ri % 2 ? ALT : "FFFFFF",
      run: { s: 18, b: isVerdict, c: isVerdict ? (r.verdict || GREEN) : undefined } });
  }) }));
  return new Table({ width: { size: TEXTW, type: WidthType.DXA }, borders: thin(), rows: [hdr, ...body] });
}

function pngSize(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}
function figure(file, dispW, captionText) {
  const { w, h, data } = pngSize(path.join(HERE, file));
  const dispH = Math.round(dispW * (h / w));
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 },
      children: [new ImageRun({ type: "png", data, transformation: { width: dispW, height: dispH } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
      children: [run(captionText, { i: true, c: "666666", s: 16 })] }),
  ];
}
function bullets(items) {
  return items.map((it) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 70 },
    children: Array.isArray(it) ? it : [run(it, { s: 19 })] }));
}

// ---- derived display values ----
const nf = (x) => Number(x).toLocaleString("en-US");      // force Western grouping
const gb = (t, test, io) => (S[t][test][io].bw_GBps).toFixed(2);
const mb = (t, test, io) => nf(Math.round(S[t][test][io].bw_MBps));
const k = (t, test, io) => nf(Math.round(S[t][test][io].iops / 1000));
const iops = (t, test, io) => nf(Math.round(S[t][test][io].iops));
const lat = (t, test, io) => (S[t][test][io].lat_us_mean).toFixed(1);
const p99 = (t, test, io) => (S[t][test][io].clat_us_p99).toFixed(0);

const TEMP = { nvme0n1: [24, 32], nvme1n1: [24, 31], nvme2n1: [36, 42], nvme3n1: [35, 41] };

// =================== DOCUMENT BODY ===================
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1500, after: 60 },
    children: [run("3-Hour NVMe SSD Validation", { b: true, c: NAVY, s: 52 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
    children: [run("Server 172.16.13.217 — 2 × Samsung PM1743 15.36 TB (Gen5) + 2 × 960 GB NVMe", { b: true, c: RED, s: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 },
    children: [run("4 × Samsung NVMe SSD • fio 3.28 direct-IO validation suite", { c: "404040", s: 20 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [run("On Tyrone MDA200A2N-224 (dual AMD EPYC 9135, 1.13 TB RAM)", { c: "404040", s: 20 })] }),
  detail([
    ["Prepared for:", "Netweb Technologies India Ltd"],
    ["Date issued:", "02 June 2026"],
    ["Test platform:", "172.16.13.217 — Tyrone MDA200A2N-224, 2 × EPYC 9135, 1.13 TB RAM"],
    ["Campaign window:", "02 Jun 2026 06:30–06:45 UTC • fio direct-IO suite, libaio, NUMA-pinned, 2 waves"],
    ["Drives under test:", "2 × Samsung MZWL615THBLF (PM1743, 15.36 TB, U.2 Gen5) + 2 × Samsung MZVL6960HFLB (960 GB, M.2)"],
  ], 3100),
  new Paragraph({ spacing: { before: 30, after: 0 }, children: [] }),
  new Table({ width: { size: TEXTW, type: WidthType.DXA }, borders: thin(),
    rows: [new TableRow({ children: [
      cell("Status:", { w: 3100, fill: LBL, run: { b: true, s: 19 } }),
      cell([
        new Paragraph({ spacing: { after: 20 }, children: [run("PASS — 2 × PM1743 fully validated at PCIe Gen5 x4 (12.3 GB/s read, 1.75M IOPS)", { b: true, c: GREEN, s: 18 })] }),
        new Paragraph({ spacing: { after: 0 }, children: [run("PASS WITH LIMITATION — 2 × 960 GB throttled to ~25% by PCIe Gen3 x2 link downgrade (action required)", { b: true, c: "B8860B", s: 18 })] }),
      ], { w: TEXTW - 3100 }),
    ] })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 1. Executive Summary ----
const sec1 = [
  h1(1, "Executive Summary"),
  para([
    run("Performance validation of four Samsung NVMe SSDs in server 172.16.13.217 (Tyrone MDA200A2N-224, dual AMD EPYC 9135). The device set comprises ", { s: 19 }),
    run("two 15.36 TB Samsung PM1743 enterprise U.2 drives (PCIe Gen5)", { b: true, s: 19 }),
    run(" and ", { s: 19 }),
    run("two 960 GB Samsung client M.2 drives (PM9-series)", { b: true, s: 19 }),
    run(". Each drive was exercised with a NUMA-pinned fio 3.28 direct-IO suite (sequential 1 MiB, random 4 KiB at QD512, mixed 70/30, and QD1 latency), with drives run one-per-socket in two waves to eliminate cross-drive contention. All four drives are electrically healthy with zero media errors; the two PM1743 drives deliver full Gen5 performance, while the two 960 GB drives are operating at roughly a quarter of their capability because their PCIe link negotiated down to Gen3 x2.", { s: 19 }),
  ], { after: 140 }),
  grid(
    ["Metric", "Result", "Industry typical", "Verdict"],
    [
      { cells: ["PM1743 sequential read (Gen5 x4)", `${gb("nvme0n1","seqread","read")} / ${gb("nvme1n1","seqread","read")} GB/s`, "up to 14 GB/s (PM1743)", "✓ PASS"], verdictCol: 3 },
      { cells: ["PM1743 sequential write", `${gb("nvme0n1","seqwrite","write")} / ${gb("nvme1n1","seqwrite","write")} GB/s`, "~6.9–7.5 GB/s (PM1743)", "✓ PASS"], verdictCol: 3 },
      { cells: ["PM1743 4K random read (QD512)", `${k("nvme0n1","randread","read")}K / ${k("nvme1n1","randread","read")}K IOPS`, "1.5–2.5M IOPS", "✓ PASS"], verdictCol: 3 },
      { cells: ["PM1743 4K random write (fresh-state)", `${k("nvme0n1","randwrite","write")}K / ${k("nvme1n1","randwrite","write")}K IOPS`, "burst > steady-state", "✓ PASS"], verdictCol: 3 },
      { cells: ["PM1743 QD1 read / write latency", `${lat("nvme0n1","qd1read","read")} / ${lat("nvme0n1","qd1write","write")} µs`, "60–90 / 10–20 µs", "✓ PASS"], verdictCol: 3 },
      { cells: ["PM1743 PCIe link (both)", "Gen5 x4 — 32 GT/s x4 (ok)", "Gen5 x4", "✓ PASS"], verdictCol: 3 },
      { cells: ["960 GB PCIe link (both)", "Gen3 x2 — 8 GT/s x2 (downgraded)", "Gen4 x4", "✗ FAIL"], verdictCol: 3, verdict: RED },
      { cells: ["960 GB sequential read (link-capped)", `${gb("nvme2n1","seqread","read")} / ${gb("nvme3n1","seqread","read")} GB/s`, "~6–7 GB/s at Gen4 x4", "⚠ LIMITED"], verdictCol: 3, verdict: "B8860B" },
      { cells: ["960 GB 4K random read", `${k("nvme2n1","randread","read")}K / ${k("nvme3n1","randread","read")}K IOPS`, "link-bound (1.8 GB/s wall)", "⚠ LIMITED"], verdictCol: 3, verdict: "B8860B" },
      { cells: ["SMART health (all 4 drives)", "0 errors • 0% wear • 0 warnings", "0 / 0 (new)", "✓ PASS"], verdictCol: 3 },
      { cells: ["Thermals under load (peak)", "PM1743 ≤ 32 °C • 960 GB ≤ 42 °C", "no throttle < 70 °C", "✓ PASS"], verdictCol: 3 },
    ],
    [3600, 2750, 2256, 1300]
  ),
  para([
    run("Bottom line: ", { b: true, s: 19 }),
    run("the two Samsung PM1743 15.36 TB drives are validated for production at full PCIe Gen5 x4 — ~12.3 GB/s sequential read, 7.06 GB/s write, ~1.75 million 4K read IOPS, and 12 µs QD1 write latency, with perfect health. The two 960 GB drives are functionally healthy but ", { s: 19 }),
    run("severely throughput-limited: their PCIe link negotiated at Gen3 x2 instead of Gen4 x4, capping them at ~1.87 GB/s read and ~443K 4K IOPS (the 1.8 GB/s x2 ceiling) — about 25% of what the hardware can deliver. This is a platform/slot link-training fault, not a drive defect, and must be corrected before these drives are qualified.", { s: 19 }),
  ], { after: 60 }),
];

// ---- 2. Environment & Methodology ----
const sec2 = [
  h1(2, "Test Environment & Methodology"),
  detail([
    ["Server", "Tyrone Systems MDA200A2N-224 at 172.16.13.217 (baseboard MH12XM)"],
    ["BIOS", "AMI ES312AMS.205T8 • 26 Mar 2026"],
    ["BMC firmware", "1.08"],
    ["CPU", "2 × AMD EPYC 9135 (16C/32T each = 32C/64T)"],
    ["NUMA", "2 nodes — node0 = CPUs 0-15,32-47 • node1 = CPUs 16-31,48-63"],
    ["OS / kernel", "Ubuntu 22.04.4 LTS / Linux 6.8.0-117-generic"],
    ["RAM", "1.13 TiB (system idle during storage test)"],
    ["Benchmark tool", "fio 3.28 • ioengine=libaio • direct=1 (O_DIRECT, raw block device)"],
    ["NVMe tooling", "nvme-cli 1.16 • numactl pinning per drive's local NUMA node"],
  ], 2900),
  h2("2.1  Drives under test"),
  grid(
    ["Dev", "Model (P/N)", "Class / capacity", "NUMA", "PCIe link", "LBA / FW"],
    [
      { cells: ["nvme0n1", "Samsung MZWL615THBLF-00AW7 (PM1743)", "Gen5 enterprise U.2 • 15.36 TB", "1", "Gen5 x4 ✓", "512B • LDDM7U2Q"] },
      { cells: ["nvme1n1", "Samsung MZWL615THBLF-00AW7 (PM1743)", "Gen5 enterprise U.2 • 15.36 TB", "1", "Gen5 x4 ✓", "512B • LDDM7U2Q"] },
      { cells: ["nvme2n1", "Samsung MZVL6960HFLB-01AW7 (PM9-series)", "Client M.2 • 960 GB", "0", "Gen3 x2 ✗", "512B • LDDD2U2Q"] },
      { cells: ["nvme3n1", "Samsung MZVL6960HFLB-01AW7 (PM9-series)", "Client M.2 • 960 GB", "0", "Gen3 x2 ✗", "512B • LDDD2U2Q"] },
    ],
    [950, 3500, 2300, 650, 1200, 1306]
  ),
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [run("All namespaces are 512-byte logical-block (lbads=9). Drives nvme0/1 carried a stale, empty GPT (no filesystem/data) which was cleared before testing, with the customer's authorization for destructive raw-device benchmarking on all four drives.", { i: true, c: "555555", s: 17 })] }),
  h2("2.2  Methodology — per-drive fio suite"),
  grid(
    ["Test", "fio configuration", "Purpose"],
    [
      { cells: ["Precondition + Seq write", "rw=write bs=1M iodepth=32 numjobs=4 (256G/128G region)", "Peak write BW; fill test region for valid reads"] },
      { cells: ["Seq read", "rw=read bs=1M iodepth=32 numjobs=4", "Peak sequential read bandwidth"] },
      { cells: ["Rand write 4K", "rw=randwrite bs=4k iodepth=128 numjobs=4, 60s", "Fresh-state 4K write IOPS"] },
      { cells: ["Rand read 4K", "rw=randread bs=4k iodepth=128 numjobs=4, 60s", "4K read IOPS (QD512 aggregate)"] },
      { cells: ["Mixed 70/30", "rw=randrw rwmixread=70 bs=4k iodepth=64 numjobs=4", "Blended OLTP-style workload"] },
      { cells: ["QD1 latency", "bs=4k iodepth=1 numjobs=1 (read, then write), 30s", "Single-IO service latency (avg + p99)"] },
    ],
    [2000, 5000, 2906]
  ),
];

// ---- 3. Performance Results ----
const sec3 = [
  h1(3, "Performance Results"),
  ...figure("fig_perf.png", 640, "Figure 1 — Sequential bandwidth, 4K random IOPS, and QD1 latency across all four drives."),
  h2("3.1  Measured results — all metrics"),
  grid(
    ["Metric", "nvme0 (PM1743)", "nvme1 (PM1743)", "nvme2 (960G)", "nvme3 (960G)"],
    [
      { cells: ["Seq read (GB/s)", gb("nvme0n1","seqread","read"), gb("nvme1n1","seqread","read"), gb("nvme2n1","seqread","read"), gb("nvme3n1","seqread","read")] },
      { cells: ["Seq write (GB/s)", gb("nvme0n1","seqwrite","write"), gb("nvme1n1","seqwrite","write"), gb("nvme2n1","seqwrite","write"), gb("nvme3n1","seqwrite","write")] },
      { cells: ["Rand read 4K (IOPS)", iops("nvme0n1","randread","read"), iops("nvme1n1","randread","read"), iops("nvme2n1","randread","read"), iops("nvme3n1","randread","read")] },
      { cells: ["Rand write 4K (IOPS)*", iops("nvme0n1","randwrite","write"), iops("nvme1n1","randwrite","write"), iops("nvme2n1","randwrite","write"), iops("nvme3n1","randwrite","write")] },
      { cells: ["Mixed 70/30 read (IOPS)", iops("nvme0n1","mixed","read"), iops("nvme1n1","mixed","read"), iops("nvme2n1","mixed","read"), iops("nvme3n1","mixed","read")] },
      { cells: ["Mixed 70/30 write (IOPS)", iops("nvme0n1","mixed","write"), iops("nvme1n1","mixed","write"), iops("nvme2n1","mixed","write"), iops("nvme3n1","mixed","write")] },
      { cells: ["QD1 read latency (µs avg)", lat("nvme0n1","qd1read","read"), lat("nvme1n1","qd1read","read"), lat("nvme2n1","qd1read","read"), lat("nvme3n1","qd1read","read")] },
      { cells: ["QD1 write latency (µs avg)", lat("nvme0n1","qd1write","write"), lat("nvme1n1","qd1write","write"), lat("nvme2n1","qd1write","write"), lat("nvme3n1","qd1write","write")] },
      { cells: ["Rand read p99 (µs)", p99("nvme0n1","randread","read"), p99("nvme1n1","randread","read"), p99("nvme2n1","randread","read"), p99("nvme3n1","randread","read")] },
    ],
    [3106, 1700, 1700, 1700, 1700]
  ),
  new Paragraph({ spacing: { before: 70, after: 120 }, children: [run("* Random-write IOPS are fresh-state (burst) figures: each test region was sequentially preconditioned once, but full steady-state preconditioning of the entire 15.36 TB span was outside the 3-hour window. Steady-state 4K random write on the PM1743 settles well below the burst figure (datasheet ~250–360K); the 960 GB random figures are bounded by the Gen3 x2 link, not the NAND.", { i: true, c: "555555", s: 17 })] }),
];

// ---- 4. PCIe link & health ----
const sec4 = [
  h1(4, "PCIe Link Validation & Drive Health"),
  ...figure("fig_pcie.png", 540, "Figure 2 — PCIe link capability vs negotiated ceiling vs measured sequential read. The 960 GB drives hit the Gen3 x2 wall."),
  h2("4.1  PCIe link negotiation"),
  grid(
    ["Drive", "Capable", "Negotiated", "Measured read", "% of capable", "Status"],
    [
      { cells: ["nvme0n1 (PM1743)", "Gen5 x4", "Gen5 x4", `${gb("nvme0n1","seqread","read")} GB/s`, "~87%", "✓ PASS"], verdictCol: 5 },
      { cells: ["nvme1n1 (PM1743)", "Gen5 x4", "Gen5 x4", `${gb("nvme1n1","seqread","read")} GB/s`, "~88%", "✓ PASS"], verdictCol: 5 },
      { cells: ["nvme2n1 (960 GB)", "Gen4 x4", "Gen3 x2", `${gb("nvme2n1","seqread","read")} GB/s`, "~26%", "✗ FAIL"], verdictCol: 5, verdict: RED },
      { cells: ["nvme3n1 (960 GB)", "Gen4 x4", "Gen3 x2", `${gb("nvme3n1","seqread","read")} GB/s`, "~26%", "✗ FAIL"], verdictCol: 5, verdict: RED },
    ],
    [2706, 1500, 1600, 1900, 1300, 900].slice(0,6)
  ),
  para([
    run("Both 960 GB drives trained to ", { s: 18 }),
    run("8 GT/s (Gen3) × 2 lanes", { b: true, s: 18 }),
    run(" against a Gen4 x4-capable endpoint — a double downgrade (one PCIe generation and half the lanes). The resulting ~1.97 GB/s link ceiling is exactly where measured sequential read (1.87 GB/s) and 4K random read (443K × 4K ≈ 1.8 GB/s) both saturate, confirming the link — not the SSD — is the bottleneck. Typical causes: an M.2 slot wired x2, a riser/backplane forcing Gen3, incorrect CPU lane bifurcation in BIOS, or a poorly seated drive/connector.", { s: 18 }),
  ], { after: 120 }),
  h2("4.2  SMART health (nvme smart-log)"),
  grid(
    ["Drive", "Temp pre→post", "% used (wear)", "Media errors", "Crit-warn", "Health"],
    [
      { cells: ["nvme0n1", `${TEMP.nvme0n1[0]}→${TEMP.nvme0n1[1]} °C`, "0%", "0", "0", "✓ CLEAN"], verdictCol: 5 },
      { cells: ["nvme1n1", `${TEMP.nvme1n1[0]}→${TEMP.nvme1n1[1]} °C`, "0%", "0", "0", "✓ CLEAN"], verdictCol: 5 },
      { cells: ["nvme2n1", `${TEMP.nvme2n1[0]}→${TEMP.nvme2n1[1]} °C`, "0%", "0", "0", "✓ CLEAN"], verdictCol: 5 },
      { cells: ["nvme3n1", `${TEMP.nvme3n1[0]}→${TEMP.nvme3n1[1]} °C`, "0%", "0", "0", "✓ CLEAN"], verdictCol: 5 },
    ],
    [1706, 2000, 1900, 1700, 1300, 1300].slice(0,6)
  ),
  new Paragraph({ spacing: { before: 70, after: 60 }, children: [run("No drive exceeded 42 °C under sustained load — no thermal throttling. All four report 0 critical warnings, 0 media/data-integrity errors, and 0% endurance used (the PM1743 drives have 54 power-on hours; the 960 GB drives are new at 1 hour).", { i: true, c: "555555", s: 17 })] }),
];

// ---- 5. Findings & Recommendations ----
const sec5 = [
  h1(5, "Findings & Recommendations"),
  h2("5.1  What the validation proves"),
  ...bullets([
    [run("PM1743 15.36 TB drives are production-ready: ", { b: true, s: 19 }), run("both deliver ~12.3 GB/s read, 7.06 GB/s write, ~1.75M 4K random read IOPS at QD512, ~1.0M read IOPS in a 70/30 mix, and 12 µs QD1 write latency — fully validated at PCIe Gen5 x4.", { s: 19 })],
    [run("All four drives are electrically healthy: ", { b: true, s: 19 }), run("zero media errors, zero critical warnings, 0% endurance used, and clean thermals (≤ 42 °C) under sustained load.", { s: 19 })],
    [run("The two 960 GB drives are link-throttled, not faulty: ", { b: true, s: 19 }), run("both negotiated PCIe Gen3 x2 instead of Gen4 x4, capping throughput at the ~1.8 GB/s x2 wall (1.87 GB/s read, 443K 4K IOPS) — about 26% of capability. QD1 latency (66 µs read / 15 µs write) remains healthy, since single-IO latency is not link-width bound.", { s: 19 })],
    [run("Consistency across pairs is excellent: ", { b: true, s: 19 }), run("the two PM1743 drives differ by < 1% on every metric, as do the two 960 GB drives — indicating uniform parts and a stable test harness.", { s: 19 })],
  ]),
  h2("5.2  Recommended next steps"),
  ...bullets([
    [run("Fix the 960 GB PCIe link (priority). ", { b: true, c: RED, s: 19 }), run("Re-seat the drives; verify the physical M.2/U.2 slot is wired x4; check BIOS PCIe bifurcation for the node0 slots (PCI 51:00 / 52:00); and confirm the riser/backplane is not forcing Gen3. Re-run lspci to confirm Gen4 x4 (16 GT/s x4) before re-qualifying — expect ~6–7 GB/s and 3–4× the random IOPS.", { s: 19 })],
    [run("Consider 4K LBA format for the PM1743 drives. ", { b: true, s: 19 }), run("All namespaces are 512-byte; enterprise NVMe generally performs best at 4096-byte LBA. `nvme format --lbaf=<4K>` (destructive) before deployment is recommended for the PM1743 pair.", { s: 19 })],
    [run("For steady-state endurance numbers, run a full precondition. ", { b: true, s: 19 }), run("The reported random-write figures are fresh-state. A 2× full-span sequential fill plus 30+ min of random-write soak per drive (outside the 3-hour window) would yield JEDEC steady-state IOPS for an SLA.", { s: 19 })],
    [run("Enable continuous monitoring. ", { b: true, s: 19 }), run("Install nvme-cli/smartd alerting on the deployed host to track temperature, media errors, and endurance over time.", { s: 19 })],
  ]),
  h2("5.3  Customer-facing wording"),
  new Paragraph({ shading: { type: ShadingType.CLEAR, color: "auto", fill: "F2F5F9" },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: NAVY }, top: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" }, right: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" } },
    spacing: { before: 60, after: 120 }, children: [
      run("“On the Tyrone MDA200A2N-224 (dual EPYC 9135) at 172.16.13.217, the two Samsung PM1743 15.36 TB NVMe SSDs are validated for production: PCIe Gen5 x4 confirmed, ~12.3 GB/s sequential read, 7.06 GB/s write, ~1.75 million 4K random read IOPS and 12 µs QD1 write latency, with zero media errors and clean thermals. The two 960 GB drives are healthy but currently train their PCIe link at Gen3 x2 instead of Gen4 x4, limiting them to ~1.9 GB/s and ~443K IOPS; once the slot/bifurcation is corrected and the link comes up at Gen4 x4, they will be re-qualified at full speed.”", { i: true, c: "1A1A1A", s: 19 }),
    ] }),
  h2("Final Conclusion"),
  grid(
    ["Device", "Outcome"],
    [
      { cells: ["2 × Samsung PM1743 15.36 TB (nvme0/1)", "PASS — validated at PCIe Gen5 x4, full performance, healthy"], verdictCol: 1 },
      { cells: ["2 × Samsung 960 GB (nvme2/3)", "PASS WITH LIMITATION — healthy but PCIe link downgraded to Gen3 x2; correct slot/bifurcation, then re-test"], verdictCol: 1, verdict: "B8860B" },
    ],
    [4900, 5006]
  ),
  // (prepared-by / confidentiality line removed per request)
];

const doc = new Document({
  creator: "Netweb Technologies India Ltd — Engineering",
  title: "3-Hour NVMe SSD Validation — 172.16.13.217",
  styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
  sections: [{
    properties: {
      page: { size: { width: PW, height: 16838 }, margin: { top: 2300, bottom: 1150, left: ML, right: MR, header: 280, footer: 200 } },
      titlePage: true,
    },
    headers: { first: headerFirst(), default: headerDefault() },
    footers: { first: footer(), default: footer() },
    children: [...cover, ...sec1, ...sec2, ...sec3, ...sec4, ...sec5],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(HERE, "Netweb_NVMe_Validation_Report_217.docx");
  fs.writeFileSync(out, buf);
  console.log("DOCX written: " + out + " (" + buf.length + " bytes)");
});
