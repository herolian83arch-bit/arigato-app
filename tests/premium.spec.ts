import { test, expect } from '@playwright/test';

test.describe('Premium Features Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Audio APIをモック
    await page.addInitScript(() => {
      // オーディオ再生回数をカウント
      (window as any).__AUDIO_PLAY_COUNT = 0;
      
      // HTMLMediaElement.prototype.playをモック
      Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
        configurable: true,
        value: function() { 
          (window as any).__AUDIO_PLAY_COUNT++; 
          console.log('🎵 Mock audio play called');
          return Promise.resolve(); 
        }
      });
    });
  });

  test('should verify premium features on verification page', async ({ page }) => {
    console.log('🚀 Starting premium features verification...');

    // 検証ページに遷移
    await page.goto('/verify.html');
    console.log('📱 Navigated to verification page');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded completely');

    // プレミアム状態が設定されているか確認
    const premiumIndicator = page.getByTestId('premium-indicator');
    await expect(premiumIndicator).toHaveAttribute('data-status', 'on');
    console.log('✅ Premium status verified');

    // お気に入り機能のテスト
    const favoriteBtn = page.getByTestId('star-toggle');
    
    // 初期状態はOFF
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'false');
    console.log('✅ Initial favorite state is OFF');

    // ONに切り替え
    await favoriteBtn.click();
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Favorite toggled to ON');

    // OFFに切り替え
    await favoriteBtn.click();
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'false');
    console.log('✅ Favorite toggled to OFF');

    // 再度ONに切り替え
    await favoriteBtn.click();
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Favorite toggled back to ON');

    // 音声機能のテスト
    const audioBtn = page.getByTestId('audio-button');
    await audioBtn.click();
    console.log('✅ Audio button clicked');

    // ログに音声クリックが記録されているか確認
    const logContent = await page.locator('#log').textContent();
    expect(logContent).toContain('audio:clicked');
    console.log('✅ Audio click logged');

    console.log('🎉 Premium features verification completed successfully!');
  });

  test('should maintain favorite state after page reload', async ({ page }) => {
    console.log('🔄 Testing favorite state persistence...');

    // 検証ページに遷移
    await page.goto('/verify.html');
    await page.waitForLoadState('networkidle');

    // お気に入りをONに設定
    const favoriteBtn = page.getByTestId('star-toggle');
    await favoriteBtn.click();
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');

    // localStorageの値を確認（favoriteTestキーを使用）
    const favoriteTest = await page.evaluate(() => {
      return localStorage.getItem('favoriteTest');
    });
    expect(favoriteTest).toBe('1');
    console.log('✅ Favorite saved to localStorage');

    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // お気に入り状態が保持されているか確認
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Favorite state maintained after reload');
  });

  test('should handle audio API correctly', async ({ page }) => {
    console.log('🔊 Testing audio API functionality...');

    // 検証ページに遷移
    await page.goto('/verify.html');
    await page.waitForLoadState('networkidle');

    // 音声ボタンをクリック
    const audioBtn = page.getByTestId('audio-button');
    await audioBtn.click();

    // ログに音声クリックが記録されているか確認
    await expect(page.locator('#log')).toContainText('audio:clicked');
    console.log('✅ Audio API test passed');

    // 複数回クリックしても問題ないかテスト
    await audioBtn.click();
    await audioBtn.click();
    await expect(page.locator('#log')).toContainText('audio:clicked');
    console.log('✅ Multiple audio clicks handled correctly');

    // オーディオ再生回数を確認
    const playCount = await page.evaluate(() => {
      return (window as any).__AUDIO_PLAY_COUNT || 0;
    });
    expect(playCount).toBeGreaterThan(0);
    console.log(`✅ Audio play called ${playCount} times`);
  });
});
