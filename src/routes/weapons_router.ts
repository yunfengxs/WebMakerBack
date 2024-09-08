
import express, { Request, Response } from 'express';
import pool from '../../src/db';

const router = express.Router();

// 创建类型保护函数
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// 创建weapons（C）
router.post('/', async (req: Request, res: Response) => {
  const { name, quality, attack_power, special_effects, description, image_url, wear_type, can_be_destroyed, attribute_bonus, durability, level_requirement } = req.body;

  let values = [req.body.name, req.body.quality, req.body.attack_power, req.body.special_effects, req.body.description, req.body.image_url, req.body.wear_type, req.body.can_be_destroyed, req.body.attribute_bonus, req.body.durability, req.body.level_requirement];

  let query = `INSERT INTO weapons (name, quality, attack_power, special_effects, description, image_url, wear_type, can_be_destroyed, attribute_bonus, durability, level_requirement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(query, values);
    res.status(201).json({
      id: (result as any).insertId,
      name, quality, attack_power, special_effects, description, image_url, wear_type, can_be_destroyed, attribute_bonus, durability, level_requirement,
    });
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取所有weapons（R）
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM weapons');
    res.json(rows);
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取单个weapons（R）
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM weapons WHERE id = ?', [id]);
    if ((rows as any[]).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.status(404).json({ message: 'weapons not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 更新weapons（U）
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, quality, attack_power, special_effects, description, image_url, wear_type, can_be_destroyed, attribute_bonus, durability, level_requirement } = req.body;

  let values = [req.body.name, req.body.quality, req.body.attack_power, req.body.special_effects, req.body.description, req.body.image_url, req.body.wear_type, req.body.can_be_destroyed, req.body.attribute_bonus, req.body.durability, req.body.level_requirement, id];

  let query = `UPDATE weapons SET name = ?, quality = ?, attack_power = ?, special_effects = ?, description = ?, image_url = ?, wear_type = ?, can_be_destroyed = ?, attribute_bonus = ?, durability = ?, level_requirement = ? WHERE id = ?`;

  try {
    const [result] = await pool.query(query, values);
    if ((result as any).affectedRows > 0) {
      res.json({ id, name, quality, attack_power, special_effects, description, image_url, wear_type, can_be_destroyed, attribute_bonus, durability, level_requirement });
    } else {
      res.status(404).json({ message: 'weapons not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 删除weapons（D）
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM weapons WHERE id = ?', [id]);
    if ((result as any).affectedRows > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'weapons not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

export default router;
