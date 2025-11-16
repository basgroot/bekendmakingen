import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
        rules: {
            "linebreak-style": ["error", "unix"],
            "quotes": ["error", "double", { "avoidEscape": true }],
            "semi": ["error", "always"],
            "no-prototype-builtins": "off"
        }
    }
]);
