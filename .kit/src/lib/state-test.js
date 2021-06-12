// TODO: Refactor – convert this to a unit test once State class
// ===== is its own module.

import State from './State.js'

const state = new State({
  UNKNOWN: {},
  OK: {},
  NOT_OK: {}
})

console.log('state', state)
console.log('state.OK', state.OK)

try {
  console.log('state.DOES_NOT_EXIST', state.DOES_NOT_EXIST)
} catch (error) {
  console.error('Non-existent state throws as expected')
  console.error(error)
}

try {
  state.DOES_NOT_EXIST = {}
} catch (error) {
  console.error('Trying to create new state fails.')
  console.error(error)
}

state.OK = {contextUpdated: true}
console.log('Updating context on existing state works.')
console.log(state.OK)

console.log('State is unknown? (should be true)', state.is(state.UNKNOWN))

console.log('Setting state to OK…')
state.set(state.OK)

console.log('State is OK? (should be true)', state.is(state.OK))

console.log('State is UNKNOWN? (should be false', state.is(state.UNKNOWN))

console.log('Setting state to NOT_OK with error in context')
state.set(state.NOT_OK, {error: 'This is just not ok.'})

console.log('State is OK? (should be false)', state.is(state.OK))
console.log('State is UNKNOWN? (should be false', state.is(state.UNKNOWN))
console.log('State is NOT_OK? (should be true)', state.is(state.NOT_OK))
console.log('Error message: ', state.NOT_OK.error)