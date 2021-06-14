module.exports = function (client, request) {
  const tokenShort = request.params.token.slice(0,8).toLowerCase()
  console.log(`   🔐️    ❨Place❩ Manage domain socket connection request with token ${tokenShort}  for domain ${request.params.domain}`)

  // Set the client’s room to limit private broadcasts to people who are authenticated.
  client.room = this.setRoom({url: `/manage/${request.params.domain}`})

  if (!db.privateTokens) {
    db.privateTokens = []
  }

  let authorised = false
  db.privateTokens.forEach(token => {
    if (token.domain === request.params.domain && token.body === request.params.token) {
      authorised = true
      token.accessedAt = Date.now()
    }
  })

  if (!authorised) {
    console.log(`   ⛔️    ❨Domain❩ Unauthorised: token ${tokenShort}`)
    client.send(JSON.stringify({
      type: 'authorisation-failure',
      error: 'Unauthorised.'
    }))
    client.close()
  } else {
    // TODO: add client to room, etc., etc.
    console.log(`   🔓️    ❨Domain❩ Authorised: token ${tokenShort}`)
    client.send(JSON.stringify({
      type: 'authorisation-success'
    }))
    this.broadcast(client, JSON.stringify({
      type: 'info',
      body: `There’s been a new login from ${request._remoteAddress}`
    }))
  }
}
