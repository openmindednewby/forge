/**
 * Custom ESLint Plugin: Smart Max Lines Per Function
 *
 * Applies different line limits based on function type:
 * - React components (functions returning JSX): higher limit (default 200)
 * - Regular functions: stricter limit (default 50, warning at 30)
 */

const COMPONENT_MAX_DEFAULT = 200;
const FUNCTION_MAX_DEFAULT = 50;
const FUNCTION_WARN_DEFAULT = 30;

/**
 * Check if an AST node is a JSX element or fragment
 */
function isJSX(node) {
  if (!node) {
    return false;
  }
  return (
    node.type === 'JSXElement' ||
    node.type === 'JSXFragment'
  );
}

/**
 * Check if an expression could resolve to JSX
 */
function expressionReturnsJSX(node) {
  if (!node) {
    return false;
  }

  // Direct JSX
  if (isJSX(node)) {
    return true;
  }

  // Conditional expression: condition ? <A/> : <B/>
  if (node.type === 'ConditionalExpression') {
    return expressionReturnsJSX(node.consequent) || expressionReturnsJSX(node.alternate);
  }

  // Logical expressions: condition && <A/> or condition || <A/>
  if (node.type === 'LogicalExpression') {
    return expressionReturnsJSX(node.left) || expressionReturnsJSX(node.right);
  }

  // Parenthesized expression
  if (node.type === 'ParenthesizedExpression') {
    return expressionReturnsJSX(node.expression);
  }

  // Sequence expression (rare but possible)
  if (node.type === 'SequenceExpression') {
    const lastExpr = node.expressions[node.expressions.length - 1];
    return expressionReturnsJSX(lastExpr);
  }

  return false;
}

/**
 * Recursively check if a block contains a return statement with JSX
 */
function blockReturnsJSX(blockBody) {
  if (!blockBody || !Array.isArray(blockBody)) {
    return false;
  }

  for (const statement of blockBody) {
    if (statementReturnsJSX(statement)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a statement returns JSX
 */
function statementReturnsJSX(statement) {
  if (!statement) {
    return false;
  }

  switch (statement.type) {
    case 'ReturnStatement':
      return expressionReturnsJSX(statement.argument);

    case 'IfStatement':
      // Check consequent
      if (statement.consequent) {
        if (statement.consequent.type === 'BlockStatement') {
          if (blockReturnsJSX(statement.consequent.body)) {
            return true;
          }
        } else if (statementReturnsJSX(statement.consequent)) {
          return true;
        }
      }
      // Check alternate (else branch)
      if (statement.alternate) {
        if (statement.alternate.type === 'BlockStatement') {
          if (blockReturnsJSX(statement.alternate.body)) {
            return true;
          }
        } else if (statementReturnsJSX(statement.alternate)) {
          return true;
        }
      }
      return false;

    case 'SwitchStatement':
      for (const switchCase of statement.cases) {
        if (blockReturnsJSX(switchCase.consequent)) {
          return true;
        }
      }
      return false;

    case 'TryStatement':
      if (statement.block && blockReturnsJSX(statement.block.body)) {
        return true;
      }
      if (statement.handler && statement.handler.body && blockReturnsJSX(statement.handler.body.body)) {
        return true;
      }
      if (statement.finalizer && blockReturnsJSX(statement.finalizer.body)) {
        return true;
      }
      return false;

    case 'BlockStatement':
      return blockReturnsJSX(statement.body);

    default:
      return false;
  }
}

/**
 * Check if a function node is a React component (returns JSX)
 */
function isReactComponent(node) {
  // Arrow function with implicit JSX return: () => <div/>
  if (node.type === 'ArrowFunctionExpression') {
    if (node.body.type !== 'BlockStatement') {
      return expressionReturnsJSX(node.body);
    }
  }

  // Function with block body - check for JSX returns
  const body = node.body;
  if (body && body.type === 'BlockStatement') {
    return blockReturnsJSX(body.body);
  }

  return false;
}

/**
 * Count effective lines in a function (optionally skipping blanks/comments)
 */
function countLines(node, sourceCode, skipBlankLines, skipComments) {
  const startLine = node.loc.start.line;
  const endLine = node.loc.end.line;

  if (!skipBlankLines && !skipComments) {
    return endLine - startLine + 1;
  }

  const lines = sourceCode.lines.slice(startLine - 1, endLine);
  let count = 0;

  // Get all comments in the function
  const allComments = sourceCode.getAllComments();
  const functionComments = allComments.filter(
    (comment) => comment.loc.start.line >= startLine && comment.loc.end.line <= endLine
  );

  // Build a set of line numbers that are purely comment lines
  const commentOnlyLines = new Set();
  if (skipComments) {
    for (const comment of functionComments) {
      for (let line = comment.loc.start.line; line <= comment.loc.end.line; line++) {
        const lineContent = sourceCode.lines[line - 1];
        if (lineContent) {
          const trimmed = lineContent.trim();
          // Check if line is only a comment (starts with // or /* or * for multiline)
          const isOnlyComment =
            trimmed.startsWith('//') ||
            trimmed.startsWith('/*') ||
            trimmed.startsWith('*') ||
            trimmed.endsWith('*/') ||
            trimmed === '';
          if (isOnlyComment) {
            commentOnlyLines.add(line);
          }
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = startLine + i;
    const lineContent = lines[i];

    // Skip blank lines
    if (skipBlankLines && lineContent.trim() === '') {
      continue;
    }

    // Skip comment-only lines
    if (skipComments && commentOnlyLines.has(lineNumber)) {
      continue;
    }

    count++;
  }

  return count;
}

/**
 * The ESLint rule definition
 */
const smartMaxLinesRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce different line limits for React components vs regular functions',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          componentMax: {
            type: 'integer',
            minimum: 1,
            description: 'Maximum lines for React components',
          },
          functionMax: {
            type: 'integer',
            minimum: 1,
            description: 'Maximum lines for regular functions (error threshold)',
          },
          functionWarn: {
            type: 'integer',
            minimum: 1,
            description: 'Warning threshold for regular functions',
          },
          skipBlankLines: {
            type: 'boolean',
            description: 'Skip blank lines when counting',
          },
          skipComments: {
            type: 'boolean',
            description: 'Skip comment lines when counting',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      componentTooLong:
        'React component has too many lines ({{count}}). Maximum allowed is {{max}}.',
      functionTooLong:
        'Function has too many lines ({{count}}). Maximum allowed is {{max}}.',
      functionWarning:
        'Function has {{count}} lines which exceeds recommended limit of {{warn}}. Consider refactoring.',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const componentMax = options.componentMax ?? COMPONENT_MAX_DEFAULT;
    const functionMax = options.functionMax ?? FUNCTION_MAX_DEFAULT;
    const functionWarn = options.functionWarn ?? FUNCTION_WARN_DEFAULT;
    const skipBlankLines = options.skipBlankLines ?? true;
    const skipComments = options.skipComments ?? true;

    const sourceCode = context.sourceCode || context.getSourceCode();

    function checkFunction(node) {
      const lineCount = countLines(node, sourceCode, skipBlankLines, skipComments);
      const isComponent = isReactComponent(node);

      if (isComponent) {
        // React component - apply componentMax limit
        if (lineCount > componentMax) {
          context.report({
            node,
            messageId: 'componentTooLong',
            data: {
              count: String(lineCount),
              max: String(componentMax),
            },
          });
        }
      } else {
        // Regular function - apply functionMax (error) and functionWarn (warning)
        if (lineCount > functionMax) {
          context.report({
            node,
            messageId: 'functionTooLong',
            data: {
              count: String(lineCount),
              max: String(functionMax),
            },
          });
        } else if (lineCount > functionWarn) {
          context.report({
            node,
            messageId: 'functionWarning',
            data: {
              count: String(lineCount),
              warn: String(functionWarn),
            },
          });
        }
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};

/**
 * Export the plugin
 */
export default {
  rules: {
    'smart-max-lines': smartMaxLinesRule,
  },
};
