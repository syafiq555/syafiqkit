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

Meeting mode (a spec with "topics" instead of "columns"): a whiteboard panel to copy by hand, plus one
speaker-note card per topic beside it:
{
  "topics": [ {"text": "1. Pay first or next invoice?", "cue": "RM 2.50 mid-month",
               "notes": [["The issue", "..."], ["Example", "..."], ["Suggest", "..."]]} ],
  "dont_reopen": ["...already decided..."], "decided_blank": 3, "actions_blank": 4,
  "decided": ["..."], "actions": ["what · owner · date"],
  "open": [ {"head": "STILL OPEN · Hong Liang", "lines": ["..."], "blank": 0} ]
}
"decided" and "actions" write lines onto the panel after the meeting (under about 42 characters each);
the blanks follow them. "open" adds sections below Actions for questions still waiting, one per owner.
A cue may hold several short lines ("\n"); the topics below it move down to make room.
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


def rule(id_, x, y, w):
    E.append({"id": id_, "type": "line", "x": x, "y": y, "width": w, "height": 0, "strokeWidth": 1,
              "points": [[0, 0], [w, 0]]})


def write_lines(id_, x, y, head, n, w=380, filled=()):
    txt(id_ + "h", x, y, head, 20)
    top = y + (60 if filled else 48)
    for i, line in enumerate(filled):
        txt(f"{id_}t{i}", x, top + i * 34 - 24, line, FS_LINE)
    for i in range(len(filled) + n):
        rule(f"{id_}l{i}", x, top + i * 34, w)
    return top + (len(filled) + n) * 34


def note_block(notes, chars):
    entries = []
    for label, text in notes:
        first, *rest = wrap(f"{label}: {text}" if text else label, chars).split("\n")
        entries.append("\n".join([first] + ["    " + r for r in rest]))
    return "\n\n".join(entries)


def meeting(spec):
    txt("wbt", 0, 0, spec.get("whiteboard_head", "WHITEBOARD (copy this)"), 22)
    y = 50
    for i, t in enumerate(spec["topics"]):
        txt(f"wb{i}", 0, y, t["text"], 26)
        if t.get("cue"):
            txt(f"wbc{i}", 30, y + 36, t["cue"], 18)
        y += 67 + 23 * len(t.get("cue", "").split("\n"))
    dec_end = write_lines("dec", 0, y + 20, "DECIDED", spec.get("decided_blank", 3),
                          filled=spec.get("decided", ()))
    act_y = max(y + 200, dec_end + 30)
    act_end = write_lines("act", 0, act_y, "ACTIONS (what / owner / date)", spec.get("actions_blank", 4),
                          filled=spec.get("actions", ()))
    for k, s in enumerate(spec.get("open", ())):
        act_end = write_lines(f"open{k}", 0, act_end + 40, s["head"], s.get("blank", 0), filled=s.get("lines", ()))
    E.append({"id": "wbframe", "type": "rectangle", "x": -30, "y": -30, "width": 470,
              "height": max(y + 400, act_end + 16),
              "strokeWidth": 2, "roundness": None, "backgroundColor": "transparent"})
    txt("nt", 520, 0, spec.get("notes_head", "MY NOTES (not for the board)"), 22)
    cards = [(t["text"], note_block(t.get("notes", []), 74)) for t in spec["topics"]]
    if spec.get("dont_reopen"):
        cards.append(("Don't reopen", "\n".join("- " + d for d in spec["dont_reopen"])))
    cw, cy = 640, 50
    for r in range(0, len(cards), 2):
        pair = cards[r:r + 2]
        h = max((body.count("\n") + 1) * 15 * 1.25 for _, body in pair) + 90
        for j, (head, body) in enumerate(pair):
            i, cx = r + j, 520 + j * (cw + 30)
            E.append({"id": f"card{i}", "type": "rectangle", "x": cx, "y": cy, "width": cw, "height": h,
                      "strokeWidth": 1, "roundness": {"type": 3}, "backgroundColor": "#ffffff"})
            txt(f"ch{i}", cx + 20, cy + 16, head, 20)
            rule(f"cl{i}", cx + 20, cy + 50, cw - 40)
            txt(f"cn{i}", cx + 20, cy + 64, body, 15)
        cy += h + 30


def main():
    spec = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    if "topics" in spec:
        meeting(spec)
        return save(out)
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
    save(out)


def save(out):
    doc = {"type": "excalidraw", "version": 2, "source": "syafiqkit/excalidraw-board", "elements": E,
           "appState": {"viewBackgroundColor": "#ffffff"}, "files": {}}
    json.dump(doc, open(out, "w"), indent=1)
    if "--clipboard" in sys.argv:
        subprocess.run(["pbcopy"], input=json.dumps({"type": "excalidraw/clipboard", "elements": E, "files": {}}).encode(), check=True)
    print(f"{len(E)} elements -> {out}" + (" (and clipboard)" if "--clipboard" in sys.argv else ""))


if __name__ == "__main__":
    main()
