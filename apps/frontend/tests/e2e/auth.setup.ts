/**
 * Auth Setup - Session E2E deterministe
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { loginUser, TEST_USER } from './utils/auth';

const authFile = path.join(__dirname, '../../.playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await loginUser(page, TEST_USER);
  await page.context().storageState({ path: authFile });
});
