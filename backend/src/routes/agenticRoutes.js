import express from 'express';
import { env } from '../config/env.js';

const router = express.Router();

// Groq API base URL (OpenAI-compatible interface)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Using llama-3.1-8b-instant — fast and free on Groq
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * POST /api/agentic-plan
 * Receives current situational context (hospitals, shelters, roads)
 * and returns a reasoned evacuation plan with natural-language justifications.
 * Uses Groq API (GROQ_API_KEY in backend/.env) for LLM reasoning.
 * Falls back to a mocked reasoning trace if the key is missing or the call fails.
 */
router.post('/', async (req, res) => {
  const { atRiskHospitals, atRiskShelters, safeShelters } = req.body;

  try {
    // --- Groq LLM path ---
    if (env.groqApiKey) {
      const hospitalList = Array.isArray(atRiskHospitals)
        ? atRiskHospitals.map(h => h.name).join(', ')
        : 'None';
      const shelterList = Array.isArray(atRiskShelters)
        ? atRiskShelters.map(s => s.name).join(', ')
        : 'None';
      const safeCount = Array.isArray(safeShelters) ? safeShelters.length : 0;
      const safeNames = Array.isArray(safeShelters)
        ? safeShelters.map(s => s.name).join(', ')
        : 'None';

      const systemPrompt = 'You are a Disaster Response AI assistant for the Kerala Flood Emergency Command System. '
        + 'Generate concise, prioritized evacuation plans. Always respond with valid JSON only.';

      const userPrompt = 'Current flood emergency situation:\n'
        + '- At-risk hospitals requiring evacuation: ' + hospitalList + '\n'
        + '- At-risk shelters requiring relocation: ' + shelterList + '\n'
        + '- Safe shelters available (' + safeCount + '): ' + safeNames + '\n\n'
        + 'Generate a prioritized plan. For each facility assign the best safe shelter, '
        + 'considering capacity, road accessibility, and medical urgency.\n\n'
        + 'Respond ONLY with this JSON structure:\n'
        + '{"plans": [{"priority": "CRITICAL|HIGH|MEDIUM|LOW", "type": "Medical Evacuation|Shelter Transfer", '
        + '"title": "string", "description": "string", "sourceLocation": "string", '
        + '"targetShelterName": "string", "estimatedPatients": number, "reasoning": "string"}]}';

      try {
        const groqRes = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + env.groqApiKey
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1024
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const rawContent = data.choices[0].message.content.trim();

          // Strip markdown code fences if Groq wraps the JSON in ```json ... ```
          const jsonText = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          const parsed = JSON.parse(jsonText);

          const formattedPlans = parsed.plans.map((p, i) => ({
            ...p,
            id: 'agentic-groq-' + i + '-' + Date.now(),
            timestamp: new Date().toISOString(),
            distanceKm: parseFloat((Math.random() * 8 + 1).toFixed(1)),
            allocatedCapacity: 150,
            routePolyline: [[9.5, 76.3], [9.6, 76.4]]
          }));

          console.log('[Agentic] Groq LLM plan generated:', formattedPlans.length, 'recommendations');
          return res.json({ success: true, source: 'llm', plans: formattedPlans });
        } else {
          const errText = await groqRes.text();
          console.error('[Agentic] Groq API error:', groqRes.status, errText);
        }
      } catch (llmErr) {
        console.error('[Agentic] Groq call failed, falling back to mock:', llmErr.message);
      }
    } else {
      console.warn('[Agentic] No GROQ_API_KEY found — using mocked reasoning trace.');
    }

    // --- FALLBACK: Mocked Agentic Reasoning Trace ---
    // Used when no valid GROQ_API_KEY is configured or the LLM call fails.
    const mockedPlans = [];

    if (Array.isArray(atRiskHospitals)) {
      atRiskHospitals.forEach((hosp, idx) => {
        const name = (hosp.properties && (hosp.properties.name || hosp.properties['name:en']))
          || ('Hospital Zone #' + (idx + 1));
        const targetShelter = Array.isArray(safeShelters) && safeShelters.length > 0
          ? safeShelters[idx % safeShelters.length]
          : null;
        const target = (targetShelter && targetShelter.name) || 'Regional Safe Hub';

        mockedPlans.push({
          id: 'mock-agentic-hosp-' + idx + '-' + Date.now(),
          priority: idx === 0 ? 'CRITICAL' : 'HIGH',
          type: 'Medical Evacuation',
          title: 'Evacuate ' + name,
          description: 'Transfer vulnerable patients and staff from ' + name + ' to ' + target + '.',
          sourceLocation: name,
          targetShelterName: target,
          estimatedPatients: 45,
          distanceKm: 4.2,
          allocatedCapacity: 200,
          routePolyline: [[9.5, 76.3], [9.6, 76.4]],
          timestamp: new Date().toISOString(),
          reasoning: 'Constraint Analysis: ' + target + ' selected due to accessible northern corridor (4.2km). '
            + 'Southern routes are flooded. Medical priority requires immediate dispatch before water rises further. '
            + 'Shelter has sufficient remaining capacity for ' + name + ' patient load.'
        });
      });
    }

    if (Array.isArray(atRiskShelters)) {
      atRiskShelters.slice(0, 2).forEach((shelter, idx) => {
        const name = shelter.name || ('At-Risk Shelter #' + (idx + 1));
        const targetShelter = Array.isArray(safeShelters) && safeShelters.length > 0
          ? safeShelters[(idx + 2) % safeShelters.length]
          : null;
        const target = (targetShelter && targetShelter.name) || 'Secondary Hub';

        mockedPlans.push({
          id: 'mock-agentic-shelter-' + idx + '-' + Date.now(),
          priority: 'MEDIUM',
          type: 'Shelter Transfer',
          title: 'Relocate ' + name,
          description: 'Relocate evacuees from ' + name + ' to ' + target + '.',
          sourceLocation: name,
          targetShelterName: target,
          estimatedPatients: 80,
          distanceKm: 7.1,
          allocatedCapacity: 150,
          routePolyline: [[9.5, 76.3], [9.6, 76.4]],
          timestamp: new Date().toISOString(),
          reasoning: 'Capacity Check: ' + name + ' is inside the active flood polygon. '
            + target + ' is further (7.1km) but is the only hub with 80+ beds remaining. '
            + 'Relocating via the northern evacuation corridor as primary road network is passable.'
        });
      });
    }

    console.log('[Agentic] Mock plan generated:', mockedPlans.length, 'recommendations');
    return res.json({ success: true, source: 'mock', plans: mockedPlans });

  } catch (err) {
    console.error('[Agentic] Unexpected error:', err);
    res.status(500).json({ success: false, error: 'Agentic planning failed.' });
  }
});

export default router;
