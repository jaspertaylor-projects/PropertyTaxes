# backend/app/main.py
# Purpose: Define the FastAPI app, load data on startup, and provide API endpoints for data inspection and revenue forecasting.
# Imports From: ./bootstrap.py
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
APPEALS_DATA: dict[str, float] = {}

DATA_DEFINITIONS = {
    "fullasmt25": {
        "file_name": "fullasmt25.txt",
        "colspecs": [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 6),
            (6, 9),
            (9, 13),
            (13, 18),
            (18, 22),
            (22, 26),
            (26, 39),
            (39, 52),
            (52, 65),
            (65, 78),
        ],
        "names": [
            "DIVISION_TMK",
            "ZONE_TMK",
            "SECTION_TMK",
            "PLAT_TMK",
            "PARCEL_TMK",
            "CPR_TMK",
            "PARCEL_YEAR",
            "LAND_CLASS",
            "TAX_RATE_CLASS",
            "ASSESSED_LAND_VALUE",
            "LAND_EXEMPTION",
            "ASSESSED_BUILDING_VALUE",
            "BUILDING_EXEMPTION",
        ],
    },
    "fulllegal25": {
        "file_name": "fulllegal25.txt",
        "colspecs": [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 6),
            (6, 9),
            (9, 13),
            (13, 18),
            (18, 32),
            (32, 43),
            (43, 223),
        ],
        "names": [
            "DIVISION_TMK",
            "ZONE_TMK",
            "SECTION_TMK",
            "PLAT_TMK",
            "PARCEL_TMK",
            "CPR_TMK",
            "TAX_YEAR",
            "ACRES",
            "SQFT",
            "LEGAL_DESCRIPTION",
        ],
    },
    "fulllndarclass25": {
        "file_name": "fulllndarclass25.txt",
        "colspecs": [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 6),
            (6, 9),
            (9, 13),
            (13, 17),
            (17, 18),
            (18, 23),
            (23, 35),
            (35, 40),
        ],
        "names": [
            "DIVISION_TMK",
            "ZONE_TMK",
            "SECTION_TMK",
            "PLAT_TMK",
            "PARCEL_TMK",
            "CPR_TMK",
            "LAND_CLASS",
            "MULTIPLE_CLASS_FLAG",
            "PARCEL_YEAR",
            "LAND_AREA_PER_CLASS",
            "LAND_LINE",
        ],
    },
    # "fullownr25": {
    #     "file_name": "fulllownr25.txt",
    #     "colspecs": [
    #         (0, 1),
    #         (1, 2),
    #         (2, 3),
    #         (3, 6),
    #         (6, 9),
    #         (9, 13),
    #         (13, 53),
    #         (53, 93),
    #         (93, 214),
    #         (214, 294),
    #         (294, 386),
    #         (386, 426),
    #         (426, 428),
    #         (428, 433),
    #         (433, 437),
    #         (437, 467),
    #     ],
    #     "names": [
    #         "DIVISION_TMK",
    #         "ZONE_TMK",
    #         "SECTION_TMK",
    #         "PLAT_TMK",
    #         "PARCEL_TMK",
    #         "CPR_TMK",
    #         "OWNER",
    #         "OWNER_TYPE",
    #         "CO_MAILING_ADDRESS",
    #         "MAILING_STREET_ADDRESS",
    #         "MAILING_CITY_STATE_ZIP",
    #         "MAILING_CITY_NAME",
    #         "MAILING_STATE",
    #         "MAILING_ZIP1",
    #         "MAILING_ZIP2",
    #         "COUNTRY",
    #     ],
    # },
    "fullpardat25": {
        "file_name": "fullpardat25.txt",
        "colspecs": [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 6),
            (6, 9),
            (9, 13),
            (13, 18),
            (18, 19),
            (19, 21),
            (21, 31),
            (31, 37),
            (37, 39),
            (39, 69),
            (69, 77),
            (77, 87),
            (87, 98),
            (98, 115),
            (115, 123),
        ],
        "names": [
            "DIVISION_TMK",
            "ZONE_TMK",
            "SECTION_TMK",
            "PLAT_TMK",
            "PARCEL_TMK",
            "CPR_TMK",
            "PARCEL_YEAR",
            "MULTIPLE_CLASS_FLAG",
            "STREET_NUMBER_PRE",
            "STREET_NUMBER",
            "ADDITIONAL_STREET_NUMBER",
            "STREET_DIRECTION",
            "STREET",
            "STREET_NAME_SUFFIX",
            "UNIT_DESCRIPTION",
            "UNIT",
            "PARCEL_ACRES",
            "NEIGHBORHOOD_CODE",
        ],
    },
}


def load_data_on_startup():
    """Load fixed-width text files and CSVs into pandas DataFrames."""
    global APPEALS_DATA
    logger = logging.getLogger(__name__)
    logger.info("Starting data loading process...")

    # Load fixed-width files
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

    # Load appeals CSV
    try:
        appeals_path = os.path.join(DATA_DIR, "Appeals.csv")
        appeals_df = pd.read_csv(appeals_path)
        appeals_df.columns = appeals_df.columns.str.strip()
        appeals_df["TAX CLASS"] = appeals_df["TAX CLASS"].str.strip()
        appeals_df["APPEAL VALUE"] = (
            appeals_df["APPEAL VALUE"].replace({",": ""}, regex=True).astype(float)
        )
        APPEALS_DATA = appeals_df.set_index("TAX CLASS")["APPEAL VALUE"].to_dict()
        logger.info("Successfully loaded %s", appeals_path)
    except FileNotFoundError:
        logger.error("Data file not found: %s", appeals_path)
    except Exception as e:
        logger.error("Failed to load data from %s: %s", appeals_path, e)

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
                "datefmt": "\n%Y-%m-%dT%H:%M:%S%z",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
            "backend_file": _rotating_file_handler_dict(BACKEND_ERROR_FILE, "ERROR"),
            "frontend_file": _rotating_file_handler_dict(FRONTEND_ERROR_FILE, "ERROR"),
        },
        "loggers": {
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "backend_file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "backend_file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console", "backend_file"],
                "propagate": False,
            },
            "fastapi": {
                "level": "INFO",
                "handlers": ["console", "backend_file"],
                "propagate": False,
            },
            "frontend.client": {
                "level": "ERROR",
                "handlers": ["console", "frontend_file"],
                "propagate": False,
            },
        },
        "root": {"level": "INFO", "handlers": ["console", "backend_file"]},
    }

    for name in ("", "uvicorn", "uvicorn.error", "uvicorn.access", "fastapi", "frontend.client"):
        logger = logging.getLogger(name)
        logger.handlers.clear()

    logging.config.dictConfig(config)

    try:
        for f in (BACKEND_ERROR_FILE, FRONTEND_ERROR_FILE):
            if not os.path.exists(f):
                with open(f, "a", encoding="utf-8"):
                    pass
    except Exception:
        pass

    def _excepthook(exc_type, exc, tb):
        logger = logging.getLogger("uvicorn.error")
        logger.error("Uncaught exception\n%s", "".join(traceback.format_exception(exc_type, exc, tb)))

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

# FY 2026 Rates from Final Budget Handout
DEFAULT_POLICY = {
    "TIME SHARE": {"code": 0, "rate": 14.70, "tiers": []},
    "NON-OWNER-OCCUPIED": {
        "code": 1,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 5.87},
            {"up_to": 3_000_000, "rate": 8.60},
            {"up_to": None, "rate": 17.00},
        ],
    },
    "COMMERCIALIZED RESIDENTIAL": {
        "code": 10,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 2.00},
            {"up_to": 3_000_000, "rate": 3.00},
            {"up_to": None, "rate": 10.00},
        ],
    },
    "TVR-STRH": {
        "code": 11,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 12.50},
            {"up_to": 3_000_000, "rate": 14.00},
            {"up_to": None, "rate": 15.55},
        ],
    },
    "LONG TERM RENTAL": {
        "code": 12,
        "rate": None,
        "tiers": [
            {"up_to": 1_300_000, "rate": 2.95},
            {"up_to": 3_000_000, "rate": 5.00},
            {"up_to": None, "rate": 8.50},
        ],
    },
    "APARTMENT": {"code": 2, "rate": 3.50, "tiers": []},
    "COMMERCIAL": {"code": 3, "rate": 6.05, "tiers": []},
    "INDUSTRIAL": {"code": 4, "rate": 7.05, "tiers": []},
    "AGRICULTURAL": {"code": 5, "rate": 5.74, "tiers": []},
    "CONSERVATION": {"code": 6, "rate": 6.43, "tiers": []},
    "HOTEL / RESORT": {"code": 7, "rate": 11.80, "tiers": []},
    "OWNER-OCCUPIED": {
        "code": 9,
        "rate": None,
        "tiers": [
            {"up_to": 1_300_000, "rate": 1.65},
            {"up_to": 4_500_000, "rate": 1.80},
            {"up_to": None, "rate": 5.75},
        ],
    },
}

FY_COMPARISON_DATA = {
    "FY 2025": {
        "TIME SHARE": {"certified_value": 3_905_410_955, "certified_revenue": 57_019_000},
        "NON-OWNER-OCCUPIED": {"certified_value": 17_664_372_655, "certified_revenue": 141_536_630},
        "COMMERCIALIZED RESIDENTIAL": {"certified_value": 286_823_300, "certified_revenue": 1_392_135},
        "TVR-STRH": {"certified_value": 18_696_743_965, "certified_revenue": 246_287_352},
        "LONG TERM RENTAL": {"certified_value": 2_261_799_755, "certified_revenue": 7_782_265},
        "APARTMENT": {"certified_value": 595_055_010, "certified_revenue": 2_082_693},
        "COMMERCIAL": {"certified_value": 2_419_886_030, "certified_revenue": 14_640_310},
        "INDUSTRIAL": {"certified_value": 2_240_512_595, "certified_revenue": 15_795_614},
        "AGRICULTURAL": {"certified_value": 1_742_186_795, "certified_revenue": 10_000_152},
        "CONSERVATION": {"certified_value": 317_375_505, "certified_revenue": 2_040_724},
        "HOTEL / RESORT": {"certified_value": 4_383_911_250, "certified_revenue": 51_510_957},
        "OWNER-OCCUPIED": {"certified_value": 18_754_560_210, "certified_revenue": 35_274_540},
        "totals": {"certified_value": 73_268_638_025, "certified_revenue": 585_362_373},
    },
    "FY 2026": {
        "TIME SHARE": {"certified_value": 4_202_362_000, "certified_revenue": 61_774_721},
        "NON-OWNER-OCCUPIED": {"certified_value": 19_709_983_430, "certified_revenue": 173_968_757},
        "COMMERCIALIZED RESIDENTIAL": {"certified_value": 315_851_925, "certified_revenue": 1_117_435},
        "TVR-STRH": {"certified_value": 19_725_277_065, "certified_revenue": 264_661_563},
        "LONG TERM RENTAL": {"certified_value": 3_487_698_245, "certified_revenue": 11_585_508},
        "APARTMENT": {"certified_value": 720_171_325, "certified_revenue": 2_520_600},
        "COMMERCIAL": {"certified_value": 2_722_903_800, "certified_revenue": 16_473_568},
        "INDUSTRIAL": {"certified_value": 2_425_696_900, "certified_revenue": 17_101_163},
        "AGRICULTURAL": {"certified_value": 2_025_402_205, "certified_revenue": 11_625_809},
        "CONSERVATION": {"certified_value": 343_329_550, "certified_revenue": 2_207_609},
        "HOTEL / RESORT": {"certified_value": 4_631_269_245, "certified_revenue": 54_648_977},
        "OWNER-OCCUPIED": {"certified_value": 23_418_112_540, "certified_revenue": 41_392_002},
        "totals": {"certified_value": 83_728_058_230, "certified_revenue": 659_077_712},
    },
}

FY2026_PARCEL_COUNTS = {
    "TIME SHARE": 2480,
    "NON-OWNER-OCCUPIED": 14781,
    "COMMERCIALIZED RESIDENTIAL": 149,
    "TVR-STRH": 12500,
    "LONG TERM RENTAL": 4163,
    "APARTMENT": 684,
    "COMMERCIAL": 2004,
    "INDUSTRIAL": 807,
    "AGRICULTURAL": 5489,
    "CONSERVATION": 1088,
    "HOTEL / RESORT": 495,
    "OWNER-OCCUPIED": 27792,
}

# FY 2026 Tier thresholds by class (from handout): last tier is open-ended (None)
FY2026_TIER_THRESHOLDS: dict[str, List[Optional[int]]] = {
    "NON-OWNER-OCCUPIED": [1_000_000, 3_000_000, None],
    "COMMERCIALIZED RESIDENTIAL": [1_000_000, 3_000_000, None],
    "TVR-STRH": [1_000_000, 3_000_000, None],
    "LONG TERM RENTAL": [1_300_000, 3_000_000, None],
    "OWNER-OCCUPIED": [1_300_000, 4_500_000, None],
}

# FY 2026 Tier parcel counts from the handout (second number in each tier row)
FY2026_TIER_HANDOUT_PARCEL_COUNTS: dict[str, List[int]] = {
    "NON-OWNER-OCCUPIED": [8602, 4958, 1221],
    "COMMERCIALIZED RESIDENTIAL": [19, 109, 21],
    "TVR-STRH": [5321, 5933, 1246],
    "LONG TERM RENTAL": [3600, 510, 53],
    "OWNER-OCCUPIED": [23902, 3706, 184],
}


class Tier(BaseModel):
    up_to: Optional[int]
    rate: float


class TaxClassPolicy(BaseModel):
    code: int
    rate: Optional[float] = None
    tiers: List[Tier]


class ForecastRequest(BaseModel):
    policy: dict[str, TaxClassPolicy]
    appeals: dict[str, float]
    applyExemptionAverage: bool


class TierRevenue(BaseModel):
    label: str
    lower_bound: Optional[int] = None
    up_to: Optional[int] = None
    rate: float
    revenue: float


class RevenueResult(BaseModel):
    certified_value: float
    certified_revenue: float
    parcel_count: int
    exemption_count: int
    tier_breakdown: Optional[List[TierRevenue]] = None


class ForecastResponse(BaseModel):
    results_by_class: dict[str, RevenueResult]
    totals: RevenueResult
    comparison_data: dict[str, Any]


class TierParcelCountsRequest(BaseModel):
    policy: dict[str, TaxClassPolicy]


class TierParcelCountsByClass(BaseModel):
    thresholds: List[Optional[int]]
    fy2026_tier_counts: List[int]
    data_tier_counts: List[int]
    data_total_count: int


class TierParcelCountsResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None
    classes: Optional[dict[str, TierParcelCountsByClass]] = None


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
            client_ip = client[0] if isinstance(client, (tuple, list)) and client else None
            self.logger.exception("Unhandled exception | path=%s | ip=%s", path, client_ip)
            raise


# Register logging middleware first so it wraps the entire stack.
app.add_middleware(ExceptionLoggingMiddleware)

# CORS should come after logging so CORS errors are captured too.
origins = ["http://localhost", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Endpoints: Dataframes ----------------------------------------------------
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
    df_head = df.head(10).replace({np.nan: None})
    result_json = df_head.to_json(orient="records")
    return json.loads(result_json)


def _value_counts_json_safe(series: pd.Series) -> dict[str, int]:
    counts = series.value_counts(dropna=False).to_dict()
    safe: dict[str, int] = {}
    for k, v in counts.items():
        if pd.isna(k):
            safe["NULL (Not Set)"] = v
        else:
            safe[str(k).strip()] = v
    return safe


@app.get("/api/dataframes/fullpardat25/multiple-class-flag-counts")
def get_multiple_class_flag_counts_pardat() -> Any:
    """Value counts for MULTIPLE_CLASS_FLAG in fullpardat25."""
    df_name = "fullpardat25"
    column_name = "MULTIPLE_CLASS_FLAG"
    if df_name not in DATASETS:
        raise HTTPException(status_code=404, detail=f"Dataframe '{df_name}' not found")
    df = DATASETS[df_name]
    if column_name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found in '{df_name}'")
    return _value_counts_json_safe(df[column_name])


@app.get("/api/dataframes/fulllndarclass25/multiple-class-flag-counts")
def get_multiple_class_flag_counts_lndar() -> Any:
    """Value counts for MULTIPLE_CLASS_FLAG in fulllndarclass25."""
    df_name = "fulllndarclass25"
    column_name = "MULTIPLE_CLASS_FLAG"
    if df_name not in DATASETS:
        raise HTTPException(status_code=404, detail=f"Dataframe '{df_name}' not found")
    df = DATASETS[df_name]
    if column_name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found in '{df_name}'")
    return _value_counts_json_safe(df[column_name])


# ---- Endpoints: Policy & Appeals ---------------------------------------------
@app.get("/api/policy/default")
def get_default_policy() -> dict[str, Any]:
    """Returns the default tax policy based on FY 2026 rates."""
    return DEFAULT_POLICY


@app.get("/api/appeals-and-exemptions")
def get_appeals_and_exemptions() -> dict[str, Any]:
    """Returns default appeal values and calculated exemptions by tax class."""
    if not APPEALS_DATA:
        raise HTTPException(status_code=503, detail="Appeals data not loaded.")
    if "fullasmt25" not in DATASETS:
        raise HTTPException(status_code=503, detail="Assessment data not loaded.")

    df = DATASETS["fullasmt25"].copy()
    # Exclude disaster-affected parcels
    df = df[(df["ASSESSED_LAND_VALUE"] > 0) | (df["ASSESSED_BUILDING_VALUE"] > 0)]

    data_parcel_counts = df["TAX_RATE_CLASS"].value_counts().to_dict()

    exemptions = {}
    for class_code, class_name in TAX_CLASS_MAPPING.items():
        data_count = data_parcel_counts.get(class_code, 0)
        handout_count = FY2026_PARCEL_COUNTS.get(class_name, 0)
        # Exemption is the difference, cannot be negative
        exemption_count = max(0, data_count - handout_count)
        exemptions[class_name] = {
            "data_parcel_count": data_count,
            "fy2026_parcel_count": handout_count,
            "exemption_count": exemption_count,
        }

    return {
        "appeals": APPEALS_DATA,
        "exemptions": exemptions,
    }


@app.get("/api/policy/multiclass-behavior")
def get_multiclass_behavior() -> dict[str, Any]:
    """
    Declare how the forecast handles parcels flagged as multi-class ('X') and provide quick counts.

    Strategy: Ignore the multi-class flag for tax computation and use fullasmt25.TAX_RATE_CLASS
    as the single source of truth for rate/tier lookup.
    """
    summary: dict[str, Any] = {
        "strategy": "ignore_flag_use_tax_rate_class",
        "description": (
            "Parcels with MULTIPLE_CLASS_FLAG = 'X' are not apportioned across classes. "
            "Revenue is computed solely from fullasmt25.TAX_RATE_CLASS using provided tiers/rates."
        ),
        "data_sources": {
            "pardat_flag": "fullpardat25.MULTIPLE_CLASS_FLAG",
            "lndar_flag": "fulllndarclass25.MULTIPLE_CLASS_FLAG",
            "rate_class": "fullasmt25.TAX_RATE_CLASS",
        },
        "counts": {},
        "notes": [
            "MULTIPLE_CLASS_FLAG indicates multiple land classes on record, not billable tax class.",
            "TAX_RATE_CLASS encodes the class actually used for billing (e.g., owner-occupied override).",
        ],
    }

    if "fullpardat25" in DATASETS and "MULTIPLE_CLASS_FLAG" in DATASETS["fullpardat25"].columns:
        summary["counts"]["pardat"] = _value_counts_json_safe(DATASETS["fullpardat25"]["MULTIPLE_CLASS_FLAG"])
    if "fulllndarclass25" in DATASETS and "MULTIPLE_CLASS_FLAG" in DATASETS["fulllndarclass25"].columns:
        summary["counts"]["lndar"] = _value_counts_json_safe(DATASETS["fulllndarclass25"]["MULTIPLE_CLASS_FLAG"])

    return summary


# ---- Endpoints: Forecast ------------------------------------------------------
@app.post("/api/revenue-forecast", response_model=ForecastResponse)
def calculate_revenue_forecast(request: ForecastRequest) -> Any:
    """Calculates a revenue forecast based on the provided tax policy.

    Bracket convention: lower bound is exclusive, upper bound is inclusive. For example, with
    thresholds [0, 1,300,000], [1,300,001, 3,000,000], ... the amount at exactly the upper
    threshold is taxed in the lower tier, and the next dollar above a tier's upper bound is taxed
    in the following tier. The implementation below uses a continuous allocation where the taxable
    amount per tier is (value - lower_bound) clipped to [0, upper_bound - lower_bound], which
    achieves the desired exclusivity/inclusivity without off-by-one issues.
    """
    logger = logging.getLogger(__name__)
    logger.info("--- Starting Revenue Forecast Calculation ---")
    logger.info(
        "Request Payload: policy_classes=%s, appeal_classes=%s, applyExemptionAverage=%s",
        list(request.policy.keys()),
        list(request.appeals.keys()),
        request.applyExemptionAverage,
    )

    try:
        if "fullasmt25" not in DATASETS:
            logger.error("Assessment data 'fullasmt25' not found in DATASETS.")
            raise HTTPException(status_code=503, detail="Assessment data not loaded.")

        logger.info("Step 1: Preparing base assessment data.")
        df = DATASETS["fullasmt25"].copy()
        initial_rows = len(df)
        logger.info("Loaded 'fullasmt25' with %d initial rows.", initial_rows)

        # Exclude disaster-affected parcels (Land Value = 0 AND Building Value = 0)
        df = df[(df["ASSESSED_LAND_VALUE"] > 0) | (df["ASSESSED_BUILDING_VALUE"] > 0)]
        disaster_excluded_rows = initial_rows - len(df)
        logger.info(
            "Excluded %d disaster-affected parcels. %d rows remaining.",
            disaster_excluded_rows,
            len(df),
        )

        # Data prep: Calculate net taxable value
        logger.info(
            "Calculating total assessed value, total exemption, and net taxable value."
        )
        df["total_assessed_value"] = df["ASSESSED_LAND_VALUE"] + df["ASSESSED_BUILDING_VALUE"]
        df["total_exemption"] = df["LAND_EXEMPTION"] + df["BUILDING_EXEMPTION"]
        df["net_taxable_value"] = df["total_assessed_value"] - df["total_exemption"]
        df["net_taxable_value"] = df["net_taxable_value"].clip(lower=0)
        logger.info("Net taxable value calculation complete.")

        df["tax"] = 0.0

        # Pre-compute per-class tier revenue before any adjustments
        pre_tier_revenue: dict[str, List[dict[str, Any]]] = {}

        logger.info("Step 2: Applying tax policy to each class.")
        for class_name, class_policy in request.policy.items():
            class_code = class_policy.code
            mask = df["TAX_RATE_CLASS"] == class_code

            parcel_count_for_class = int(mask.sum())
            if not parcel_count_for_class > 0:
                logger.info(
                    "  - Class '%s' (Code: %d): No parcels found, skipping.",
                    class_name,
                    class_code,
                )
                continue

            logger.info(
                "  - Processing Class '%s' (Code: %d) for %d parcels.",
                class_name,
                class_code,
                parcel_count_for_class,
            )

            values = df.loc[mask, "net_taxable_value"]

            if class_policy.tiers:
                logger.info("    -> Applying TIERED rates.")
                sorted_tiers = sorted(
                    class_policy.tiers,
                    key=lambda t: t.up_to if t.up_to is not None else float("inf"),
                )

                tax = pd.Series(0.0, index=values.index)
                lower_bound = 0
                class_tier_rows: List[dict[str, Any]] = []

                for i, tier in enumerate(sorted_tiers):
                    rate = tier.rate / 1000.0
                    upper_bound = tier.up_to if tier.up_to is not None else float("inf")
                    logger.info(
                        "      - Tier %d: Rate=%.4f for values between %s and %s (lower exclusive, upper inclusive)",
                        i + 1,
                        tier.rate,
                        f"${lower_bound:,.0f}",
                        f"${upper_bound:,.0f}" if upper_bound != float("inf") else "infinity",
                    )

                    if upper_bound <= lower_bound:
                        logger.warning("      - Tier %d is invalid or out of order, skipping.", i + 1)
                        continue

                    # lower bound exclusive, upper bound inclusive
                    taxable_in_bracket = (values - lower_bound).clip(
                        lower=0, upper=(upper_bound - lower_bound)
                    )
                    tier_tax_series = taxable_in_bracket * rate
                    tax += tier_tax_series

                    # Summary for tier revenue reporting (pre-adjustment)
                    lb_for_label = int(lower_bound)
                    ub_for_label: Optional[int] = None if upper_bound == float("inf") else int(upper_bound)
                    if upper_bound == float("inf"):
                        label = f"Tier {i + 1}: over ${lb_for_label:,.0f}"
                    elif lower_bound == 0:
                        label = f"Tier {i + 1}: up to ${int(upper_bound):,}"
                    else:
                        # Display exclusive lower bound as lower_bound + 1 for clarity in dollar terms
                        display_lower = lb_for_label + 1
                        label = f"Tier {i + 1}: ${display_lower:,.0f} to ${int(upper_bound):,}"

                    class_tier_rows.append(
                        {
                            "label": label,
                            "lower_bound": int(lb_for_label),
                            "up_to": ub_for_label,
                            "rate": float(tier.rate),
                            "revenue": float(tier_tax_series.sum()),
                        }
                    )

                    lower_bound = upper_bound

                df.loc[mask, "tax"] = tax
                pre_tier_revenue[class_name] = class_tier_rows
                logger.info("    -> Tiered tax calculation complete for '%s'.", class_name)

            elif class_policy.rate is not None:
                rate = class_policy.rate / 1000.0
                logger.info("    -> Applying FLAT rate: %.4f", class_policy.rate)
                tax_series = values * rate
                df.loc[mask, "tax"] = tax_series
                pre_tier_revenue[class_name] = [
                    {
                        "label": "Flat Rate",
                        "lower_bound": None,
                        "up_to": None,
                        "rate": float(class_policy.rate),
                        "revenue": float(tax_series.sum()),
                    }
                ]
                logger.info("    -> Flat rate tax calculation complete for '%s'.", class_name)
            else:
                logger.warning(
                    "    -> Class '%s' has no tiers and no flat rate. Tax will be 0.",
                    class_name,
                )
                pre_tier_revenue[class_name] = []

        logger.info("Step 3: Aggregating results by tax class.")
        results: dict[str, dict[str, float | int | list | None]] = {}
        grouped = df.groupby("TAX_RATE_CLASS")

        for class_code, group_df in grouped:
            class_name = TAX_CLASS_MAPPING.get(class_code)
            if not class_name or class_name not in request.policy:
                continue

            data_parcel_count = int(len(group_df))
            fy2026_count = FY2026_PARCEL_COUNTS.get(class_name, 0)
            exemption_count = max(0, data_parcel_count - fy2026_count)

            certified_value = float(group_df["net_taxable_value"].sum())
            certified_revenue = float(group_df["tax"].sum())

            logger.info("  - Aggregated Class '%s':", class_name)
            logger.info("    - Raw Parcel Count: %d", data_parcel_count)
            logger.info("    - FY2026 Handout Count: %d", fy2026_count)
            logger.info("    - Calculated Exemptions: %d", exemption_count)
            logger.info("    - Pre-adjustment Value: %s", f"${certified_value:,.2f}")
            logger.info("    - Pre-adjustment Revenue: %s", f"${certified_revenue:,.2f}")

            tier_rows = pre_tier_revenue.get(class_name, [])

            # Apply exemption average proportionally across the class (not per tier counts)
            exemption_adjustment_factor = 1.0
            if request.applyExemptionAverage and data_parcel_count > 0:
                non_exempt_count = data_parcel_count - exemption_count
                exemption_adjustment_factor = (
                    non_exempt_count / data_parcel_count if data_parcel_count else 1.0
                )
                logger.info(
                    "    - Applying Exemption Average Adjustment Factor: %.4f",
                    exemption_adjustment_factor,
                )
                certified_value *= exemption_adjustment_factor
                certified_revenue *= exemption_adjustment_factor
                logger.info("    - Post-exemption Value: %s", f"${certified_value:,.2f}")
                logger.info("    - Post-exemption Revenue: %s", f"${certified_revenue:,.2f}")
            else:
                logger.info("    - Skipping Exemption Average Adjustment.")

            # Scale tier revenues by exemption adjustment factor only
            scaled_tier_rows = [
                {
                    **tr,
                    "revenue": float(tr.get("revenue", 0.0)) * float(exemption_adjustment_factor),
                }
                for tr in tier_rows
            ]

            results[class_name] = {
                "certified_value": certified_value,
                "certified_revenue": certified_revenue,
                "parcel_count": data_parcel_count,
                "exemption_count": exemption_count,
                "tier_breakdown": scaled_tier_rows,
            }

        logger.info("Step 4: Applying appeal deductions.")
        adjusted_results: dict[str, dict[str, float | int | list | None]] = {}
        for class_name, result_data in results.items():
            appeal_value = float(request.appeals.get(class_name, 0) or 0)
            original_value = float(result_data["certified_value"])  # after exemption adj

            logger.info("  - Processing Appeals for Class '%s':", class_name)
            logger.info("    - Appeal Value from Request: %s", f"${appeal_value:,.2f}")
            logger.info("    - Value Before Appeal: %s", f"${original_value:,.2f}")

            tier_rows_after_exemption = result_data.get("tier_breakdown") or []

            if original_value > 0 and appeal_value > 0:
                appeal_deduction = min(appeal_value * 0.5, original_value)
                adjusted_value = original_value - appeal_deduction
                reduction_factor = adjusted_value / original_value if original_value > 0 else 0.0
                adjusted_revenue = float(result_data["certified_revenue"]) * reduction_factor
                logger.info("    - Reduction Factor: %.4f", reduction_factor)
                logger.info("    - Final Adjusted Value: %s", f"${adjusted_value:,.2f}")
                logger.info("    - Final Adjusted Revenue: %s", f"${adjusted_revenue:,.2f}")

                # Scale tier revenues by the same reduction factor so tiers sum to the class revenue
                appeal_adjusted_tiers = [
                    {**tr, "revenue": float(tr.get("revenue", 0.0)) * float(reduction_factor)}
                    for tr in tier_rows_after_exemption
                ]

                adjusted_results[class_name] = {
                    "certified_value": adjusted_value,
                    "certified_revenue": adjusted_revenue,
                    "parcel_count": int(result_data["parcel_count"]),
                    "exemption_count": int(result_data["exemption_count"]),
                    "tier_breakdown": appeal_adjusted_tiers,
                }
            else:
                logger.info("    - No appeal deduction applied (value or appeal is zero).")
                adjusted_results[class_name] = result_data

        logger.info("Step 5: Calculating final totals.")
        total_value = sum(float(r["certified_value"]) for r in adjusted_results.values())
        total_revenue = sum(float(r["certified_revenue"]) for r in adjusted_results.values())
        total_parcels = sum(int(r["parcel_count"]) for r in adjusted_results.values())
        total_exemptions = sum(int(r["exemption_count"]) for r in adjusted_results.values())

        logger.info("  - Total Value: %s", f"${total_value:,.2f}")
        logger.info("  - Total Revenue: %s", f"${total_revenue:,.2f}")
        logger.info("  - Total Parcels: %d", total_parcels)
        logger.info("  - Total Exemptions: %d", total_exemptions)

        response_data = {
            "results_by_class": adjusted_results,
            "totals": {
                "certified_value": total_value,
                "certified_revenue": total_revenue,
                "parcel_count": total_parcels,
                "exemption_count": total_exemptions,
                "tier_breakdown": None,
            },
            "comparison_data": FY_COMPARISON_DATA,
        }
        logger.info("--- Revenue Forecast Calculation Successful ---")
        return response_data
    except Exception as e:
        logger.error("Revenue calculation failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during revenue calculation: {str(e)}",
        )


# ---- Tier Parcel Counts (FY2026 thresholds only) -----------------------------
@app.post("/api/tier-parcel-counts", response_model=TierParcelCountsResponse)
def get_tier_parcel_counts(request: TierParcelCountsRequest) -> TierParcelCountsResponse:
    """
    Returns tier parcel counts per class when and only when the provided policy's tiers exactly
    match the official FY 2026 tier thresholds per class. Counts include FY26 handout tier counts
    and current-data tier counts using net taxable value.
    """
    logger = logging.getLogger(__name__)

    # Validate policy tiers match FY 2026 thresholds for all tiered classes we track
    for class_name, thresholds in FY2026_TIER_THRESHOLDS.items():
        policy = request.policy.get(class_name)
        if policy is None:
            reason = f"Missing '{class_name}' in policy."
            return TierParcelCountsResponse(allowed=False, reason=reason)
        policy_thresholds = [t.up_to for t in sorted(policy.tiers, key=lambda t: t.up_to or float("inf"))]
        if policy_thresholds != thresholds:
            reason = (
                f"Tier thresholds for '{class_name}' do not match FY 2026. "
                f"expected={thresholds} got={policy_thresholds}"
            )
            return TierParcelCountsResponse(allowed=False, reason=reason)

    # Ensure data is available
    if "fullasmt25" not in DATASETS:
        raise HTTPException(status_code=503, detail="Assessment data not loaded.")

    df = DATASETS["fullasmt25"].copy()
    # Exclude disaster-affected parcels
    df = df[(df["ASSESSED_LAND_VALUE"] > 0) | (df["ASSESSED_BUILDING_VALUE"] > 0)]

    # Compute net taxable
    df["total_assessed_value"] = df["ASSESSED_LAND_VALUE"] + df["ASSESSED_BUILDING_VALUE"]
    df["total_exemption"] = df["LAND_EXEMPTION"] + df["BUILDING_EXEMPTION"]
    df["net_taxable_value"] = (df["total_assessed_value"] - df["total_exemption"]).clip(lower=0)

    def _counts_for_class(values: pd.Series, thresholds_list: List[Optional[int]]) -> List[int]:
        # lower bound exclusive, upper bound inclusive for all but the first tier which is [0, upper]
        counts: List[int] = []
        for i, upper in enumerate(thresholds_list):
            if i == 0:
                if upper is None:
                    counts.append(int((values >= 0).sum()))
                else:
                    counts.append(int((values <= upper).sum()))
            else:
                prev_upper = thresholds_list[i - 1]
                if upper is None:
                    counts.append(int((values > (prev_upper or 0)).sum()))
                else:
                    counts.append(int(((values > (prev_upper or 0)) & (values <= upper)).sum()))
        return counts

    classes_payload: dict[str, TierParcelCountsByClass] = {}

    for class_name, thresholds in FY2026_TIER_THRESHOLDS.items():
        class_code = DEFAULT_POLICY[class_name]["code"]
        mask = df["TAX_RATE_CLASS"] == class_code
        values = df.loc[mask, "net_taxable_value"]
        data_counts = _counts_for_class(values, thresholds)
        fy_counts = FY2026_TIER_HANDOUT_PARCEL_COUNTS.get(class_name, [0] * len(thresholds))
        classes_payload[class_name] = TierParcelCountsByClass(
            thresholds=thresholds,
            fy2026_tier_counts=fy_counts,
            data_tier_counts=data_counts,
            data_total_count=int(mask.sum()),
        )

    return TierParcelCountsResponse(allowed=True, classes=classes_payload)


# ---- Misc --------------------------------------------------------------------
@app.get("/api/hello")
def read_root() -> dict[str, Any]:
    return {
        "message": "Hello from the FastAPI & Docker Coming in Hot and fresh and tasty today!!!",
        "timestamp": datetime.datetime.now().isoformat(),
    }


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
def log_frontend_error(payload: FrontendErrorPayload, request: Request) -> dict[str, str]:
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
