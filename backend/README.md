# Disaster Command - Backend

The backend system powering the Disaster Command AI. This Node.js/Express service integrates with MongoDB, Socket.IO, and AI providers (OpenAI/Gemini) to manage disaster response simulations, primarily modeled after the 2018 Kerala Floods.

## Tech Stack
- **Node.js & Express.js**: REST API Framework
- **MongoDB & Mongoose**: Geospatial database modeling
- **Socket.IO**: Real-time event broadcasting
- **Nodemailer**: Transactional alert delivery
- **Axios**: AI provider communication

## Module Overview

1. **Simulation Engine**: Serves chronological JSON frames containing weather, river, and satellite data. Includes advanced behaviors like Missing Data Simulation.
2. **Dashboard**: Aggregates macro statistics (affected population, flooded areas, pending approvals).
3. **Hydro Feed**: Normalizes IoT sensor data (dam levels, river gauges) to determine active danger levels.
4. **AI Response Planner**: Extracts live database context and queries Large Language Models to generate structured JSON mitigation plans.
5. **Approval Engine**: Provides human-in-the-loop oversight for AI decisions. Automatically generates immutable `AuditLogs`.
6. **Alert Centre**: Safely dispatches transactional emails to emergency contacts, enforcing strict human approval protocols.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/disaster_command
   OPENAI_API_KEY=your_openai_api_key
   SMTP_HOST=smtp.yourprovider.com
   SMTP_USER=test
   SMTP_PASS=pass
   ```

3. **Start the Server**:
   ```bash
   # Development (Nodemon)
   npm run dev

   # Production
   npm start
   ```

## API Testing
Refer to `API_DOCS.md` for endpoint details, or import `Disaster_Command.postman_collection.json` into Postman to instantly test all routes.
