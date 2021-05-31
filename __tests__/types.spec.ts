import { expectType } from 'tsd'

import { PayloadFunc } from '../src'

describe(`types`, () => {
  describe(`PayloadFunc`, () => {
    it(`should return a function type`, () => {
      function optionalPayloadFunc(num: number) {
        return `${num}`
      }
      expectType<PayloadFunc<number, string>>(optionalPayloadFunc)
    })

    it(`should strip payload info if type is 'void'`, () => {
      function emptyPayloadFunc() {}
      expectType<PayloadFunc<void, void>>(emptyPayloadFunc)
    })

    it(`should strip payload info if type is 'unknown'`, () => {
      function emptyPayloadFunc() {}
      expectType<PayloadFunc<unknown, void>>(emptyPayloadFunc)
    })

    it(`should mark payload optional if type contain 'undefined'`, () => {
      function optionalPayloadFunc(_num?: number) {}
      expectType<PayloadFunc<number | undefined, void>>(optionalPayloadFunc)
    })

    it(`should mark payload optional if type contain 'void'`, () => {
      function optionalPayloadFunc(_num?: number) {}
      expectType<PayloadFunc<number | void, void>>(optionalPayloadFunc)
    })
  })
})
