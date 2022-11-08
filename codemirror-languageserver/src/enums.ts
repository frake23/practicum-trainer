export const mapFromEnum = <T extends Record<string, string | number>>(
  enm: T
) => {
  return Object.fromEntries(
    Object.entries(enm).map(([key, value]) => [value, key])
  ) as Record<T[keyof T], keyof T>;
};

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export enum CompletionTriggerKind {
  Invoked = 1,
  TriggerCharacter = 2,
  TriggerForIncompleteCompletions = 3,
}

export enum CompletionItemTag {
  Deprecated = 1,
}

export enum InsertTextMode {
  asIs = 1,
  adjustIndentation = 2,
}

export enum MarkupKind {
  PlainText = "plaintext",
  Markdown = "markdown",
}
