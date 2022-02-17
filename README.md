# Domain

__Work-in-progress (not ready for use).__

Domain enables people to seamlessly get started with their own place on the [Small Web](https://small-tech.org/research-and-development) in under a minute.

You can use Domain to run a Small Web Domain as a commercial activity (e.g., charging €10/month for a Small Web place on small-web.org), a public good (e.g., a city providing free Small Web places to its citizens via tokens), or on a hyperlocal or more intimate level (e.g., providing Small Web places for your neighbourhood or your own family via a private instance).

A Small Web Domain is, for all intents and purposes, like a top-level domain but:

  1. It is a second-level domain (e.g., small-web.org).
  2. Small Web places are registered as subdomains.
  3. Unless it is being run as a private instance (e.g., for your family), the second-level domain is registered on the [Public Suffix List](https://publicsuffix.org/).

If a person wants to move their place to a different Small Web Domain or to a Big Web domain (i.e., their own second-level domain), they can at any time.

## Install

1. Install [NodeKit](https://github.com/small-tech/nodekit)
2. Clone this repo.
3. `npm install`

## Run

Domain is a [NodeKit](https://github.com/small-tech/nodekit) app. There is no build stage.

From the Domain folder, simply run:

```shell
nodekit
```

  - Main page: https://localhost
  - Admin Panel: https://localhost/admin

For admin panel password see terminal output.

## Configure

Once you sign up for accounts with the [supported service providers](#supported-service-providers) and Domain is running, you can configure your account using the Admin Panel.

## Is this ready for use?

No. It is under heavy development.

## Why such a generic name?

On purpose. We are not trying to create A Brand™ here. The “brand”, if anything, is the instantly-recognisable simplicity and typographic treatment of the public-facing sign-up page itself which will enable people to recognise Small Web Domains (due to the lack of bullshit/noise). Otherwise, the focus is on the domain itself, as it should be.

## What does it take to run a Small Web Domain?

Domain integrates three* main services:

1. A Domain Name Service (DNS) provider for setting up domains.

2. A Virtual Private Server (VPS) provider for settings up servers.

3. A payment provider to limit access to scarce resources.

_\* For public instances, it also requires that your domain is registered on the [Public Suffix List](https://publicsuffix.org/)._

## Supported service providers

Domain provides support for the following service providers. You will need to get accounts with them to configure it.

### DNS

  - [DNSimple](https://dnsimple.com)

### VPS

  - [Hetzner Cloud](https://www.hetzner.com/cloud)

### Payment

  - __None:__ for private instances (e.g., families, internal use at organisations, etc.)

  - __Tokens:__ for use in place of money by organisations running public instances (e.g., a city providing free Small Web Places to its citizens). __(Under construction.)__

  - __[Stripe](https://stripe.com)__: for commercial payments (e.g., for making your Small Web Domain financially sustainable within the capitalist system you find yourself living under) __(Under construction.)__

## What is the token payment type?

The Small Web aims to be a bridge between the capitalist centralised web and a post-capitalist humanscale web of individually-owned-and-controlled single-tenant web places. As such, we have the unenviable task of trying to design a system that is both sustainable under capitalism and viable for post-capitalist use.

Supporting both Stripe and tokens as a payment type is an example of this.

A token is simply a secret code that you can enter in place of traditional payment with money.

For example, a municipality might decide that its citizens having their own place on the Small Web is good for human rights and democracy and might budget to provide them with this service from the common purse, for the common good. As such, it might create codes that get mailed out to all citizens. They can then use these codes in place of payment. (We prototyped an early version of this with the City of Ghent several years ago. Unfortunately, a conservative government came into power and our funding for the project was cut off.)

Traditional/token payment doesn’t have to be mutually exclusive. The municipality in question might, for example, enable both so that people can sign up for more than one Small Web place or if it wants to enable others (e.g., people who are not residents of their city) to sign up.

## LICENSE

Copyright ⓒ 2021-present [Aral Balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

Released under AGPL version 3.0.
