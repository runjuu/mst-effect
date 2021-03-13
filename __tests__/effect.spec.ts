import { Subject } from 'rxjs'
import { map, startWith, endWith } from 'rxjs/operators'
import { types, destroy } from 'mobx-state-tree'

import { effect, action } from '../src'

describe('effect', () => {
  it(`should execute the action that Observable emit`, () => {
    const spy = jest.fn()
    const Model = types.model().actions((self) => ({
      log: effect<string>(self, (payload$) =>
        payload$.pipe(map((message) => action(spy, message))),
      ),
    }))

    const model = Model.create()

    model.log('hi!')

    expect(spy.mock.calls).toEqual([['hi!']])
  })

  it(`should auto subscribe & unsubscribe the Observable`, () => {
    const spy = jest.fn()
    const Model = types.model().actions((self) => ({
      log: effect<never>(self, (payload$) =>
        payload$.pipe(startWith(action(spy, 'start')), endWith(action(spy, 'end'))),
      ),
    }))

    const model = Model.create()

    expect(spy.mock.calls).toEqual([['start']])

    destroy(model)

    expect(spy.mock.calls).toEqual([['start'], ['end']])
  })

  it(`should accept 'null' as valid action`, () => {
    const spy = jest.fn()
    const Model = types.model().actions((self) => ({
      log: effect<boolean>(self, (payload$) =>
        payload$.pipe(map((isNull) => (isNull ? null : action(spy)))),
      ),
    }))

    const model = Model.create()

    model.log(true)
    expect(spy.mock.calls).toEqual([])

    model.log(false)
    expect(spy.mock.calls).toEqual([[]])
  })

  it(`should accept an array of actions`, () => {
    const spy = jest.fn()
    const Model = types.model().actions((self) => ({
      log: effect<number>(self, (payload$) =>
        payload$.pipe(
          map((times) => Array.from({ length: times }).map((_, index) => action(spy, index))),
        ),
      ),
    }))

    const model = Model.create()

    model.log(3)
    expect(spy.mock.calls).toEqual([[0], [1], [2]])
  })

  it(`should ignore 'null' inside action array`, () => {
    const spy = jest.fn()
    const Model = types.model().actions((self) => ({
      log: effect<string>(self, (payload$) =>
        payload$.pipe(map((message) => [null, action(spy, message), null])),
      ),
    }))

    const model = Model.create()

    model.log('hi!')
    expect(spy.mock.calls).toEqual([['hi!']])
  })

  it(`should warning if emit invalid action`, () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    const Model = types.model().actions((self) => ({
      emit: effect<any>(self, (payload$) => payload$.pipe(map((value) => value))),
    }))

    const model = Model.create()

    model.emit('hi!')
    expect(spy.mock.calls).toEqual([['[mst-effect]: hi! is not a valid EffectActions']])
    spy.mockRestore()
  })

  it(`should keep alive even after error occur`, () => {
    const spy = jest.fn()
    const spyError = jest.spyOn(console, 'error').mockImplementation()

    const Model = types.model().actions((self) => ({
      throwErr: effect<boolean>(self, (payload$) =>
        payload$.pipe(
          map((throwErr) => {
            if (throwErr) {
              throw new Error('')
            } else {
              return action(spy)
            }
          }),
        ),
      ),
    }))

    const model = Model.create()

    model.throwErr(true)
    expect(spy.mock.calls).toEqual([])
    expect(spyError.mock.calls.length).toBe(1)

    model.throwErr(false)
    expect(spy.mock.calls).toEqual([[]])
  })

  it(`should able to update model value inside action`, () => {
    const Model = types.model({ value: types.string }).actions((self) => ({
      setValue: effect<string>(self, (payload$) =>
        payload$.pipe(
          map((newValue) =>
            action(() => {
              self.value = newValue
            }),
          ),
        ),
      ),
    }))

    const model = Model.create({ value: '' })

    model.setValue('123')

    expect(model.value).toBe('123')
  })

  it(`should able to use Observable directly`, () => {
    const subject = new Subject<number>()
    const spy = jest.fn()
    const Model = types.model({ value: types.string }).actions((self) => ({
      _effect: effect(self, subject.pipe(map((num) => action(spy, num)))),
    }))

    Model.create({ value: '' })

    subject.next(123)

    expect(spy.mock.calls).toEqual([[123]])
  })
})
