import { addDisposer } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'

import type { PayloadFunc, AnyInstance, NormalizeOptionalPayload } from '../types'
import type { ValidEffectActions } from './action'
import { subscribe } from './utils'

export type EffectFactory<P> = (
  payload$: Observable<NormalizeOptionalPayload<P>>,
) => Observable<ValidEffectActions>

export type EffectDispatcher<P> = PayloadFunc<P, void>

export function effect<P>(self: AnyInstance, factory: EffectFactory<P>): EffectDispatcher<P>
export function effect(self: AnyInstance, factory: EffectFactory<any>): EffectDispatcher<any> {
  const payloadSource = new Subject()
  const effect$ = factory(payloadSource.asObservable())
  const subscription = subscribe(self, factory, effect$)

  addDisposer(self, () => {
    payloadSource.complete()
    subscription.unsubscribe()
  })

  return (payload) => {
    payloadSource.next(payload)
  }
}
