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

const { payment } = require("../../.db/settings.cjs")

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
    settings.payment.mode = db.settings.payment.mode,
    settings.payment.currency = db.settings.payment.currency,
    settings.payment.price = db.settings.payment.price
  }

  response.json(settings)
}
