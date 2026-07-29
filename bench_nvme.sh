#!/bin/bash
# NVMe validation benchmark suite - run as root: sudo bash bench_nvme.sh
set -u
OUT=/tmp/nvmebench
mkdir -p "$OUT"
LOG="$OUT/run.log"
: > "$LOG"
echo "BENCH_START $(date -u +%FT%TZ)" | tee -a "$LOG"
fio --version | tee -a "$LOG"

# Pre-test temps
for n in 0 1 2 3; do
  t=$(nvme smart-log /dev/nvme${n}n1 2>/dev/null | grep -E '^temperature' | head -1)
  echo "nvme${n}n1 PRE  $t" >> "$OUT/temps.txt"
done

# Clear stale (empty) GPT on the two 15TB drives - authorized destructive, no filesystems present
for d in /dev/nvme0n1 /dev/nvme1n1; do
  wipefs -a "$d" >/dev/null 2>&1
done
partprobe >/dev/null 2>&1 || true
sleep 2

run_suite() {
  local dev=$1 node=$2 ws=$3 part=$4 tag=$5
  local G="numactl --cpunodebind=$node --membind=$node fio --filename=$dev --ioengine=libaio --direct=1 --group_reporting --output-format=json --name=j"
  echo "[$(date +%T)] $tag START node=$node ws=$ws part=$part" >> "$LOG"

  echo "[$(date +%T)] $tag seqwrite" >> "$LOG"
  $G --rw=write     --bs=1M --iodepth=32  --numjobs=4 --size=$part --offset_increment=$part --output=$OUT/${tag}_seqwrite.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag seqread" >> "$LOG"
  $G --rw=read      --bs=1M --iodepth=32  --numjobs=4 --size=$part --offset_increment=$part --output=$OUT/${tag}_seqread.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag randwrite" >> "$LOG"
  $G --rw=randwrite --bs=4k --iodepth=128 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=60 --ramp_time=10 --output=$OUT/${tag}_randwrite.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag randread" >> "$LOG"
  $G --rw=randread  --bs=4k --iodepth=128 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=60 --ramp_time=10 --output=$OUT/${tag}_randread.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag mixed7030" >> "$LOG"
  $G --rw=randrw --rwmixread=70 --bs=4k --iodepth=64 --numjobs=4 --size=$part --offset_increment=$part --norandommap --randrepeat=0 --time_based --runtime=45 --ramp_time=10 --output=$OUT/${tag}_mixed.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag qd1read" >> "$LOG"
  $G --rw=randread  --bs=4k --iodepth=1 --numjobs=1 --size=$ws --norandommap --randrepeat=0 --time_based --runtime=30 --output=$OUT/${tag}_qd1read.json >>"$LOG" 2>&1

  echo "[$(date +%T)] $tag qd1write" >> "$LOG"
  $G --rw=randwrite --bs=4k --iodepth=1 --numjobs=1 --size=$ws --norandommap --randrepeat=0 --time_based --runtime=30 --output=$OUT/${tag}_qd1write.json >>"$LOG" 2>&1

  nvme smart-log $dev 2>/dev/null | grep -E '^temperature' | head -1 | sed "s/^/${tag} POST /" >> "$OUT/temps.txt"
  echo "[$(date +%T)] $tag DONE" >> "$LOG"
}

# WAVE 1: one drive per socket - nvme0(node1, 15TB) || nvme2(node0, 960GB)
run_suite /dev/nvme0n1 1 256G 64G nvme0n1 &
run_suite /dev/nvme2n1 0 128G 32G nvme2n1 &
wait
echo "[$(date +%T)] WAVE1 COMPLETE" >> "$LOG"

# WAVE 2: nvme1(node1, 15TB) || nvme3(node0, 960GB)
run_suite /dev/nvme1n1 1 256G 64G nvme1n1 &
run_suite /dev/nvme3n1 0 128G 32G nvme3n1 &
wait
echo "[$(date +%T)] WAVE2 COMPLETE" >> "$LOG"

chmod -R a+rX "$OUT"
echo "ALL_DONE $(date -u +%FT%TZ)" | tee -a "$LOG"
