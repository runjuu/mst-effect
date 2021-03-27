import { addDisposer } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'
import { tap, catchError, take } from 'rxjs/operators'

import type { PayloadFunc, AnyInstance } from '../types'
import type { ValidEffectActions } from './action'
import { EFFECT_ACTIONS_HANDLER } from '../const'

export type EffectFactory<P, R = void> = (
  payload$: Observable<P>,
  resolve: PayloadFunc<R, void>,
) => Observable<ValidEffectActions>

export function effect<P, R = void>(
  self: AnyInstance,
  fn: EffectFactory<P, R> | Observable<ValidEffectActions>,
): PayloadFunc<P, Promise<R | undefined>>

export function effect(
  self: AnyInstance,
  fn: EffectFactory<any, any> | Observable<ValidEffectActions>,
): PayloadFunc<any, Promise<any>> {
  if (!self[EFFECT_ACTIONS_HANDLER]) {
    console.warn(
      `[mst-effect]: Make sure the 'types' is imported from 'mst-effect' instead of 'mobx-state-tree'`,
    )
  }

  const payloadSource = new Subject()
  const resultSource = new Subject()

  const effect$ =
    typeof fn === 'function'
      ? fn(payloadSource.asObservable(), (value) => resultSource.next(value))
      : fn

  const subscription = effect$
    .pipe(
      tap((actions) => self[EFFECT_ACTIONS_HANDLER]?.(actions)),
      logAngIgnoreError(fn),
    )
    .subscribe()

  addDisposer(self, () => {
    payloadSource.complete()
    resultSource.complete()
    subscription.unsubscribe()
  })

  return (payload) => {
    const promise = resultSource.pipe(take(1)).toPromise()
    payloadSource.next(payload)
    return promise
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
