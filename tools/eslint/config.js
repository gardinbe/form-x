/* eslint-disable import/no-named-as-default-member */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import javascript from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import pluginImportNewlines from 'eslint-plugin-import-newlines';
import pluginPreferArrowFns from 'eslint-plugin-prefer-arrow-functions';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginSortExports from 'eslint-plugin-sort-exports';
import pluginTsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';
import typescript from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ignored

  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**'
    ]
  },

  // presets

  javascript.configs.recommended,
  ...typescript.configs.strictTypeChecked,
  stylistic.configs['recommended-flat'],
  pluginImport.flatConfigs.recommended,

  // plugins

  {
    plugins: {
      // some plugins are already defined by preset configs
      'prefer-arrow-functions': pluginPreferArrowFns,
      'import-newlines': pluginImportNewlines,
      'simple-import-sort': pluginSimpleImportSort,
      'sort-exports': pluginSortExports,
      'tsdoc': pluginTsdoc
    }
  },

  // node environment

  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: globals.node,
      parser: typescript.parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true
        },
        project: 'tsconfig.node.json'
      }
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': [
          '.js',
          '.mjs',
          '.cjs',
          '.jsx',
          '.ts',
          '.mts',
          '.cts',
          '.tsx'
        ]
      },
      'import/resolver': {
        node: true,
        typescript: {
          alwaysTryTypes: true,
          project: 'tsconfig.node.json'
        }
      }
    }
  },

  // browser environment

  {
    files: [
      'src/**',
      'demo/**'
    ],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: globals.browser,
      parser: typescript.parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true
        },
        project: 'tsconfig.browser.json'
      }
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': [
          '.js',
          '.mjs',
          '.cjs',
          '.jsx',
          '.ts',
          '.mts',
          '.cts',
          '.tsx'
        ]
      },
      'import/resolver': {
        node: true,
        typescript: {
          alwaysTryTypes: true,
          project: 'tsconfig.browser.json'
        }
      }
    }
  },

  // global rules

  {
    rules: {
      // ESLint core

      'camelcase': 'error',
      'curly': [
        'error',
        'all'
      ],
      'dot-notation': 'error',
      'eqeqeq': 'error',
      'no-useless-concat': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Stylistic

      '@stylistic/array-bracket-newline': [
        'error',
        { multiline: true }
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          ArrayExpression: 'consistent',
          ArrayPattern: { minItems: 3 } // tuples
        }
      ],
      '@stylistic/arrow-parens': [
        'error',
        'always',
        { requireForBlockBody: true }
      ],
      '@stylistic/brace-style': [
        'error',
        '1tbs'
      ],
      '@stylistic/comma-dangle': [
        'error',
        'never'
      ],
      '@stylistic/function-call-argument-newline': [
        'error',
        'consistent'
      ],
      '@stylistic/function-call-spacing': 'error',
      '@stylistic/function-paren-newline': [
        'error',
        'multiline-arguments'
      ],
      '@stylistic/indent': [
        'error',
        2,
        {
          SwitchCase: 1,
          flatTernaryExpressions: true,
          ignoredNodes: ['TemplateLiteral *']
        }
      ],
      '@stylistic/indent-binary-ops': [
        'off',
        2
      ], // can be problematic for object members
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
          // tabWidth: 4,
          ignoreComments: false,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true
        }
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: { delimiter: 'semi' }
        }
      ],
      '@stylistic/newline-per-chained-call': 'off',
      '@stylistic/no-extra-parens': 'error',
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-tabs': 'off',
      '@stylistic/nonblock-statement-body-position': [
        'error',
        'below'
      ],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true,
            consistent: true
          },
          ObjectPattern: {
            multiline: true,
            consistent: true
          }
        }
      ],
      '@stylistic/object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: true
        }
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'block-like'
        },
        {
          blankLine: 'always',
          prev: 'block-like',
          next: '*'
        }
      ],
      '@stylistic/quotes': [
        'error',
        'single'
      ],
      '@stylistic/semi': [
        'error',
        'always'
      ],

      // Typescript ESLint

      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/restrict-plus-operands': [
        'error',
        { allowNumberAndString: true }
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true }
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        { ignoreStatic: true }
      ],
      '@typescript-eslint/unified-signatures': 'off',

      // Import

      'import/first': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/newline-after-import': [
        'error',
        {
          count: 1,
          exactCount: true,
          considerComments: true
        }
      ],
      'import/consistent-type-specifier-style': [
        'error',
        'prefer-top-level'
      ],
      'import/no-duplicates': [
        'error',
        { 'prefer-inline': false }
      ],

      // Prefer-arrow-functions

      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          allowNamedFunctions: false,
          classPropertiesAllowed: false,
          disallowPrototype: false,
          returnStyle: 'unchanged',
          singleReturnOnly: false
        }
      ],

      // Import-newlines

      'import-newlines/enforce': [
        'error',
        4,
        100 // max-len
      ],

      // Simple-import-sort

      'simple-import-sort/exports': 'off',
      'simple-import-sort/imports': 'error',

      // Sort-exports

      'sort-exports/sort-exports': [
        'error',
        {
          sortDir: 'asc',
          pattern: '**/index.{js,mjs,cjs,ts,mts,cts}'
        }
      ]
    }
  },

  // typescript rules

  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    rules: {
      // TSDoc

      'tsdoc/syntax': 'warn'
    }
  }
];
