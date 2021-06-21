// Retrieve and return the product and price details for the
// requested Stripe mode (test or live).

const stripeWithSecretKey = require('stripe')

module.exports = async (client, message) => {

  const stripeDetails = db.settings.payment.modeDetails[message.mode === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey)

  let product, price

  try {
    product = await stripe.products.retrieve(stripeDetails.productId)
    price = await stripe.prices.retrieve(stripeDetails.priceId)
  } catch (error) {
    client.send(JSON.stringify({
      type: 'payment-providers.stripe.get.error',
      error
    }))
    return
  }

  client.send(JSON.stringify({
    type: 'payment-providers.stripe.get.result',
    product,
    price
  }))
}
