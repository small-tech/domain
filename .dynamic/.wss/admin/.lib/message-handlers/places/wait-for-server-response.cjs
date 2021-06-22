const fetch = require('node-fetch')

const MessageType = {
  places: {
    'wait-for-server-response': {
      error: 'places.wait-for-server-response.error',
      result: 'places.wait-for-server-response.result'
    }
  }
}

module.exports = async (client, message) => {
  // Validate request.
  if (db.domains[message.domain] === undefined) {
    client.send(JSON.stringify({
      type: MessageType.places['wait-for-server-response'].error,
      error: 'Domain not found.'
    }))
    return
  }

  if (db.domains[message.domain].status !== 'setup-vps-created') {
    client.send(JSON.stringify({
      type: MessageType.places['wait-for-server-response'].error,
      error: `Incorrect domain status (${db.domains[message.domain].status}). Should be 'setup-vps-created'.`
    }))
    return
  }

  // Request is valid.

  console.log('Waiting for server response for', message.url)
  let serverResponseReceived = false

  const newSiteUrl = `https://${message.domain}.${db.settings.dns.domain}`

  // TODO: Implement timeout.

  while (!serverResponseReceived) {
    console.log(`Trying to see if ${newSiteUrl} is ready.`)
    let response
    try {
      response = await fetch(newSiteUrl)
      serverResponseReceived = response.ok
    } catch (error) {
      console.log(`${newSiteUrl} is not yet ready, got an error.`)
    }
    if (!serverResponseReceived) {
      console.log(`${newSiteUrl} not ready, waiting a bit before retrying…`)
      // Wait a bit before trying again.
      await duration(1000)
    }
  }

  db.domains[message.domain].status = 'active'

  console.log(`🎉️ ${newSiteUrl} is ready!`)

  client.send(JSON.stringify({
    type: MessageType.places['wait-for-server-response'].result
  }))
}
