const stripeWithSecretKey = require('stripe')
const Remote = require('@small-tech/remote')

const STRIPE = 2

module.exports = function (client, request) {
  console.log(`   👩‍💻️    ❨Place❩ New connection to index.`)
  client.room = this.setRoom(request)

  const remote = new Remote(client)

  remote.create.checkout.session.request.handler = async message => {
    console.log('>>> Create checkout session called with', message)

    if (db.settings.payment.provider !== STRIPE) {
      return remote.create.checkout.session.request.respond(message, {error: 'Payment provider is not Stripe.'})
    }

    const stripeSettings = db.settings.payment.providers[STRIPE]
    const mode = stripeSettings.mode
    const modeDetails = stripeSettings.modeDetails[mode === 'live' ? 1 : 0]
    const priceId = modeDetails.priceId

    const stripe = stripeWithSecretKey(modeDetails.secretKey, {
      apiVersion: '2020-08-27'
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      // TODO: Instead of using the domain, pass the domain from the client here
      // ===== so that it also works when testing from localhost, etc.
      // TODO: Implement these endpoints.
      success_url: `https://${db.settings.dns.domain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${db.settings.dns.domain}/stripe/cancelled`
    })

    remote.create.checkout.session.request.respond(message, { url: session.url })
  }
}
