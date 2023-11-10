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

The idea was to reuse the Readme.md exposed on github to create also my site, in this way i can update both in the same moment.
I also added a GPC service discover session because i'm right now (2023/Nov) i'm tring to get the GCP certification, so what better way than try on a personal project.

1. The source of truth of the information exposed is, as i said before, the README.md
2. Running the build script two mainly script starts:
    1. The md to html build, using showdown, it export all the md inforamtion formatting it in html (i also add some custom part, like head tags)
    2. The css build, since a site need a litle bit of style, i added some basic css using Less and using the css variables
3. After made a version using showdown and pushing the tag on github a build inside Google Cloud Build is runned using the Dockerfile in the project (multi stage)
4. The build (docker image), is Deployed into a Google Run Service and exposed internally via internal IP
5. The service is exposed to the internet using a Google LoadBalancer (regional) becusa since the Google run service was created on the europen cluster, was not possible to automaticcaly set a DNS name there.
6. Since i choose a regional loadbalancer i had to use cloudflare SSL cert to set the https frontend
7. The LoadBalancer public ip is added in an A record inside my Cloudflare account

<img src="https://canellariccardo.it/public/projectstructure.jpg" width="100%" />