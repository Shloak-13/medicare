# Family Healthcare Analytics Dashboard
### Python · Pandas · Plotly · Dash · EDA · Healthcare Domain

An end-to-end analytics project tracking 2 years of family healthcare data across spend, medication adherence, health metrics, and insurance claims.

## What This Project Demonstrates

- Exploratory data analysis for healthcare cost and utilization patterns
- KPI dashboard design for executive-style reporting
- Interactive Plotly visualizations with Dash
- Domain-specific insight generation for family health, medication adherence, and insurance claims
- Synthetic data modeling with realistic Indian healthcare cost assumptions

## Dashboard Preview

![Monthly healthcare spend trend](assets/dashboard_preview_1.png)

![Medication adherence heatmap](assets/dashboard_preview_2.png)

## Key Insights Found

- Dad shows the clearest cost-risk pattern, driven by increased specialist visits and cardiac checkups in Q3 2025.
- Medication adherence is lowest for Dad, creating a useful chronic-care monitoring signal.
- Insurance approvals offset a meaningful portion of family healthcare spend, but rejected and pending claims still create out-of-pocket exposure.

## How to Run

```bash
pip install -r requirements.txt
python analytics/generate_data.py
python analytics/dashboard.py  # opens at localhost:8050
jupyter notebook analytics/healthcare_analysis.ipynb
```

## Project Structure

```text
.
├── analytics/
│   ├── charts.py
│   ├── dashboard.py
│   ├── export_previews.py
│   ├── generate_data.py
│   ├── healthcare_analysis.ipynb
│   └── data/
│       └── family_health_data.csv
├── assets/
│   ├── dashboard_preview_1.png
│   └── dashboard_preview_2.png
├── legacy/
│   └── previous full-stack healthcare web app code
├── requirements.txt
└── README.md
```

## Tech Stack

Python · Pandas · NumPy · Plotly · Dash · Jupyter

## Note

The synthetic data in this project is modeled on realistic Indian healthcare cost patterns and can be adapted for real clinic, hospital, or insurance datasets.
