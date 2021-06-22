// Create a new price.

const stripeWithSecretKey = require('stripe')

module.exports = async (client, message) => {
  const stripeDetails = db.settings.payment.modeDetails[message.mode === 'live' ? 1 : 0]
  const stripe = stripeWithSecretKey(stripeDetails.secretKey)

  const domain = db.settings.dns.domain

  const priceDetails = {
    // TODO: Ensure we are saving the currency code.
    currency: db.settings.payment.currency,

    // TODO: Ensure this is in Stripe units.
    unit_amount: db.settings.payment.price,
    product_id: `prod_small-web_${domain}`,
    nickname: `Price for ${domain} (monthly)`,
    recurring: {
      interval: 'month'
    },
    tax_behavior: 'inclusive'
  }

  let price
  try {
    price = await stripe.prices.create(priceDetails)
  } catch (error) {
    client.send(JSON.stringify({
      type: 'payment-providers.stripe.prices.create.error',
      error
    }))
    return
  }

  client.send(JSON.stringify({
    type: 'payment-providers.stripe.prices.create.result',
    price
  }))
}
