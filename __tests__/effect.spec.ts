import { timer, Subject, Observable } from 'rxjs'
import { map, startWith, endWith, switchMap } from 'rxjs/operators'
import { types as mstTypes } from 'mobx-state-tree'

import { types, effect, action, destroy, NOOP, ValidEffectActions } from '../src'

jest.useFakeTimers()

describe('effect', () => {
  describe(`action`, () => {
    it(`should execute the action immediately`, () => {
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

    it(`should accept 'NOOP' as valid action`, () => {
      const spy = jest.fn()
      const Model = types.model().actions((self) => ({
        run: effect<ValidEffectActions>(self, (payload$) => payload$),
      }))

      const model = Model.create()

      model.run(NOOP)
      model.run(action(spy))
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

    it(`should ignore 'NOOP' inside action array`, () => {
      const spy = jest.fn()
      const Model = types.model().actions((self) => ({
        log: effect<string>(self, (payload$) =>
          payload$.pipe(map((message) => [NOOP, action(spy, message), NOOP])),
        ),
      }))

      const model = Model.create()

      model.log('hi!')
      expect(spy.mock.calls).toEqual([['hi!']])
    })

    it(`should able to modify model inside action`, () => {
      const Model = types.model({ value: types.string }).actions((self) => ({
        setValue: effect<string>(self, (payload$) => {
          function updateValue(value: string) {
            self.value = value
          }

          return payload$.pipe(
            switchMap((newValue) => timer(1000).pipe(map(() => action(updateValue, newValue)))),
          )
        }),
      }))

      const model = Model.create({ value: '' })

      model.setValue('123')

      jest.advanceTimersByTime(1000)

      expect(model.value).toBe('123')
    })

    it(`should warning if action invalid`, () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation()
      const Model = types.model().actions((self) => ({
        emit: effect<any>(self, (payload$) => payload$),
      }))

      const model = Model.create()
      const invalidActions = [
        'string',
        123,
        true,
        false,
        undefined,
        null,
        Symbol('invalid action'),
        {},
        function invalidAction() {},
      ]

      invalidActions.forEach(model.emit)
      expect(spy.mock.calls.length).toBe(invalidActions.length)
      expect(spy.mock.calls).toMatchSnapshot()
      spy.mockRestore()
    })

    it(`should warning if 'types' is not imported from 'mst-effect'`, () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation()
      const Model = mstTypes.model().actions((self) => ({
        emit: effect(self, new Subject()),
      }))

      Model.create()
      expect(spy.mock.calls).toMatchSnapshot()
      spy.mockRestore()
    })
  })

  describe(`subscription`, () => {
    it(`should subscribe the Observable when create`, () => {
      const spy = jest.fn()
      const Model = types.model().actions((self) => ({
        log: effect<never>(self, (payload$) => payload$.pipe(startWith(action(spy, 'start')))),
      }))

      Model.create()

      expect(spy.mock.calls).toEqual([['start']])
    })

    it(`should complete the Observable when destroy`, () => {
      const spy = jest.fn()
      const Model = types.model().actions((self) => ({
        log: effect<never>(self, (payload$) => payload$.pipe(endWith(action(spy, 'end')))),
      }))

      const model = Model.create()
      destroy(model)
      expect(spy.mock.calls).toEqual([['end']])
    })

    it(`should unsubscribe the Observable when destroy`, () => {
      const spy = jest.fn()
      const Model = types.model().actions((self) => ({
        log: effect<never>(self, () => new Observable(() => spy)),
      }))

      const model = Model.create()
      destroy(model)
      expect(spy).toBeCalledTimes(1)
    })
  })

  it(`should keep alive after error occur`, () => {
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

  it(`should able to use Observable directly`, () => {
    const subject = new Subject<ValidEffectActions>()
    const spy = jest.fn()
    const Model = types
      .model({
        value: types.string,
      })
      .actions((self) => {
        effect(self, subject)
        return {}
      })

    Model.create({ value: '' })

    subject.next(action(spy, 123))

    expect(spy.mock.calls).toEqual([[123]])
  })
})
