
import express, { Request, Response } from 'express';
import pool from '../db';

const router = express.Router();

// 创建类型保护函数
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// 创建father（C）
router.post('/', async (req: Request, res: Response) => {
  const { updated_at, execute_status, execute_result, converted_model_size, max_totalpss, max_sysmem, status } = req.body;

  let values = [req.body.updated_at, req.body.execute_status, req.body.execute_result, req.body.converted_model_size, req.body.max_totalpss, req.body.max_sysmem, req.body.status];

  let query = `INSERT INTO father (updated_at, execute_status, execute_result, converted_model_size, max_totalpss, max_sysmem, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(query, values);
    res.status(201).json({
      id: (result as any).insertId,
      updated_at, execute_status, execute_result, converted_model_size, max_totalpss, max_sysmem, status,
    });
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取所有father（R）
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM father');
    res.json(rows);
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 获取单个father（R）
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM father WHERE id = ?', [id]);
    if ((rows as any[]).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.status(404).json({ message: 'father not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 更新father（U）
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { updated_at, execute_status, execute_result, converted_model_size, max_totalpss, max_sysmem, status } = req.body;

  let values = [req.body.updated_at, req.body.execute_status, req.body.execute_result, req.body.converted_model_size, req.body.max_totalpss, req.body.max_sysmem, req.body.status, id];

  let query = `UPDATE father SET updated_at = ?, execute_status = ?, execute_result = ?, converted_model_size = ?, max_totalpss = ?, max_sysmem = ?, status = ? WHERE id = ?`;

  try {
    const [result] = await pool.query(query, values);
    if ((result as any).affectedRows > 0) {
      res.json({ id, updated_at, execute_status, execute_result, converted_model_size, max_totalpss, max_sysmem, status });
    } else {
      res.status(404).json({ message: 'father not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// 删除father（D）
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM father WHERE id = ?', [id]);
    if ((result as any).affectedRows > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'father not found' });
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
