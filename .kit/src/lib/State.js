////////////////////////////////////////////////////////////////////////////////
//
// Basic State class.
//
// Properties:
//
// - Only one state may be active at a time.
// - No new states can be added after initialisation (throws TypeError)
// - Has is() and set() methods. Former returns a boolean based
//   on whether current state is the passed state and latter stores the passed
//   (optional) context in the state and sets the current state to it.
// - Exposes a subscribe method so you can treat it as a store and get
//   reactive updates in your interface by prefixing the state object’s name
//   with a dollar sign.
//
// Copyright ⓒ 2021-present Aral Balkan.
// Shared with ♥ by the Small Technology Foundation.
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
////////////////////////////////////////////////////////////////////////////////

// This is a Proxy class to ensure that new states cannot be added once
// a state object has been created. (You can, however, update the context of
// existing states). It acts as a guard.
export default class StateProxy {
  state = null

  constructor (state) {
    this.state = new State(state)

    return new Proxy(this.state, {
      get: function (target, property, receiver) {
        const state = Reflect.get(...arguments)
        if (state === undefined) {
          throw new TypeError(`State does not exist (get): ${property}`)
        }
        return state
      },

      set: function (object, property, value) {
        // If the state does not already exist, the get lookup will fail (see above).
        // (You can only set the context on an existing state.)
        const state = Reflect.get(...arguments)
        if (state === undefined) {
          throw new TypeError(`State does not exist (set): ${property}`)
        }
        return Reflect.set(...arguments)
      }
    })
  }
}

// This is the actual state class that does the bulk of the work.
class State {
  now = null

  // TODO: Make this a proper list of subscribers.
  subscription = function () {
    console.log('No subscription yet.')
  }

  constructor (state) {
    // Copy the state
    Object.assign(this, state)

    // Set the first state as the default.
    this.now = state[Object.keys(state)[0]]
  }

  is (state) {
    return this.now === state
  }

  set (state, context = {}) {
    const key = Object.keys(this).find(key => this[key] === state)

    if (key === undefined) {
      throw new TypeError(`State does not exist (set): ${state}`)
    }

    this[key] = context
    this.now = this[key]

    // TODO: Iterate the proper list of subscribers.
    this.subscription(this)
  }

  subscribe (subscription) {
    this.subscription = subscription
    subscription(this)

    // TODO: Make this a proper unsubscribe function.
    return function () {
      console.log('Not really unsubscribing')
    }
  }
}
