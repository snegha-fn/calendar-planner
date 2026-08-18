# -*- coding:utf-8 -*-

"""
Calendar Planner API

Run:
    uvicorn server:app --reload
"""
from fastapi.staticfiles import StaticFiles
import os
import configparser
from typing import List

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request

from pydantic import BaseModel

from dotenv import load_dotenv

from google import genai
from google.genai import types

import database_handler
import method


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Calendar Planner API",
    description="Calendar Planner with AI scheduling assistant",
    version="2.0"
)

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# ============================================================
# TEMPLATES
# ============================================================

templates = Jinja2Templates(
    directory="templates"
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

config = configparser.ConfigParser()

config.read("db.conf")

info = config["DEFAULT"]


dbh = database_handler.DatabaseHandler(
    db_name=info["db_name"],
    check_same_thread=False
)


m = method.Method(
    conf_file="db.conf"
)


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)


gemini_client = None


if GEMINI_API_KEY:

    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )


# ============================================================
# SCHEDULE MODEL
# ============================================================

class Schedule(BaseModel):

    sid: str

    name: str

    content: str

    category: str

    level: int

    status: float

    creation_time: str

    start_time: str

    end_time: str


# ============================================================
# AI MODELS
# ============================================================

class AIPlanRequest(BaseModel):

    prompt: str


class AISession(BaseModel):

    title: str

    description: str

    date: str

    start_time: str

    end_time: str

    category: str

    level: int


class AIPlanResponse(BaseModel):

    summary: str

    sessions: List[AISession]


# ============================================================
# HOME PAGE
# ============================================================



# ============================================================
# CALENDAR PAGE
# ============================================================

@app.get("/", response_class=HTMLResponse)
def index(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="calendar.html",
        context={}
    )


@app.get("/calendar", response_class=HTMLResponse)
def calendar_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="calendar.html",
        context={}
    )

# ============================================================
# GET ALL SCHEDULES
# ============================================================

@app.get("/schedules")
def get_schedules():

    return dbh.fetch_all(
        table_name=info["table_name"]
    )


# ============================================================
# GET ONE SCHEDULE
# ============================================================

@app.get(
    "/schedules/{schedule_id}"
)
def get_schedule(
    schedule_id: str
):

    return m.get(
        dbh,
        schedule_id
    )


# ============================================================
# CREATE SCHEDULE
# ============================================================

@app.post("/schedules")
def create_schedule(
    schedule: Schedule
):

    if m.post(
        dbh,
        schedule
    ):

        return schedule

    else:

        return {
            "errno": "1"
        }


# ============================================================
# UPDATE SCHEDULE
# ============================================================

@app.put(
    "/schedules/{schedule_id}"
)
def update_schedule(
    schedule_id: str,
    schedule: Schedule
):

    if m.update(
        dbh,
        schedule_id,
        schedule
    ):

        return schedule

    else:

        return {
            "errno": "2"
        }


# ============================================================
# DELETE SCHEDULE
# ============================================================

@app.delete(
    "/schedules/{schedule_id}"
)
def delete_schedule(
    schedule_id: str
):

    if m.delete(
        dbh,
        schedule_id
    ):

        return {
            "msg": "success"
        }

    else:

        return {
            "errno": "3"
        }


# ============================================================
# AI PLANNER
# ============================================================

@app.post(
    "/ai/plan",
    response_model=AIPlanResponse
)
def generate_ai_plan(
    request: AIPlanRequest
):

    # --------------------------------------------------------
    # Check API key
    # --------------------------------------------------------

    if gemini_client is None:

        from fastapi import HTTPException

        raise HTTPException(
            status_code=500,
            detail=(
                "GEMINI_API_KEY is not configured. "
                "Create a .env file and add "
                "GEMINI_API_KEY=your_key"
            )
        )


    # --------------------------------------------------------
    # Validate user prompt
    # --------------------------------------------------------

    if not request.prompt.strip():

        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail="Please provide a planning request."
        )


    # --------------------------------------------------------
    # AI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are an intelligent calendar scheduling assistant.

Your job is to turn a user's natural-language goal
into a realistic calendar plan.

USER REQUEST:

{request.prompt}


IMPORTANT RULES:

1. Break large goals into smaller sessions.

2. Respect deadlines mentioned by the user.

3. Never schedule anything in the past.

4. Do not create impossible schedules.

5. Leave reasonable breaks between long sessions.

6. Prefer 1-3 hour sessions.

7. If the user says they are available only at
   specific times, respect those times.

8. Use category:
   - Study
   - Work
   - Personal
   - Other

9. Priority:
   1 = Low
   2 = Medium
   3 = High

10. For exam preparation, distribute chapters
    across available days instead of putting
    everything on one day.

11. Return valid structured data only.

12. Dates must use:
    YYYY-MM-DD

13. Times must use:
    HH:MM

Create a concise summary explaining the plan.
"""


    # --------------------------------------------------------
    # GEMINI REQUEST
    # --------------------------------------------------------

    try:

        response = gemini_client.models.generate_content(

            model="gemini-2.5-flash",

            contents=prompt,

            config=types.GenerateContentConfig(

                response_mime_type="application/json",

                response_schema=
                    AIPlanResponse.model_json_schema()
            )
        )


    except Exception as error:

        from fastapi import HTTPException

        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {str(error)}"
        )


       # --------------------------------------------------------
    # PARSE RESPONSE
    # --------------------------------------------------------

    try:

        result = AIPlanResponse.model_validate_json(
            response.text
        )

        return result

    except Exception as error:

        from fastapi import HTTPException

        raise HTTPException(
            status_code=500,
            detail=(
                "AI returned an invalid plan: "
                f"{str(error)}"
            )
        )