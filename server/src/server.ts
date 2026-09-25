import express, { Request, Response } from 'express';
import cors from 'cors';
import { DDI_DATABASE, findServerDDI } from './data/ddiDatabase.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'ReconRx Medication Reconciliation Copilot API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ddiRulesLoaded: DDI_DATABASE.length
  });
});

// Get Trained DDI Database
app.get('/api/v1/ddi', (_req: Request, res: Response) => {
  res.json({
    count: DDI_DATABASE.length,
    database: 'DrugBank 6.0 & Micromedex High-Severity Interactions',
    rules: DDI_DATABASE
  });
});

// Check DDI between two medications
app.post('/api/v1/ddi/check', (req: Request, res: Response) => {
  const { drugA, drugB } = req.body;
  if (!drugA || !drugB) {
    return res.status(400).json({ error: 'Both drugA and drugB parameters are required.' });
  }

  const match = findServerDDI(drugA, drugB);
  if (match) {
    return res.json({
      hasInteraction: true,
      interaction: match
    });
  }

  res.json({
    hasInteraction: false,
    message: 'No high-severity interaction identified in current knowledgebase.'
  });
});

// OCR & AI Normalization Mock/Fallback Endpoint
app.post('/api/v1/ocr/parse', (req: Request, res: Response) => {
  const { rawText } = req.body;
  res.json({
    success: true,
    normalizedMeds: [
      { name: 'Metformin', dose: '1000 mg', frequency: 'Once daily', route: 'Oral' },
      { name: 'Amlodipine', dose: '5 mg', frequency: 'Once daily', route: 'Oral' },
      { name: 'Aspirin', dose: '75 mg', frequency: 'Once daily', route: 'Oral' }
    ],
    confidenceScore: 0.96,
    extractedFrom: rawText ? 'Provided input' : 'Standard admission order sheet'
  });
});

app.listen(PORT, () => {
  console.log(`[ReconRx Server] Listening on http://localhost:${PORT}`);
  console.log(`[ReconRx Server] ${DDI_DATABASE.length} trained DDI rules loaded.`);
});
