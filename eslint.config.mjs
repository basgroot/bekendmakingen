import js from "@eslint/js";
import globals from "globals";

export default [
    {
        "ignores": ["node_modules/**", "history/**", "**/*.min.js"]
    },
    js.configs.recommended,
    {
        "files": ["**/*.{js,mjs,cjs}"],
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
            "no-unused-vars": ["error", { "args": "none" }]
        }
    },
    {
        "files": ["**/*.mjs"],
        "languageOptions": {
            "sourceType": "module"
        }
    }
];
