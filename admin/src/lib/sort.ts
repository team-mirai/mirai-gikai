export type SortOrder = "asc" | "desc";

export interface SortConfig<TField extends string> {
  field: TField;
  order: SortOrder;
}

export function parseSortParams<TField extends string>(
  validFields: readonly TField[],
  defaultConfig: SortConfig<TField>,
  sort?: string,
  order?: string
): SortConfig<TField> {
  const field = validFields.includes(sort as TField)
    ? (sort as TField)
    : defaultConfig.field;
  const sortOrder =
    order === "asc" || order === "desc" ? order : defaultConfig.order;
  return { field, order: sortOrder };
}
