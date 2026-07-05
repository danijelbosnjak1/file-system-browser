const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const app = require('../src/app');
const sequelize = require('../src/common/database');

let server;
let baseUrl;

const request = async (method, path, body) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
};

const postFolder = (name, parentId) => request('POST', '/folders', { name, parentId });
const postFile = (name, parentId) => request('POST', '/files', { name, parentId });

test.before(async () => {
  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.beforeEach(async () => {
  await sequelize.sync({ force: true });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await sequelize.close();
});

test('lists root folder contents', async () => {
  const emptyList = await request('GET', '/items');
  assert.equal(emptyList.status, 200);
  assert.deepEqual(emptyList.body, []);

  const folder = await postFolder('Documents');
  assert.equal(folder.status, 201);

  const rootItems = await request('GET', '/items');
  assert.equal(rootItems.status, 200);
  assert.equal(rootItems.body.length, 1);
  assert.equal(rootItems.body[0].name, 'Documents');
  assert.equal(rootItems.body[0].type, 'folder');
});

test('creates files and nested folders', async () => {
  const documents = await postFolder('Documents');
  const work = await postFolder('Work', documents.body.id);
  const file = await postFile('cv.pdf', work.body.id);

  assert.equal(documents.status, 201);
  assert.equal(work.status, 201);
  assert.equal(file.status, 201);

  const workItems = await request('GET', `/items?parentId=${work.body.id}`);

  assert.equal(workItems.status, 200);
  assert.equal(workItems.body.length, 1);
  assert.equal(workItems.body[0].name, 'cv.pdf');
  assert.equal(workItems.body[0].type, 'file');
});

test('rejects duplicate names in the same folder', async () => {
  const folder = await postFolder('Documents');
  const firstFile = await postFile('report.txt', folder.body.id);
  const duplicateFile = await postFile('report.txt', folder.body.id);

  assert.equal(firstFile.status, 201);
  assert.equal(duplicateFile.status, 409);
});

test('rejects blank names and invalid parent ids', async () => {
  const blankFolder = await postFolder('   ');
  const blankFile = await postFile('');
  const invalidParentList = await request('GET', '/items?parentId=abc');
  const invalidParentFolder = await request('POST', '/folders', {
    name: 'Documents',
    parentId: 'abc',
  });
  const invalidParentFile = await request('POST', '/files', {
    name: 'notes.txt',
    parentId: 'abc',
  });

  assert.equal(blankFolder.status, 400);
  assert.equal(blankFolder.body.message, 'Folder name is required');
  assert.equal(blankFile.status, 400);
  assert.equal(blankFile.body.message, 'File name is required');
  assert.equal(invalidParentList.status, 400);
  assert.equal(invalidParentList.body.message, 'parentId must be a valid number');
  assert.equal(invalidParentFolder.status, 400);
  assert.equal(invalidParentFolder.body.message, 'parentId must be a valid number');
  assert.equal(invalidParentFile.status, 400);
  assert.equal(invalidParentFile.body.message, 'parentId must be a valid number');
});

test('allows the same name in different folders', async () => {
  const personal = await postFolder('Personal');
  const work = await postFolder('Work');

  const personalFile = await postFile('report.txt', personal.body.id);
  const workFile = await postFile('report.txt', work.body.id);

  assert.equal(personalFile.status, 201);
  assert.equal(workFile.status, 201);
});

test('rejects creating children inside files', async () => {
  const file = await postFile('notes.txt');

  const childFolder = await postFolder('Invalid Child', file.body.id);
  const childFile = await postFile('child.txt', file.body.id);

  assert.equal(childFolder.status, 400);
  assert.equal(childFile.status, 400);
});

test('searches files by exact name in a parent folder', async () => {
  const personal = await postFolder('Personal');
  const work = await postFolder('Work');

  await postFile('report.txt', personal.body.id);
  await postFile('report.txt', work.body.id);
  await postFile('report-draft.txt', personal.body.id);

  const search = await request(
    'GET',
    `/search?query=REPORT.txt&scope=parent&parentId=${personal.body.id}`
  );

  assert.equal(search.status, 200);
  assert.equal(search.body.length, 1);
  assert.equal(search.body[0].name, 'report.txt');
  assert.equal(search.body[0].parentId, personal.body.id);
  assert.deepEqual(search.body[0].path, [{ id: personal.body.id, name: 'Personal' }]);
});

test('searches files by exact name across all files', async () => {
  const personal = await postFolder('Personal');
  const work = await postFolder('Work');

  await postFile('report.txt', personal.body.id);
  await postFile('report.txt', work.body.id);

  const search = await request('GET', '/search?query=report.txt&scope=all');

  assert.equal(search.status, 200);
  assert.equal(search.body.length, 2);
  assert.deepEqual(
    search.body.map((item) => item.path.map((pathItem) => pathItem.name)).sort(),
    [['Personal'], ['Work']]
  );
});

test('returns top 10 file suggestions that start with a prefix', async () => {
  await postFolder('rep-folder');
  await postFile('final-report.txt');

  for (let index = 0; index < 12; index += 1) {
    await postFile(`rep-${String(index).padStart(2, '0')}.txt`);
  }

  const suggestions = await request('GET', '/suggestions?prefix=rep&scope=all&limit=50');

  assert.equal(suggestions.status, 200);
  assert.equal(suggestions.body.length, 10);
  assert.ok(suggestions.body.every((item) => item.type === 'file'));
  assert.ok(suggestions.body.every((item) => item.name.startsWith('rep')));
  assert.ok(suggestions.body.every((item) => Array.isArray(item.path)));
});

test('deletes files', async () => {
  const file = await postFile('notes.txt');

  const deleted = await request('DELETE', `/items/${file.body.id}`);
  const rootItems = await request('GET', '/items');

  assert.equal(deleted.status, 200);
  assert.deepEqual(rootItems.body, []);
});

test('deletes folders recursively', async () => {
  const documents = await postFolder('Documents');
  const work = await postFolder('Work', documents.body.id);
  await postFile('cv.pdf', work.body.id);

  const deleted = await request('DELETE', `/items/${documents.body.id}`);
  const globalSearch = await request('GET', '/search?query=cv.pdf&scope=all');

  assert.equal(deleted.status, 200);
  assert.deepEqual(globalSearch.body, []);
});
