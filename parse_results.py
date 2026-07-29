#!/usr/bin/env python3
import json, os
OUT = "/tmp/nvmebench"
tags = ["nvme0n1", "nvme1n1", "nvme2n1", "nvme3n1"]
tests = ["seqwrite", "seqread", "randwrite", "randread", "mixed", "qd1read", "qd1write"]

res = {}
for tag in tags:
    res[tag] = {}
    for test in tests:
        fn = f"{OUT}/{tag}_{test}.json"
        if not os.path.exists(fn):
            continue
        try:
            d = json.load(open(fn))
        except Exception as e:
            res[tag][test] = {"error": str(e)}
            continue
        job = d["jobs"][0]
        entry = {}
        for io in ("read", "write"):
            j = job.get(io, {})
            if j.get("io_bytes", 0) == 0 and j.get("iops", 0) == 0:
                continue
            clat = j.get("clat_ns", {})
            pct = clat.get("percentile", {}) or {}
            entry[io] = {
                "bw_MBps": round(j.get("bw_bytes", 0) / 1e6, 1),
                "bw_GBps": round(j.get("bw_bytes", 0) / 1e9, 3),
                "iops": int(round(j.get("iops", 0))),
                "lat_us_mean": round(j.get("lat_ns", {}).get("mean", 0) / 1000.0, 1),
                "clat_us_mean": round(clat.get("mean", 0) / 1000.0, 1),
                "clat_us_p99": round(pct.get("99.000000", 0) / 1000.0, 1),
                "clat_us_p999": round(pct.get("99.900000", 0) / 1000.0, 1),
            }
        res[tag][test] = entry

json.dump(res, open(f"{OUT}/summary.json", "w"), indent=2)


def gv(tag, test, io, key, dflt="-"):
    return res.get(tag, {}).get(test, {}).get(io, {}).get(key, dflt)


print("=" * 70)
for tag in tags:
    print(f"\n===== {tag} =====")
    print(f"  Seq Read    : {gv(tag,'seqread','read','bw_GBps')} GB/s  ({gv(tag,'seqread','read','bw_MBps')} MB/s)")
    print(f"  Seq Write   : {gv(tag,'seqwrite','write','bw_GBps')} GB/s  ({gv(tag,'seqwrite','write','bw_MBps')} MB/s)")
    print(f"  RandRead 4K : {gv(tag,'randread','read','iops')} IOPS  (avg {gv(tag,'randread','read','lat_us_mean')}us, p99 {gv(tag,'randread','read','clat_us_p99')}us)")
    print(f"  RandWrite 4K: {gv(tag,'randwrite','write','iops')} IOPS  (avg {gv(tag,'randwrite','write','lat_us_mean')}us, p99 {gv(tag,'randwrite','write','clat_us_p99')}us)")
    print(f"  Mixed 70/30 : R {gv(tag,'mixed','read','iops')} + W {gv(tag,'mixed','write','iops')} IOPS")
    print(f"  QD1 RandRead: {gv(tag,'qd1read','read','lat_us_mean')} us avg (p99 {gv(tag,'qd1read','read','clat_us_p99')}us)")
    print(f"  QD1 RandWrt : {gv(tag,'qd1write','write','lat_us_mean')} us avg (p99 {gv(tag,'qd1write','write','clat_us_p99')}us)")
print("\nSUMMARY_JSON_WRITTEN")
