import { Subject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { IAnyModelType, Instance, addDisposer } from 'mobx-state-tree'

import type { PayloadFunc, EffectFactory } from './types'
import { HANDLE_MST_EFFECT_ACTIONS } from './const'

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
  const subscription = effect$
    .pipe(
      tap((actions) => {
        if (self[HANDLE_MST_EFFECT_ACTIONS]) {
          self[HANDLE_MST_EFFECT_ACTIONS](actions)
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
