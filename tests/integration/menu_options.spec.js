const TestUtil = require('../utils/TestUtils')
const OverviewPage = require('../Pages/OverviewPage')
const HomePage = require('../Pages/HomePage')
const PasswordPage = require('../Pages/PasswordPage')
const expect = require('chai').expect
const chalk = require('chalk')

const puppeteer = require('puppeteer')

const testUtil = new TestUtil()
const overviewPage = new OverviewPage()
const homePage = new HomePage()
const passwordPage = new PasswordPage()

let browser, page
const password = '123123123'

describe('Hamburger menu options [Wallet] - ["mainnet"]', async () => {
  beforeEach(async () => {
    browser = await puppeteer.launch(testUtil.getChromeOptions())
    page = await browser.newPage()
    await page.goto(testUtil.extensionRootUrl)
    await homePage.ClickOnAcceptPrivacy(page)
  })

  afterEach(async () => {
    try {
      console.log('Cleaning up instances')
      await page.close()
      await browser.close()
    } catch (e) {
      console.log('Cannot cleanup instances')
    }
  })

  it('should be able to see Settings page', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page, null)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select testnet
    await overviewPage.SelectNetwork(page)
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)

    // Click on Backup seed from Burger Icon menu
    await page.waitForSelector('#burger_icon_menu', { visible: true })
    await page.click('#burger_icon_menu')
    // Click on Settings
    const settings = await page.waitForSelector('#settings', { visible: true })
    await settings.click()
    await page.waitForSelector('#settings_item_default_wallet', { visible: true })
    const settingDefaultWebWallet = await page.$eval('#settings_item_default_wallet', (el) => el.textContent)
    expect(settingDefaultWebWallet).contains('Set Liquality as the default dapp wallet. Other wallets cannot interact with dapps while this is enabled.')

    const settingsItemWebNetwork = await page.$eval('#settings_item_web_network', (el) => el.textContent)
    expect(settingsItemWebNetwork).contains('Select which ethereum based network should be used for dapps.')

    await page.waitForSelector('#download_logs_button', { visible: true })
    const appVersion = await page.$eval('#settings_app_version', (el) => el.textContent)
    expect(appVersion).contain('Version')
  })
  it('should be able to test backup seed feature', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page, null)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select testnet
    await overviewPage.SelectNetwork(page)
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)

    // Check the currency
    expect(await overviewPage.GetCurrency(page),
      'Wallet stats has currency should be USD').contain('USD')

    // Click on Backup seed from Burger Icon menu
    await page.waitForSelector('#burger_icon_menu', { visible: true })
    await page.click('#burger_icon_menu')
    await page.waitForSelector('#backup_seed', { visible: true })
    await page.click('#backup_seed')
    console.log(chalk.green('User clicked on Backup Seed option'))
    await page.waitForSelector('#i_have_privacy_button', { visible: true })
    expect(await page.$eval('#show_seed_phrase', (el) => el.textContent)).equals('Show Seed Phrase?')
    expect(await page.$eval('#show_seed_phrase_warning', (el) => el.textContent))
      .equals('Anyone who has this seed phrase can steal your funds!')
    await page.click('#i_have_privacy_button')
    await page.waitForSelector('#password', { visible: true })
    await page.type('#password', password)
    await page.click('#checkbox')
    await page.waitForSelector('#continue_button_to_see_seed_phrase:not([disabled])')
    await page.click('#continue_button_to_see_seed_phrase')
    await page.waitForSelector('#i_saved_the_seed:not([disabled])', { visible: true })

    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('#seed_word_mouse_hover'))
      return elements.map(element => {
        return element.innerText
      })
    })

    expect(result.length).equals(12)
    for (const word of result) {
      expect(word).not.equals(undefined)
      expect(word).not.equals(null)
    }

    await page.click('#i_saved_the_seed')
    await page.waitForTimeout(1000)
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
  })
  it('Backup seed test validate password wrong error message', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page, null)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select testnet
    await overviewPage.SelectNetwork(page)
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)

    // Click on Backup seed from Burger Icon menu
    await page.waitForSelector('#burger_icon_menu', { visible: true })
    await page.click('#burger_icon_menu')
    await page.waitForSelector('#backup_seed', { visible: true })
    await page.click('#backup_seed')
    console.log(chalk.green('User clicked on Backup Seed option'))
    await page.waitForSelector('#i_have_privacy_button', { visible: true })
    expect(await page.$eval('#show_seed_phrase', (el) => el.textContent)).equals('Show Seed Phrase?')
    expect(await page.$eval('#show_seed_phrase_warning', (el) => el.textContent))
      .equals('Anyone who has this seed phrase can steal your funds!')
    await page.click('#i_have_privacy_button')
    await page.waitForSelector('#password', { visible: true })
    await page.type('#password', 'testwallet00001')
    await page.click('#checkbox')
    await page.waitForSelector('#continue_button_to_see_seed_phrase:not([disabled])')
    await page.click('#continue_button_to_see_seed_phrase')
    await page.waitForSelector('#password_error', { visible: true })
    expect(await page.$eval('#password_error', (el) => el.textContent))
      .contains('Try Again. Enter the right password (it has 8 or more characters).')
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
    if (process.env.NODE_ENV === 'mainnet') {
      await overviewPage.SelectNetwork(page, 'mainnet')
    } else {
      await overviewPage.SelectNetwork(page)
    }
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // Clock on Lock
    await overviewPage.ClickLock(page)
    // Unlock
    await passwordPage.ClickUnlock(page, password)
  })
  it('Import wallet,lock wallet and while unlock wallet check password error-["mainnet"]', async () => {
    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    // Select network
    if (process.env.NODE_ENV === 'mainnet') {
      await overviewPage.SelectNetwork(page, 'mainnet')
    } else {
      await overviewPage.SelectNetwork(page)
    }
    // check Send & Swap & Receive options have been displayed
    await overviewPage.ValidateSendSwipeReceiveOptions(page)
    // Clock on Lock
    await overviewPage.ClickLock(page)
    // While Unlock enter wrong password
    await page.type('#password', 'wallettest01')
    await page.click('#unlock_button')
    // Check password error message
    await page.waitForSelector('#password_error', { visible: true })
    const error = await page.$eval('#password_error', (el) => el.textContent)
    expect(error).contains('Try Again. Enter the right password (it has 8 or more characters).')
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
    if (process.env.NODE_ENV === 'mainnet') {
      await overviewPage.SelectNetwork(page, 'mainnet')
    } else {
      await overviewPage.SelectNetwork(page)
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
