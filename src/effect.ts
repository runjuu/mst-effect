import { Subject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { IAnyModelType, Instance, addDisposer } from 'mobx-state-tree'

import { Identity } from './const'
import type { PayloadFunc, EffectFactory, EffectAction, ValidEffectActions } from './types'

export function action<P extends any[]>(fn: (...params: P) => void, ...params: P): EffectAction {
  return { [Identity]: () => fn(...params) }
}

export function noop(..._params: any[]): EffectAction {
  return action(() => {})
}

export function effect<P = void>(
  self: Instance<IAnyModelType>,
  fn: EffectFactory<P>,
): PayloadFunc<P, void>
export function effect(
  self: Instance<IAnyModelType>,
  fn: EffectFactory<any>,
): (payload: any) => void {
  const payloadSource = new Subject()
  const effect$ = fn(payloadSource.asObservable())
  const subscription = effect$.pipe(tap(runActions), logAngIgnoreError(fn)).subscribe()

  addDisposer(self, () => {
    payloadSource.complete()
    subscription.unsubscribe()
  })

  return (payload) => {
    payloadSource.next(payload)
  }
}

function isValidAction(action: any): action is EffectAction {
  return action && typeof action === 'object' && typeof action[Identity] === 'function'
}

function runAction(action: any) {
  if (isValidAction(action)) {
    action[Identity]()
  } else if (action !== null) {
    console.warn(`[mst-effect]: ${action} is not a valid EffectActions`)
  }
}

function runActions(actions: ValidEffectActions) {
  if (Array.isArray(actions)) {
    actions.forEach(runAction)
  } else {
    runAction(actions)
  }
}

function logAngIgnoreError(factory: unknown) {
  return catchError((err, caught) => {
    /* eslint-disable no-console */
    console.group('[mst-effect]: error')
    console.log(factory)
    console.error(err)
    console.groupEnd()
    /* eslint-enable no-console */
    return caught
  })
}
