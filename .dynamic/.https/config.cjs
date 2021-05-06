module.exports = (request, response) => {

  const defaultSettings = {
    name: 'Your small web host',
    description: `<a href='/admin'>Configure your host</a> to get started.`
  }

  let settings
  if (db.settings === undefined) {
    settings = defaultSettings
  } else {
    settings = {
      name: db.settings.name,
      description: db.settings.description,
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
