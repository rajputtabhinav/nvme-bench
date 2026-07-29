// Netweb/Tyrone house-format report: NVMe validation on 172.16.15.38 + cross-server comparison vs 172.16.13.217
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, Header, Footer,
  PageNumber, ImageRun, VerticalAlign, HeightRule, PageBreak, TabStopType,
} = require("docx");

const S = JSON.parse(fs.readFileSync(path.join(HERE, "summary_38.json"), "utf8"));  // this server (.38)
const P = JSON.parse(fs.readFileSync(path.join(HERE, "summary_217.json"), "utf8")); // prior server (.217)

const NAVY="1F3864", RED="C00000", GOLD="E0A33E", GREEN="2E7D32", AMBER="B8860B";
const HDRFILL="1F3864", ALT="F2F2F2", LBL="EDEDED", LINE="BFBFBF";
const PW=11906, ML=1000, MR=1000, FULLW=PW; const TEXTW=PW-ML-MR; const HDRW=FULLW-720;

const noB={top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideHorizontal:{style:BorderStyle.NONE},insideVertical:{style:BorderStyle.NONE}};
const thin=(c=LINE)=>({top:{style:BorderStyle.SINGLE,size:4,color:c},bottom:{style:BorderStyle.SINGLE,size:4,color:c},left:{style:BorderStyle.SINGLE,size:4,color:c},right:{style:BorderStyle.SINGLE,size:4,color:c},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:c},insideVertical:{style:BorderStyle.SINGLE,size:4,color:c}});
function run(text,o={}){return new TextRun({text,bold:o.b,italics:o.i,color:o.c,size:o.s||20,font:"Calibri"});}
function para(runs,o={}){return new Paragraph({children:Array.isArray(runs)?runs:[runs],alignment:o.align,spacing:{before:o.before??0,after:o.after??120},shading:o.fill?{type:ShadingType.CLEAR,color:"auto",fill:o.fill}:undefined,border:o.border});}
function band(children,fill,o={}){return new Table({width:{size:FULLW,type:WidthType.DXA},indent:{size:-ML,type:WidthType.DXA},borders:noB,rows:[new TableRow({children:[new TableCell({shading:{type:ShadingType.CLEAR,color:"auto",fill},margins:{top:o.pt??80,bottom:o.pb??80,left:360,right:360},children})]})]});}
function rule(color,h=50){return new Table({width:{size:FULLW,type:WidthType.DXA},indent:{size:-ML,type:WidthType.DXA},borders:noB,rows:[new TableRow({height:{value:h,rule:HeightRule.EXACT},children:[new TableCell({shading:{type:ShadingType.CLEAR,color:"auto",fill:color},children:[new Paragraph({spacing:{after:0},children:[]})]})]})]});}
function headerDefault(){return new Header({children:[band([new Paragraph({spacing:{after:0},tabStops:[{type:TabStopType.RIGHT,position:HDRW}],children:[run("NETWEB TECHNOLOGIES INDIA LTD",{b:true,c:"FFFFFF",s:18}),new TextRun({text:"\tTyrone MDI300 (172.16.15.38) — NVMe SSD Validation",color:"FFFFFF",size:16,font:"Calibri"})]}),new Paragraph({spacing:{after:0},children:[run("Empowering Compute, Network and Storage",{i:true,c:GOLD,s:14})]})],NAVY,{pt:70,pb:70}),rule(RED,45)]});}
function headerFirst(){return new Header({children:[band([new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:0},children:[run("NETWEB TECHNOLOGIES",{b:true,c:"FFFFFF",s:40})]}),new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:0},children:[run("INDIA LIMITED",{b:true,c:"FFFFFF",s:20})]}),new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:0},children:[run("Empowering Compute, Network and Storage",{i:true,c:GOLD,s:17})]})],NAVY,{pt:150,pb:120}),rule(RED,60)]});}
function footer(){return new Footer({children:[rule(RED,30),band([new Paragraph({spacing:{after:0},tabStops:[{type:TabStopType.CENTER,position:HDRW/2},{type:TabStopType.RIGHT,position:HDRW}],children:[new TextRun({text:"\tPage ",color:"FFFFFF",size:15,font:"Calibri"}),new TextRun({children:[PageNumber.CURRENT],color:"FFFFFF",size:15,font:"Calibri"}),new TextRun({text:"\t04 June 2026",color:"FFFFFF",size:15,font:"Calibri"})]})],NAVY,{pt:60,pb:60})]});}
function h1(num,title){return new Paragraph({spacing:{before:220,after:130},children:[run(`${num}. ${title}`,{b:true,c:RED,s:26})]});}
function h2(title){return new Paragraph({spacing:{before:160,after:90},children:[run(title,{b:true,c:NAVY,s:21})]});}
function cell(children,o={}){return new TableCell({width:o.w?{size:o.w,type:WidthType.DXA}:undefined,shading:o.fill?{type:ShadingType.CLEAR,color:"auto",fill:o.fill}:undefined,verticalAlign:VerticalAlign.CENTER,margins:{top:40,bottom:40,left:90,right:90},children:(Array.isArray(children)?children:[children]).map((x)=>typeof x==="string"?new Paragraph({spacing:{after:0},children:[run(x,o.run||{})]}):x)});}
function detail(rows,w1=2900){return new Table({width:{size:TEXTW,type:WidthType.DXA},borders:thin(),rows:rows.map((r)=>new TableRow({children:[cell(r[0],{w:w1,fill:LBL,run:{b:true,s:19}}),cell(r[1],{w:TEXTW-w1,run:{s:19}})]}))});}
function grid(headers,rows,widths){const hdr=new TableRow({tableHeader:true,children:headers.map((h,i)=>cell(h,{w:widths[i],fill:HDRFILL,run:{b:true,c:"FFFFFF",s:18}}))});const body=rows.map((r,ri)=>new TableRow({children:r.cells.map((c,i)=>{const isV=r.verdictCol===i;return cell(c,{w:widths[i],fill:ri%2?ALT:"FFFFFF",run:{s:18,b:isV,c:isV?(r.verdict||GREEN):undefined}});})}));return new Table({width:{size:TEXTW,type:WidthType.DXA},borders:thin(),rows:[hdr,...body]});}
function pngSize(p){const b=fs.readFileSync(p);return{w:b.readUInt32BE(16),h:b.readUInt32BE(20),data:b};}
function figure(file,dispW,cap){const{w,h,data}=pngSize(path.join(HERE,file));const dispH=Math.round(dispW*(h/w));return[new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:40},children:[new ImageRun({type:"png",data,transformation:{width:dispW,height:dispH}})]}),new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:160},children:[run(cap,{i:true,c:"666666",s:16})]})];}
function bullets(items){return items.map((it)=>new Paragraph({bullet:{level:0},spacing:{after:70},children:Array.isArray(it)?it:[run(it,{s:19})]}));}

// accessors
const nf=(x)=>Number(x).toLocaleString("en-US");
const GB=(D,t,test,io)=>(D[t][test][io].bw_GBps).toFixed(2);
const IOPS=(D,t,test,io)=>nf(Math.round(D[t][test][io].iops));
const LAT=(D,t,test,io)=>(D[t][test][io].lat_us_mean).toFixed(1);
const P99=(D,t,test,io)=>(D[t][test][io].clat_us_p99).toFixed(0);
// representative serials: 960GB=S8CDNG0YC00174, 15.36TB=S7RKNG0YB01763
const r960_217="nvme3n1", r960_38="nvme0n1", rbig_217="nvme0n1", rbig_38="nvme3n1";
const H={nvme0n1:{t:"35→41",poh:48},nvme1n1:{t:"38→46",poh:48},nvme2n1:{t:"35→45",poh:101},nvme3n1:{t:"34→43",poh:101}};

// ===== COVER =====
const cover=[
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:1500,after:60},children:[run("NVMe SSD Validation — Server 172.16.15.38",{b:true,c:NAVY,s:44})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:200},children:[run("4 × Samsung PM9D3a  •  Cross-Server Comparison vs 172.16.13.217",{b:true,c:RED,s:23})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:30},children:[run("2 × PM9D3a 960 GB M.2 + 2 × PM9D3a 15.36 TB U.2 (the same physical drives previously tested on .217)",{c:"404040",s:19})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:340},children:[run("On Tyrone MDI300 (user-Dev) — 2 × Intel Xeon 6730P (64C/128T), 1.0 TB DDR5",{c:"404040",s:19})]}),
  detail([
    ["Prepared for:","Netweb Technologies India Ltd"],
    ["Date issued:","04 June 2026"],
    ["Test platform:","172.16.15.38 — Tyrone MDI300 (user-Dev), 2 × Intel Xeon 6730P, 1.0 TB DDR5"],
    ["Campaign window:","04 Jun 2026 06:15–06:39 UTC • fio 3.28 direct-IO, libaio, NUMA-pinned, drives run sequentially"],
    ["Drives under test:","2 × MZVL6960HFLB 960 GB M.2 + 2 × MZWL615THBLF 15.36 TB U.2 (Samsung PM9D3a)"],
  ],3100),
  new Paragraph({spacing:{before:30,after:0},children:[]}),
  new Table({width:{size:TEXTW,type:WidthType.DXA},borders:thin(),rows:[new TableRow({children:[
    cell("Status:",{w:3100,fill:LBL,run:{b:true,s:19}}),
    cell([
      new Paragraph({spacing:{after:20},children:[run("PASS — all 4 PM9D3a drives healthy & benchmarked; 960 GB read 2× faster than on .217 (Gen4 vs Gen3 link)",{b:true,c:GREEN,s:18})]}),
      new Paragraph({spacing:{after:0},children:[run("ACTION — 1 × 15.36 TB drive (S7RKNG0YB01786) was found dead at idle (APST controller-down), recovered & re-validated; 960 GB still link x2-width",{b:true,c:AMBER,s:18})]}),
    ],{w:TEXTW-3100}),
  ]})]}),
  new Paragraph({children:[new PageBreak()]}),
];

// ===== 1. EXEC =====
const sec1=[
  h1(1,"Executive Summary"),
  para([
    run("Re-validation of the four Samsung PM9D3a NVMe SSDs previously tested on the MDA200A2N-224 at 172.16.13.217, now installed in server 172.16.15.38 (Tyrone MDI300, hostname user-Dev — 2 × Intel Xeon 6730P, 64C/128T, 1.0 TB DDR5). Serial numbers confirm these are the ",{s:19}),
    run("same physical drives",{b:true,s:19}),
    run(": two 960 GB M.2 22×80 and two 15.36 TB 2.5-inch U.2 (all Samsung PM9D3a per firmware NQN). The move directly tests whether the PCIe link issues seen on .217 follow the drives or the slots. All four drives passed a NUMA-pinned fio 3.28 suite with zero media errors. One 15.36 TB drive was found dead on arrival (controller-down, APST power-state fault) and was recovered in-place via PCIe hot-rescan, then fully benchmarked.",{s:19}),
  ],{after:140}),
  grid(["Metric","Result on .38","vs .217 / typical","Verdict"],[
    {cells:["15.36 TB U.2 sequential read (Gen5 x4)",`${GB(S,"nvme2n1","seqread","read")} / ${GB(S,"nvme3n1","seqread","read")} GB/s`,"≈ .217 (12.2 GB/s)","✓ PASS"],verdictCol:3},
    {cells:["15.36 TB U.2 sequential write",`${GB(S,"nvme2n1","seqwrite","write")} / ${GB(S,"nvme3n1","seqwrite","write")} GB/s`,"≈ .217 (7.06 GB/s)","✓ PASS"],verdictCol:3},
    {cells:["15.36 TB 4K random read",`${IOPS(S,"nvme2n1","randread","read")} / ${IOPS(S,"nvme3n1","randread","read")} IOPS`,"1.5–2.5M","✓ PASS"],verdictCol:3},
    {cells:["960 GB M.2 sequential read",`${GB(S,"nvme0n1","seqread","read")} / ${GB(S,"nvme1n1","seqread","read")} GB/s`,"2.0× .217 (1.87) — link fix","✓ PASS"],verdictCol:3},
    {cells:["960 GB M.2 4K random read",`${IOPS(S,"nvme0n1","randread","read")} / ${IOPS(S,"nvme1n1","randread","read")} IOPS`,"1.9× .217 (443K)","✓ PASS"],verdictCol:3},
    {cells:["960 GB M.2 seq write / rand write","1.62 GB/s • 395K IOPS","= .217 (NAND-bound, not link)","✓ PASS"],verdictCol:3},
    {cells:["960 GB M.2 PCIe link","Gen4 x2 (speed up from Gen3; width still x2)","Gen4 x4 capable","⚠ LIMITED"],verdictCol:3,verdict:AMBER},
    {cells:["15.36 TB U.2 PCIe link (both)","Gen5 x4 (32 GT/s x4)","Gen5 x4","✓ PASS"],verdictCol:3},
    {cells:["Drive S7RKNG0YB01786 (15.36 TB)","Found dead at idle (APST); recovered; ran full load OK","needs APST fix before prod","⚠ ACTION"],verdictCol:3,verdict:AMBER},
    {cells:["SMART health (all 4)","0 media errors • 0% wear • ≤ 46 °C","0 / 0 (new)","✓ PASS"],verdictCol:3},
  ],[3700,3050,1856,1300]),
  para([
    run("Bottom line: ",{b:true,s:19}),
    run("the verdict on the .217 report's open question is clear. The 960 GB drives' sequential read ",{s:19}),
    run("doubled (1.87 → 3.76 GB/s) and random read nearly doubled (443K → 852K IOPS)",{b:true,s:19}),
    run(" simply by moving to .38 — proving the Gen3 speed cap was a .217 slot/BIOS limitation, now resolved (Gen4). However the link still trains at ",{s:19}),
    run("x2 width on both servers",{b:true,s:19}),
    run(", so the half-width follows the drives/their wiring and still leaves ~50% of Gen4 bandwidth on the table. The 15.36 TB Gen5 drives perform identically to .217 (~12 GB/s). One 15.36 TB drive arrived dead from an APST power-state controller-down; after an in-place PCIe rescan it recovered to full Gen5 x4 and completed the entire suite under load — it is electrically sound but needs the APST mitigation before production.",{s:19}),
  ],{after:60}),
];

// ===== 2. ENV & METHOD =====
const sec2=[
  h1(2,"Test Environment & Methodology"),
  detail([
    ["Server","Tyrone MDI300 (hostname user-Dev) at 172.16.15.38"],
    ["CPU","2 × Intel Xeon 6730P (32C/64T each = 64C/128T)"],
    ["NUMA","2 nodes — all 4 NVMe slots on node 0 (CPUs 0-31,64-95)"],
    ["OS / kernel","Ubuntu 22.04.4 LTS / Linux 6.8.0-111-generic"],
    ["RAM","1.0 TiB DDR5"],
    ["Benchmark tool","fio 3.28 • ioengine=libaio • direct=1 (raw block device) • numactl node0 pinning"],
    ["Run strategy","Drives benchmarked sequentially (all on node 0) for clean, contention-free per-drive peaks"],
  ],2900),
  h2("2.1  Drives under test (same units previously on .217)"),
  grid(["Dev","Model (P/N) — Samsung PM9D3a","Form / capacity","Serial","PCIe link"],[
    {cells:["nvme0n1","MZVL6960HFLB-01AW7","M.2 22×80 • 960 GB","S8CDNG0YC00174","Gen4 x2 ⚠"]},
    {cells:["nvme1n1","MZVL6960HFLB-01AW7","M.2 22×80 • 960 GB","S8CDNG0YC00153","Gen4 x2 ⚠"]},
    {cells:["nvme2n1","MZWL615THBLF-00AW7","2.5-inch U.2 • 15.36 TB","S7RKNG0YB01786","Gen5 x4 ✓ (recovered)"]},
    {cells:["nvme3n1","MZWL615THBLF-00AW7","2.5-inch U.2 • 15.36 TB","S7RKNG0YB01763","Gen5 x4 ✓"]},
  ],[1150,2950,2400,2356,1050]),
  new Paragraph({spacing:{before:60,after:120},children:[run("Model designation per firmware NQN is Samsung PM9D3a for all four (the .217 report referred to the 15.36 TB units as \"PM1743\" — same physical drives). nvme2n1 was found in a controller-down state and recovered before testing (see §5).",{i:true,c:"555555",s:17})]}),
  h2("2.2  Methodology — per-drive fio suite"),
  grid(["Test","fio configuration","Purpose"],[
    {cells:["Precondition + Seq write","rw=write bs=1M iodepth=32 numjobs=4 (256G/128G region)","Peak write BW; fill region for valid reads"]},
    {cells:["Seq read","rw=read bs=1M iodepth=32 numjobs=4","Peak sequential read bandwidth"]},
    {cells:["Rand read / write 4K","bs=4k iodepth=128 numjobs=4, 60s time-based","4K IOPS at QD512 (read & fresh-state write)"]},
    {cells:["Mixed 70/30","rw=randrw rwmixread=70 bs=4k iodepth=64 numjobs=4","Blended OLTP-style workload"]},
    {cells:["QD1 latency","bs=4k iodepth=1 numjobs=1 (read, then write), 30s","Single-IO service latency (avg + p99)"]},
  ],[2100,4900,2906]),
];

// ===== 3. PERFORMANCE =====
const sec3=[
  h1(3,"Performance Results — Server 172.16.15.38"),
  ...figure("fig_perf_38.png",640,"Figure 1 — Sequential bandwidth, 4K random IOPS, and QD1 latency for all four drives on .38."),
  h2("3.1  Measured results — all metrics"),
  grid(["Metric","nvme0 (960G)","nvme1 (960G)","nvme2 (15.36T)*","nvme3 (15.36T)"],[
    {cells:["Seq read (GB/s)",GB(S,"nvme0n1","seqread","read"),GB(S,"nvme1n1","seqread","read"),GB(S,"nvme2n1","seqread","read"),GB(S,"nvme3n1","seqread","read")]},
    {cells:["Seq write (GB/s)",GB(S,"nvme0n1","seqwrite","write"),GB(S,"nvme1n1","seqwrite","write"),GB(S,"nvme2n1","seqwrite","write"),GB(S,"nvme3n1","seqwrite","write")]},
    {cells:["Rand read 4K (IOPS)",IOPS(S,"nvme0n1","randread","read"),IOPS(S,"nvme1n1","randread","read"),IOPS(S,"nvme2n1","randread","read"),IOPS(S,"nvme3n1","randread","read")]},
    {cells:["Rand write 4K (IOPS)",IOPS(S,"nvme0n1","randwrite","write"),IOPS(S,"nvme1n1","randwrite","write"),IOPS(S,"nvme2n1","randwrite","write"),IOPS(S,"nvme3n1","randwrite","write")]},
    {cells:["Mixed 70/30 read (IOPS)",IOPS(S,"nvme0n1","mixed","read"),IOPS(S,"nvme1n1","mixed","read"),IOPS(S,"nvme2n1","mixed","read"),IOPS(S,"nvme3n1","mixed","read")]},
    {cells:["QD1 read lat (µs)",LAT(S,"nvme0n1","qd1read","read"),LAT(S,"nvme1n1","qd1read","read"),LAT(S,"nvme2n1","qd1read","read"),LAT(S,"nvme3n1","qd1read","read")]},
    {cells:["QD1 write lat (µs)",LAT(S,"nvme0n1","qd1write","write"),LAT(S,"nvme1n1","qd1write","write"),LAT(S,"nvme2n1","qd1write","write"),LAT(S,"nvme3n1","qd1write","write")]},
  ],[3106,1700,1700,1700,1700]),
  new Paragraph({spacing:{before:70,after:60},children:[run("* nvme2n1 = the recovered drive (S7RKNG0YB01786); it performed on par with its healthy sibling nvme3n1, confirming it is electrically sound. Random-write figures are fresh-state (burst), not steady-state.",{i:true,c:"555555",s:17})]}),
];

// ===== 4. COMPARISON =====
const sec4=[
  h1(4,"Cross-Server Comparison — MDA200 (.217) vs MDI300 (.38)"),
  ...figure("fig_compare.png",640,"Figure 2 — Same drives, two servers (MDA200A2N-224 at .217 vs Tyrone MDI300 at .38): 960 GB read scales with the link generation; 15.36 TB Gen5 is consistent."),
  grid(["Metric (representative drive)","960 GB .217","960 GB .38","15.36 TB .217","15.36 TB .38"],[
    {cells:["Seq read (GB/s)",GB(P,r960_217,"seqread","read"),GB(S,r960_38,"seqread","read"),GB(P,rbig_217,"seqread","read"),GB(S,rbig_38,"seqread","read")]},
    {cells:["Seq write (GB/s)",GB(P,r960_217,"seqwrite","write"),GB(S,r960_38,"seqwrite","write"),GB(P,rbig_217,"seqwrite","write"),GB(S,rbig_38,"seqwrite","write")]},
    {cells:["Rand read 4K (IOPS)",IOPS(P,r960_217,"randread","read"),IOPS(S,r960_38,"randread","read"),IOPS(P,rbig_217,"randread","read"),IOPS(S,rbig_38,"randread","read")]},
    {cells:["PCIe link negotiated","Gen3 x2","Gen4 x2","Gen5 x4","Gen5 x4"]},
  ],[3306,1650,1650,1650,1650]),
  para([
    run("What the move proves: ",{b:true,s:19}),
    run("the 960 GB drives' read throughput doubled (1.87 → 3.76 GB/s, 443K → 852K IOPS) purely because the MDI300 (.38) trains the link at Gen4 (16 GT/s) where the MDA200 (.217) was stuck at Gen3 (8 GT/s) — confirming the speed cap was a .217 platform/slot fault, not the drives. ",{s:19}),
    run("But both servers negotiate only x2 lane width",{b:true,s:19}),
    run(" on these M.2 units, so they still deliver ~half of a true Gen4 x4 link (~3.9 vs ~7.0 GB/s achievable). Notably, 960 GB sequential write (1.62 GB/s) and random write (395K IOPS) are identical on both servers — these are NAND-write-bound on this drive class, not link-bound, so they do not improve with the faster link. The 15.36 TB Gen5 drives are within run-variance across the two platforms (~12 GB/s read, 7 GB/s write).",{s:19}),
  ],{after:60}),
];

// ===== 5. PCIe / HEALTH / RECOVERY =====
const sec5=[
  h1(5,"PCIe Link, Health & the Recovered Drive"),
  ...figure("fig_pcie_38.png",560,"Figure 3 — PCIe link on .38: 960 GB M.2 capped at Gen4 x2 (half width); 15.36 TB U.2 at full Gen5 x4."),
  h2("5.1  PCIe link & SMART health"),
  grid(["Drive","Negotiated link","Temp pre→post","Wear","Media err","Health"],[
    {cells:["nvme0n1 (960 GB)","Gen4 x2 ⚠",`${H.nvme0n1.t} °C`,"0%","0","✓ CLEAN"],verdictCol:5},
    {cells:["nvme1n1 (960 GB)","Gen4 x2 ⚠",`${H.nvme1n1.t} °C`,"0%","0","✓ CLEAN"],verdictCol:5},
    {cells:["nvme2n1 (15.36 TB, recovered)","Gen5 x4 ✓",`${H.nvme2n1.t} °C`,"0%","0","✓ CLEAN"],verdictCol:5},
    {cells:["nvme3n1 (15.36 TB)","Gen5 x4 ✓",`${H.nvme3n1.t} °C`,"0%","0","✓ CLEAN"],verdictCol:5},
  ],[2906,1900,1700,1100,1100,1200]),
  new Paragraph({spacing:{before:60,after:120},children:[run("No thermal throttling (peak 46 °C). All four report 0 media errors and 0% endurance used.",{i:true,c:"555555",s:17})]}),
  h2("5.2  The dead-and-recovered drive (S7RKNG0YB01786)"),
  ...bullets([
    [run("Found dead on arrival: ",{b:true,s:19}),run("the kernel reported the controller down with CSTS=0xffffffff and PCI_STATUS=0x10 (device dropped off the PCIe bus) ~99 min after boot; an automatic reset failed (-19) and the device was disabled — it showed 0.00 B capacity in nvme list.",{s:19})],
    [run("Root cause — APST power-state bug: ",{b:true,s:19}),run("the kernel explicitly flagged a faulty power-saving mode and recommended nvme_core.default_ps_max_latency_us=0 / pcie_aspm=off. The fault triggered at idle, not under load.",{s:19})],
    [run("Recovered in place: ",{b:true,s:19}),run("a PCIe hot remove + bus rescan re-enumerated the controller; it came back at full Gen5 x4 and passed the entire fio suite (12.0 GB/s read, 1.5M IOPS) with no further drops — confirming the NAND/controller is healthy.",{s:19})],
    [run("Risk: ",{b:true,s:19}),run("without the APST mitigation it can drop again at idle. APST control via nvme set-feature is not exposed on this PM9D3a firmware, so the fix must be applied at the kernel/boot level.",{s:19})],
  ]),
];

// ===== 6. FINDINGS =====
const sec6=[
  h1(6,"Findings & Recommendations"),
  h2("6.1  What the validation proves"),
  ...bullets([
    [run("All four PM9D3a drives are healthy and performant: ",{b:true,s:19}),run("0 media errors, 0% wear, clean thermals; the 15.36 TB U.2 pair delivers full Gen5 x4 (~12 GB/s read, 7 GB/s write, ~1.5M IOPS).",{s:19})],
    [run("The .217 Gen3 cap was a slot fault, now resolved: ",{b:true,s:19}),run("the 960 GB drives read 2× faster on .38 (Gen4 vs Gen3). Their write path is NAND-bound (~1.62 GB/s) and unchanged by the faster link.",{s:19})],
    [run("The x2 lane-width limit follows the drives: ",{b:true,s:19}),run("both servers train these M.2 units at x2, leaving ~50% of Gen4 x4 bandwidth unused.",{s:19})],
    [run("Drive S7RKNG0YB01786 has an APST idle-stability defect: ",{b:true,s:19}),run("electrically sound under load, but drops off the bus at idle until power-state transitions are disabled.",{s:19})],
  ]),
  h2("6.2  Recommended next steps"),
  ...bullets([
    [run("Apply the APST mitigation (priority). ",{b:true,c:RED,s:19}),run("Boot .38 with nvme_core.default_ps_max_latency_us=0 pcie_aspm=off pcie_port_pm=off (GRUB), or update the PM9D3a firmware, then soak S7RKNG0YB01786 at idle for several hours to confirm it no longer drops. Do not deploy this drive until verified.",{s:19})],
    [run("Unlock x4 width for the 960 GB M.2 drives. ",{b:true,s:19}),run("Move them to M.2 slots wired x4 (or check board lane bifurcation); a true Gen4 x4 link should roughly double sequential read again to ~7 GB/s.",{s:19})],
    [run("Consider 4K LBA format. ",{b:true,s:19}),run("All drives are 512-byte; reformat the PM9D3a units to 4096-byte LBA before deployment for best efficiency.",{s:19})],
    [run("Monitor in production. ",{b:true,s:19}),run("Enable smartd/nvme-cli alerting for temperature, media errors, and controller-down events.",{s:19})],
  ]),
  h2("Final Conclusion"),
  grid(["Device","Outcome"],[
    {cells:["2 × PM9D3a 15.36 TB U.2 (nvme3 + recovered nvme2)","PASS — full Gen5 x4 performance & health. nvme2 (S7RKNG0YB01786) requires the APST fix before production."],verdictCol:1,verdict:AMBER},
    {cells:["2 × PM9D3a 960 GB M.2 (nvme0/1)","PASS — healthy; read 2× faster than .217 (Gen4 link). Still x2 width — move to an x4 slot to double read again."],verdictCol:1,verdict:GREEN},
  ],[4900,5006]),
  // (prepared-by / confidentiality line removed per request)
];

const doc=new Document({creator:"Netweb Technologies India Ltd — Engineering",title:"NVMe SSD Validation — 172.16.15.38 + comparison vs 172.16.13.217",styles:{default:{document:{run:{font:"Calibri",size:20}}}},sections:[{properties:{page:{size:{width:PW,height:16838},margin:{top:2300,bottom:1150,left:ML,right:MR,header:280,footer:200}},titlePage:true},headers:{first:headerFirst(),default:headerDefault()},footers:{first:footer(),default:footer()},children:[...cover,...sec1,...sec2,...sec3,...sec4,...sec5,...sec6]}]});
Packer.toBuffer(doc).then((buf)=>{const out=path.join(HERE,"Netweb_NVMe_Validation_Report_38.docx");fs.writeFileSync(out,buf);console.log("DOCX written: "+out+" ("+buf.length+" bytes)");});
