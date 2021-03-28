import { Observable, Subscription } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import type { AnyInstance } from '../types'
import type { ValidEffectActions } from './action'
import { EFFECT_ACTIONS_HANDLER } from '../const'

export function subscribe(
  self: AnyInstance,
  factory: unknown,
  actions$: Observable<ValidEffectActions>,
): Subscription {
  if (!self[EFFECT_ACTIONS_HANDLER]) {
    console.warn(
      `[mst-effect]: Make sure the 'types' is imported from 'mst-effect' instead of 'mobx-state-tree'`,
    )
  }

  return actions$
    .pipe(
      tap((actions) => self[EFFECT_ACTIONS_HANDLER]?.(actions)),
      logAngIgnoreError(factory),
    )
    .subscribe()

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
}
