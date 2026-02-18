/**
 * ESLint rule: no-optional-undefined
 *
 * Prevents declaring optional properties/parameters with explicit `| undefined`
 * in the type annotation. With `exactOptionalPropertyTypes: true`, `?: T` and
 * `?: T | undefined` are semantically different, but the correct practice is to
 * use `?: T` and fix the assignment side (omit the key) rather than widening the
 * type with `| undefined`.
 *
 * Bad:  pageCount?: number | undefined;
 * Good: pageCount?: number;
 *
 * Bad:  function foo(bar?: string | undefined) {}
 * Good: function foo(bar?: string) {}
 */

/** @type {import('eslint').ESLint.Plugin} */
export default {
  rules: {
    'no-optional-undefined': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Disallow combining optional marker (?) with `| undefined` in type annotations',
        },
        messages: {
          noOptionalUndefined:
            'Do not combine optional (?) with `| undefined`. Use `?: {{type}}` and omit the key when the value is undefined.',
        },
        schema: [],
      },
      create(context) {
        /**
         * Check if a type annotation is a union containing `undefined`.
         * Returns the cleaned type string (without undefined) if found,
         * otherwise returns null.
         */
        function getTypeWithoutUndefined(typeAnnotation) {
          if (!typeAnnotation || typeAnnotation.type !== 'TSUnionType') return null;

          const hasUndefined = typeAnnotation.types.some(
            (t) => t.type === 'TSUndefinedKeyword',
          );
          if (!hasUndefined) return null;

          const nonUndefinedTypes = typeAnnotation.types.filter(
            (t) => t.type !== 'TSUndefinedKeyword',
          );

          const sourceCode = context.sourceCode ?? context.getSourceCode();
          if (nonUndefinedTypes.length === 1)
            return sourceCode.getText(nonUndefinedTypes[0]);

          return nonUndefinedTypes.map((t) => sourceCode.getText(t)).join(' | ');
        }

        function checkNode(node, typeAnnotationNode) {
          if (!node.optional) return;
          if (!typeAnnotationNode) return;

          const annotation =
            typeAnnotationNode.typeAnnotation ?? typeAnnotationNode;
          const cleanType = getTypeWithoutUndefined(annotation);
          if (cleanType === null) return;

          context.report({
            node: typeAnnotationNode,
            messageId: 'noOptionalUndefined',
            data: { type: cleanType },
          });
        }

        return {
          // Interface / type alias properties: foo?: string | undefined
          TSPropertySignature(node) {
            checkNode(node, node.typeAnnotation?.typeAnnotation);
          },
          // Function parameters: function foo(bar?: string | undefined)
          // Arrow functions, methods, etc.
          Identifier(node) {
            if (!node.optional) return;
            // Only check function parameters
            const parent = node.parent;
            if (!parent) return;
            const isParam =
              (parent.type === 'FunctionDeclaration' ||
                parent.type === 'FunctionExpression' ||
                parent.type === 'ArrowFunctionExpression') &&
              parent.params.includes(node);
            if (!isParam) return;

            checkNode(node, node.typeAnnotation?.typeAnnotation);
          },
        };
      },
    },
  },
};
