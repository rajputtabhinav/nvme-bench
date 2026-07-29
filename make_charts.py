#!/usr/bin/env python3
"""Generate Tyrone/Netweb house-style charts for the NVMe validation report."""
import json, sys, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

HERE = os.path.dirname(os.path.abspath(__file__))
summary = json.load(open(os.path.join(HERE, "summary.json")))

# House palette
NAVY = "#1F3864"
GREEN = "#3C8C5A"
GOLD = "#E0A33E"
RED = "#C00000"
GREY = "#9AA5B1"

plt.rcParams.update({
    "font.size": 10,
    "axes.edgecolor": "#888888",
    "axes.linewidth": 0.8,
    "axes.titlesize": 11,
    "axes.titleweight": "bold",
    "axes.titlecolor": NAVY,
})

tags = ["nvme0n1", "nvme1n1", "nvme2n1", "nvme3n1"]
short = {
    "nvme0n1": "nvme0\n15.36TB G5",
    "nvme1n1": "nvme1\n15.36TB G5",
    "nvme2n1": "nvme2\n960GB",
    "nvme3n1": "nvme3\n960GB",
}
# longer labels used only on the wider single-panel PCIe figure
shortp = {
    "nvme0n1": "nvme0\nPM1743 15.36TB",
    "nvme1n1": "nvme1\nPM1743 15.36TB",
    "nvme2n1": "nvme2\n960GB client",
    "nvme3n1": "nvme3\n960GB client",
}
# PCIe theoretical raw ceilings (GB/s)
cap = {"nvme0n1": 15.75, "nvme1n1": 15.75, "nvme2n1": 7.88, "nvme3n1": 7.88}
neg = {"nvme0n1": 15.75, "nvme1n1": 15.75, "nvme2n1": 1.97, "nvme3n1": 1.97}


def g(tag, test, io, key, d=0.0):
    return summary.get(tag, {}).get(test, {}).get(io, {}).get(key, d)


def barlabels(ax, bars, fmt="{:.1f}", dy=0):
    for b in bars:
        h = b.get_height()
        ax.annotate(fmt.format(h), (b.get_x() + b.get_width() / 2, h),
                    ha="center", va="bottom", fontsize=8, xytext=(0, 1 + dy),
                    textcoords="offset points", color="#222222")


labels = [short[t] for t in tags]
x = range(len(tags))
w = 0.38

# ---------- Figure 1: 3-panel performance ----------
fig, axes = plt.subplots(1, 3, figsize=(13.2, 3.9))

# (a) Sequential bandwidth GB/s
ax = axes[0]
rd = [g(t, "seqread", "read", "bw_GBps") for t in tags]
wr = [g(t, "seqwrite", "write", "bw_GBps") for t in tags]
b1 = ax.bar([i - w / 2 for i in x], rd, w, label="Seq Read", color=NAVY)
b2 = ax.bar([i + w / 2 for i in x], wr, w, label="Seq Write", color=GREEN)
barlabels(ax, b1); barlabels(ax, b2)
ax.set_title("Sequential bandwidth (1 MiB, QD32×4)")
ax.set_ylabel("GB/s")
ax.set_xticks(list(x)); ax.set_xticklabels(labels, fontsize=7.5)
ax.legend(fontsize=8, frameon=False)
ax.set_ylim(0, max(rd + wr) * 1.25)
ax.grid(axis="y", ls=":", alpha=0.5)

# (b) Random 4K IOPS (k)
ax = axes[1]
rr = [g(t, "randread", "read", "iops") / 1000.0 for t in tags]
rw = [g(t, "randwrite", "write", "iops") / 1000.0 for t in tags]
b1 = ax.bar([i - w / 2 for i in x], rr, w, label="Rand Read 4K", color=NAVY)
b2 = ax.bar([i + w / 2 for i in x], rw, w, label="Rand Write 4K", color=GOLD)
barlabels(ax, b1, "{:.0f}k"); barlabels(ax, b2, "{:.0f}k")
ax.set_title("Random 4 KiB IOPS (QD128×4)")
ax.set_ylabel("kIOPS")
ax.set_xticks(list(x)); ax.set_xticklabels(labels, fontsize=7.5)
ax.legend(fontsize=8, frameon=False)
ax.set_ylim(0, max(rr + rw) * 1.25 if max(rr + rw) > 0 else 1)
ax.grid(axis="y", ls=":", alpha=0.5)

# (c) QD1 latency us
ax = axes[2]
lr = [g(t, "qd1read", "read", "lat_us_mean") for t in tags]
lw = [g(t, "qd1write", "write", "lat_us_mean") for t in tags]
b1 = ax.bar([i - w / 2 for i in x], lr, w, label="QD1 Read", color=NAVY)
b2 = ax.bar([i + w / 2 for i in x], lw, w, label="QD1 Write", color=RED)
barlabels(ax, b1, "{:.0f}"); barlabels(ax, b2, "{:.0f}")
ax.set_title("QD1 4 KiB latency (lower = better)")
ax.set_ylabel("microseconds")
ax.set_xticks(list(x)); ax.set_xticklabels(labels, fontsize=7.5)
ax.legend(fontsize=8, frameon=False)
ax.set_ylim(0, max(lr + lw) * 1.3 if max(lr + lw) > 0 else 1)
ax.grid(axis="y", ls=":", alpha=0.5)

fig.tight_layout()
fig.savefig(os.path.join(HERE, "fig_perf.png"), dpi=150, bbox_inches="tight")
plt.close(fig)

# ---------- Figure 2: PCIe link ceiling vs measured ----------
fig, ax = plt.subplots(figsize=(8.2, 4.0))
ww = 0.27
capv = [cap[t] for t in tags]
negv = [neg[t] for t in tags]
meas = [g(t, "seqread", "read", "bw_GBps") for t in tags]
b1 = ax.bar([i - ww for i in x], capv, ww, label="Link capable (max)", color=GREY)
b2 = ax.bar([i for i in x], negv, ww, label="Link negotiated (ceiling)", color=NAVY)
b3 = ax.bar([i + ww for i in x], meas, ww, label="Measured seq read", color=GREEN)
barlabels(ax, b1); barlabels(ax, b2); barlabels(ax, b3)
# mark downgraded drives
for i, t in enumerate(tags):
    if neg[t] < cap[t] - 0.01:
        ax.annotate("LINK\nDOWNGRADE", (i, cap[t]), ha="center", va="bottom",
                    fontsize=7.5, fontweight="bold", color=RED, xytext=(0, 10),
                    textcoords="offset points")
ax.set_title("PCIe link: capable vs negotiated vs measured")
ax.set_ylabel("GB/s")
ax.set_xticks(list(x)); ax.set_xticklabels([shortp[t] for t in tags], fontsize=8)
ax.legend(fontsize=8, frameon=False, loc="upper right")
ax.set_ylim(0, max(capv) * 1.32)
ax.grid(axis="y", ls=":", alpha=0.5)
fig.tight_layout()
fig.savefig(os.path.join(HERE, "fig_pcie.png"), dpi=150, bbox_inches="tight")
plt.close(fig)

print("charts written: fig_perf.png, fig_pcie.png")
