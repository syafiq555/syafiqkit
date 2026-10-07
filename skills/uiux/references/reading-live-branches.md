# Reading the branch that actually renders

When reading a component to understand what's designed, trace to the branch that returns on the route you're designing for.

A component holds several layouts (conditional render, feature flag, route check), and the page you're redesigning may be the desktop master-detail while the first layout in the file is mobile grid. An import name, component name and file's opening JSX all describe what exists, never what ships on this route, which is why designing from them produces careful redesigns of surfaces no user sees.

The same holds one layer up: confirm a framework or library from the entry point that loads it, not from a manifest that declares it.

Trace the render path before designing. Where a surface genuinely has two live branches, design both and say so. If you are describing a layout you inferred from a name rather than one you traced to the branch that returns it, you have not traced it yet.
