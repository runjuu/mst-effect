import { Observable, Subject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

import type { PayloadFunc, EffectFactory, ValidEffectActions, EffectAction } from '../types'
import { IAnyModelType, Instance, addDisposer } from '../mst'
import { EFFECT_ACTIONS_HANDLER, EFFECT_ACTION_IDENTITY } from '../const'

export function action<P extends any[]>(fn: (...params: P) => void, ...params: P): EffectAction {
  return { [EFFECT_ACTION_IDENTITY]: () => fn(...params) }
}

export function effect(
  self: Instance<IAnyModelType>,
  fn: Observable<ValidEffectActions>,
): PayloadFunc<never, void>
export function effect<P = void>(
  self: Instance<IAnyModelType>,
  fn: EffectFactory<P>,
): PayloadFunc<P, void>
export function effect(
  self: Instance<IAnyModelType>,
  fn: EffectFactory<any> | Observable<ValidEffectActions>,
): (payload: any) => void {
  const payloadSource = new Subject()
  const effect$ = typeof fn === 'function' ? fn(payloadSource.asObservable()) : fn
  const subscription = effect$
    .pipe(
      tap((actions) => {
        if (self[EFFECT_ACTIONS_HANDLER]) {
          self[EFFECT_ACTIONS_HANDLER](actions)
        } else {
          console.warn(
            `[mst-effect]: Make sure the 'types' is imported from 'mst-effect' instead of 'mobx-state-tree'`,
          )
        }
      }),
      logAngIgnoreError(fn),
    )
    .subscribe()

  addDisposer(self, () => {
    payloadSource.complete()
    subscription.unsubscribe()
  })

  return (payload) => {
    payloadSource.next(payload)
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
