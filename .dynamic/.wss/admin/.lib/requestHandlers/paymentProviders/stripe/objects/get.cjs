// Returns the Stripe objects (price, product, and webhook).
// If they do not exist, they are created and returned.
// If they do not exist and they cannot be created, or if there is any other error,
// an error is returned.

const stripeWithSecretKey = require('stripe')
const validateDns = require('../../../../validate-dns.cjs')

module.exports = async (remote, message) => {
  const mode = message.modeId
  const stripeDetails = db.settings.payment.providers[2].modeDetails[mode === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey, {
    apiVersion: '2020-08-27'
  })

  let product, price, webhook = null

  // Before we can create Stripe objects, the DNS settings and domain
  // must be valid. TODO: implementing this check here so that we’re thorough,
  // but the client should detect this state and inform the person and
  // not allow things to progress to this point.
  try {
    await validateDns()
  } catch (error) {
    remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    return
  }

  const domain = db.settings.dns.domain
  const webhookUrl = `https://${domain}/stripe`

  // If the Stripe object IDs do not exist in the database, then
  // either they have not been created in Stripe or this installation
  // of Domain doesn’t know about them for some reason. Attempt to create them.

  if (stripeDetails.productId === '') {
    // Product does not exist. Attempt to create it.
    try {
      remote.paymentProviders.stripe.objects.get.progress.creatingProduct.send()
      product = await createProduct(domain, stripe)
    } catch (error) {
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    stripeDetails.productId = product.id
  }

  if (stripeDetails.priceId === '') {
    // Price does not exist. Attempt to create it.
    try {
      remote.paymentProviders.stripe.objects.get.progress.creatingPrice.send()
      price = await createPrice(domain, stripe)
    } catch (error) {
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    stripeDetails.priceId = price.id
  }

  if (stripeDetails.webhookId === '') {
    // Webhook does not exist. Attempt to create it.
    try {
      remote.paymentProviders.stripe.objects.get.progress.creatingWebhook.send()
      webhook = await createWebhook(domain, webhookUrl, stripe)
    } catch (error) {
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    stripeDetails.webhookId = webhook.id
  }

  // At this point, the Stripe object IDs should exist in the database
  // and the objects themselves might even be populated if we
  // just created them. If not, we will retrieve them now.

  if (product === null) {
    try {
      product = await stripe.products.retrieve(stripeDetails.productId)
    } catch (error) {
      // TODO: analyse error.
      console.log('Stripe: error retrieving product. Attempting to create…', error)
      // Product does not exist. Attempt to create it.
      try {
        product = await createProduct(domain, stripe)
      } catch (error) {
        return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
    }
  }

  if (price === null) {
    try {
      price = await stripe.prices.retrieve(stripeDetails.priceId)
    } catch (error) {
      // TODO: analyse error.
      console.log('Stripe: error retrieving price. Will attempt to create.', error)
      try {
        price = await createPrice(domain, stripe)
      } catch (error) {
        return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
    }
  }

  if (webhook === null) {
    try {
      webhook = await stripe.webhookEndpoints.retrieve(stripeDetails.webhookId)
    } catch (error) {
      // TODO: analyse error.
      console.log('Stripe: error retrieving webhook. Will attempt to create.', error)
      try {
        webhook = await createWebhook(domain, webhookUrl, stripe)
      } catch (error) {
        remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
    }
  }

  // OK, if we made it here, all should be good and we have the Stripe objects to return.

  remote.paymentProviders.stripe.objects.get.request.respond(message, { product, price, webhook})
}


// Attempt to create product (may throw).
async function createProduct(domain, stripe) {
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

  return await stripe.products.create(productDetails)
}


// Attempt to create price (may throw).
async function createPrice(domain, stripe) {
  const priceDetails = {
    currency: db.settings.payment.currency,

    // TODO: Ensure this is in Stripe units.
    unit_amount: db.settings.payment.price,
    product: `prod_small-web_${domain}`,
    nickname: `Price for ${domain} (monthly)`,
    recurring: {
      interval: 'month'
    },
    tax_behavior: 'inclusive'
  }

  console.log('Creating price…', priceDetails)

  return await stripe.prices.create(priceDetails)
}


// Attempt to create webhook (may throw).
async function createWebhook(domain, webhookUrl, stripe) {
  console.log('Creating webhook…')
  return await stripe.webhookEndpoints.create({
    url: webhookUrl,
    description: `Webhooks for Small Web domain ${domain}`,
    enabled_events: [
      'customer.subscription.created',
      'customer.subscription.deleted',
      'customer.subscription.updated'
    ]
  })
}
