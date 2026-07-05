const { Op, col, fn, where: sequelizeWhere } = require('sequelize');
const sequelize = require('../common/database');
const defineFileSystemNode = require('../common/models/FileSystemNode');

const FileSystemNode = sequelize.models.fileSystemNode || defineFileSystemNode(sequelize);

const parseParentId = (rawParentId) => {
  if (rawParentId === undefined || rawParentId === null || rawParentId === '') {
    return null;
  }

  const parentId = Number(rawParentId);

  if (Number.isNaN(parentId)) {
    return undefined;
  }

  return parentId;
};

const validateParentFolder = async (parentId) => {
  if (parentId === null) {
    return null;
  }

  const parent = await FileSystemNode.findByPk(parentId);

  if (!parent) {
    return { status: 404, message: 'Parent folder not found' };
  }

  if (parent.type !== 'folder') {
    return { status: 400, message: 'Parent must be a folder' };
  }

  return null;
};

const deleteNodeAndChildren = async (id, transaction) => {
  const children = await FileSystemNode.findAll({
    where: { parentId: id },
    transaction,
  });

  for (const child of children) {
    await deleteNodeAndChildren(child.id, transaction);
  }

  await FileSystemNode.destroy({
    where: { id },
    transaction,
  });
};

const getParentPath = async (node) => {
  const path = [];
  let parentId = node.parentId;

  while (parentId !== null) {
    const parent = await FileSystemNode.findByPk(parentId);

    if (!parent) {
      break;
    }

    path.unshift({
      id: parent.id,
      name: parent.name,
    });
    parentId = parent.parentId;
  }

  return path;
};

const addParentPaths = async (files) =>
  Promise.all(
    files.map(async (file) => ({
      ...file.toJSON(),
      path: await getParentPath(file),
    })),
  );

const listItems = async (req, res) => {
  try {
    const parentId = parseParentId(req.query.parentId);

    if (parentId === undefined) {
      return res.status(400).json({ message: 'parentId must be a valid number' });
    }

    const items = await FileSystemNode.findAll({
      where: { parentId },
      order: [
        ['type', 'DESC'],
        ['name', 'ASC'],
      ],
    });

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving items',
      error: error.message,
    });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const parentId = parseParentId(req.body.parentId);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    if (parentId === undefined) {
      return res.status(400).json({ message: 'parentId must be a valid number' });
    }

    const parentError = await validateParentFolder(parentId);

    if (parentError) {
      return res.status(parentError.status).json({ message: parentError.message });
    }

    const existingItem = await FileSystemNode.findOne({
      where: {
        parentId,
        name: name.trim(),
      },
    });

    if (existingItem) {
      return res.status(409).json({
        message: 'A folder with that name already exists in this folder',
      });
    }

    const folder = await FileSystemNode.create({
      name: name.trim(),
      type: 'folder',
      parentId,
    });

    return res.status(201).json(folder);
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating folder',
      error: error.message,
    });
  }
};

const createFile = async (req, res) => {
  try {
    const { name } = req.body;
    const parentId = parseParentId(req.body.parentId);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'File name is required' });
    }

    if (parentId === undefined) {
      return res.status(400).json({ message: 'parentId must be a valid number' });
    }

    const parentError = await validateParentFolder(parentId);

    if (parentError) {
      return res.status(parentError.status).json({ message: parentError.message });
    }

    const existingItem = await FileSystemNode.findOne({
      where: {
        parentId,
        name: name.trim(),
      },
    });

    if (existingItem) {
      return res.status(409).json({
        message: 'A file with that name already exists in this folder',
      });
    }

    const file = await FileSystemNode.create({
      name: name.trim(),
      type: 'file',
      parentId,
    });

    return res.status(201).json(file);
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating file',
      error: error.message,
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Item id must be a valid number' });
    }

    const item = await FileSystemNode.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await sequelize.transaction(async (transaction) => {
      await deleteNodeAndChildren(id, transaction);
    });

    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error deleting item',
      error: error.message,
    });
  }
};

const searchFiles = async (req, res) => {
  try {
    const query = req.query.query ? req.query.query.trim() : '';
    const scope = req.query.scope || 'parent';
    const parentId = parseParentId(req.query.parentId);

    if (!query) {
      return res.status(200).json([]);
    }

    if (!['parent', 'all'].includes(scope)) {
      return res.status(400).json({ message: 'scope must be either parent or all' });
    }

    if (parentId === undefined) {
      return res.status(400).json({ message: 'parentId must be a valid number' });
    }

    const conditions = [
      { type: 'file' },
      sequelizeWhere(fn('lower', col('name')), query.toLowerCase()),
    ];

    if (scope === 'parent') {
      conditions.push({ parentId });
    }

    const files = await FileSystemNode.findAll({
      where: { [Op.and]: conditions },
      order: [['name', 'ASC']],
    });

    return res.status(200).json(await addParentPaths(files));
  } catch (error) {
    return res.status(500).json({
      message: 'Error searching files',
      error: error.message,
    });
  }
};

const suggestFiles = async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.trim() : '';
    const scope = req.query.scope || 'parent';
    const parentId = parseParentId(req.query.parentId);
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!prefix) {
      return res.status(200).json([]);
    }

    if (!['parent', 'all'].includes(scope)) {
      return res.status(400).json({ message: 'scope must be either parent or all' });
    }

    if (parentId === undefined) {
      return res.status(400).json({ message: 'parentId must be a valid number' });
    }

    if (Number.isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'limit must be a positive number' });
    }

    const conditions = [
      { type: 'file' },
      sequelizeWhere(fn('lower', col('name')), {
        [Op.like]: `${prefix.toLowerCase()}%`,
      }),
    ];

    if (scope === 'parent') {
      conditions.push({ parentId });
    }

    const files = await FileSystemNode.findAll({
      where: { [Op.and]: conditions },
      order: [['name', 'ASC']],
      limit: Math.min(limit, 10),
    });

    return res.status(200).json(await addParentPaths(files));
  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving suggestions',
      error: error.message,
    });
  }
};

module.exports = {
  listItems,
  createFolder,
  createFile,
  deleteItem,
  searchFiles,
  suggestFiles,
};
