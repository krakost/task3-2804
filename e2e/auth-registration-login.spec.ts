import { expect, test } from '@playwright/test'

const LOCALE_KEY = 'preferred-locale'

test.describe('Auth: sign up then sign in', () => {
  test('registers, logs in, creates board, column, and task', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `kanban.e2e.${stamp}@example.com`
    const password = 'KanbanE2e_9mK!'

    const boardTitle = `Orion sprint ${stamp.slice(-8)}`
    const columnTitle = 'In progress'
    const taskTitle = 'Implement dashboard widgets'
    const taskDescription =
      'Add charts for velocity and burndown; stub data from fixtures.'

    await page.addInitScript((key) => {
      localStorage.setItem(key, 'en')
    }, LOCALE_KEY)

    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/boards')
    await expect(
      page.locator('header').getByRole('button', { name: 'Sign up' }),
    ).toBeVisible({ timeout: 30_000 })

    await page.locator('header').getByRole('button', { name: 'Sign up' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill(password)
    await page.locator('#signup-confirm').fill(password)

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign up' })
      .click()

    const headerEmail = page.locator('header').getByText(email, { exact: true })
    const confirmBanner = page.getByRole('status')

    await Promise.race([
      headerEmail.waitFor({ state: 'visible', timeout: 60_000 }),
      confirmBanner.waitFor({ state: 'visible', timeout: 60_000 }),
    ])

    if (await confirmBanner.isVisible()) {
      test.skip(
        true,
        'Supabase returned no session (likely “Confirm email” is enabled). For local E2E, turn off email confirmation in Supabase Auth settings or confirm the address.',
      )
    }

    await expect(headerEmail).toBeVisible()

    await page.locator('header').getByRole('button', { name: 'Sign out' }).click()
    await expect(
      page.locator('header').getByRole('button', { name: 'Sign in' }),
    ).toBeVisible()

    await page.locator('header').getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(password)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign in' })
      .click()

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 })
    await expect(headerEmail).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Create board' }).click()
    await expect(
      page.getByRole('dialog', { name: 'Create board' }),
    ).toBeVisible()
    await page.locator('#create-board-title').fill(boardTitle)
    await page
      .getByRole('dialog', { name: 'Create board' })
      .getByRole('button', { name: 'Create' })
      .click()

    await expect(page).toHaveURL(/\/board\/[a-f0-9-]+$/i, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: boardTitle, level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Add column' }).click()
    await expect(
      page.getByRole('dialog', { name: 'New column' }),
    ).toBeVisible()
    await page.locator('#column-title').fill(columnTitle)
    await page
      .getByRole('dialog', { name: 'New column' })
      .getByRole('button', { name: 'Create' })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 })

    await expect(
      page.getByRole('heading', { name: columnTitle, level: 2 }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Create card' }).click()
    await expect(page.getByRole('dialog', { name: 'New card' })).toBeVisible()
    await page.locator('#task-card-title').fill(taskTitle)
    await page.locator('#task-card-description').fill(taskDescription)
    await page
      .getByRole('dialog', { name: 'New card' })
      .getByRole('button', { name: 'Create card' })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 })

    await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible()
    await expect(
      page.getByText(taskDescription, { exact: false }).first(),
    ).toBeVisible()
  })
})
