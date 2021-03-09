import { EffectAction, ValidEffectActions } from './types'
import { Identity } from './const'

export function action<P extends any[]>(fn: (...params: P) => void, ...params: P): EffectAction {
  return { [Identity]: () => fn(...params) }
}

export function noop(..._params: any[]): EffectAction {
  return action(() => {})
}

export function runActions(actions: ValidEffectActions): void {
  if (Array.isArray(actions)) {
    actions.forEach(runAction)
  } else {
    runAction(actions)
  }
}

function isValidAction(action: any): action is EffectAction {
  return action && typeof action === 'object' && typeof action[Identity] === 'function'
}

function runAction(action: any): void {
  if (isValidAction(action)) {
    action[Identity]()
  } else if (action !== null) {
    console.warn(`[mst-effect]: ${action} is not a valid EffectActions`)
  }
}
