// Create a new price.
const stripeWithSecretKey = require('stripe')

module.exports = async (remote, message) => {
  console.log('message', message)
  const stripeDetails = db.settings.payment.providers[2].modeDetails[message.modeId === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey, {
    apiVersion: '2020-08-27'
  })

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

  console.log(priceDetails)

  let price
  try {
    price = await stripe.prices.create(priceDetails)
  } catch (error) {
    remote.paymentProviders.stripe.prices.create.respond({ error })
    return
  }

  remote.paymentProviders.stripe.prices.create.respond({ price })
}
