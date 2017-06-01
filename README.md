# Floodwatch

This repo contains the in-progress code for Floodwatch v2, a collective ad-monitoring tool from The Office For Creative Research.
 
Since its first release, Floodwatch has helped reverse the power dynamic between user and advertiser by helping users track and understand the volume and types of ads they’re being served. Floodwatch v2.0 expands on that functionality by allowing users to compare themselves to each other: users may enter their demographic information and see how their ad breakdown compares to that of other demographics.

This repo is not currently being maintained.

![comparison](/doc-images/4d.png)

### Server deploy

```bash
./scripts/build.bash TAG # defaults to current git branchname
./scripts/deploy.bash TAG [SERVER...]
```

e.g.

```bash
./scripts/build.bash develop
./scripts/deploy.bash develop floodwatch-server-staging.floodwatch.me
```
