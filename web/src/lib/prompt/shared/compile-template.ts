import type { PromptVariables } from "../interface/types";

/**
 * Mustache風テンプレート変数 {{variableName}} を値で置換する純粋関数
 */
export function compileTemplate(
  template: string,
  variables: PromptVariables = {}
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key: string) => variables[key] ?? match
  );
}
