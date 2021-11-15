# Rush Wallet

A browser extension for smart contract wallet.

This project is built from base code of [Liquality](https://github.com/Liquality) because of their well organized code.

## Getting started
- Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
- Go to this folder repo and run `nvm use` to takes the right version for node (install if you need it)

## Project setup
```
npm ci
```

### Compiles and hot-reloads for development
```
npm run dev
```

and load `/dist` directory as unpacked extension on Google Chrome.

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Run Integration __tests__

[Wallet] Integration __tests__ have been written using [puppeteer](https://developers.google.com/web/tools/puppeteer)

#### testNet __tests__
```
$ export SEED_WORDS={testNet import wallet 12 words}

Ex: export SEED_WORDS=test1 test2 test3 test4 test5 test6 test7 test8 test9 test10 test11 test12

$ npm run test:testNetNetwork
```

### Releases

Release to Chrome Store dev*

Update the tag in [manifest.json](src/manifest.json) & [package.json](package.json)

```shell
git tag <TAG NAME>
```

```shell
git push origin <TAG NAME>
```



## License

[MIT](./LICENSE.md)
