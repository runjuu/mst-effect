import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { types, signal, destroy } from '../src'

const Model = types.model().extend((self) => {
  const [dispatch$, dispatch] = signal<any>(self)

  return {
    state: { dispatch$ },
    actions: { dispatch },
  }
})

describe(`signal`, () => {
  it(`should return a Observable, and a function to feed a new value to it.`, () => {
    const model = Model.create()

    expect(typeof model.dispatch === 'function').toBeTruthy()
    expect(model.dispatch$).toBeInstanceOf(Observable)
  })

  it(`should synchronous emit same value when calling the function`, () => {
    const model = Model.create()
    const spy = jest.fn()
    const value = {}

    model.dispatch$.subscribe(spy)
    model.dispatch(value)

    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith(value)
  })

  it(`should complete the Observable when model was destroyed`, () => {
    const model = Model.create()
    const spy = jest.fn()

    model.dispatch$.subscribe({ complete: spy })
    destroy(model)
    expect(spy).toBeCalledTimes(1)
  })

  it(`should able to custom the stream`, () => {
    const Model1 = types.model().extend((self) => {
      const [dispatch$, dispatch] = signal<number, string>(self, (payload$) =>
        payload$.pipe(map((num) => `${num}`)),
      )

      return {
        state: { dispatch$ },
        actions: { dispatch },
      }
    })

    const spy = jest.fn()
    const model = Model1.create()

    model.dispatch$.subscribe(spy)
    model.dispatch(123)

    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith('123')
  })
})
