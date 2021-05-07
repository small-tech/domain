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
        mode: db.settings.payment.mode,
        currency: db.settings.payment.currency,
        price: db.settings.payment.price
      },
      dns: {
        domain: db.settings.dns.domain
      }
    }
  }

  response.json(settings)
}
