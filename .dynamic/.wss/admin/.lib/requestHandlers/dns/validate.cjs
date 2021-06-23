const fetch = require('node-fetch')

module.exports = async (remote, message) => {
  console.log('   📡️    ❨Domain❩ Validating DNS Provider settings.')

  const retrieveDomainUrl = `https://api.dnsimple.com/v2/${db.settings.dns.accountId}/domains/${db.settings.dns.domain}`
  const dnsAccountDetails = await (await fetch(retrieveDomainUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${db.settings.dns.accessToken}`
    }
  })).json()

  if (dnsAccountDetails.message) {
    // Something went wrong (most likely an authentication failure)
    remote.dns.validate.error.send({
      error: dnsAccountDetails.message
    })
  } else {
    // VPS account is valid. Return the account details.
    remote.dns.validate.response.send({
      details: dnsAccountDetails
    })
  }
}
