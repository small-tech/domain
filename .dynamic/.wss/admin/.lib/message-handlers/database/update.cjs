const set = require('keypather/set')

module.exports = (client, message) => {
  // Update the value at a specific keypath.
  // console.log('Update', message)
  set(db, message.keyPath, message.value)
}
