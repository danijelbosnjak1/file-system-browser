const router = require('express').Router();
const fileSystemController = require('../controllers/fileSystemController');

router.get('/items', fileSystemController.listItems);
router.post('/folders', fileSystemController.createFolder);
router.post('/files', fileSystemController.createFile);
router.delete('/items/:id', fileSystemController.deleteItem);
router.get('/search', fileSystemController.searchFiles);
router.get('/suggestions', fileSystemController.suggestFiles);

module.exports = router;
