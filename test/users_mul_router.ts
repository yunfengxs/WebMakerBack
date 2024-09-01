
import express, { Request, Response } from 'express';
import pool from '../db';

const router = express.Router();

// 创建类型保护函数
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// 创建users_mul（C）
router.post('/', async (req: Request, res: Response) => {
  const { name, email, age, status, created_at } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users_mul (name, email, age, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, email, age, status, created_at]
    );
    res.status(201).json({ id: (result as any).insertId, name, email, age, status, created_at });
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取所有users_mul（R）
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users_mul');
    res.json(rows);
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取单个users_mul（R）
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users_mul WHERE id = ?', [id]);
    if ((rows as any[]).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.status(404).json({ message: 'users_mul not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 更新users_mul（U）
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, age, status, created_at } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE users_mul SET name = ?, email = ?, age = ?, status = ?, created_at = ? WHERE id = ?',
      [name, email, age, status, created_at, id]
    );
    if ((result as any).affectedRows > 0) {
      res.json({ id, name, email, age, status, created_at });
    } else {
      res.status(404).json({ message: 'users_mul not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 删除users_mul（D）
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users_mul WHERE id = ?', [id]);
    if ((result as any).affectedRows > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'users_mul not found' });
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
