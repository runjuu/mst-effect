import { reaction, IReactionPublic, IReactionOptions } from 'mobx'
import { Observable } from 'rxjs'

export function reaction$<T>(
  expression: (r: IReactionPublic) => T,
  opts: Omit<IReactionOptions, 'fireImmediately'> & { fireImmediately: true },
): Observable<{ current: T; prev: T | undefined; r: IReactionPublic }>

export function reaction$<T>(
  expression: (r: IReactionPublic) => T,
  opts?: IReactionOptions,
): Observable<{ current: T; prev: T; r: IReactionPublic }>

export function reaction$<T>(
  expression: (r: IReactionPublic) => T,
  opts?: IReactionOptions,
): Observable<{ current: T; prev: T; r: IReactionPublic }> {
  return new Observable((observer) => {
    const dispose = reaction(
      expression,
      (current, prev, r) => observer.next({ current, prev, r }),
      opts,
    )

    return () => dispose()
  })
}
