// Retrieve and return the product and price details for the
// requested Stripe mode (test or live).
const stripeWithSecretKey = require('stripe')

module.exports = async (remote, message) => {

  const stripeDetails = db.settings.payment.modeDetails[message.mode === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey)

  let product, price

  try {
    product = await stripe.products.retrieve(stripeDetails.productId)
    price = await stripe.prices.retrieve(stripeDetails.priceId)
  } catch (error) {
    remote.paymentProviders.stripe.get.error.send({ error })
    return
  }

  remote.paymentProviders.stripe.get.response.send({ product, price })
}
