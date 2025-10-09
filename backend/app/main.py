# backend/app/main.py
# Purpose: Define the FastAPI app, load data on startup, and provide API endpoints for data inspection.
# Imports From: None
# Exported To: ./bootstrap.py
from __future__ import annotations

import datetime
import json
import logging
import logging.config
import os
import sys
import traceback
from typing import Any, List, Optional

import numpy as np
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---- Paths -------------------------------------------------------------------
LOG_DIR = os.getenv("LOG_DIR", "/logs")
BACKEND_ERROR_FILE = os.path.join(LOG_DIR, "backend-error.log")
FRONTEND_ERROR_FILE = os.path.join(LOG_DIR, "frontend-error.log")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


# ---- Data Loading ------------------------------------------------------------
DATASETS: dict[str, pd.DataFrame] = {}

DATA_DEFINITIONS = {
    "fullasmt25": {
        "file_name": "fullasmt25.txt",
        "colspecs": [
            (0, 1), (1, 2), (2, 3), (3, 6), (6, 9), (9, 13), (13, 18), (18, 22),
            (22, 26), (26, 39), (39, 52), (52, 65), (65, 78),
        ],
        "names": [
            "DIVISION_TMK", "ZONE_TMK", "SECTION_TMK", "PLAT_TMK", "PARCEL_TMK",
            "CPR_TMK", "PARCEL_YEAR", "LAND_CLASS", "TAX_RATE_CLASS",
            "ASSESSED_LAND_VALUE", "LAND_EXEMPTION", "ASSESSED_BUILDING_VALUE",
            "BUILDING_EXEMPTION",
        ],
    },
    "fulllegal25": {
        "file_name": "fulllegal25.txt",
        "colspecs": [
            (0, 1), (1, 2), (2, 3), (3, 6), (6, 9), (9, 13), (13, 18), (18, 32),
            (32, 43), (43, 223),
        ],
        "names": [
            "DIVISION_TMK", "ZONE_TMK", "SECTION_TMK", "PLAT_TMK", "PARCEL_TMK",
            "CPR_TMK", "TAX_YEAR", "ACRES", "SQFT", "LEGAL_DESCRIPTION",
        ],
    },
    "fulllndarclass25": {
        "file_name": "fulllndarclass25.txt",
        "colspecs": [
            (0, 1), (1, 2), (2, 3), (3, 6), (6, 9), (9, 13), (13, 17), (17, 18),
            (18, 23), (23, 35), (35, 40),
        ],
        "names": [
            "DIVISION_TMK", "ZONE_TMK", "SECTION_TMK", "PLAT_TMK", "PARCEL_TMK",
            "CPR_TMK", "LAND_CLASS", "MULTIPLE_CLASS_FLAG", "PARCEL_YEAR",
            "LAND_AREA_PER_CLASS", "LAND_LINE",
        ],
    },
    "fullownr25": {
        "file_name": "fullownr25.txt",
        "colspecs": [
            (0, 1), (1, 2), (2, 3), (3, 6), (6, 9), (9, 13), (13, 53), (53, 93),
            (93, 214), (214, 294), (294, 386), (386, 426), (426, 428),
            (428, 433), (433, 437), (437, 467),
        ],
        "names": [
            "DIVISION_TMK", "ZONE_TMK", "SECTION_TMK", "PLAT_TMK", "PARCEL_TMK",
            "CPR_TMK", "OWNER", "OWNER_TYPE", "CO_MAILING_ADDRESS",
            "MAILING_STREET_ADDRESS", "MAILING_CITY_STATE_ZIP",
            "MAILING_CITY_NAME", "MAILING_STATE", "MAILING_ZIP1", "MAILING_ZIP2",
            "COUNTRY",
        ],
    },
    "fullpardat25": {
        "file_name": "fullpardat25.txt",
        "colspecs": [
            (0, 1), (1, 2), (2, 3), (3, 6), (6, 9), (9, 13), (13, 18), (18, 19),
            (19, 21), (21, 31), (31, 37), (37, 39), (39, 69), (69, 77),
            (77, 87), (87, 98), (98, 115), (115, 123),
        ],
        "names": [
            "DIVISION_TMK", "ZONE_TMK", "SECTION_TMK", "PLAT_TMK", "PARCEL_TMK",
            "CPR_TMK", "PARCEL_YEAR", "MULTIPLE_CLASS_FLAG", "STREET_NUMBER_PRE",
            "STREET_NUMBER", "ADDITIONAL_STREET_NUMBER", "STREET_DIRECTION",
            "STREET", "STREET_NAME_SUFFIX", "UNIT_DESCRIPTION", "UNIT",
            "PARCEL_ACRES", "NEIGHBORHOOD_CODE",
        ],
    },
}

def load_data_on_startup():
    """Load fixed-width text files into pandas DataFrames."""
    logger = logging.getLogger(__name__)
    logger.info("Starting data loading process...")
    for name, definition in DATA_DEFINITIONS.items():
        file_path = os.path.join(DATA_DIR, definition["file_name"])
        try:
            df = pd.read_fwf(
                file_path,
                colspecs=definition["colspecs"],
                names=definition["names"],
                encoding="latin1",
                header=None,
            )
            DATASETS[name] = df
            logger.info("Successfully loaded %s", file_path)
        except FileNotFoundError:
            logger.error("Data file not found: %s", file_path)
        except Exception as e:
            logger.error("Failed to load data from %s: %s", file_path, e)
    logger.info("Data loading complete.")


# ---- Logging Setup ------------------------------------------------------------
def _ensure_log_dir() -> None:
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
    except Exception:
        pass


def _rotating_file_handler_dict(filename: str, level: str) -> dict[str, Any]:
    return {
        "class": "logging.handlers.RotatingFileHandler",
        "level": level,
        "filename": filename,
        "maxBytes": 5_242_880,
        "backupCount": 5,
        "encoding": "utf-8",
        "formatter": "default",
    }


def configure_logging() -> None:
    _ensure_log_dir()

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            }
        },
        "handlers": {
            "backend_file": _rotating_file_handler_dict(BACKEND_ERROR_FILE, "ERROR"),
            "frontend_file": _rotating_file_handler_dict(FRONTEND_ERROR_FILE, "ERROR"),
        },
        "loggers": {
            "uvicorn": {
                "level": "ERROR",
                "handlers": ["backend_file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "ERROR",
                "handlers": ["backend_file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "ERROR",
                "handlers": ["backend_file"],
                "propagate": False,
            },
            "fastapi": {
                "level": "ERROR",
                "handlers": ["backend_file"],
                "propagate": False,
            },
            "frontend.client": {
                "level": "ERROR",
                "handlers": ["frontend_file"],
                "propagate": False,
            },
        },
        "root": {"level": "ERROR", "handlers": ["backend_file"]},
    }

    # Avoid duplicated handlers in reload scenarios.
    for name in (
        "",
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "fastapi",
        "frontend.client",
    ):
        logger = logging.getLogger(name)
        logger.handlers.clear()

    logging.config.dictConfig(config)

    # Ensure log files exist so they can be tailed immediately.
    try:
        for f in (BACKEND_ERROR_FILE, FRONTEND_ERROR_FILE):
            if not os.path.exists(f):
                with open(f, "a", encoding="utf-8"):
                    pass
    except Exception:
        pass

    def _excepthook(exc_type, exc, tb):
        logger = logging.getLogger("uvicorn.error")
        logger.error(
            "Uncaught exception\n%s",
            "".join(traceback.format_exception(exc_type, exc, tb)),
        )

    sys.excepthook = _excepthook  # type: ignore[assignment]


configure_logging()

# ---- Tax Calculation Data and Models -----------------------------------------

TAX_CLASS_MAPPING = {
    0: "TIME SHARE",
    1: "NON-OWNER-OCCUPIED",
    2: "APARTMENT",
    3: "COMMERCIAL",
    4: "INDUSTRIAL",
    5: "AGRICULTURAL",
    6: "CONSERVATION",
    7: "HOTEL / RESORT",
    9: "OWNER-OCCUPIED",
    10: "COMMERCIALIZED RESIDENTIAL",
    11: "TVR-STRH",
    12: "LONG TERM RENTAL",
}

# FY 2025 Rates from Final Budget Handout
DEFAULT_POLICY = {
    "TIME SHARE": {
        "code": 0,
        "rate": 14.60,
        "tiers": []
    },
    "NON-OWNER-OCCUPIED": {
        "code": 1,
        "rate": None,
        "tiers": [
            {"up_to": 1000000, "rate": 5.87},
            {"up_to": 3000000, "rate": 8.50},
            {"up_to": None, "rate": 14.00},
        ]
    },
    "COMMERCIALIZED RESIDENTIAL": {
        "code": 10,
        "rate": None,
        "tiers": [
            {"up_to": 1000000, "rate": 4.00},
            {"up_to": 3000000, "rate": 5.00},
            {"up_to": None, "rate": 8.00},
        ]
    },
    "TVR-STRH": {
        "code": 11,
        "rate": None,
        "tiers": [
            {"up_to": 1000000, "rate": 12.50},
            {"up_to": 3000000, "rate": 13.50},
            {"up_to": None, "rate": 15.00},
        ]
    },
    "LONG TERM RENTAL": {
        "code": 12,
        "rate": None,
        "tiers": [
            {"up_to": 1300000, "rate": 3.00},
            {"up_to": 3000000, "rate": 5.00},
            {"up_to": None, "rate": 8.00},
        ]
    },
    "APARTMENT": {
        "code": 2,
        "rate": 3.50,
        "tiers": []
    },
    "COMMERCIAL": {
        "code": 3,
        "rate": 6.05,
        "tiers": []
    },
    "INDUSTRIAL": {
        "code": 4,
        "rate": 7.05,
        "tiers": []
    },
    "AGRICULTURAL": {
        "code": 5,
        "rate": 5.74,
        "tiers": []
    },
    "CONSERVATION": {
        "code": 6,
        "rate": 6.43,
        "tiers": []
    },
    "HOTEL / RESORT": {
        "code": 7,
        "rate": 11.75,
        "tiers": []
    },
    "OWNER-OCCUPIED": {
        "code": 9,
        "rate": None,
        "tiers": [
            {"up_to": 1300000, "rate": 1.80},
            {"up_to": 4500000, "rate": 2.00},
            {"up_to": None, "rate": 3.25},
        ]
    }
}

class Tier(BaseModel):
    up_to: Optional[int]
    rate: float

class TaxClassPolicy(BaseModel):
    code: int
    rate: Optional[float]
    tiers: List[Tier]

class RevenueResult(BaseModel):
    certified_value: float
    certified_revenue: float
    parcel_count: int

class ForecastResponse(BaseModel):
    results_by_class: dict[str, RevenueResult]
    totals: RevenueResult


# ---- FastAPI App --------------------------------------------------------------
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    load_data_on_startup()

# ---- Exception Logging Middleware (ASGI) --------------------------------------
class ExceptionLoggingMiddleware:
    # Purpose: Capture any unhandled exceptions during request handling and log them with path and client IP.
    # Imports From: None
    # Exported To: FastAPI app via add_middleware
    def __init__(self, app: FastAPI):
        self.app = app
        self.logger = logging.getLogger("uvicorn.error")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        try:
            return await self.app(scope, receive, send)
        except Exception:
            path = scope.get("path")
            client = scope.get("client")
            client_ip = (
                client[0] if isinstance(client, (tuple, list)) and client else None
            )
            self.logger.exception(
                "Unhandled exception | path=%s | ip=%s", path, client_ip
            )
            raise


# Register logging middleware first so it wraps the entire stack.
app.add_middleware(ExceptionLoggingMiddleware)

# CORS should come after logging so CORS errors are captured too.
origins = [
    "http://localhost",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Endpoints ----------------------------------------------------------------
@app.get("/api/dataframes")
def list_dataframes() -> list[str]:
    """Returns a list of available dataframe names."""
    return list(DATASETS.keys())


@app.get("/api/dataframes/{name}")
def get_dataframe_head(name: str) -> Any:
    """Returns the first 10 rows of a specified dataframe."""
    if name not in DATASETS:
        raise HTTPException(status_code=404, detail="Dataframe not found")
    df = DATASETS[name]
    # Convert to JSON, handling potential NaN values which are not valid JSON
    df_head = df.head(10).replace({np.nan: None})
    result_json = df_head.to_json(orient="records")
    return json.loads(result_json)


@app.get("/api/policy/default")
def get_default_policy() -> dict[str, Any]:
    """Returns the default tax policy based on FY 2025 rates."""
    return DEFAULT_POLICY


@app.post("/api/revenue-forecast", response_model=ForecastResponse)
def calculate_revenue_forecast(policy: dict[str, TaxClassPolicy]) -> Any:
    """Calculates a revenue forecast based on the provided tax policy."""
    try:
        if "fullasmt25" not in DATASETS:
            raise HTTPException(status_code=503, detail="Assessment data not loaded.")

        df = DATASETS["fullasmt25"].copy()

        # Exclude disaster-affected parcels (Land Value = 0 AND Building Value = 0)
        df = df[(df["ASSESSED_LAND_VALUE"] > 0) | (df["ASSESSED_BUILDING_VALUE"] > 0)]

        # Data prep: Calculate net taxable value
        df["total_assessed_value"] = df["ASSESSED_LAND_VALUE"] + df["ASSESSED_BUILDING_VALUE"]
        df["total_exemption"] = df["LAND_EXEMPTION"] + df["BUILDING_EXEMPTION"]
        df["net_taxable_value"] = df["total_assessed_value"] - df["total_exemption"]
        # Ensure net taxable value is not negative
        df["net_taxable_value"] = df["net_taxable_value"].clip(lower=0)
        
        df["tax"] = 0.0

        for class_name, class_policy in policy.items():
            class_code = class_policy.code
            mask = df["TAX_RATE_CLASS"] == class_code

            if not mask.any():
                continue

            # Use net_taxable_value for calculation
            values = df.loc[mask, "net_taxable_value"]

            if class_policy.tiers:
                # Tiered calculation
                tier_tax = pd.Series(0.0, index=values.index)
                lower_bound = 0
                for tier in class_policy.tiers:
                    rate = tier.rate / 1000.0
                    upper_bound = tier.up_to if tier.up_to is not None else float('inf')

                    # Value within this tier's range
                    tier_value = np.minimum(np.maximum(0, values - lower_bound), upper_bound - lower_bound)
                    tier_tax += tier_value * rate

                    lower_bound = upper_bound
                    if lower_bound == float('inf'):
                        break
                df.loc[mask, "tax"] = tier_tax
            elif class_policy.rate is not None:
                # Flat rate calculation
                rate = class_policy.rate / 1000.0
                df.loc[mask, "tax"] = values * rate

        # Aggregate results
        results = {}
        grouped = df.groupby("TAX_RATE_CLASS")

        for class_code, group_df in grouped:
            class_name = TAX_CLASS_MAPPING.get(class_code)
            if not class_name or class_name not in policy:
                continue

            results[class_name] = {
                "certified_value": group_df["net_taxable_value"].sum(),
                "certified_revenue": group_df["tax"].sum(),
                "parcel_count": len(group_df),
            }

        # Calculate totals
        total_value = sum(r["certified_value"] for r in results.values())
        total_revenue = sum(r["certified_revenue"] for r in results.values())
        total_parcels = sum(r["parcel_count"] for r in results.values())

        return {
            "results_by_class": results,
            "totals": {
                "certified_value": total_value,
                "certified_revenue": total_revenue,
                "parcel_count": total_parcels,
            }
        }
    except Exception as e:
        logging.getLogger("fastapi").error("Revenue calculation failed: %s", e)
        raise HTTPException(status_code=500, detail="An error occurred during revenue calculation.")


@app.get("/api/hello")
def read_root() -> dict[str, Any]:
    return {
        "message": "Hello from the FastAPI & Docker Coming in Hot and fresh and tasty today!!!",
        "timestamp": datetime.datetime.now().isoformat(),
    }


@app.get("/api/external-data")
def get_external_data() -> dict[str, Any]:
    try:
        response = requests.get("https://jsonplaceholder.typicode.com/todos/1", timeout=5)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        # Log the error and return a user-friendly message
        logging.getLogger("fastapi").error("Failed to fetch external data: %s", e)
        return {"error": "Failed to fetch data from external service."}


# ---- Frontend Error Intake ----------------------------------------------------
class FrontendErrorPayload(BaseModel):
    message: str
    stack: str | None = None
    source: str | None = None
    line: int | None = None
    col: int | None = None
    href: str | None = None
    userAgent: str | None = None


@app.post("/api/logs/frontend")
def log_frontend_error(
    payload: FrontendErrorPayload, request: Request
) -> dict[str, str]:
    client_ip = request.client.host if request.client else None
    logger = logging.getLogger("frontend.client")
    logger.error(
        "FrontendError | ip=%s | message=%s | source=%s | line=%s | col=%s | href=%s | userAgent=%s | stack=%s",
        client_ip,
        payload.message,
        payload.source,
        payload.line,
        payload.col,
        payload.href,
        payload.userAgent,
        payload.stack,
    )
    return {"status": "ok"}

