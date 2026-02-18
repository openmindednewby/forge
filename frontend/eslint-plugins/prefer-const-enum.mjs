/**
 * Custom ESLint Plugin: Prefer Const Enum
 *
 * Flags type aliases where ALL union members are string literals (2+ members)
 * and suggests converting to const enum.
 *
 * Examples:
 *   FLAGGED:  type Mode = 'light' | 'dark';
 *   FLAGGED:  export type Status = 'active' | 'inactive' | 'pending';
 *
 *   NOT FLAGGED:
 *     type Result = Success | Error;           // Union of type references
 *     type Nullable<T> = T | null;             // Contains null keyword
 *     type Mixed = 'a' | number;               // Contains non-string member
 *     type Single = 'only';                    // Single value, not a union
 *     type Callback = () => void;              // Function type
 */

/**
 * Convert a string literal value to a PascalCase enum member name.
 *
 * 'light'        -> 'Light'
 * 'modern-grid'  -> 'ModernGrid'
 * 'UPPER_CASE'   -> 'UpperCase'
 * '2xl'          -> '_2xl'
 */
function toPascalCase(value) {
  // Split on hyphens, underscores, spaces, and camelCase boundaries
  const words = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter((w) => w.length > 0);

  const result = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // If starts with a digit, prefix with underscore
  if (/^\d/.test(result)) return `_${result}`;

  return result;
}

const preferConstEnumRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer const enum over string literal union types for better autocomplete, refactoring, and centralized definitions.',
      category: 'Best Practices',
      recommended: true,
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      preferConstEnum:
        'String literal union type "{{name}}" should be a const enum. Const enums provide autocomplete, refactoring support, and centralized definitions.',
      convertToConstEnum: 'Convert "{{name}}" to const enum',
    },
  },

  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const { typeAnnotation } = node;

        // Must be a union type
        if (typeAnnotation.type !== 'TSUnionType') return;

        const { types } = typeAnnotation;

        // Must have 2+ members
        if (types.length < 2) return;

        // ALL members must be string literals
        const allStringLiterals = types.every(
          (member) =>
            member.type === 'TSLiteralType' &&
            member.literal.type === 'Literal' &&
            typeof member.literal.value === 'string',
        );

        if (!allStringLiterals) return;

        const typeName = node.id.name;
        const isExported =
          node.parent.type === 'ExportNamedDeclaration';
        const exportPrefix = isExported ? 'export ' : '';

        // Build the const enum suggestion
        const enumMembers = types
          .map((member) => {
            const value = member.literal.value;
            const memberName = toPascalCase(value);
            return `  ${memberName} = '${value}',`;
          })
          .join('\n');

        const replacement = `${exportPrefix}const enum ${typeName} {\n${enumMembers}\n}`;

        // The node to replace depends on whether it's exported
        const targetNode = isExported ? node.parent : node;

        context.report({
          node: node.id,
          messageId: 'preferConstEnum',
          data: { name: typeName },
          suggest: [
            {
              messageId: 'convertToConstEnum',
              data: { name: typeName },
              fix(fixer) {
                return fixer.replaceText(targetNode, replacement);
              },
            },
          ],
        });
      },
    };
  },
};

export default {
  rules: {
    'prefer-const-enum': preferConstEnumRule,
  },
};
