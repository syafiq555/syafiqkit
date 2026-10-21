import glob
import os
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import pipeline

paths = sys.argv[1:] or sorted(
    p for p in glob.glob("assets/screens/*") if p.lower().endswith((".png", ".jpg", ".jpeg", ".webp")) and ".depth." not in p
)
if not paths:
    sys.exit("no pictures given and none in assets/screens: pass the backdrop files to map")

device = "mps" if torch.backends.mps.is_available() else "cpu"
estimate = pipeline("depth-estimation", model=os.environ.get("DEPTH_MODEL", "depth-anything/Depth-Anything-V2-Small-hf"), device=device)

for path in paths:
    picture = Image.open(path).convert("RGB")
    depth = np.asarray(estimate(picture)["predicted_depth"].squeeze().float().cpu(), dtype=np.float32)
    low, high = np.percentile(depth, [1, 99])
    depth = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)
    out = Image.fromarray((depth * 255).astype(np.uint8), "L").resize(picture.size, Image.BICUBIC)
    out = out.filter(ImageFilter.GaussianBlur(radius=max(picture.size) * 0.004))
    target = os.path.splitext(path)[0] + ".depth.png"
    out.save(target)
    print(f"{path} -> {target}")
