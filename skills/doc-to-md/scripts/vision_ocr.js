ObjC.import('Foundation');
ObjC.import('Vision');

function run(argv) {
  const lines = [];
  let langs = ['en-US'];
  const paths = [];
  for (const a of argv) {
    if (a.startsWith('--langs=')) langs = a.slice(8).split(',').filter(Boolean);
    else paths.push(a);
  }
  for (const path of paths) {
    const url = $.NSURL.fileURLWithPath(path);
    const req = $.VNRecognizeTextRequest.alloc.init;
    req.recognitionLevel = 0;
    req.usesLanguageCorrection = true;
    req.recognitionLanguages = $(langs);
    const handler = $.VNImageRequestHandler.alloc.initWithURLOptions(url, $({}));
    const err = Ref();
    if (!handler.performRequestsError($([req]), err)) {
      lines.push(['#ERROR', path, ObjC.unwrap(err[0].localizedDescription)].join('\t'));
      continue;
    }
    lines.push(['#PAGE', path].join('\t'));
    const results = req.results;
    for (let i = 0; i < results.count; i++) {
      const o = results.objectAtIndex(i);
      const cand = o.topCandidates(1).objectAtIndex(0);
      const raw = ObjC.unwrap(cand.string);
      const text = raw.replace(/[\t\n]/g, ' ');
      const b = o.boundingBox;
      let dx = 0, dy = 0;
      if (raw.length >= 2) {
        const first = cand.boundingBoxForRangeError($.NSMakeRange(0, 1), null);
        const last = cand.boundingBoxForRangeError($.NSMakeRange(raw.length - 1, 1), null);
        if (!first.isNil() && !last.isNil()) {
          const f = first.boundingBox, l = last.boundingBox;
          dx = (l.origin.x + l.size.width / 2) - (f.origin.x + f.size.width / 2);
          dy = (l.origin.y + l.size.height / 2) - (f.origin.y + f.size.height / 2);
        }
      }
      lines.push([text, b.origin.x, b.origin.y, b.size.width, b.size.height, dx, dy].join('\t'));
    }
  }
  return lines.join('\n');
}
