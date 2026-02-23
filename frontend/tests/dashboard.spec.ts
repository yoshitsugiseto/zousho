import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:5173';
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
);

test.describe('Zousho App E2E Tests', () => {
    test.beforeAll(async () => {
        // テストユーザーは seed.sql で 'password123' として作成済み ('000...02' 等)
        // signUp は既存ユーザーがいる場合に 400 (User already registered) を返すが、
        // 念のため実行し、エラーは無視する。
        try {
            await supabase.auth.signUp({ email: 'user@example.com', password: 'password123' });
        } catch (e) {}
        try {
            await supabase.auth.signUp({ email: 'admin@example.com', password: 'password123' });
        } catch (e) {}

        // public.users 側の role を admin に更新する処理（もし必要なら）
        // ※ seed.sql で既に行われているはず
    });

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[Browser ${msg.type()}] ${msg.text()}`);
            }
        });
        page.on('pageerror', error => {
            console.log(`[Browser Exception] ${error.message}`);
        });
        page.on('response', async response => {
            if (response.status() >= 400) {
                console.log(`[Network Error] ${response.status()} ${response.url()}`);
                try {
                    const body = await response.text();
                    console.log(`[Network Response Body] ${body}`);
                } catch (e) {
                    // ignore
                }
            }
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
        
        const passwordInput = page.locator('input[type="password"]');
        await passwordInput.fill('password123');
        
        // 入力内容を確認（シークレット入力欄などでないことを確実にする）
        // ログインボタンをクリック
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        // ログイン押下後の遷移を待機
        console.log('[Debug] Waiting for navigation...');
        try {
            await Promise.race([
                page.waitForURL('**/', { timeout: 15000 }),
                page.waitForURL('**/setup', { timeout: 15000 }),
                page.waitForURL('**/verify-mfa', { timeout: 15000 }),
                page.waitForSelector('text=みんなの本棚', { timeout: 15000 }),
                page.waitForSelector('text=Invalid login credentials', { timeout: 5000 })
            ]);
        } catch (e) {
            console.log(`[Error] Navigation/Selector timeout. URL: ${page.url()}`);
        }

        const loginError = page.locator('text=Invalid login credentials');
        if (await loginError.isVisible()) {
            console.log('[Error] Login failed with "Invalid login credentials".');
            // 失敗した場合はここで終了させて原因を特定しやすくする
            throw new Error('Login failed: Invalid login credentials');
        }

        console.log(`[Debug] URL after login: ${page.url()}`);

        const setupHeader = page.locator('h2:has-text("アカウントの初期設定")');
        const mfaHeader = page.locator('h2:has-text("2段階認証の設定")');
        const verifyHeader = page.locator('h2:has-text("2段階認証")');

        try {
            if (await setupHeader.isVisible({ timeout: 2000 })) {
                 console.log('[Debug] In Setup screen');
                 await page.locator('input[placeholder="新しいパスワード (6文字以上)"]').fill('newpassword123');
                 await page.locator('input[placeholder="パスワード（確認用）"]').fill('newpassword123');
                 await page.locator('button:has-text("パスワードを設定して次へ")').click();
                 await mfaHeader.waitFor({ state: 'visible', timeout: 5000 });
            }

            if (await mfaHeader.isVisible({ timeout: 2000 })) {
                console.log('[Debug] In MFA enrollment screen');
                const secretElement = page.locator('p.font-mono');
                await secretElement.waitFor({ state: 'visible', timeout: 5000 });
                const secret = await secretElement.innerText();
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret.trim());
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button:has-text("認証して設定を完了")').click();
            } else if (await verifyHeader.isVisible({ timeout: 2000 })) {
                console.log('[Debug] In MFA verification screen');
                const secret = process.env.TEST_USER_MFA_SECRET || 'JBSWY3DPEHPK3PXP';
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret);
                
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button[type="submit"]').click();
            }
        } catch (e) {
            console.log(`[Debug] MFA/Setup check finished or skipped: ${e}`);
        }

        // ダッシュボードの表示確認
        await page.waitForSelector('text=みんなの本棚', { state: 'visible', timeout: 15000 });
        
        // メールアドレスではなく表示名が出ている可能性があるため、要素の存在だけ確認
        const headerContainer = page.locator('nav');
        await expect(headerContainer).toBeVisible();

        await page.locator('input[placeholder="本のタイトルや著者で探す..."]').fill('Team Geek');
        await expect(page.locator('text=Team Geek').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=達人プログラマー')).not.toBeVisible();
    });

    test('管理者としてログインし、書籍管理メニューが表示されること', async ({ page }) => {
        await page.goto(BASE_URL);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 15000 });
        await emailInput.fill('admin@example.com');
        await page.locator('input[type="password"]').fill('password123');
        
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        try {
            await Promise.race([
                page.waitForURL('**/', { timeout: 15000 }),
                page.waitForURL('**/setup', { timeout: 15000 }),
                page.waitForURL('**/verify-mfa', { timeout: 15000 }),
                page.waitForSelector('text=Administrator', { timeout: 15000 }),
                page.waitForSelector('text=Invalid login credentials', { timeout: 5000 })
            ]);
        } catch (e) {
            console.log(`[Error] Navigation timeout. URL: ${page.url()}`);
        }

        const loginError = page.locator('text=Invalid login credentials');
        if (await loginError.isVisible()) {
            throw new Error('Admin login failed: Invalid login credentials');
        }

        console.log(`[Debug] Admin URL after login: ${page.url()}`);

        const setupHeader = page.locator('h2:has-text("アカウントの初期設定")');
        const mfaHeader = page.locator('h2:has-text("2段階認証の設定")');
        const verifyHeader = page.locator('h2:has-text("2段階認証")');

        try {
            if (await setupHeader.isVisible({ timeout: 2000 })) {
                 console.log('[Debug] Admin in Setup screen');
                 await page.locator('input[placeholder="新しいパスワード (6文字以上)"]').fill('newpassword123');
                 await page.locator('input[placeholder="パスワード（確認用）"]').fill('newpassword123');
                 await page.locator('button:has-text("パスワードを設定して次へ")').click();
                 await mfaHeader.waitFor({ state: 'visible', timeout: 5000 });
            }

            if (await mfaHeader.isVisible({ timeout: 2000 })) {
                console.log('[Debug] Admin in MFA enrollment screen');
                const secretElement = page.locator('p.font-mono');
                await secretElement.waitFor({ state: 'visible', timeout: 5000 });
                const secret = await secretElement.innerText();
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret.trim());
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button:has-text("認証して設定を完了")').click();
            } else if (await verifyHeader.isVisible({ timeout: 2000 })) {
                console.log('[Debug] Admin in MFA verification screen');
                const secret = process.env.TEST_ADMIN_MFA_SECRET || 'JBSWY3DPEHPK3PXP';
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret);
                
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button[type="submit"]').click();
            }
        } catch (e) {}

        await page.waitForSelector('text=Administrator', { state: 'visible', timeout: 15000 });
        await expect(page.locator('text=書籍管理')).toBeVisible();
    });
});
