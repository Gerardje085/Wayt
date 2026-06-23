"""
Wayt – Fitness Progressive Overload Tracker
=============================================
Streamlit app for tracking workouts and applying the progressive overload
algorithm. Uses Supabase (PostgreSQL) as the cloud database via supabase-py.

Pages:
  1. Workout Loggen  – Log a workout session with smart advice
  2. Voortgang       – Progress dashboard with volume chart
  3. PWS Admin Data  – Raw data table + CSV download for researchers
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date
from supabase import create_client, Client

# ─────────────────────────────────────────────────────────────────────────────
# 1. PAGE CONFIG
# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Wayt – Fitness Tracker",
    page_icon="🏋️",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────────────────────────────────────
# 2. CUSTOM CSS
# ─────────────────────────────────────────────────────────────────────────────
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
        border-right: 1px solid #2a2a4a;
    }
    [data-testid="stSidebar"] * { color: #e0e0f0 !important; }
    [data-testid="stAppViewContainer"] { background: #0d0d1a; }
    [data-testid="stHeader"] { background: transparent; }

    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #1e1e3a 0%, #16213e 100%);
        border: 1px solid #3a3a6a;
        border-radius: 12px;
        padding: 16px 20px;
    }
    [data-testid="stMetricLabel"] { color: #9090c0 !important; font-size: 0.8rem; }
    [data-testid="stMetricValue"] { color: #a78bfa !important; font-size: 2rem; font-weight: 700; }

    .stAlert { border-radius: 10px; border-left-width: 4px; }

    .stButton > button {
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 12px 28px;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: opacity 0.2s ease, transform 0.1s ease;
        width: 100%;
    }
    .stButton > button:hover { opacity: 0.9; transform: translateY(-1px); }
    .stButton > button:active { transform: translateY(0px); }

    h1 { color: #c4b5fd !important; font-weight: 900 !important; letter-spacing: -1px; }
    h2 { color: #a78bfa !important; font-weight: 700 !important; }
    h3 { color: #ddd6fe !important; font-weight: 600 !important; }

    [data-testid="stSelectbox"] > div > div,
    [data-testid="stNumberInput"] input {
        background: #1e1e3a !important;
        color: #e0e0f0 !important;
        border: 1px solid #3a3a6a !important;
        border-radius: 8px !important;
    }

    hr { border-color: #2a2a4a; }

    [data-testid="stDataFrame"] {
        border: 1px solid #3a3a6a;
        border-radius: 10px;
        overflow: hidden;
    }

    .wayt-logo {
        font-size: 2.4rem;
        font-weight: 900;
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -2px;
        line-height: 1;
    }
    .wayt-tagline {
        color: #7070a0;
        font-size: 0.78rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-top: 2px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ─────────────────────────────────────────────────────────────────────────────
# 3. SUPABASE CONNECTION
# ─────────────────────────────────────────────────────────────────────────────

@st.cache_resource(show_spinner="Verbinding maken met database...")
def get_supabase() -> Client:
    """Creates and returns a cached Supabase client using Streamlit Secrets."""
    url: str = st.secrets["supabase"]["url"]
    key: str = st.secrets["supabase"]["key"]
    return create_client(url, key)


# ─────────────────────────────────────────────────────────────────────────────
# 4. DATABASE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def get_users(sb: Client) -> pd.DataFrame:
    response = sb.table("users").select("*").order("id").execute()
    if response.data:
        return pd.DataFrame(response.data)
    return pd.DataFrame(columns=["id", "name"])


def ensure_seed_users(sb: Client) -> None:
    """Seed the two default research participants if they don't exist yet."""
    seed = [
        {"id": 1, "name": "Proefpersoon 1"},
        {"id": 2, "name": "Proefpersoon 2"},
    ]
    sb.table("users").upsert(seed, on_conflict="id").execute()


def get_last_workout(sb: Client, user_id: int, exercise: str):
    response = (
        sb.table("workouts")
        .select("*")
        .eq("user_id", user_id)
        .eq("exercise", exercise)
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    if response.data:
        return response.data[0]
    return None


def get_workouts_for_user(sb: Client, user_id: int, exercise: str) -> pd.DataFrame:
    response = (
        sb.table("workouts")
        .select("*")
        .eq("user_id", user_id)
        .eq("exercise", exercise)
        .order("date")
        .execute()
    )
    if response.data:
        return pd.DataFrame(response.data)
    return pd.DataFrame(columns=["id", "user_id", "date", "exercise", "sets", "reps", "weight", "volume"])


def get_all_workouts(sb: Client) -> pd.DataFrame:
    response = (
        sb.table("workouts")
        .select("*, users(name)")
        .order("date", desc=True)
        .execute()
    )
    if response.data:
        df = pd.DataFrame(response.data)
        if "users" in df.columns:
            df["naam"] = df["users"].apply(
                lambda x: x["name"] if isinstance(x, dict) else "-"
            )
            df = df.drop(columns=["users"])
        cols_order = ["id", "naam", "user_id", "date", "exercise", "sets", "reps", "weight", "volume"]
        df = df[[c for c in cols_order if c in df.columns]]
        return df
    return pd.DataFrame()


def save_workout(sb: Client, user_id: int, exercise: str, sets: int, reps: int, weight: float) -> None:
    volume = sets * reps * weight
    row = {
        "user_id": user_id,
        "date": str(date.today()),
        "exercise": exercise,
        "sets": sets,
        "reps": reps,
        "weight": weight,
        "volume": volume,
    }
    sb.table("workouts").insert(row).execute()


# ─────────────────────────────────────────────────────────────────────────────
# 5. PROGRESSIVE OVERLOAD ALGORITHM
# ─────────────────────────────────────────────────────────────────────────────

BASELINE_SETS   = 3
BASELINE_REPS   = 10
BASELINE_WEIGHT = 30.0
WEIGHT_STEP     = 2.5
TARGET_SETS     = 3


def calculate_prescription(last) -> dict:
    """
    Given the last workout row (or None), returns the prescribed
    sets, reps, and weight for the next session.

    Rules:
      No history          -> 3 x 10 @ 30 kg  (baseline)
      Last was 3 x 10+    -> weight +2.5 kg, target 8 reps
      Last was 3 x 8 or 9 -> same weight, target 10 reps
      Any other result    -> repeat same prescription
    """
    if last is None:
        return {"sets": BASELINE_SETS, "reps": BASELINE_REPS, "weight": BASELINE_WEIGHT}

    prev_sets   = int(last["sets"])
    prev_reps   = int(last["reps"])
    prev_weight = float(last["weight"])

    if prev_sets >= TARGET_SETS and prev_reps >= 10:
        return {"sets": TARGET_SETS, "reps": 8, "weight": prev_weight + WEIGHT_STEP}
    elif prev_sets >= TARGET_SETS and prev_reps in (8, 9):
        return {"sets": TARGET_SETS, "reps": 10, "weight": prev_weight}
    else:
        return {"sets": prev_sets, "reps": prev_reps, "weight": prev_weight}


# ─────────────────────────────────────────────────────────────────────────────
# 6. SIDEBAR NAVIGATION
# ─────────────────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown('<div class="wayt-logo">Wayt</div>', unsafe_allow_html=True)
    st.markdown('<div class="wayt-tagline">Progressive Overload Tracker</div>', unsafe_allow_html=True)
    st.markdown("---")

    page = st.radio(
        "Navigatie",
        options=[
            "Workout Loggen",
            "Voortgang",
            "PWS Admin Data",
        ],
        label_visibility="collapsed",
    )

    st.markdown("---")
    st.markdown(
        "<small style='color:#555580;'>PWS Onderzoeksproject 2026<br>"
        "Aangedreven door Supabase + Streamlit</small>",
        unsafe_allow_html=True,
    )

# ─────────────────────────────────────────────────────────────────────────────
# 7. DATABASE INIT
# ─────────────────────────────────────────────────────────────────────────────

try:
    sb = get_supabase()
    ensure_seed_users(sb)
    users_df = get_users(sb)
    user_options = dict(zip(users_df["name"], users_df["id"]))
    db_connected = True
except Exception as e:
    db_connected = False
    st.error(
        f"Database verbinding mislukt. Controleer je Streamlit Secrets.\n\n{e}"
    )
    st.stop()

EXERCISES = ["Lat Pulldown", "Smith Machine Bench Press"]

# ─────────────────────────────────────────────────────────────────────────────
# 8. PAGE 1 – WORKOUT LOGGEN
# ─────────────────────────────────────────────────────────────────────────────

if page == "Workout Loggen":

    st.title("Workout Loggen")
    st.markdown("Log je training en ontvang een slimme aanbeveling op basis van je vorige sessie.")
    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        selected_user_name = st.selectbox(
            "Selecteer gebruiker",
            options=list(user_options.keys()),
            key="log_user",
        )
    with col2:
        selected_exercise = st.selectbox(
            "Selecteer oefening",
            options=EXERCISES,
            key="log_exercise",
        )

    selected_user_id = user_options[selected_user_name]

    st.markdown("### Slim Advies")

    last_workout = get_last_workout(sb, selected_user_id, selected_exercise)
    prescription = calculate_prescription(last_workout)

    if last_workout is None:
        st.info(
            "Geen vorige sessie gevonden voor deze oefening.\n\n"
            f"Begin met het startgewicht: **{prescription['sets']} sets x "
            f"{prescription['reps']} herhalingen @ {prescription['weight']} kg**."
        )
    else:
        prev_sets   = last_workout["sets"]
        prev_reps   = last_workout["reps"]
        prev_weight = last_workout["weight"]
        prev_date   = last_workout["date"]

        st.info(
            f"**Vorige sessie ({prev_date}):** "
            f"{prev_sets}x{prev_reps} met **{prev_weight} kg**\n\n"
            f"**Jouw doel voor vandaag is: {prescription['sets']} sets van "
            f"{prescription['reps']} herhalingen met {prescription['weight']} kg.**"
        )

    st.markdown("### Vul je training in")

    with st.form("log_form", clear_on_submit=True):
        fc1, fc2, fc3 = st.columns(3)
        with fc1:
            actual_sets = st.number_input(
                "Sets", min_value=1, max_value=10,
                value=prescription["sets"], step=1,
            )
        with fc2:
            actual_reps = st.number_input(
                "Herhalingen", min_value=1, max_value=30,
                value=prescription["reps"], step=1,
            )
        with fc3:
            actual_weight = st.number_input(
                "Gewicht (kg)", min_value=0.0, max_value=300.0,
                value=float(prescription["weight"]), step=2.5, format="%.1f",
            )

        volume_preview = actual_sets * actual_reps * actual_weight
        st.markdown(
            f"<div style='color:#9090c0; font-size:0.9rem; margin:4px 0 12px;'>"
            f"Berekend volume: <strong style='color:#a78bfa;'>{volume_preview:.0f} kg</strong>"
            f"</div>",
            unsafe_allow_html=True,
        )

        submitted = st.form_submit_button("Sla Training Op", use_container_width=True)

    if submitted:
        try:
            save_workout(
                sb,
                user_id=selected_user_id,
                exercise=selected_exercise,
                sets=int(actual_sets),
                reps=int(actual_reps),
                weight=float(actual_weight),
            )
            st.success(
                f"Training opgeslagen! "
                f"{int(actual_sets)}x{int(actual_reps)} @ {actual_weight} kg - "
                f"Volume: **{volume_preview:.0f} kg**"
            )
            st.balloons()
        except Exception as e:
            st.error(f"Fout bij opslaan: {e}")

# ─────────────────────────────────────────────────────────────────────────────
# 9. PAGE 2 – VOORTGANG
# ─────────────────────────────────────────────────────────────────────────────

elif page == "Voortgang":

    st.title("Voortgang")
    st.markdown("Bekijk je volume-ontwikkeling per oefening in de loop van de tijd.")
    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        prog_user_name = st.selectbox(
            "Selecteer gebruiker",
            options=list(user_options.keys()),
            key="prog_user",
        )
    with col2:
        prog_exercise = st.selectbox(
            "Selecteer oefening",
            options=EXERCISES,
            key="prog_exercise",
        )

    prog_user_id = user_options[prog_user_name]
    df = get_workouts_for_user(sb, prog_user_id, prog_exercise)

    if df.empty:
        st.warning(
            f"Geen data gevonden voor **{prog_user_name}** - **{prog_exercise}**.\n\n"
            "Log eerst een training op de pagina 'Workout Loggen'."
        )
    else:
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

        first_volume   = float(df["volume"].iloc[0])
        last_volume    = float(df["volume"].iloc[-1])
        pct_change     = ((last_volume - first_volume) / first_volume * 100) if first_volume > 0 else 0.0
        total_sessions = len(df)

        m1, m2, m3 = st.columns(3)
        with m1:
            st.metric("Sessies", total_sessions)
        with m2:
            st.metric(
                "Huidig Volume",
                f"{last_volume:.0f} kg",
                delta=f"{last_volume - first_volume:+.0f} kg t.o.v. dag 1",
            )
        with m3:
            st.metric(
                "Totale Groei",
                f"{pct_change:+.1f}%",
                delta="t.o.v. eerste sessie",
            )

        st.markdown("---")
        st.markdown("### Volume per Sessie")

        fig = px.line(
            df, x="date", y="volume", markers=True,
            title=f"Volume - {prog_user_name} - {prog_exercise}",
            labels={"date": "Datum", "volume": "Volume (kg)"},
            color_discrete_sequence=["#a78bfa"],
        )
        fig.update_traces(
            line=dict(width=2.5),
            marker=dict(size=8, color="#ec4899", line=dict(color="#ffffff", width=1.5)),
        )
        fig.update_layout(
            paper_bgcolor="#0d0d1a",
            plot_bgcolor="#13132a",
            font=dict(family="Inter", color="#c0c0e0"),
            title_font=dict(size=15, color="#c4b5fd"),
            xaxis=dict(gridcolor="#2a2a4a", linecolor="#3a3a6a", tickformat="%d %b '%y"),
            yaxis=dict(gridcolor="#2a2a4a", linecolor="#3a3a6a"),
            hovermode="x unified",
            hoverlabel=dict(bgcolor="#1e1e3a", font_color="#e0e0f0"),
            margin=dict(l=0, r=0, t=40, b=0),
        )
        st.plotly_chart(fig, use_container_width=True)

        st.markdown("### Gewicht per Sessie")

        fig2 = px.bar(
            df, x="date", y="weight",
            title=f"Gewicht - {prog_user_name} - {prog_exercise}",
            labels={"date": "Datum", "weight": "Gewicht (kg)"},
            color_discrete_sequence=["#7c3aed"],
        )
        fig2.update_layout(
            paper_bgcolor="#0d0d1a",
            plot_bgcolor="#13132a",
            font=dict(family="Inter", color="#c0c0e0"),
            title_font=dict(size=15, color="#c4b5fd"),
            xaxis=dict(gridcolor="#2a2a4a", linecolor="#3a3a6a", tickformat="%d %b '%y"),
            yaxis=dict(gridcolor="#2a2a4a", linecolor="#3a3a6a"),
            hoverlabel=dict(bgcolor="#1e1e3a", font_color="#e0e0f0"),
            margin=dict(l=0, r=0, t=40, b=0),
        )
        st.plotly_chart(fig2, use_container_width=True)

        st.markdown("### Sessie Details")
        display_df = df[["date", "sets", "reps", "weight", "volume"]].copy()
        display_df["date"] = display_df["date"].dt.strftime("%d-%m-%Y")
        display_df.columns = ["Datum", "Sets", "Herhalingen", "Gewicht (kg)", "Volume (kg)"]
        st.dataframe(display_df, use_container_width=True, hide_index=True)

# ─────────────────────────────────────────────────────────────────────────────
# 10. PAGE 3 – PWS ADMIN DATA
# ─────────────────────────────────────────────────────────────────────────────

elif page == "PWS Admin Data":

    st.title("PWS Admin Data")
    st.markdown(
        "Bekijk hier alle ruwe trainingsdata uit de database. "
        "Download de data als CSV voor je onderzoeksanalyse."
    )
    st.markdown("---")

    all_df = get_all_workouts(sb)

    if all_df.empty:
        st.warning("De database bevat nog geen trainingsdata.")
    else:
        total_rows   = len(all_df)
        unique_users = all_df["user_id"].nunique() if "user_id" in all_df.columns else "-"
        date_range   = (
            f"{all_df['date'].min()} tot {all_df['date'].max()}"
            if "date" in all_df.columns else "-"
        )

        s1, s2, s3 = st.columns(3)
        with s1:
            st.metric("Totaal Sessies", total_rows)
        with s2:
            st.metric("Proefpersonen", unique_users)
        with s3:
            st.metric("Periode", date_range)

        st.markdown("---")
        st.markdown("### Ruwe Database Tabel")

        display_admin = all_df.copy()
        if "weight" in display_admin.columns:
            display_admin["weight"] = display_admin["weight"].apply(lambda x: f"{float(x):.1f}")
        if "volume" in display_admin.columns:
            display_admin["volume"] = display_admin["volume"].apply(lambda x: f"{float(x):.0f}")

        rename_map = {
            "id": "ID",
            "naam": "Naam",
            "user_id": "Gebruiker ID",
            "date": "Datum",
            "exercise": "Oefening",
            "sets": "Sets",
            "reps": "Herhalingen",
            "weight": "Gewicht (kg)",
            "volume": "Volume (kg)",
        }
        display_admin = display_admin.rename(
            columns={k: v for k, v in rename_map.items() if k in display_admin.columns}
        )

        st.dataframe(display_admin, use_container_width=True, hide_index=True)

        st.markdown("---")
        csv_bytes = all_df.to_csv(index=False).encode("utf-8")

        st.download_button(
            label="Download als CSV (wayt_onderzoeksdata.csv)",
            data=csv_bytes,
            file_name="wayt_onderzoeksdata.csv",
            mime="text/csv",
            use_container_width=True,
        )

        st.markdown(
            "<small style='color:#555580;'>* De CSV bevat alle kolommen in het originele formaat.</small>",
            unsafe_allow_html=True,
        )
