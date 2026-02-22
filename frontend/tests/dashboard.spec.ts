import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Zousho App E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[Browser ${msg.type()}] ${msg.text()}`);
            }
        });
        page.on('pageerror', error => {
            console.log(`[Browser Exception] ${error.message}`);
        });
    });

    test('ログイン画面が表示されること', async ({ page }) => {
        await page.goto(BASE_URL);

        await expect(page.locator('h2')).toContainText('蔵書管理システム', { timeout: 15000 });
        await expect(page.locator('p')).toContainText('アカウントにログイン');
    });

    test('一般ユーザーとしてログインし、ダッシュボードで本を借りられること', async ({ page }) => {
        await page.goto(BASE_URL);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 15000 });
        await emailInput.fill('user@example.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();

        await page.waitForSelector('text=みんなの本棚', { state: 'visible', timeout: 15000 });
        await expect(page.locator('text=user@example.com')).toBeVisible();

        await page.waitForSelector('text=達人プログラマー', { state: 'visible', timeout: 15000 });

        await page.locator('input[placeholder="本のタイトルや著者で探す..."]').fill('Team Geek');
        await expect(page.locator('text=Team Geek')).toBeVisible();
        await expect(page.locator('text=達人プログラマー')).not.toBeVisible();
    });

    test('管理者としてログインし、書籍管理メニューが表示されること', async ({ page }) => {
        await page.goto(BASE_URL);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 15000 });
        await emailInput.fill('admin@example.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();

        await page.waitForSelector('text=Administrator', { state: 'visible', timeout: 15000 });
        await expect(page.locator('text=書籍管理')).toBeVisible();
    });
});
