#!/usr/bin/env python3
"""Build a black-and-white discussion board as raw Excalidraw JSON from a small spec.

usage: build_board.py spec.json out.excalidraw [--clipboard]

Spec shape (see ../assets/example-sprint-board.json):
{
  "title": "...", "subtitle": "...", "footer": "...",
  "columns": [ {"id": "now", "head": "CAN START NOW",
                "rows": [ {"id": "gEt", "text": "GATE: ...", "branches": ["one point", "another"],
                           "gate": true, "done": false} ]} ],
  "arrows":  [ {"from": "gEtb1", "to": "gP"} ],          # element ids; branch ids are <rowid>b<n>
  "parked":  {"columns": [["what", 300], ["why parked", 300], ["what brings it back", 330], ["owner", 120]],
              "rows": [["#10 ...", "not important now", "after ...", "Syafiq"]]},
  "strips":  [ {"id": "dec", "head": "ALREADY DECIDED", "lines": ["..."], "blank": 2} ]
}
One point per box. Main boxes hold a short noun phrase; each branch holds one fact about it.
"""
import json, subprocess, sys

FS_HEAD, FS_MAIN, FS_SUB, FS_LINE = 20, 18, 16, 16
MW, BW, GAP, COLGAP = 250, 230, 14, 40
COLW = MW + GAP + BW
E = []


def wrap(t, maxc):
    out, cur = [], ""
    for w in t.split():
        if len(cur) + len(w) + 1 > maxc and cur:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        out.append(cur)
    return "\n".join(out)


def measure(t, w, fs):
    tt = wrap(t, int((w - 20) / (fs * 0.55)))
    return tt, (tt.count("\n") + 1) * fs * 1.25


def box(id_, x, y, w, h, t, fs, sw=1, dashed=False):
    r = {"id": id_, "type": "rectangle", "x": x, "y": y, "width": w, "height": h, "strokeWidth": sw,
         "roundness": {"type": 3}, "backgroundColor": "#ffffff",
         "boundElements": [{"id": "t_" + id_, "type": "text"}]}
    if dashed:
        r["strokeStyle"] = "dashed"
    E.append(r)
    tt, th = measure(t, w, fs)
    E.append({"id": "t_" + id_, "type": "text", "x": x + 10, "y": y + (h - th) / 2, "width": w - 20, "height": th,
              "text": tt, "fontSize": fs, "fontFamily": 2, "textAlign": "center", "verticalAlign": "middle",
              "containerId": id_})


def txt(id_, x, y, t, fs):
    lines = t.split("\n")
    # width generous on purpose: Excalidraw clips a text element narrower than its glyphs
    E.append({"id": id_, "type": "text", "x": x, "y": y, "width": round(max(len(l) for l in lines) * fs * 0.72, 1),
              "height": len(lines) * fs * 1.25, "text": t, "fontSize": fs, "fontFamily": 2})


def bind(eid, arrow_id):
    for e in E:
        if e["id"] == eid and e.get("boundElements") is not None:
            e["boundElements"].append({"id": arrow_id, "type": "arrow"})


def connector(id_, x, y, dx, dy, frm, to, sw=1, head=None):
    E.append({"id": id_, "type": "arrow", "x": x, "y": y, "width": dx, "height": dy, "strokeWidth": sw,
              "roundness": None, "points": [[0, 0], [dx, dy]], "endArrowhead": head,
              "startBinding": {"elementId": frm, "focus": 0, "gap": 1},
              "endBinding": {"elementId": to, "focus": 0, "gap": 1}})
    bind(frm, id_); bind(to, id_)


def by_id(eid):
    return next(e for e in E if e["id"] == eid)


def column(cx, col):
    box("h_" + col["id"], cx, 80, COLW, 44, col["head"], FS_HEAD, sw=2)
    y = 140
    for row in col["rows"]:
        cid, main = row["id"], row["text"]
        branches = row.get("branches", [])
        _, mth = measure(main, MW, FS_MAIN)
        mh = max(56, mth + 18)
        bhs = [max(44, measure(b, BW, FS_SUB)[1] + 14) for b in branches]
        bh = sum(bhs) + 8 * (len(bhs) - 1) if bhs else 0
        rowh = max(mh, bh)
        my = y + (rowh - mh) / 2
        box(cid, cx, my, MW, mh, main, FS_MAIN, sw=4 if row.get("gate") else 1, dashed=row.get("done", False))
        byy = y + (rowh - bh) / 2
        for j, (b, h) in enumerate(zip(branches, bhs)):
            bid = f"{cid}b{j}"
            box(bid, cx + MW + GAP, byy, BW, h, b, FS_SUB)
            connector(f"l_{bid}", cx + MW, my + mh / 2, GAP, byy + h / 2 - (my + mh / 2), cid, bid)
            byy += h + 8
        y += rowh + 16
    return y


def main():
    spec = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    txt("title", 20, 0, spec["title"], 26)
    if spec.get("subtitle"):
        txt("sub", 20, 38, spec["subtitle"], 15)
    ends, x = [], 20
    for col in spec["columns"]:
        ends.append(column(x, col)); x += COLW + COLGAP
    for i, a in enumerate(spec.get("arrows", [])):
        f, t = by_id(a["from"]), by_id(a["to"])
        fx, fy = f["x"] + f["width"], f["y"] + f["height"] / 2
        tx, ty = t["x"], t["y"] + t["height"] / 2
        connector(f"a{i}", fx, fy, tx - fx, ty - fy, a["from"], a["to"], sw=3, head="arrow")
    bottom = max(ends)
    if spec.get("parked"):
        p = spec["parked"]; py = bottom + 30
        txt("hParked", 20, py, p.get("head", "PARKED"), FS_HEAD)
        hx, hy = 20, py + 36
        for i, (h, w) in enumerate(p["columns"]):
            txt(f"ph{i}", hx + 6, hy, h, 15); hx += w + 10
        ry = hy + 26
        for r, row in enumerate(p["rows"]):
            rx = 20
            for c, (val, (_, w)) in enumerate(zip(row, p["columns"])):
                box(f"p{r}{c}", rx, ry, w, 46, val, FS_SUB); rx += w + 10
            ry += 54
        bottom = ry
    rx, rw, sy = x, 520, 80
    for s in spec.get("strips", []):
        n = len(s["lines"]) + s.get("blank", 0)
        h = 48 + 26 * n + 20
        E.append({"id": s["id"], "type": "rectangle", "x": rx, "y": sy, "width": rw, "height": h, "strokeWidth": 2,
                  "roundness": {"type": 3}, "backgroundColor": "transparent", "boundElements": None})
        txt(s["id"] + "H", rx + 16, sy + 12, s["head"], FS_HEAD)
        yy = sy + 48
        for i, l in enumerate(s["lines"]):
            txt(f"{s['id']}{i}", rx + 16, yy, "- " + l, FS_LINE); yy += 26
        for i in range(s.get("blank", 0)):
            txt(f"{s['id']}b{i}", rx + 16, yy, "- ______________________________", FS_LINE); yy += 26
        sy += h + 20
    if spec.get("footer"):
        txt("footer", 20, bottom + 24, spec["footer"], 15)
    doc = {"type": "excalidraw", "version": 2, "source": "syafiqkit/excalidraw-board", "elements": E,
           "appState": {"viewBackgroundColor": "#ffffff"}, "files": {}}
    json.dump(doc, open(out, "w"), indent=1)
    if "--clipboard" in sys.argv:
        subprocess.run(["pbcopy"], input=json.dumps({"type": "excalidraw/clipboard", "elements": E, "files": {}}).encode(), check=True)
    print(f"{len(E)} elements -> {out}" + (" (and clipboard)" if "--clipboard" in sys.argv else ""))


if __name__ == "__main__":
    main()
