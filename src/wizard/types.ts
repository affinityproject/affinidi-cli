export interface SubMenuPrompts {
  projectPrompt: () => Promise<void>
  schemaPrompt: () => Promise<void>
}

export type VoidFn = () => void

export type AsyncVoidFn = () => Promise<void>

export type MainMenuFnType = (fns: SubMenuPrompts) => () => Promise<void>
