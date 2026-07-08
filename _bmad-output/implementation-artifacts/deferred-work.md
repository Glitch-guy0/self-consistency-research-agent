# Deferred Work Items

## Deferred from: code review of 1-1-project-scaffold (2026-07-08)

- constructor() in ILLMProvider interface is invalid TypeScript — pre-existing stub owned by Story 1.6

## Deferred from: review of 1-2-environment-config-loader (2026-07-08)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-environment-config-loader.md`
  summary: `.ts` extension in imports may cause build issues with `allowImportingTsExtensions` + `outDir` configuration
  evidence: TypeScript's `allowImportingTsExtensions` requires `noEmit` or `emitDeclarationOnly` when `outDir` is set. The project has `build: "tsc"` which emits JS files — the `.ts` extension in import paths would produce `.ts` references in emitted JS, which Node.js cannot resolve. This is a pre-existing config issue not caused by this story.
