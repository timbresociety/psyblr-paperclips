# Validation status

Validated in the artifact-generation environment:
- reduced context surface checker passes;
- original archived engine: 51/51 reference checks pass;
- original master consistency checker passes;
- starter TypeScript/TSX parses and type-checks against temporary React/Vite declaration shims.

Not validated here:
- a real dependency install;
- Vite production bundle;
- browser interaction/screenshots.

Reason: `npm install` exceeded the available registry command window in the generation sandbox and did not create `node_modules`.

On the target machine run:

```bash
npm install
npm run check
npm run dev
```

Then execute `tasks/ORCHESTRATE.md`. If install/build fails, fix bootstrap only before delegating feature slices.
