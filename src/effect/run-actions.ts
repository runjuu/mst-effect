import { EffectAction, ValidEffectActions } from '../types'
import { EFFECT_ACTION_IDENTITY } from '../const'

export function runActions(actions: ValidEffectActions): void {
  ;(Array.isArray(actions) ? actions : [actions]).forEach(runAction)
}

function isValidAction(action: any): action is EffectAction {
  return (
    action && typeof action === 'object' && typeof action[EFFECT_ACTION_IDENTITY] === 'function'
  )
}

function runAction(action: any): void {
  if (isValidAction(action)) {
    action[EFFECT_ACTION_IDENTITY]()
  } else if (action !== null) {
    console.warn(`[mst-effect]: ${action} is not a valid EffectActions`)
  }
}
