#!/bin/bash
# NVMe validation suite for server 172.16.15.38 (user-Dev) - run as root: sudo bash bench_nvme38.sh
# All 4 drives are on NUMA node 0 -> run sequentially for clean per-drive peaks.
set -u
OUT=/tmp/nvmebench
mkdir -p "$OUT"
LOG="$OUT/run.log"
: > "$LOG"
echo "BENCH_START $(date -u +%FT%TZ)" | tee -a "$LOG"
fio --version | tee -a "$LOG"
echo "--- device map at start ---" >> "$LOG"
nvme list >> "$LOG" 2>&1

# Recovered drive nvme2 (S7RKNG0YB01786) was found controller-down (APST power-state bug).
# Disable APST to keep it stable through the run.
echo "--- disabling APST on /dev/nvme2 ---" >> "$LOG"
nvme set-feature /dev/nvme2 -f 0x0c -v 0 >> "$LOG" 2>&1 || echo "APST disable failed/unsupported" >> "$LOG"

for n in 0 1 2 3; do
  t=$(nvme smart-log /dev/nvme${n}n1 2>/dev/null | grep -E '^temperature' | head -1)
  echo "nvme${n}n1 PRE  $t" >> "$OUT/temps.txt"
done

run_suite() {
  local dev=$1 node=$2 ws=$3 part=$4 tag=$5
  if ! nvme id-ns "$dev" >/dev/null 2>&1; then
    echo "[$(date +%T)] $tag SKIP — device not responding" >> "$LOG"
    echo "DEVICE_DOWN" > "$OUT/${tag}_status.txt"; return
  fi
  local G="numactl --cpunodebind=$node --membind=$node fio --filename=$dev --ioengine=libaio --direct=1 --group_reporting --output-format=json --name=j"
  echo "[$(date +%T)] $tag START node=$node ws=$ws part=$part" >> "$LOG"
  $G --rw=write     --bs=1M --iodepth=32  --numjobs=4 --size=$part --offset_increment=$part --output=$OUT/${tag}_seqwrite.json >>"$LOG" 2>&1
  $G --rw=read      --bs=1M --iodepth=32  --numjobs=4 --size=$part --offset_increment=$part --output=$OUT/${tag}_seqread.json >>"$LOG" 2>&1
  $G --rw=randwrite --bs=4k --iodepth=128 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=60 --ramp_time=10 --output=$OUT/${tag}_randwrite.json >>"$LOG" 2>&1
  $G --rw=randread  --bs=4k --iodepth=128 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=60 --ramp_time=10 --output=$OUT/${tag}_randread.json >>"$LOG" 2>&1
  $G --rw=randrw --rwmixread=70 --bs=4k --iodepth=64 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=45 --ramp_time=10 --output=$OUT/${tag}_mixed.json >>"$LOG" 2>&1
  $G --rw=randread  --bs=4k --iodepth=1 --numjobs=1 --size=$ws --norandommap --randrepeat=0 --time_based --runtime=30 --output=$OUT/${tag}_qd1read.json >>"$LOG" 2>&1
  $G --rw=randwrite --bs=4k --iodepth=1 --numjobs=1 --size=$ws --norandommap --randrepeat=0 --time_based --runtime=30 --output=$OUT/${tag}_qd1write.json >>"$LOG" 2>&1
  nvme smart-log $dev 2>/dev/null | grep -E '^temperature' | head -1 | sed "s/^/${tag} POST /" >> "$OUT/temps.txt"
  echo "[$(date +%T)] $tag DONE" >> "$LOG"
}

run_suite /dev/nvme0n1 0 128G 32G nvme0n1
run_suite /dev/nvme1n1 0 128G 32G nvme1n1
run_suite /dev/nvme2n1 0 256G 64G nvme2n1
run_suite /dev/nvme3n1 0 256G 64G nvme3n1

chmod -R a+rX "$OUT"
echo "ALL_DONE $(date -u +%FT%TZ)" | tee -a "$LOG"
