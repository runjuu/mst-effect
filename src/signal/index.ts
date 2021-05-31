import { addDisposer } from 'mobx-state-tree'
import { Observable, Subject } from 'rxjs'

import { AnyInstance, PayloadFunc } from '../types'

export type SignalFactory<P, R> = (payload$: Observable<P>) => Observable<R>

export type SignalResult<P, R> = [Observable<R>, PayloadFunc<P, void>]

export function signal<P>(self: AnyInstance): SignalResult<P, P>
export function signal<P, R>(self: AnyInstance, fn: SignalFactory<P, R>): SignalResult<P, R>
export function signal<P, R>(self: AnyInstance, fn?: SignalFactory<P, R>): SignalResult<P, R> {
  const payloadSource = new Subject<P>()
  const signal$ = fn?.(payloadSource.asObservable()) ?? payloadSource.asObservable()

  addDisposer(self, () => payloadSource.complete())

  return [signal$, (payload: P) => payloadSource.next(payload)] as SignalResult<P, R>
}
