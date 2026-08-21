/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "exceljs/dist/exceljs.min.js" {
  import ExcelJS from "exceljs";
  const ExcelJSDefault: typeof ExcelJS;
  export default ExcelJSDefault;
}
