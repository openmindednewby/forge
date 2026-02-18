/**
 * Custom ESLint Plugin: Enum File Isolation
 *
 * Flags exported enums in files that also contain unrelated exports.
 * Enums should live in dedicated files (e.g., status.enum.ts or status.ts).
 *
 * Related helpers (functions/variables/types that reference the enum name)
 * are allowed in the same file as the enum.
 *
 * Examples:
 *   FLAGGED - enum mixed with unrelated exports:
 *     export const enum ExportType { Csv = 'csv', Excel = 'excel' }
 *     export interface TableColumn { ... }  // Unrelated to ExportType
 *
 *   FLAGGED - multiple exported enums in one file:
 *     export const enum ErrorActionType { ... }
 *     export const enum ErrorSeverity { ... }
 *
 *   NOT FLAGGED - enum with related helpers:
 *     export const enum MenuStatus { Active = 'active', Inactive = 'inactive' }
 *     export const menuStatusToLabel = (s: MenuStatus): string => { ... }
 */

const enumFileIsolationRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Exported enums should live in dedicated files. Only related helpers may share the file.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      multipleEnums:
        'File contains multiple exported enums ({{enumNames}}). Each enum should have its own dedicated file.',
      unrelatedExports:
        'Exported enum "{{enumName}}" is in a file with unrelated exports. Move the enum to a dedicated file (e.g., {{suggestedFile}}) or move unrelated exports elsewhere.',
    },
  },

  create(context) {
    const exportedEnums = [];
    const otherExportNodes = [];

    /**
     * Collect exported enum declarations.
     */
    function collectExportedEnum(node) {
      // ExportNamedDeclaration > TSEnumDeclaration
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration &&
        node.declaration.type === 'TSEnumDeclaration'
      ) {
        exportedEnums.push({
          name: node.declaration.id.name,
          node: node.declaration.id,
        });
        return true;
      }
      return false;
    }

    /**
     * Collect non-enum exported declarations.
     */
    function collectOtherExport(node) {
      if (node.type !== 'ExportNamedDeclaration') return;
      // Skip if it's an enum (already collected)
      if (
        node.declaration &&
        node.declaration.type === 'TSEnumDeclaration'
      )
        return;

      otherExportNodes.push(node);
    }

    /**
     * Check if a source text references an enum name using word boundary.
     */
    function referencesEnum(sourceText, enumName) {
      const regex = new RegExp(`\\b${enumName}\\b`);
      return regex.test(sourceText);
    }

    return {
      ExportNamedDeclaration(node) {
        if (!collectExportedEnum(node)) collectOtherExport(node);
      },

      'Program:exit'() {
        // No exported enums -> nothing to check
        if (exportedEnums.length === 0) return;

        const sourceCode = context.sourceCode || context.getSourceCode();

        // Check for multiple exported enums in the same file
        if (exportedEnums.length > 1) {
          const enumNames = exportedEnums
            .map((e) => e.name)
            .join(', ');
          for (const enumInfo of exportedEnums) {
            context.report({
              node: enumInfo.node,
              messageId: 'multipleEnums',
              data: { enumNames },
            });
          }
          return;
        }

        // Single enum - check if other exports are related
        const enumName = exportedEnums[0].name;
        const enumNode = exportedEnums[0].node;

        // If no other exports, the file is fine
        if (otherExportNodes.length === 0) return;

        // Check each other export to see if it references the enum
        const unrelatedExports = otherExportNodes.filter((node) => {
          const text = sourceCode.getText(node);
          return !referencesEnum(text, enumName);
        });

        if (unrelatedExports.length > 0) {
          // Convert PascalCase to kebab-case for suggested filename
          const suggestedFile = enumName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase()
            .concat('.ts');

          context.report({
            node: enumNode,
            messageId: 'unrelatedExports',
            data: { enumName, suggestedFile },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    'enum-file-isolation': enumFileIsolationRule,
  },
};
