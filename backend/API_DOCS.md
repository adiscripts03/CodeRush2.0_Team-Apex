# Disaster Command - API Documentation

Base URL: `http://localhost:<PORT>/api`

---

## 1. System Health
### Check Backend Status
- **URL**: `/health`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Disaster Command Backend is running seamlessly.",
    "timestamp": "2026-08-07T10:00:00.000Z"
  }
  ```

---

## 2. Dashboard
### Get Aggregated Dashboard Stats
- **URL**: `/dashboard`
- **Method**: `GET`
- **Description**: Returns live counts of affected infrastructure and response metrics.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "floodArea": 45000,
      "populationAffected": 500000,
      "roadsSubmerged": 120,
      "hospitals": 5,
      "shelters": 12,
      "pendingApprovals": 3,
      "alerts": 15
    }
  }
  ```

---

## 3. Simulation / Replay Engine
### Load Simulation Frame
- **URL**: `/replay/frame/:id`
- **Method**: `GET`
- **Description**: Loads the specified frame data for the timeline scrubber. Automatically triggers a Socket.IO broadcast. Frame 3 includes a Missing Data Simulation.
- **Parameters**: `id` (Frame number 0-4)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "timestamp": "2018-08-16T08:00:00Z",
      "rainfall": 300,
      "riverLevel": 8.5,
      ...
    }
  }
  ```

---

## 4. Hydro Feed
### Get Live Hydro Sensor Feed
- **URL**: `/hydro`
- **Method**: `GET`
- **Description**: Retrieves formatted hydro station statuses and danger levels.
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "stationName": "Pamba Dam Level",
        "river": "Ranni / Pathanamthitta",
        "waterLevel": 98.4,
        "dangerLevel": 2,
        "status": "Red Alert",
        "timestamp": "2026-08-07T10:00:00.000Z"
      }
    ]
  }
  ```

---

## 5. AI Response Planner
### Generate Emergency Plan
- **URL**: `/planner/generate`
- **Method**: `POST`
- **Description**: Collects macro context, builds a prompt, and calls OpenAI/Gemini to generate a strict JSON response plan. Saves the plan to the DB.
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "AI Response Plan generated successfully",
    "data": {
      "priority": "critical",
      "reason": "...",
      "peopleAffected": 2500,
      ...
    },
    "actionId": "64d0a1..."
  }
  ```

---

## 6. Approval Engine
### Get All Response Actions
- **URL**: `/actions`
- **Method**: `GET`
- **Response** (200 OK): Array of `ResponseAction` documents.

### Approve Action
- **URL**: `/actions/:id/approve`
- **Method**: `POST`
- **Body**: `{ "notes": "Optional approval notes" }`
- **Response** (200 OK): Updated Action.

### Reject Action
- **URL**: `/actions/:id/reject`
- **Method**: `POST`
- **Body**: `{ "notes": "Rejection reason" }`
- **Response** (200 OK): Updated Action.

### Edit Action
- **URL**: `/actions/:id/edit`
- **Method**: `PUT`
- **Body**: Any modifiable fields (e.g., `{ "priority": "high" }`)
- **Response** (200 OK): Updated Action.

*(All approval engine endpoints automatically generate AuditLogs and trigger Socket.IO broadcasts).*

---

## 7. Alert Centre
### Dispatch Alert
- **URL**: `/alerts/send`
- **Method**: `POST`
- **Description**: Sends an email via Nodemailer. Requires human approval.
- **Body Requirements**:
  ```json
  {
    "eventId": "...",
    "type": "email",
    "recipient": "demo@example.com",
    "subject": "Evacuation Warning",
    "message": "Please evacuate...",
    "humanApproved": true
  }
  ```
- **Response** (201 Created): Returns the saved `Alert` record.
- **Error** (403 Forbidden): If `humanApproved` is false.
