import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

export default [
    {
        "ignores": ["node_modules/**", "history/**", "**/*.min.js", "**/*.css"]
    },
    js.configs.recommended,
    {
        "files": ["**/*.{js,mjs,cjs}"],
        "plugins": {
            jsdoc
        },
        "languageOptions": {
            "ecmaVersion": "latest",
            "sourceType": "script",
            "globals": {
                ...globals.browser,
                "google": "readonly"
            }
        },
        "rules": {
            "eqeqeq": "error",
            "quote-props": ["error", "always"],
            "padding-line-between-statements": ["error", { "blankLine": "always", "prev": "function", "next": "function" }],
            "linebreak-style": ["error", "unix"],
            "quotes": ["error", "double", { "avoidEscape": true }],
            "semi": ["error", "always"],
            "no-prototype-builtins": "off",
            "no-unused-vars": ["error", { "args": "none", "caughtErrorsIgnorePattern": "^_" }],
            "no-undef": "error",
            "no-console": "off",
            "no-implicit-globals": "error",
            "no-var": "error",
            "prefer-const": "error",
            "no-constant-condition": "error",
            "no-duplicate-case": "error",
            "no-fallthrough": "error",
            "no-unreachable": "error",
            "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }],
            "no-extra-semi": "error",
            "no-loss-of-precision": "error",
            "no-self-assign": "error",
            "no-shadow": ["error", { "builtinGlobals": false }],
            "jsdoc/require-jsdoc": [
                "warn",
                {
                    "require": {
                        "FunctionDeclaration": true,
                        "ArrowFunctionExpression": false,
                        "FunctionExpression": false
                    },
                    "checkConstructors": false
                }
            ],
            "jsdoc/require-param": "warn",
            "jsdoc/require-param-type": "warn",
            "jsdoc/require-param-description": "warn",
            "jsdoc/require-returns": "warn",
            "jsdoc/require-returns-type": "warn",
            "jsdoc/check-param-names": "error",
            "jsdoc/check-tag-names": "error",
            "jsdoc/check-types": "error"
        }
    },
    {
        "files": ["**/*.mjs"],
        "languageOptions": {
            "sourceType": "module"
        }
    },
    {
        "files": [".githooks/*.cjs"],
        "languageOptions": {
            "sourceType": "commonjs",
            "globals": {
                ...globals.node
            }
        },
        "rules": {
            "no-implicit-globals": "off",
            "jsdoc/require-jsdoc": "off",
            "jsdoc/require-param": "off",
            "jsdoc/require-returns": "off"
        }
    }
];
