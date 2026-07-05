import { expect, test, type APIRequestContext } from '@playwright/test';

const API_BASE_URL = 'http://127.0.0.1:3000';
const E2E_FOLDER_PREFIX = 'e2e-folder-';

const cleanupE2eFolders = async (request: APIRequestContext) => {
  const response = await request.get(`${API_BASE_URL}/items`);
  const items = await response.json();
  const e2eFolders = items.filter(
    (item: { id: number; name: string; type: string }) =>
      item.type === 'folder' && item.name.startsWith(E2E_FOLDER_PREFIX),
  );

  await Promise.all(e2eFolders.map((folder: { id: number }) => request.delete(`${API_BASE_URL}/items/${folder.id}`)));
};

test.beforeEach(async ({ request }) => {
  await cleanupE2eFolders(request);
});

test.afterEach(async ({ request }) => {
  await cleanupE2eFolders(request);
});

test('creates, finds, and deletes a file in a nested folder', async ({ page }) => {
  const suffix = Date.now();
  const folderName = `${E2E_FOLDER_PREFIX}${suffix}`;
  const fileName = `e2e-file-${suffix}.txt`;

  await page.goto('/');

  await page.getByRole('button', { name: 'New Folder' }).click();
  await page.getByRole('textbox', { name: 'Folder name' }).fill(folderName);
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText(folderName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: folderName, exact: true }).click();
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(folderName);

  await page.getByRole('button', { name: 'New File' }).click();
  await page.getByRole('textbox', { name: 'File name' }).fill(fileName);
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText(fileName, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'All files' }).click();
  await page.getByRole('textbox', { name: 'Search by exact name' }).fill(fileName);
  await page.getByRole('textbox', { name: 'Search by exact name' }).press('Enter');

  await expect(page.getByRole('heading', { name: `Search results for "${fileName}"` })).toBeVisible();
  await expect(page.getByText('Searching all files from CloudStorage')).toBeVisible();
  await expect(page.getByText(fileName, { exact: true })).toBeVisible();
  await expect(page.getByText(`CloudStorage > ${folderName}`)).toBeVisible();

  await page.getByRole('textbox', { name: 'Search by exact name' }).fill('');
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(folderName);
  await expect(page.getByText('Searching all files from CloudStorage')).toBeHidden();
  await expect(page.getByText('Showing 1 items')).toBeVisible();

  await page.getByRole('button', { name: `Delete ${fileName}` }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Delete item' });
  await expect(deleteDialog).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(deleteDialog).toBeHidden();
  await expect(page.getByRole('button', { name: `Delete ${fileName}` })).toBeHidden();

  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page.getByRole('heading', { name: 'All Files' })).toBeVisible();

  await page.getByRole('button', { name: `Delete ${folderName}` }).click();
  await expect(deleteDialog).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(deleteDialog).toBeHidden();
  await expect(page.getByRole('button', { name: `Delete ${folderName}` })).toBeHidden();
});
