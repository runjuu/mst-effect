import { Observable } from 'rxjs'
import { expectType } from 'tsd'
import { IReactionPublic } from 'mobx'

import { types, reaction$ } from '../src'

const Model = types
  .model({
    num: types.number,
  })
  .actions((self) => ({
    updateNum(num: number) {
      self.num = num
    },
  }))

describe(`reaction$`, () => {
  it(`should return an Observable`, () => {
    expect(reaction$(() => {})).toBeInstanceOf(Observable)
  })

  it(`should emit data anytime it observes changes`, () => {
    const model = Model.create({ num: 0 })
    const num$ = reaction$(() => model.num)
    const spy = jest.fn()

    num$.subscribe(({ current, prev }) => spy({ current, prev }))

    model.updateNum(1)
    model.updateNum(2)
    model.updateNum(3)

    expect(spy).toBeCalledTimes(3)
    expect(spy.mock.calls).toMatchSnapshot()
  })

  it(`should un-observe after unsubscribe`, () => {
    const model = Model.create({ num: 0 })
    const spy = jest.fn()
    const num$ = reaction$(() => {
      spy(model.num)
      return model.num
    })

    num$.subscribe().unsubscribe()
    model.updateNum(1)
    model.updateNum(2)
    model.updateNum(3)

    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith(0)
  })

  it(`should able to specify reaction's options`, () => {
    const model = Model.create({ num: 0 })
    const num$ = reaction$(() => model.num, { fireImmediately: true })
    const spy = jest.fn()

    num$.subscribe(({ current, prev }) => spy({ current, prev }))

    expect(spy).toBeCalledTimes(1)
    expect(spy.mock.calls).toMatchSnapshot()
  })

  it(`should mark 'prev' to optional when 'fireImmediately' is true`, () => {
    const model = Model.create({ num: 0 })
    const num$ = reaction$(() => model.num, { fireImmediately: true })
    expectType<Observable<{ current: number; prev?: number; r: IReactionPublic }>>(num$)
  })
})
