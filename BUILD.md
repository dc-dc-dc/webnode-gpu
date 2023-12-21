# Github Build

This repo is configured to build on new tags created

To build a new version

Update the commits [inside](/scripts/build.mjs) to the version to target of `depot_tools` and `dawn`
Update [package.json](./package.json) version to the tag you are going to create

Example if the new tag is v0.0.10 version should be 0.0.10

Create the git tag and push with the commit
```shell
git tag v*.*.*
git push --tags
```