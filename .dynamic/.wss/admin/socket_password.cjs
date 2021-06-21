// TODO: We need a call from the client to let us know when that happens so we can set the domain status to active.
const path = require('path')

const messageHandlers = {
  // General database updates (deltas).
  'update': require('./.lib/message-handlers/update.cjs'),

  // Validation
  'validate-dns': require('./.lib/message-handlers/validate-dns.cjs'),
  'validate-psl': require('./.lib/message-handlers/validate-psl.cjs'),
  'validate-vps': require('./.lib/message-handlers/validate-vps.cjs'),

  // Server creation
  'create-server': require('./.lib/message-handlers/create-server.cjs'),
  'wait-for-server-response': require('./.lib/message-handlers/wait-for-server-response.cjs'),

  // TODO: This will no longer be required soon as we rewrite the Stripe stuff.
  'get-price': require('./.lib/message-handlers/get-price.cjs'),
}

const duration = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = function (client, request) {
  const password = request.params.password

  console.log(`   🔐️    ❨Domain❩ Socket connection request.`)

  // Set the client’s room to limit private broadcasts to people who are authenticated.
  client.room = this.setRoom({url: '/admin'})

  client.on('message', async data => {
    const message = JSON.parse(data)

    const messageHandler = messageHandlers[message.type]
    if (messageHandler === undefined) {
      console.log(`Warning: received unexpected message type: ${message.type}`)
    } else {
      messageHandler(client, message)
    }
  })

  if (password !== db.admin.password) {
    console.log(`   ⛔️    ❨Domain❩ Unauthorised password: ${password}`)
    client.send(JSON.stringify({
      type: 'error',
      body: 'Error: unauthorised.'
    }))
    client.close()
  } else {
    console.log(`   🔓️    ❨Domain❩ Authorised password: ${password}`)
    // Send a signal that sign in has succeeded.
    client.send(JSON.stringify({
      type: 'sign-in'
    }))

    // Next, send the settings.
    client.send(JSON.stringify({
      type: 'settings',
      body: db.settings
    }))
    // this.broadcast(client, `There’s been a new login from ${request._remoteAddress}`)
  }
}

if (db.settings === undefined) {
  // Initialise the settings object.
  db.settings = require(path.join(__dirname, '.lib/initial-settings.cjs'))
}
