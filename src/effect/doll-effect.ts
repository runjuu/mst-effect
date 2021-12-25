import { Subject, Observable } from 'rxjs'
import { take } from 'rxjs/operators'
import { addDisposer } from 'mobx-state-tree'

import type { AnyInstance, IsEmptyPayload, PayloadFunc } from '../types'
import type { ValidEffectActions } from './action'
import { subscribe } from './utils'

export type DollEffectFactory<P, R = void> = (
  payload$: Observable<P>,
  dollSignal: PayloadFunc<R, void>,
) => Observable<ValidEffectActions>

export type DollEffectDispatcher<P, R> = IsEmptyPayload<P> extends true
  ? <T = R>(
      payload?: undefined,
      handler?: (result$: Observable<R>) => Observable<T>,
    ) => Promise<T | undefined>
  : <T = R>(
      payload: P,
      handler?: (result$: Observable<R>) => Observable<T>,
    ) => Promise<T | undefined>

export function dollEffect<P, R = unknown>(
  self: AnyInstance,
  factory: DollEffectFactory<P, R>,
): DollEffectDispatcher<P, R>
export function dollEffect(
  self: AnyInstance,
  factory: DollEffectFactory<any, any>,
): DollEffectDispatcher<any, any> {
  const payloadSource = new Subject()
  const signalSource = new Subject()
  const effect$ = factory(payloadSource.asObservable(), (value) => signalSource.next(value))
  const subscription = subscribe(self, factory, effect$)

  addDisposer(self, () => {
    payloadSource.complete()
    signalSource.complete()
    subscription.unsubscribe()
  })

  return (payload: any, handler: any) => {
    const promise = (
      typeof handler === 'function' ? handler(signalSource.asObservable()) : signalSource
    )
      .pipe(take(1))
      .toPromise()

    payloadSource.next(payload)

    return promise
  }
}
