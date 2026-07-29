#!/usr/bin/env python3
# Remove name / "Confidential" / "Generated for ... internal engineering" from the PDF-only reports.
import fitz, os, shutil
DESK = r"C:\Users\asus\Desktop"
BK = r"C:\Users\asus\Desktop\nvme_bench\report_backups"
os.makedirs(BK, exist_ok=True)
PDFS = [
    "Netweb_100G_RoCE_Benchmark_Report.pdf",
    "Netweb_217_3h_Memory_Validation_Report.pdf",
    "Netweb_Memory_Validation_Report.pdf",
    "Netweb_Server19_Memory_Validation_Report.pdf",
]
CONF = ["Confidential — Internal Engineering", "Confidential — internal engineering review"]
NAME_FULL = "Shailendra — Netweb Technologies India Ltd"
KEEP = "Netweb Technologies India Ltd"


def bg_color(page, rect):
    """Most common pixel color in a strip just left (then right) of the text rect."""
    for (x0, x1) in [(rect.x0 - 16, rect.x0 - 3), (rect.x1 + 3, rect.x1 + 16)]:
        if x0 < 0:
            continue
        clip = fitz.Rect(x0, rect.y0 + 1, x1, rect.y1 - 1)
        if clip.width <= 0 or clip.height <= 0:
            continue
        try:
            pix = page.get_pixmap(clip=clip, dpi=72, colorspace=fitz.csRGB)
        except Exception:
            continue
        if pix.width == 0 or pix.height == 0:
            continue
        cols = {}
        for yy in range(pix.height):
            for xx in range(pix.width):
                c = pix.pixel(xx, yy)
                cols[c] = cols.get(c, 0) + 1
        if cols:
            b = max(cols, key=cols.get)
            return (b[0] / 255, b[1] / 255, b[2] / 255)
    return (1, 1, 1)


def scrub(path):
    doc = fitz.open(path)
    n_conf = n_name = n_close = 0
    for pno in range(doc.page_count):
        page = doc[pno]
        for t in CONF:
            for r in page.search_for(t):
                page.add_redact_annot(r, fill=bg_color(page, r)); n_conf += 1
        for b in page.get_text("blocks"):
            if "Generated for Netweb" in b[4]:
                rr = fitz.Rect(b[0], b[1], b[2], b[3])
                page.add_redact_annot(rr, fill=bg_color(page, rr)); n_close += 1
        full = page.search_for(NAME_FULL)
        if full:
            f = full[0]; x1 = f.x1
            for kr in page.search_for(KEEP):
                if abs(kr.y0 - f.y0) < 2 and kr.x0 >= f.x0 - 1:
                    x1 = kr.x0; break
            rr = fitz.Rect(f.x0, f.y0, x1, f.y1)
            page.add_redact_annot(rr, fill=bg_color(page, rr)); n_name += 1
        else:
            for r in page.search_for("Shailendra"):
                page.add_redact_annot(r, fill=bg_color(page, r)); n_name += 1
        page.apply_redactions()
    tmp = path + ".scrubbed.pdf"
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    return tmp, n_conf, n_name, n_close


for fn in PDFS:
    p = os.path.join(DESK, fn)
    shutil.copy2(p, os.path.join(BK, fn))
    tmp, c, nm, cl = scrub(p)
    os.replace(tmp, p)
    print(f"scrubbed {fn}: confidential={c} name={nm} closing={cl}")
print("PDF_DONE")
