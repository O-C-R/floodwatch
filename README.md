# Floodwatch

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
