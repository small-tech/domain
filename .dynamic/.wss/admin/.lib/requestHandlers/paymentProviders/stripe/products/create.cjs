// Create a new product.
const stripeWithSecretKey = require('stripe')

module.exports = async (remote, message) => {

  const stripeDetails = db.settings.payment.providers[2].modeDetails[message.modeId === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey, {
    apiVersion: '2020-08-27'
  })

  const domain = db.settings.dns.domain

  const productDetails = {
    // Note: product ids must not have dots in them.
    // Must match pattern: (/\A[a-zA-Z0-9_\-]+\z/)
    id: `prod_domain_${domain.replace(/\./g, '_')}`,

    name: `${domain} (monthly)`,
    description: 'Monthly fee for your Small Web place',
    statement_descriptor: domain,
    tax_code: 'txcd_10103000', // Software as a Service
    images: ['https://small-web.org/small-web.svg'],
    url: `https://${domain}`
  }

  console.log('Creating product…', productDetails)

  let product
  try {
    product = await stripe.products.create(productDetails)
  } catch (error) {
    console.log('STRIPE error', error)
    remote.paymentProviders.stripe.products.create.request.respond({ error })
    return
  }
  console.log('STRIPE OK', product)
  remote.paymentProviders.stripe.products.create.request.respond({ product })
}
