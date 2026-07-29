#!/usr/bin/env python3
"""Charts for the .38 NVMe report + cross-server (.217 vs .38) comparison."""
import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(HERE, "summary_38.json")))
P = json.load(open(os.path.join(HERE, "summary_217.json")))

NAVY="#1F3864"; GREEN="#3C8C5A"; GOLD="#E0A33E"; RED="#C00000"; GREY="#9AA5B1"; TEAL="#2C7FB8"
plt.rcParams.update({"font.size":10,"axes.titlesize":11,"axes.titleweight":"bold","axes.titlecolor":NAVY})

# serial -> nvmeXn1 on each server
SER217 = {"S7RKNG0YB01763":"nvme0n1","S7RKNG0YB01786":"nvme1n1","S8CDNG0YC00153":"nvme2n1","S8CDNG0YC00174":"nvme3n1"}
SER38  = {"S8CDNG0YC00174":"nvme0n1","S8CDNG0YC00153":"nvme1n1","S7RKNG0YB01786":"nvme2n1","S7RKNG0YB01763":"nvme3n1"}

tags = ["nvme0n1","nvme1n1","nvme2n1","nvme3n1"]
short = {"nvme0n1":"nvme0\n960GB M.2","nvme1n1":"nvme1\n960GB M.2",
         "nvme2n1":"nvme2\n15.36TB U.2\n(recovered)","nvme3n1":"nvme3\n15.36TB U.2"}

def g(D,t,test,io,key,d=0.0):
    return D.get(t,{}).get(test,{}).get(io,{}).get(key,d)
def lab(ax,bars,fmt="{:.1f}"):
    for b in bars:
        h=b.get_height()
        ax.annotate(fmt.format(h),(b.get_x()+b.get_width()/2,h),ha="center",va="bottom",
                    fontsize=8,xytext=(0,1),textcoords="offset points")

x=range(len(tags)); w=0.38; labels=[short[t] for t in tags]

# ---- Figure 1: .38 performance (3 panels) ----
fig,ax=plt.subplots(1,3,figsize=(13.2,4.1))
a=ax[0]
rd=[g(S,t,"seqread","read","bw_GBps") for t in tags]; wr=[g(S,t,"seqwrite","write","bw_GBps") for t in tags]
b1=a.bar([i-w/2 for i in x],rd,w,label="Seq Read",color=NAVY); b2=a.bar([i+w/2 for i in x],wr,w,label="Seq Write",color=GREEN)
lab(a,b1); lab(a,b2); a.set_title("Sequential bandwidth (1 MiB, QD32×4)"); a.set_ylabel("GB/s")
a.set_xticks(list(x)); a.set_xticklabels(labels,fontsize=7); a.legend(fontsize=8,frameon=False)
a.set_ylim(0,max(rd+wr)*1.25 if max(rd+wr)>0 else 1); a.grid(axis="y",ls=":",alpha=0.5)
a=ax[1]
rr=[g(S,t,"randread","read","iops")/1000 for t in tags]; rw=[g(S,t,"randwrite","write","iops")/1000 for t in tags]
b1=a.bar([i-w/2 for i in x],rr,w,label="Rand Read 4K",color=NAVY); b2=a.bar([i+w/2 for i in x],rw,w,label="Rand Write 4K",color=GOLD)
lab(a,b1,"{:.0f}k"); lab(a,b2,"{:.0f}k"); a.set_title("Random 4 KiB IOPS (QD128×4)"); a.set_ylabel("kIOPS")
a.set_xticks(list(x)); a.set_xticklabels(labels,fontsize=7); a.legend(fontsize=8,frameon=False)
a.set_ylim(0,max(rr+rw)*1.25 if max(rr+rw)>0 else 1); a.grid(axis="y",ls=":",alpha=0.5)
a=ax[2]
lr=[g(S,t,"qd1read","read","lat_us_mean") for t in tags]; lw=[g(S,t,"qd1write","write","lat_us_mean") for t in tags]
b1=a.bar([i-w/2 for i in x],lr,w,label="QD1 Read",color=NAVY); b2=a.bar([i+w/2 for i in x],lw,w,label="QD1 Write",color=RED)
lab(a,b1,"{:.0f}"); lab(a,b2,"{:.0f}"); a.set_title("QD1 4 KiB latency (lower = better)"); a.set_ylabel("microseconds")
a.set_xticks(list(x)); a.set_xticklabels(labels,fontsize=7); a.legend(fontsize=8,frameon=False)
a.set_ylim(0,max(lr+lw)*1.3 if max(lr+lw)>0 else 1); a.grid(axis="y",ls=":",alpha=0.5)
fig.tight_layout(); fig.savefig(os.path.join(HERE,"fig_perf_38.png"),dpi=150,bbox_inches="tight"); plt.close(fig)

# ---- Figure 2: cross-server comparison (.217 vs .38) by drive class ----
# representative serials: 960GB = S8CDNG0YC00174 ; 15.36TB = S7RKNG0YB01763
classes = [("960 GB M.2 (PM9D3a)","S8CDNG0YC00174"), ("15.36 TB U.2 (PM9D3a)","S7RKNG0YB01763")]
fig,ax=plt.subplots(1,2,figsize=(11,4.2))
# seq read panel
a=ax[0]; xs=range(len(classes)); ww=0.36
v217=[g(P,SER217[s],"seqread","read","bw_GBps") for _,s in classes]
v38 =[g(S,SER38[s],"seqread","read","bw_GBps") for _,s in classes]
b1=a.bar([i-ww/2 for i in xs],v217,ww,label="Server .217",color=GREY)
b2=a.bar([i+ww/2 for i in xs],v38,ww,label="Server .38",color=TEAL)
lab(a,b1,"{:.2f}"); lab(a,b2,"{:.2f}")
a.set_title("Sequential read — .217 vs .38"); a.set_ylabel("GB/s")
a.set_xticks(list(xs)); a.set_xticklabels([c for c,_ in classes],fontsize=8); a.legend(fontsize=8,frameon=False)
a.set_ylim(0,max(v217+v38)*1.25 if max(v217+v38)>0 else 1); a.grid(axis="y",ls=":",alpha=0.5)
# rand read IOPS panel
a=ax[1]
r217=[g(P,SER217[s],"randread","read","iops")/1000 for _,s in classes]
r38 =[g(S,SER38[s],"randread","read","iops")/1000 for _,s in classes]
b1=a.bar([i-ww/2 for i in xs],r217,ww,label="Server .217",color=GREY)
b2=a.bar([i+ww/2 for i in xs],r38,ww,label="Server .38",color=TEAL)
lab(a,b1,"{:.0f}k"); lab(a,b2,"{:.0f}k")
a.set_title("4K random read IOPS — .217 vs .38"); a.set_ylabel("kIOPS")
a.set_xticks(list(xs)); a.set_xticklabels([c for c,_ in classes],fontsize=8); a.legend(fontsize=8,frameon=False)
a.set_ylim(0,max(r217+r38)*1.25 if max(r217+r38)>0 else 1); a.grid(axis="y",ls=":",alpha=0.5)
fig.tight_layout(); fig.savefig(os.path.join(HERE,"fig_compare.png"),dpi=150,bbox_inches="tight"); plt.close(fig)

# ---- Figure 3: PCIe link on .38 ----
cap={"nvme0n1":7.88,"nvme1n1":7.88,"nvme2n1":15.75,"nvme3n1":15.75}
neg={"nvme0n1":3.94,"nvme1n1":3.94,"nvme2n1":15.75,"nvme3n1":15.75}
fig,a=plt.subplots(figsize=(8.4,4.0)); ww=0.27
capv=[cap[t] for t in tags]; negv=[neg[t] for t in tags]; meas=[g(S,t,"seqread","read","bw_GBps") for t in tags]
b1=a.bar([i-ww for i in x],capv,ww,label="Link capable (max)",color=GREY)
b2=a.bar([i for i in x],negv,ww,label="Link negotiated",color=NAVY)
b3=a.bar([i+ww for i in x],meas,ww,label="Measured seq read",color=GREEN)
lab(a,b1); lab(a,b2); lab(a,b3)
for i,t in enumerate(tags):
    if neg[t]<cap[t]-0.01:
        a.annotate("x2 WIDTH",(i,cap[t]),ha="center",va="bottom",fontsize=7.5,fontweight="bold",color=RED,xytext=(0,8),textcoords="offset points")
a.set_title("PCIe link on .38: capable vs negotiated vs measured"); a.set_ylabel("GB/s")
a.set_xticks(list(x)); a.set_xticklabels([short[t].split('\n')[0]+"\n"+short[t].split('\n')[1] for t in tags],fontsize=8)
a.legend(fontsize=8,frameon=False,loc="upper right"); a.set_ylim(0,max(capv)*1.3); a.grid(axis="y",ls=":",alpha=0.5)
fig.tight_layout(); fig.savefig(os.path.join(HERE,"fig_pcie_38.png"),dpi=150,bbox_inches="tight"); plt.close(fig)

print("charts written: fig_perf_38.png, fig_compare.png, fig_pcie_38.png")
