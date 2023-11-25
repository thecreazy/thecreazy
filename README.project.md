# Brief explanation of the project

## Tech stack

- PNPM
- Nodejs
- eslint
- less
- showdown
- Docker
- GCP
- Cloudflare

## The idea behind the project

The idea was to reuse the `Readme.md` exposed on GitHub to create my site, in this way, I can update both at the same moment.
I also added a GPC service discover session because I'm right now (2023/Nov) I'm trying to get the GCP certification, so what better way than to try on a personal project?

1. The source of truth of the information exposed is, as I said before, the README.md
2. Running the build script two mainly script starts:
   1. The MD to HTML build, using showdown, export all the MD information formatting it in HTML (I also added some custom part, like head tags)
   2. The CSS build, since a site needs a little bit of style, I added some basic CSS using Less, and using the CSS variables
3. After making a version using showdown and pushing the tag on GitHub a build inside Google Cloud Build is ruined using the Dockerfile in the project (multi-stage)
4. The build (docker image), is Deployed into a Google Run Service and exposed internally via internal IP
5. The service is exposed to the internet using a Google LoadBalancer (regional) because since the Google run service was created on the European cluster, was not possible to automatically set a DNS name there.
6. Since I chose a regional load balancer I had to use Cloudflare SSL cert to set the HTTPS frontend
7. The LoadBalancer public IP is added in an A record inside my Cloudflare account

<img src="https://canellariccardo.it/public/projectstructure.jpg" width="100%" />

## Why i stopped GCP

The reson why i stopped the GCP env is really easy to understand

<img src="https://canellariccardo.it/public/gcpbilling.jpg" width="100%" />

28 Eur for half of a month it's really too much for a static page.

I switched to vercel, same env, same features, but free.

![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=tracreazy&style=for-the-badge)
