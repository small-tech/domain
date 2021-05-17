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
    site: {
      name: 'Your small web host',
      header: `[Configure your host](/admin) to get started.`,
      footer: `---
               Add your organisation details, terms of service, and privacy policy here.`
    },
    payment: {},
    dns: {}
  }

  let settings
  if (db.settings === undefined) {
    settings = defaultSettings
  } else {
    settings = {
      site: {
        name: db.settings.site.name,
        header: db.settings.site.header,
        footer: db.settings.site.footer
      },
      payment: {
        provider: db.settings.payment.provider,
      },
      dns: {
        domain: db.settings.dns.domain
      }
    }
  }

  if (settings.payment.provider === 2 /* Stripe */) {
    settings.payment.mode = db.settings.payment.mode,
    settings.payment.currency = db.settings.payment.currency,
    settings.payment.price = db.settings.payment.price
  }

  response.json(settings)
}
