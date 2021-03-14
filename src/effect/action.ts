import { EFFECT_ACTION_IDENTITY } from '../const'

export type EffectAction = { [EFFECT_ACTION_IDENTITY]: () => void }

export type ValidEffectActions = null | EffectAction | (EffectAction | null)[]

export function action<P extends any[]>(fn: (...params: P) => void, ...params: P): EffectAction {
  return { [EFFECT_ACTION_IDENTITY]: () => fn(...params) }
}

export function runActions(actions: ValidEffectActions): void {
  ;(Array.isArray(actions) ? actions : [actions]).forEach(runAction)
}

function runAction(action: any): void {
  if (isValidAction(action)) {
    action[EFFECT_ACTION_IDENTITY]()
  } else if (action !== null) {
    console.warn(`[mst-effect]: ${action} is not a valid EffectActions`)
  }
}

function isValidAction(action: any): action is EffectAction {
  return (
    action && typeof action === 'object' && typeof action[EFFECT_ACTION_IDENTITY] === 'function'
  )
}
