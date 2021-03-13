import { addDisposer } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

import type { PayloadFunc, AnyInstance } from '../types'
import { runActions, ValidEffectActions } from './action'

export type EffectFactory<P> = (payload$: Observable<P>) => Observable<ValidEffectActions>

export function effect(self: AnyInstance, fn: Observable<ValidEffectActions>): never

export function effect<P>(self: AnyInstance, fn: EffectFactory<P>): PayloadFunc<P, void>

export function effect(
  self: AnyInstance,
  fn: EffectFactory<any> | Observable<ValidEffectActions>,
): (payload: any) => void {
  const payloadSource = new Subject()
  const effect$ = typeof fn === 'function' ? fn(payloadSource.asObservable()) : fn
  const subscription = effect$.pipe(tap(runActions), logAngIgnoreError(fn)).subscribe()

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