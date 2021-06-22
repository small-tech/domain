// TODO: We need a call from the client to let us know when that happens so we can set the domain status to active.
const path = require('path')

const messageHandlers = {
  // General database updates (deltas).
  'database.update': require('./.lib/message-handlers/database/update.cjs'),

  // DNS
  'dns.validate': require('./.lib/message-handlers/dns/validate.cjs'),

  // PSL
  'psl.validate': require('./.lib/message-handlers/psl/validate.cjs'),

  // VPS
  'vps.validate': require('./.lib/message-handlers/vps/validate.cjs'),

  // Places
  'places.create': require('./.lib/message-handlers/places/create.cjs'),
  'places.wait-for-server-response': require('./.lib/message-handlers/places/wait-for-server-response.cjs'),

  // Payment provider: Stripe
  'payment-providers.stripe.get-details': require('./.lib/message-handlers/payment-providers/stripe/get-details.cjs'),
  'payment-providers.stripe.prices.create': require('./.lib/message-handlers/payment-providers/stripe/prices/create.cjs'),
  'payment-providers.stripe.products.create': require('./.lib/message-handlers/payment-providers/stripe/products/create.cjs'),
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
