import { reaction, IReactionPublic, IReactionOptions } from 'mobx'
import { Observable } from 'rxjs'

export function reaction$<T>(
  expression: (r: IReactionPublic) => T,
  opts?: IReactionOptions,
): Observable<T> {
  return new Observable((observer) => {
    const dispose = reaction(expression, (value) => observer.next(value), opts)

    return () => dispose()
  })
}
