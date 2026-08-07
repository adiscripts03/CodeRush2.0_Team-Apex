import axios from 'axios';
import { env } from '../config/env.js';
import Hospital from '../models/Hospital.js';
import Shelter from '../models/Shelter.js';
import RoadSegment from '../models/RoadSegment.js';
import Resource from '../models/Resource.js';
import ResponseAction from '../models/ResponseAction.js';

const PROMPT_TEMPLATE = `
You are an expert AI Disaster Response Coordinator. We are currently managing the 2018 Kerala Floods.

CURRENT SITUATION:
- Flood Area: {floodArea} hectares
- Hospitals At Risk/Affected: {hospitals}
- Available Shelters: {shelters}
- Roads Submerged: {roads}
- Available Resources: {resources}
- Affected Population Estimate: {population}
- Weather Forecast: {weather}
- River Levels: {riverLevels}

TASK:
Based on this data, generate an emergency response action plan. Focus on evacuation, resource allocation, and medical dispatch.

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no conversational text, no backticks.
The JSON must perfectly match this structure:
{
  "priority": "low | medium | high | critical",
  "reason": "Brief explanation of why this action is needed",
  "peopleAffected": number,
  "recommendedShelter": "Name of shelter or N/A",
  "medicalTeams": number,
  "boats": number,
  "vehicles": number,
  "estimatedTime": "Estimated time to complete (e.g., '2 hours')",
  "humanApprovalRequired": boolean
}
`;

export const generateAIPlan = async () => {
  try {
    // 1. Collect Context Data
    const [hospitals, shelters, roads, resources] = await Promise.all([
      Hospital.countDocuments({ status: { $in: ['at-risk', 'evacuating', 'closed'] } }),
      Shelter.countDocuments({ status: 'active' }),
      RoadSegment.countDocuments({ status: 'submerged' }),
      Resource.countDocuments({ status: 'available' })
    ]);

    // Simulated macro-data (in a real system, this comes from live simulation feeds)
    const floodArea = 45000;
    const population = 500000;
    const weather = "Severe Storm, 210mm rainfall expected";
    const riverLevels = "Pamba: 8.5m (Overflowing), Kakki: 6.8m (Red Alert)";

    // 2. Build the Prompt
    let prompt = PROMPT_TEMPLATE
      .replace('{floodArea}', floodArea)
      .replace('{hospitals}', hospitals)
      .replace('{shelters}', shelters)
      .replace('{roads}', roads)
      .replace('{resources}', resources)
      .replace('{population}', population)
      .replace('{weather}', weather)
      .replace('{riverLevels}', riverLevels);

    // 3. Call AI Model
    let aiResponseJson = null;

    if (env.openaiApiKey && env.openaiApiKey !== 'your_openai_api_key_here') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview', // or gpt-3.5-turbo
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${env.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const content = response.data.choices[0].message.content;
      aiResponseJson = JSON.parse(content);
    } else {
      // Fallback if no API key is provided
      console.warn("⚠️ No valid OpenAI API key found. Using simulated AI response.");
      aiResponseJson = {
        priority: "critical",
        reason: "Pamba river overflowing causing immediate threat to Upper Kuttanad settlements.",
        peopleAffected: 2500,
        recommendedShelter: "Alappuzha Community Hall",
        medicalTeams: 4,
        boats: 12,
        vehicles: 5,
        estimatedTime: "3 hours",
        humanApprovalRequired: true
      };
    }

    // 4. Store Recommendation in MongoDB
    const responseAction = new ResponseAction({
      title: `AI Dispatch: ${aiResponseJson.reason.substring(0, 50)}...`,
      description: aiResponseJson.reason,
      type: 'evacuation', // Defaulting to evacuation for this simulation
      priority: aiResponseJson.priority,
      status: 'pending', // Always pending for human review
      notes: JSON.stringify(aiResponseJson)
    });

    await responseAction.save();

    // Broadcast the new plan via Socket.IO
    import('../sockets/socketManager.js').then(({ emitNewResponsePlan }) => {
      emitNewResponsePlan(responseAction);
    });

    return {
      success: true,
      plan: aiResponseJson,
      dbRecord: responseAction
    };

  } catch (error) {
    console.error("AI Planner Error:", error);
    throw new Error(`Failed to generate AI plan: ${error.message}`);
  }
};
