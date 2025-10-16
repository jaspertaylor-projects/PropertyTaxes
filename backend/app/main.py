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
    "fullownr25": {
        "file_name": "fullownr25.txt",
        "colspecs": [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 6),
            (6, 9),
            (9, 13),
            (13, 53),
            (53, 93),
            (93, 214),
            (214, 294),
            (294, 386),
            (386, 426),
            (426, 428),
            (428, 433),
            (433, 437),
            (437, 467),
        ],
        "names": [
            "DIVISION_TMK",
            "ZONE_TMK",
            "SECTION_TMK",
            "PLAT_TMK",
            "PARCEL_TMK",
            "CPR_TMK",
            "OWNER",
            "OWNER_TYPE",
            "CO_MAILING_ADDRESS",
            "MAILING_STREET_ADDRESS",
            "MAILING_CITY_STATE_ZIP",
            "MAILING_CITY_NAME",
            "MAILING_STATE",
            "MAILING_ZIP1",
            "MAILING_ZIP2",
            "COUNTRY",
        ],
    },
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
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
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

# FY 2025 Rates from Final Budget Handout
DEFAULT_POLICY = {
    "TIME SHARE": {"code": 0, "rate": 14.60, "tiers": []},
    "NON-OWNER-OCCUPIED": {
        "code": 1,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 5.87},
            {"up_to": 3_000_000, "rate": 8.50},
            {"up_to": None, "rate": 14.00},
        ],
    },
    "COMMERCIALIZED RESIDENTIAL": {
        "code": 10,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 4.00},
            {"up_to": 3_000_000, "rate": 5.00},
            {"up_to": None, "rate": 8.00},
        ],
    },
    "TVR-STRH": {
        "code": 11,
        "rate": None,
        "tiers": [
            {"up_to": 1_000_000, "rate": 12.50},
            {"up_to": 3_000_000, "rate": 13.50},
            {"up_to": None, "rate": 15.00},
        ],
    },
    "LONG TERM RENTAL": {
        "code": 12,
        "rate": None,
        "tiers": [
            {"up_to": 1_300_000, "rate": 3.00},
            {"up_to": 3_000_000, "rate": 5.00},
            {"up_to": None, "rate": 8.00},
        ],
    },
    "APARTMENT": {"code": 2, "rate": 3.50, "tiers": []},
    "COMMERCIAL": {"code": 3, "rate": 6.05, "tiers": []},
    "INDUSTRIAL": {"code": 4, "rate": 7.05, "tiers": []},
    "AGRICULTURAL": {"code": 5, "rate": 5.74, "tiers": []},
    "CONSERVATION": {"code": 6, "rate": 6.43, "tiers": []},
    "HOTEL / RESORT": {"code": 7, "rate": 11.75, "tiers": []},
    "OWNER-OCCUPIED": {
        "code": 9,
        "rate": None,
        "tiers": [
            {"up_to": 1_300_000, "rate": 1.80},
            {"up_to": 4_500_000, "rate": 2.00},
            {"up_to": None, "rate": 3.25},
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


class Tier(BaseModel):
    up_to: Optional[int]
    rate: float


class TaxClassPolicy(BaseModel):
    code: int
    rate: Optional[float]
    tiers: List[Tier]


class ForecastRequest(BaseModel):
    policy: dict[str, TaxClassPolicy]
    appeals: dict[str, float]
    applyExemptionAverage: bool


class RevenueResult(BaseModel):
    certified_value: float
    certified_revenue: float
    parcel_count: int
    exemption_count: int


class ForecastResponse(BaseModel):
    results_by_class: dict[str, RevenueResult]
    totals: RevenueResult
    comparison_data: dict[str, Any]


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
    """Returns the default tax policy based on FY 2025 rates."""
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
        df["net_taxable_value"] = df["net_taxable_value"].clip(lower=0)

        df["tax"] = 0.0

        for class_name, class_policy in request.policy.items():
            class_code = class_policy.code
            mask = df["TAX_RATE_CLASS"] == class_code

            if not mask.any():
                continue

            values = df.loc[mask, "net_taxable_value"]

            if class_policy.tiers:
                # Sort tiers by their 'up_to' value to ensure correct progressive calculation.
                # Tiers with 'up_to: null' are treated as infinity and placed at the end.
                sorted_tiers = sorted(
                    class_policy.tiers,
                    key=lambda t: t.up_to if t.up_to is not None else float("inf"),
                )

                tax = pd.Series(0.0, index=values.index)
                remaining_values = values.copy()
                lower_bound = 0

                for tier in sorted_tiers:
                    rate = tier.rate / 1000.0
                    upper_bound = tier.up_to if tier.up_to is not None else float("inf")
                    bracket_width = upper_bound - lower_bound

                    value_in_bracket = remaining_values.clip(upper=bracket_width)
                    tax += value_in_bracket * rate

                    remaining_values = (remaining_values - bracket_width).clip(lower=0)

                    if remaining_values.sum() == 0:
                        break

                    lower_bound = upper_bound

                df.loc[mask, "tax"] = tax
            elif class_policy.rate is not None:
                rate = class_policy.rate / 1000.0
                df.loc[mask, "tax"] = values * rate

        # Aggregate results
        results: dict[str, dict[str, float | int]] = {}
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

            # Apply exemption averaging if requested
            if request.applyExemptionAverage and data_parcel_count > 0:
                non_exempt_count = data_parcel_count - exemption_count
                adjustment_factor = non_exempt_count / data_parcel_count
                certified_value *= adjustment_factor
                certified_revenue *= adjustment_factor

            results[class_name] = {
                "certified_value": certified_value,
                "certified_revenue": certified_revenue,
                "parcel_count": data_parcel_count,  # This is the original count from data
                "exemption_count": exemption_count,
            }

        # Apply appeal deductions at the class level
        adjusted_results: dict[str, dict[str, float | int]] = {}
        for class_name, result_data in results.items():
            appeal_value = float(request.appeals.get(class_name, 0) or 0)
            original_value = float(result_data["certified_value"])

            if original_value > 0 and appeal_value > 0:
                appeal_deduction = min(appeal_value * 0.5, original_value)
                adjusted_value = original_value - appeal_deduction
                reduction_factor = adjusted_value / original_value if original_value > 0 else 0.0
                adjusted_revenue = float(result_data["certified_revenue"]) * reduction_factor

                adjusted_results[class_name] = {
                    "certified_value": adjusted_value,
                    "certified_revenue": adjusted_revenue,
                    "parcel_count": int(result_data["parcel_count"]),
                    "exemption_count": int(result_data["exemption_count"]),
                }
            else:
                adjusted_results[class_name] = result_data

        total_value = sum(float(r["certified_value"]) for r in adjusted_results.values())
        total_revenue = sum(float(r["certified_revenue"]) for r in adjusted_results.values())
        total_parcels = sum(int(r["parcel_count"]) for r in adjusted_results.values())
        total_exemptions = sum(int(r["exemption_count"]) for r in adjusted_results.values())

        return {
            "results_by_class": adjusted_results,
            "totals": {
                "certified_value": total_value,
                "certified_revenue": total_revenue,
                "parcel_count": total_parcels,
                "exemption_count": total_exemptions,
            },
            "comparison_data": FY_COMPARISON_DATA,
        }
    except Exception as e:
        logging.getLogger("fastapi").error("Revenue calculation failed: %s", e)
        raise HTTPException(status_code=500, detail="An error occurred during revenue calculation.")


# ---- Misc --------------------------------------------------------------------
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
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
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
