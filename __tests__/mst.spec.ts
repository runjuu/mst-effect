import * as mst1 from 'mobx-state-tree'

import * as mst2 from '../src/mst'

describe(`re-exports mobx-state-tree`, () => {
  it(`variables should be the same for both of them`, () => {
    expect(Object.keys(mst1).sort()).toEqual(Object.keys(mst2).sort())
  })
})
