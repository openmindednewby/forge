/**
 * Custom ESLint Plugin: No Barrel Companion File
 *
 * Flags any .ts/.tsx file that has a same-named directory containing an
 * index.ts or index.tsx barrel file. This pattern causes a silent resolution
 * conflict: TypeScript resolves `import from './foo'` to `foo.ts` (the file),
 * NOT `foo/index.ts` (the barrel). Any exports added to the barrel but missing
 * from the companion file will cause "has no exported member" errors.
 *
 * Auto-fix: When the companion file contains ONLY re-exports (no local
 * declarations or logic), the fix replaces the entire file with
 * `export * from './<name>/index';`. Files with local code are flagged
 * but NOT auto-fixed — those require manual resolution.
 *
 * Examples:
 *   BAD:  types.ts exists alongside types/index.ts
 *         → import from './types' resolves to types.ts, ignoring types/index.ts
 *
 *   GOOD: Only types/index.ts exists (no companion types.ts)
 *         → import from './types' resolves to types/index.ts as expected
 *
 *   GOOD: Only types.ts exists (no directory)
 *         → No ambiguity
 *
 *   OK:   types.ts exists with `export * from './types/index';`
 *         → Companion is a pure passthrough, all exports forwarded
 */

import { existsSync } from 'fs';
import { dirname, basename, join } from 'path';

/**
 * Checks whether a Program node contains only re-export statements
 * (no local declarations, logic, or JSX). A "re-export" is an
 * ExportNamedDeclaration or ExportAllDeclaration that has a `source`
 * property (meaning it re-exports from another module).
 * Import statements are also allowed (they may be needed for re-exports).
 */
function isPureReExportFile(programNode) {
  const { body } = programNode;
  if (body.length === 0) return false;

  return body.every((stmt) => {
    if (stmt.type === 'ImportDeclaration') return true;
    if (stmt.type === 'ExportAllDeclaration') return true;
    const isReExport = stmt.type === 'ExportNamedDeclaration' && stmt.source !== null;
    return isReExport;
  });
}

const noBarrelCompanionFileRule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Disallow .ts/.tsx files that shadow a same-named directory barrel (index.ts). ' +
        'This causes TypeScript to resolve imports to the file instead of the barrel, ' +
        'leading to missing export errors.',
      category: 'Possible Errors',
      recommended: true,
    },
    schema: [],
    messages: {
      companionFileConflict:
        'File "{{fileName}}" shadows the barrel "{{barrelPath}}". ' +
        'TypeScript resolves `import from \'./{{baseName}}\'` to this file, ignoring the barrel. ' +
        'Delete this file and update imports to use the barrel, or consolidate into one location.',
    },
  },

  create(context) {
    return {
      Program(node) {
        const filePath = context.filename || context.getFilename();

        // Only check .ts and .tsx files (not .d.ts, not index files themselves)
        if (!filePath || (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))) return;
        if (filePath.endsWith('.d.ts')) return;

        const fileBaseName = basename(filePath);

        // Skip index files — they ARE the barrel, not the companion
        if (fileBaseName === 'index.ts' || fileBaseName === 'index.tsx') return;

        // Get the base name without extension
        const ext = fileBaseName.endsWith('.tsx') ? '.tsx' : '.ts';
        const baseName = fileBaseName.slice(0, -ext.length);
        const dir = dirname(filePath);

        // Check if a same-named directory exists with an index barrel
        const siblingDir = join(dir, baseName);
        const barrelTs = join(siblingDir, 'index.ts');
        const barrelTsx = join(siblingDir, 'index.tsx');

        const hasBarrelTs = existsSync(barrelTs);
        const hasBarrelTsx = existsSync(barrelTsx);

        if (hasBarrelTs || hasBarrelTsx) {
          // If the companion is already a pure wildcard re-export of the
          // barrel, it's safe — all exports are forwarded automatically.
          const sourceCode = context.sourceCode || context.getSourceCode();
          const trimmed = sourceCode.text.trim();
          const safePattern = `export * from './${baseName}/index';`;
          if (trimmed === safePattern) return;

          const barrelPath = hasBarrelTs
            ? `${baseName}/index.ts`
            : `${baseName}/index.tsx`;

          // Only provide auto-fix when the file is purely re-exports.
          // Files with local declarations, logic, or JSX require manual
          // resolution (move code into the barrel directory).
          const canAutoFix = isPureReExportFile(node);

          context.report({
            node,
            messageId: 'companionFileConflict',
            data: {
              fileName: fileBaseName,
              barrelPath,
              baseName,
            },
            ...(canAutoFix && {
              fix(fixer) {
                const fullRange = [0, sourceCode.text.length];
                const replacement = `export * from './${baseName}/index';\n`;
                return fixer.replaceTextRange(fullRange, replacement);
              },
            }),
          });
        }
      },
    };
  },
};

export default {
  rules: {
    'no-barrel-companion-file': noBarrelCompanionFileRule,
  },
};
