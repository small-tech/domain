const fetch = require('node-fetch')

module.exports = async (client, message) => {
  // Return the price from the Stripe API.
  const stripeDetails = db.settings.payment.modeDetails[message.mode === 'live' ? 1 : 0]
  const secretKey = Buffer.from(stripeDetails.secretKey).toString('base64')
  const priceDetails = await (await fetch(`https://api.stripe.com/v1/prices/${stripeDetails.priceId}`, {
    headers: {
      Authorization: `Basic ${secretKey}`
    }
  })).json()

  console.log(`   📡️    ❨Domain❩ Validating Payment Provider settings (${message.mode} mode).`)

  if (priceDetails.error) {
    client.send(JSON.stringify({
      type: 'price-error',
      mode: message.mode,
      error: priceDetails.error
    }))
  } else {
    client.send(JSON.stringify({
      type: 'price',
      mode: message.mode,
      currency: priceDetails.currency,
      amount: priceDetails.unit_amount / 100
    }))
  }
}
