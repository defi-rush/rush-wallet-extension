const TestUtil = require('../../utils/TestUtils')
const OverviewPage = require('../Pages/OverviewPage')
const HomePage = require('../Pages/HomePage')
const PasswordPage = require('../Pages/PasswordPage')
const SeedWordsPage = require('../Pages/SeedWordsPage')
const expect = require('chai').expect

const puppeteer = require('puppeteer')

const testUtil = new TestUtil()
const overviewPage = new OverviewPage()
const homePage = new HomePage()
const passwordPage = new PasswordPage()
const seedWordsPage = new SeedWordsPage()

let browser, page
const password = '123123123'

describe('Liquality wallet- Import wallet', async () => {
  beforeEach(async () => {
    browser = await puppeteer.launch(testUtil.getChromeOptions())
    page = await browser.newPage()
    await page.goto(testUtil.extensionRootUrl)
    await homePage.ClickOnAcceptPrivacy(page)
  })

  afterEach(async () => {
    if (browser !== undefined) {
      await browser.close()
    }
  })

  it('Import wallet with random seed phrase 12 word with 0 coins-["mainnet"]', async () => {
    await homePage.ClickOnImportWallet(page)
    console.log('Import wallet page hase been loaded')

    // check continue button has been disabled
    const enterWords = 'blouse sort ice forward ivory enrich connect mimic apple setup level palm'
    await seedWordsPage.EnterImportSeedWords(page, enterWords)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    if (process.env.NODE_ENV !== 'mainnet') {
      await overviewPage.SelectNetwork(page, 'testnet')
    } else {
      await overviewPage.SelectNetwork(page, 'mainnet')
    }
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // validate the testnet asserts count
    const assetsCount = await overviewPage.GetTotalAssets(page)
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')
  })
  it('Import wallet with (12 seed words) and see balance', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select testnet
    await overviewPage.SelectNetwork(page, 'testnet')
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // validate the testnet asserts count
    const assetsCount = await overviewPage.GetTotalAssets(page)
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')
    // Check the currency
    expect(await overviewPage.GetCurrency(page),
      'Wallet stats has currency should be USD').contain('USD')

    // Check the Total amount - 10s wait to load amount
    const totalAmount = await overviewPage.GetTotalLiquidity(page)
    expect(parseInt(totalAmount), 'Funds in my wallet should be greater than 2000 USD').greaterThanOrEqual(2000)
    console.log('After Import wallet, the funds in the wallet:', totalAmount)
  })
  it('Import wallet with (24 seed words) and see balance', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit, select 24 seed option
    await page.waitForSelector('#word_button_group', { visible: true })
    await page.click('#twenty_four_words_option')
    const seedWords = await page.$$eval('#import_wallet_word', (el) => el.length)
    expect(seedWords).equals(24)
    // Enter 24 seed words
    await homePage.EnterSeedWords(page, 24)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select testnet
    await overviewPage.SelectNetwork(page, 'testnet')
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // validate the testnet asserts count
    const assetsCount = await overviewPage.GetTotalAssets(page)
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')
    // Check the currency
    expect(await overviewPage.GetCurrency(page),
      'Wallet stats has currency should be USD').contain('USD')
  })
  it('Import wallet,lock wallet and unlock wallet-["mainnet"]', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select network
    if (process.env.NODE_ENV !== 'mainnet') {
      await overviewPage.SelectNetwork(page, 'testnet')
    } else {
      await overviewPage.SelectNetwork(page, 'mainnet')
    }
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // Clock on Lock
    await overviewPage.ClickLock(page)
    // Unlock
    await passwordPage.ClickUnlock(page, password)
  })
  it('Import wallet,lock wallet and forgot password while unlock wallet-["mainnet"]', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select network
    if (process.env.NODE_ENV !== 'mainnet') {
      await overviewPage.SelectNetwork(page, 'testnet')
    } else {
      await overviewPage.SelectNetwork(page, 'mainnet')
    }
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // Clock on Lock
    await overviewPage.ClickLock(page)
    // Click on Forgot password? Import with seed phrase
    await passwordPage.ClickOnForgotPassword(page)
    // Enter the seed phrase & submit password details
    await homePage.EnterSeedWords(page)
    await passwordPage.SubmitPasswordDetails(page, password)
    // check user landed on overview page
    await overviewPage.HasOverviewPageLoaded(page)
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
  })
})
