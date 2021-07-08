const fetch = require('node-fetch')

module.exports = async () => {
  const retrieveDomainUrl = `https://api.dnsimple.com/v2/${db.settings.dns.accountId}/domains/${db.settings.dns.domain}`
  const dnsAccountDetails = await (await fetch(retrieveDomainUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${db.settings.dns.accessToken}`
    }
  })).json()

  if (dnsAccountDetails.message) {
    // Something went wrong (most likely an authentication failure)
    throw new Error(dnsAccountDetails.message)
  }

  return dnsAccountDetails
}
