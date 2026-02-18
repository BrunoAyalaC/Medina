import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET Productos (en desarrollo)' });
});

router.post('/', (req, res) => {
  res.json({ message: 'POST Productos (en desarrollo)' });
});

export default router;
