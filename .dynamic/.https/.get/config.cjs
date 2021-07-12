////////////////////////////////////////////////////////////////////////////////
//
// Configuration (Site.js GET route)
//
// Returns PUBLIC configuration information. This should never
// return any secret material.
//
// Copyright ⓒ 2021-present Aral Balkan, Small Technology Foundation.
// License: AGPL version 3.
//
////////////////////////////////////////////////////////////////////////////////

module.exports = (request, response) => {

  const defaultSettings = {
    payment: {},
    dns: {},
    org: {}
  }

  let settings
  if (db.settings === undefined) {
    settings = defaultSettings
  } else {
    settings = {
      payment: {
        provider: db.settings.payment.provider
      },
      dns: {
        domain: db.settings.dns.domain
      },
      org: db.settings.org
    }
  }

  if (settings.payment.provider === 2 /* Stripe */) {
    const stripe = db.settings.payment.providers[2]
    settings.payment.mode = stripe.mode,
    settings.payment.currency = stripe.currency,
    settings.payment.price = stripe.price
  }

  response.json(settings)
}
