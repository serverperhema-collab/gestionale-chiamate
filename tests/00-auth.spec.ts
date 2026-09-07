import { test, expect } from '@playwright/test';

test.describe('Blocco 0 - Auth & Infrastructure (Pilot)', () => {
  
  test.beforeEach(async () => {
    // Note: The global seed should have already created 'test_admin' with 'admin123'.
    // If we wanted scenario-specific seeding, we could call an exec command here.
  });

  test('Login TL, verifica dashboard, verifica /api/user/status, e logout', async ({ page }) => {
    
    // 1. Azione: Login dalla UI
    await page.goto('/login');
    await page.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // 2. Verifica UI: atterraggio sulla dashboard corretta e visibilità elementi
    // Aspettiamo che il navigatore vada alla dashboard TL.
    await page.waitForURL('/tl-dashboard');
    await expect(page).toHaveURL(/.*tl-dashboard/);
    
    // Asserzione: Verifica che esista un elemento UI tipico del TL (es. titolo)
    await expect(page.locator('h1').filter({ hasText: /TL Control Center/i })).toBeVisible();

    // 3. Verifica API (stato risultante / sessione)
    // Usiamo page.request che eredita automaticamente i cookie della sessione UI
    const sessionCookie = await page.context().cookies();
    expect(sessionCookie.find(c => c.name.includes('next-auth.session-token'))).toBeDefined();

    const response = await page.request.get('/api/user/status');
    expect(response.status()).toBe(200);
    
    const statusData = await response.json();
    expect(statusData).toHaveProperty('forceLogout', false);

    // 4. Azione: Logout
    // Assuming there's a logout button, maybe in a sidebar or header
    // If not immediately visible, we can simulate the API call or look for the text
    // Let's look for a button with text "Esci" o "Logout"
    const logoutButton = page.locator('button').filter({ hasText: /Esci|Logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // 5. Verifica stato risultante dopo logout
    await page.waitForURL('**/login*');
    await expect(page).toHaveURL(/.*login/);
    
    // API Check post-logout
    const postLogoutResponse = await page.request.get('/api/user/status');
    expect(postLogoutResponse.status()).toBe(401);
    const postLogoutData = await postLogoutResponse.json();
    expect(postLogoutData).toHaveProperty('forceLogout', true);
  });
});
