import { addDisposer, IAnyModelType, Instance } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

import type { PayloadFunc, EffectFactory, ValidEffectActions } from '../types'

import { runActions } from './action'

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
