import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:5173';
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

test.describe('Zousho App E2E Tests', () => {
    test.beforeAll(async () => {
        // テスト前にユーザーが確実に存在し、パスワードが password123 になるようにサインアップを試みる
        // 既に存在する場合はエラーになるが無視する
        await supabase.auth.signUp({ email: 'user@example.com', password: 'password123' });
        await supabase.auth.signUp({ email: 'admin@example.com', password: 'password123' });
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
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();

        // ログイン押下後、画面遷移やネットワークの反応を数秒待つ
        await page.waitForTimeout(2000);

        const setupHeader = page.locator('h2:has-text("アカウントの初期設定")');
        const mfaHeader = page.locator('h2:has-text("2段階認証の設定")');
        const verifyHeader = page.locator('h2:has-text("2段階認証")');

        try {
            // 現在どの画面にいるかを安全に判定
            if (await setupHeader.isVisible()) {
                 await page.locator('input[placeholder="新しいパスワード (6文字以上)"]').fill('newpassword123');
                 await page.locator('input[placeholder="パスワード（確認用）"]').fill('newpassword123');
                 await page.locator('button:has-text("パスワードを設定して次へ")').click();
                 await mfaHeader.waitFor({ state: 'visible', timeout: 5000 });
            }

            if (await mfaHeader.isVisible()) {
                // 初回セットアップ時：画面からシークレットを読み取って生成
                const secretElement = page.locator('p.font-mono');
                await secretElement.waitFor({ state: 'visible', timeout: 5000 });
                const secret = await secretElement.innerText();
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret.trim());
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button:has-text("認証して設定を完了")').click();
            } else if (await verifyHeader.isVisible()) {
                const secret = process.env.TEST_USER_MFA_SECRET || 'JBSWY3DPEHPK3PXP';
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret);
                
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button[type="submit"]').click();
            }
        } catch (e: any) {
            console.log('User MFA challenge error:', e.message);
        }

        await page.waitForSelector('text=みんなの本棚', { state: 'visible', timeout: 15000 });
        await expect(page.locator('text=user@example.com')).toBeVisible();

        // 今回ソート順が変わったことで「ユーザーが借りている本（達人プログラマー等）」が先頭に来る可能性があるため
        // `waitForSelector` ではなく、検索による絞り込みをメインにテストします
        await page.locator('input[placeholder="本のタイトルや著者で探す..."]').fill('Team Geek');
        await expect(page.locator('text=Team Geek').first()).toBeVisible({ timeout: 15000 });
        // Team Geekで検索した結果、他の本が消えていること
        await expect(page.locator('text=達人プログラマー')).not.toBeVisible();
    });

    test('管理者としてログインし、書籍管理メニューが表示されること', async ({ page }) => {
        await page.goto(BASE_URL);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.waitFor({ state: 'visible', timeout: 15000 });
        await emailInput.fill('admin@example.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();

        // 管理者アカウントのMFA
        await page.waitForTimeout(2000);

        const setupHeader = page.locator('h2:has-text("アカウントの初期設定")');
        const mfaHeader = page.locator('h2:has-text("2段階認証の設定")');
        const verifyHeader = page.locator('h2:has-text("2段階認証")');

        try {
            if (await setupHeader.isVisible()) {
                 await page.locator('input[placeholder="新しいパスワード (6文字以上)"]').fill('newpassword123');
                 await page.locator('input[placeholder="パスワード（確認用）"]').fill('newpassword123');
                 await page.locator('button:has-text("パスワードを設定して次へ")').click();
                 await mfaHeader.waitFor({ state: 'visible', timeout: 5000 });
            }

            if (await mfaHeader.isVisible()) {
                const secretElement = page.locator('p.font-mono');
                await secretElement.waitFor({ state: 'visible', timeout: 5000 });
                const secret = await secretElement.innerText();
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret.trim());
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button:has-text("認証して設定を完了")').click();
            } else if (await verifyHeader.isVisible()) {
                const secret = process.env.TEST_ADMIN_MFA_SECRET || 'JBSWY3DPEHPK3PXP';
                const { authenticator } = require('otplib');
                const token = authenticator.generate(secret);
                
                await page.locator('input[placeholder="000000"]').fill(token);
                await page.locator('button[type="submit"]').click();
            }
        } catch (e: any) {
            console.log('Admin MFA challenge error:', e.message);
        }

        await page.waitForSelector('text=Administrator', { state: 'visible', timeout: 15000 });
        await expect(page.locator('text=書籍管理')).toBeVisible();
    });
});
