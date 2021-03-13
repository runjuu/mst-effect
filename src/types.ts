import type { IAnyModelType, Instance } from 'mobx-state-tree'

export type IsAny<T> = 0 extends 1 & T ? true : false // https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type

export type IsEmptyPayload<P> = P extends void
  ? true
  : IsAny<P> extends true
  ? false
  : unknown extends P
  ? true
  : false

export type PayloadFunc<Payload, ReturnType> = IsEmptyPayload<Payload> extends true
  ? () => ReturnType
  : (payload: Payload) => ReturnType

export type AnyInstance = Instance<IAnyModelType>
