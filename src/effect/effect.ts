import { addDisposer } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'
import { tap, catchError, take } from 'rxjs/operators'

import type { IsEmptyPayload, PayloadFunc, AnyInstance } from '../types'
import type { ValidEffectActions } from './action'
import { EFFECT_ACTIONS_HANDLER } from '../const'

export type EffectFactory<P, R = void> = (
  payload$: Observable<P>,
  resolve: PayloadFunc<R, void>,
) => Observable<ValidEffectActions>

export type EffectDispatcher<P, R> = IsEmptyPayload<P> extends true
  ? <T = R>(
      payload?: undefined,
      handler?: (result$: Observable<R>) => Observable<T>,
    ) => Promise<T | undefined>
  : <T = R>(
      payload: P,
      handler?: (result$: Observable<R>) => Observable<T>,
    ) => Promise<T | undefined>

export function effect<P, R = unknown>(
  self: AnyInstance,
  fn: EffectFactory<P, R>,
): EffectDispatcher<P, R>
export function effect(self: AnyInstance, fn: EffectFactory<any, any>): EffectDispatcher<any, any> {
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

  const subscription = subscribe(self, fn, effect$)

  addDisposer(self, () => {
    payloadSource.complete()
    resultSource.complete()
    subscription.unsubscribe()
  })

  return (payload: any, handler: any) => {
    const promise = (typeof handler === 'function'
      ? handler(resultSource.asObservable())
      : resultSource
    )
      .pipe(take(1))
      .toPromise()

    payloadSource.next(payload)

    return promise
  }
}

function subscribe(self: AnyInstance, factory: unknown, actions$: Observable<ValidEffectActions>) {
  return actions$
    .pipe(
      tap((actions) => self[EFFECT_ACTIONS_HANDLER]?.(actions)),
      logAngIgnoreError(factory),
    )
    .subscribe()
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
