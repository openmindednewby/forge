import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import smartMaxLinesPlugin from './eslint-plugins/smart-max-lines.mjs';
import noNullCheckPlugin from './eslint-plugins/no-null-check.mjs';
import preferConstEnumPlugin from './eslint-plugins/prefer-const-enum.mjs';
import enumFileIsolationPlugin from './eslint-plugins/enum-file-isolation.mjs';
import noBarrelCompanionFilePlugin from './eslint-plugins/no-barrel-companion-file.mjs';
import noOptionalUndefinedPlugin from './eslint-plugins/no-optional-undefined.mjs';

export default [
  // =====================================================
  // IGNORE PATTERNS
  // =====================================================
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'eslint-plugins/**',
      'coverage/**',
    ],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // =====================================================
  // TYPESCRIPT CONFIGURATION
  // =====================================================
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        fetch: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        AbortController: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        WebSocket: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CloseEvent: 'readonly',
        MessageEvent: 'readonly',
        Image: 'readonly',
        CanvasRenderingContext2D: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'import': importPlugin,
      'unused-imports': unusedImportsPlugin,
      'smart-max-lines': smartMaxLinesPlugin,
      'no-null-check': noNullCheckPlugin,
      'prefer-const-enum': preferConstEnumPlugin,
      'enum-file-isolation': enumFileIsolationPlugin,
      'no-barrel-companion-file': noBarrelCompanionFilePlugin,
      'no-optional-undefined': noOptionalUndefinedPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      // TypeScript handles undefined identifiers
      'no-undef': 'off',

      // =====================================================
      // TYPESCRIPT STRICT RULES - NO ANY ALLOWED!
      // =====================================================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',

      // Type safety
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowString: false,
        allowNumber: false,
        allowNullableObject: true,
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
        allowAny: false,
      }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Ban type assertions
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never',
      }],

      // Function and method rules
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: { attributes: false },
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-for-in-array': 'error',

      // Variable and declaration rules
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-use-before-define': ['error', {
        functions: false,
        classes: true,
        variables: true,
      }],
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',

      // Code quality
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-confusing-void-expression': ['error', {
        ignoreArrowShorthand: true,
      }],
      '@typescript-eslint/no-invalid-void-type': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-find': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // Consistency rules
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
        disallowTypeAnnotations: true,
      }],
      '@typescript-eslint/consistent-type-exports': ['error', {
        fixMixedExportsWithInlineTypeSpecifier: true,
      }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'objectLiteralProperty', format: null },
        { selector: 'typeProperty', format: null },
        { selector: 'objectLiteralMethod', format: ['camelCase', 'PascalCase'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
      ],

      // Disable base ESLint rules handled by TypeScript
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      'no-use-before-define': 'off',
      'no-redeclare': 'off',
      'require-await': 'off',
      'no-return-await': 'off',

      // =====================================================
      // REACT RULES
      // =====================================================
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'error',
      'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true }],
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': ['error', { checkAliases: true }],
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-sort-props': ['error', {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        reservedFirst: true,
      }],
      'react/function-component-definition': ['error', {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      }],
      'react/hook-use-state': 'error',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/no-array-index-key': 'error',
      'react/jsx-no-leaked-render': 'error',

      // =====================================================
      // REACT HOOKS RULES
      // =====================================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // =====================================================
      // REACT COMPILER
      // =====================================================
      'react-compiler/react-compiler': 'warn',

      // =====================================================
      // WEB ACCESSIBILITY RULES (jsx-a11y)
      // =====================================================
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // =====================================================
      // IMPORT RULES
      // =====================================================
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      'import/newline-after-import': 'error',
      'import/no-mutable-exports': 'error',
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'object',
          'type',
        ],
        'pathGroups': [
          { pattern: 'react', group: 'builtin', position: 'before' },
          { pattern: 'react-dom', group: 'builtin', position: 'before' },
          { pattern: 'react-router', group: 'builtin', position: 'before' },
          { pattern: 'react-router-dom', group: 'builtin', position: 'before' },
          { pattern: '@tanstack/**', group: 'external', position: 'after' },
          { pattern: '@radix-ui/**', group: 'external', position: 'after' },
          { pattern: '@/**', group: 'internal', position: 'before' },
        ],
        'pathGroupsExcludedImportTypes': ['react', 'react-dom'],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc', caseInsensitive: true },
      }],

      // =====================================================
      // UNUSED IMPORTS
      // =====================================================
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',

      // =====================================================
      // FILE AND FUNCTION SIZE LIMITS (custom plugins)
      // =====================================================
      'max-lines': ['error', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
      'smart-max-lines/smart-max-lines': ['error', {
        componentMax: 200,
        functionMax: 50,
        functionWarn: 30,
        skipBlankLines: true,
        skipComments: true,
      }],

      // =====================================================
      // NULL CHECK RULE (custom plugin)
      // =====================================================
      'no-null-check/no-null-check': 'error',

      // =====================================================
      // ENUM ENFORCEMENT (custom plugins)
      // =====================================================
      'prefer-const-enum/prefer-const-enum': 'warn',
      'enum-file-isolation/enum-file-isolation': 'warn',

      // =====================================================
      // BARREL FILE CONFLICT PREVENTION
      // =====================================================
      'no-barrel-companion-file/no-barrel-companion-file': 'error',

      // =====================================================
      // OPTIONAL + UNDEFINED TYPE PREVENTION
      // =====================================================
      'no-optional-undefined/no-optional-undefined': 'error',

      // =====================================================
      // GENERAL BEST PRACTICES
      // =====================================================
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'no-proto': 'error',
      'no-extend-native': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-multi-str': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'radix': 'error',
      'yoda': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'multi'],
      'default-case': 'error',
      'default-case-last': 'error',
      'grouped-accessor-pairs': 'error',
      'no-constructor-return': 'error',
      'no-else-return': 'error',
      'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-multi-spaces': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-return-assign': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-var': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'spaced-comment': ['error', 'always'],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],
      'complexity': ['warn', 15],
      'no-magic-numbers': ['error', {
        ignore: [0, 1, -1, 2, 100],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        ignoreClassFieldInitialValues: true,
      }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration:not([const])', message: 'Use const enum instead of enum.' },
        { selector: 'IfStatement > LogicalExpression[left.type="LogicalExpression"]', message: 'Condition has more than 2 expressions. Extract to a named variable.' },
        { selector: 'IfStatement > LogicalExpression[right.type="LogicalExpression"]', message: 'Condition has more than 2 expressions. Extract to a named variable.' },
        { selector: 'ConditionalExpression > LogicalExpression[left.type="LogicalExpression"]', message: 'Ternary condition has more than 2 expressions. Extract to a named variable.' },
        { selector: 'ConditionalExpression > LogicalExpression[right.type="LogicalExpression"]', message: 'Ternary condition has more than 2 expressions. Extract to a named variable.' },
      ],
    },
  },

  // =====================================================
  // TEST FILE OVERRIDES
  // =====================================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow-as-parameter',
      }],
      'max-lines': 'off',
      'max-nested-callbacks': 'off',
      'smart-max-lines/smart-max-lines': 'off',
      'no-magic-numbers': 'off',
      'no-console': 'off',
      'no-null-check/no-null-check': 'off',
      'prefer-const-enum/prefer-const-enum': 'off',
      'enum-file-isolation/enum-file-isolation': 'off',
      'react-compiler/react-compiler': 'off',
    },
  },

  // Prettier config (overrides formatting rules)
  prettierConfig,

  // Re-enable curly after Prettier
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'curly': ['error', 'multi'],
    },
  },
];
