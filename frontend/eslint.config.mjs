import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

export default [
  ...(Array.isArray(nextVitals) ? nextVitals : [nextVitals]),
  ...(Array.isArray(nextTs) ? nextTs : [nextTs]),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];
