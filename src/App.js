import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient";

// ---------- UTILITIES ----------
function getFlagEmoji(country) {
  if (!country) return "";
  const code = country
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  return String.fromCodePoint(
    ...[...code].map((c) => c.charCodeAt(0) + 127397)
  );
}

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const diff = Date.now() - birth.getTime();
  return new Date(diff).getUTCFullYear() - 1970;
}

// ---------- STYLES ----------
const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    padding: "16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "white",
  },
  appShell: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    padding: "12px 16px",
    background: "#020617",
    borderRadius: 16,
    border: "1px solid #1f2937",
    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
    position: "sticky",
    top: 8,
    zIndex: 20,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#22c55e,#2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 16,
  },
  brandTextMain: {
    fontSize: 18,
    fontWeight: 700,
  },
  brandTextSub: {
    fontSize: 12,
    color: "#9ca3af",
  },
  tab: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
  },
  tabActive: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #22c55e",
    background: "#22c55e",
    color: "#020617",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  logout: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #ef4444",
    background: "rgba(248,113,113,0.1)",
    color: "#fecaca",
    cursor: "pointer",
    fontSize: 13,
  },
  container: {
    maxWidth: 900,
    margin: "24px auto",
    background: "#020617",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
    border: "1px solid #1f2937",
  },
  sectionHeader: {
    marginBottom: 8,
    fontSize: 20,
    fontWeight: 600,
  },
  sectionSub: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #374151",
    marginBottom: 12,
    fontSize: 14,
    background: "#020617",
    color: "#e5e7eb",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #374151",
    marginBottom: 12,
    fontSize: 14,
    minHeight: 80,
    background: "#020617",
    color: "#e5e7eb",
  },
  buttonPrimaryFull: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 999,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  th: {
    padding: "10px",
    border: "1px solid #1f2937",
    textAlign: "center",
    fontWeight: "bold",
    background: "#020617",
    color: "#e5e7eb",
  },
  td: {
    padding: "10px",
    border: "1px solid #111827",
    textAlign: "center",
    color: "#e5e7eb",
  },
  postCard: {
    background: "#020617",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    border: "1px solid #1f2937",
  },
  pill: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(148,163,184,0.1)",
    color: "#e5e7eb",
    fontSize: 11,
    marginRight: 4,
  },
};

// ---------- AUTH SCREEN ----------
function AuthScreen({ signIn, signUp, resetPassword }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (mode === "signin") {
        result = await signIn(email.trim(), password);
        if (result?.error) {
          setError(result.error.message || "Could not sign in.");
        }
      } else {
        result = await signUp(email.trim(), password);
        if (result?.error) {
          const raw = result.error.message || "";
          const lower = raw.toLowerCase();
          // friendlier message when email already exists
          if (
            lower.includes("already registered") ||
            lower.includes("already exists") ||
            lower.includes("duplicate")
          ) {
            setError(
              "An account already exists with this email. Try signing in instead."
            );
          } else {
            setError(raw || "Could not create account.");
          }
        } else {
          setMessage(
            "Account created. Check your email to confirm, then sign in."
          );
          setMode("signin");
          setPassword("");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(
        "Enter your email address above, then click “Forgot password?”."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result?.error) {
        setError(result.error.message || "Could not send reset email.");
      } else {
        setMessage(
          "If an account exists for this email, a password reset link has been sent."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1>SportsLink</h1>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          {mode === "signin"
            ? "Sign in to connect players, coaches, and clubs."
            : "Create your account to build your football profile."}
        </p>

        {/* Toggle buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            style={mode === "signin" ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            style={mode === "signup" ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Create account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #b91c1c",
              background: "rgba(248,113,113,0.1)",
              color: "#fecaca",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #16a34a",
              background: "rgba(34,197,94,0.1)",
              color: "#bbf7d0",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "signin" && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            style={styles.buttonPrimaryFull}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------- PROFILE VIEW ----------
function ProfileView({ profile, onSave, email }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    nationality: profile?.nationality || "",
    position: profile?.position || "",
    club: profile?.club || "",
    height: profile?.height || "",
    weight: profile?.weight || "",
    dob: profile?.dob || "",
    preferred_foot: profile?.preferred_foot || "",
    summary: profile?.summary || "",
    cover_photo: profile?.cover_photo || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      nationality: profile?.nationality || "",
      position: profile?.position || "",
      club: profile?.club || "",
      height: profile?.height || "",
      weight: profile?.weight || "",
      dob: profile?.dob || "",
      preferred_foot: profile?.preferred_foot || "",
      summary: profile?.summary || "",
      cover_photo: profile?.cover_photo || "",
    });
  }, [profile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const missing = [];

    if (!form.full_name.trim()) missing.push("Full name");
    if (!form.nationality.trim()) missing.push("Nationality");
    if (!form.position.trim()) missing.push("Position");
    if (!form.dob) missing.push("Date of birth");

    if (missing.length > 0) {
      setError(
        `Please fill in: ${missing.join(", ")}. These are important for your profile.`
      );
      return false;
    }

    // Basic DOB sanity check (no future dates)
    if (form.dob) {
      const dobDate = new Date(form.dob);
      const today = new Date();
      if (dobDate > today) {
        setError("Date of birth cannot be in the future.");
        return false;
      }
    }

    setError("");
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, photoFile });
  }

  // Profile completeness (simple: count non-empty fields)
  const fieldsForCompletion = [
    "full_name",
    "bio",
    "nationality",
    "position",
    "club",
    "height",
    "weight",
    "dob",
    "preferred_foot",
    "summary",
  ];
  const filledCount = fieldsForCompletion.filter((key) => {
    const v = form[key];
    return v !== undefined && String(v).trim() !== "";
  }).length;
  const completion = Math.round(
    (filledCount / fieldsForCompletion.length) * 100
  );

  return (
    <div style={styles.container}>
      <h2>My Profile</h2>
      <p style={{ color: "#6b7280", marginBottom: 12 }}>
        Logged in as {email}. Complete your profile so clubs and coaches can
        quickly understand who you are.
      </p>

      {/* Profile completeness bar */}
      <div
        style={{
          marginBottom: 16,
          padding: "8px 10px",
          borderRadius: 12,
          border: "1px solid #1f2937",
          background: "#020617",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
            fontSize: 13,
          }}
        >
          <span>Profile completeness</span>
          <span style={{ fontWeight: 600 }}>{completion}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 999,
            background: "#111827",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${completion}%`,
              height: "100%",
              background:
                completion < 50
                  ? "#f97316" // orange
                  : completion < 80
                  ? "#22c55e" // green
                  : "#22c55e",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #b91c1c",
            background: "rgba(248,113,113,0.1)",
            color: "#fecaca",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {profile?.photo_url && (
        <img
          src={profile.photo_url}
          alt=""
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
      )}

      <form onSubmit={handleSubmit}>
        <label>Profile photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 12 }}
        />

        <label>Full name *</label>
        <input
          style={styles.input}
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder="e.g. John Doe"
        />

        <label>Short bio</label>
        <textarea
          style={styles.textarea}
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Example: Left-footed winger with strong 1v1 ability and high work rate."
        />

        <label>Nationality *</label>
        <input
          style={styles.input}
          name="nationality"
          value={form.nationality}
          onChange={handleChange}
          placeholder="e.g. Nigeria, Canada"
        />

        <label>Position *</label>
        <input
          style={styles.input}
          name="position"
          value={form.position}
          onChange={handleChange}
          placeholder="e.g. ST, LW, RW, CM, DM, CB, GK"
        />

        <label>Club / Academy</label>
        <input
          style={styles.input}
          name="club"
          value={form.club}
          onChange={handleChange}
          placeholder="e.g. City United Abuja"
        />

        {/* Height / weight / preferred foot in one row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          <div>
            <label>Height (cm)</label>
            <input
              style={styles.input}
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="e.g. 180"
            />
          </div>
          <div>
            <label>Weight (kg)</label>
            <input
              style={styles.input}
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="e.g. 75"
            />
          </div>
          <div>
            <label>Preferred foot</label>
            <input
              style={styles.input}
              name="preferred_foot"
              value={form.preferred_foot}
              onChange={handleChange}
              placeholder="Left, Right, Both"
            />
          </div>
        </div>

        <label style={{ marginTop: 8, display: "block" }}>Date of birth *</label>
        <input
          style={styles.input}
          type="date"
          name="dob"
          value={form.dob || ""}
          onChange={handleChange}
        />

        <label>Summary / About</label>
        <textarea
          style={styles.textarea}
          name="summary"
          value={form.summary}
          onChange={handleChange}
          placeholder="Tell clubs what makes you unique: style of play, strengths, key moments in your career."
        />

        <label>Cover photo URL (optional)</label>
        <input
          style={styles.input}
          name="cover_photo"
          value={form.cover_photo}
          onChange={handleChange}
          placeholder="Paste an image URL or leave blank"
        />

        <button type="submit" style={styles.buttonPrimaryFull}>
          Save Profile
        </button>
      </form>
    </div>
  );
}

// ---------- FEED VIEW ----------
function FeedView({
  posts,
  newPost,
  setNewPost,
  createPost,
  highlights,
  highlightTitle,
  setHighlightTitle,
  setHighlightFile,
  uploadHighlight,
}) {
  return (
    <div style={styles.container}>
      <h2 style={styles.sectionHeader}>Feed</h2>
      <p style={styles.sectionSub}>
        Share updates about your training, matches, or achievements. Coaches
        see this first.
      </p>

      <textarea
        style={styles.textarea}
        placeholder="Share an update..."
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
      />
      <button style={styles.buttonPrimaryFull} onClick={createPost}>
        Post update
      </button>

      <h3 style={{ marginTop: 24, marginBottom: 4 }}>Upload highlight</h3>
      <p style={{ ...styles.sectionSub, marginBottom: 8 }}>
        Short, sharp clips work best. Show your decision-making, not just skills.
      </p>
      <input
        style={styles.input}
        placeholder="Highlight title"
        value={highlightTitle}
        onChange={(e) => setHighlightTitle(e.target.value)}
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setHighlightFile(e.target.files?.[0] || null)}
        style={{ marginBottom: 12 }}
      />
      <button style={styles.buttonPrimaryFull} onClick={uploadHighlight}>
        Upload highlight
      </button>

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Highlights</h3>
      {highlights.length === 0 ? (
        <p style={styles.emptyText}>
          You don’t have any highlights yet. Upload a clip from a recent match
          or training session.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {highlights.map((h) => (
            <div key={h.id} style={styles.postCard}>
              <strong>{h.title}</strong>
              <video
                src={h.video_url}
                controls
                style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
              />
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Recent posts</h3>
      {posts.length === 0 ? (
        <p style={styles.emptyText}>
          No posts yet. Share your first update to let others see what you’re
          working on.
        </p>
      ) : (
        posts.map((p) => (
          <div key={p.id} style={styles.postCard}>
            {p.content}
          </div>
        ))
      )}
    </div>
  );
}

// ---------- SEARCH VIEW ----------
function SearchView(props) {
  // support either props.profiles or props.allProfiles + optional currentUserId
  const { profiles, allProfiles, currentUserId, onOpenProfile } = props;

  const baseList = (profiles || allProfiles || []).filter(
    (p) => p && p.id && p.id !== currentUserId
  );

  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [sortBy, setSortBy] = useState("nameAsc"); // nameAsc | ageAsc | ageDesc | position | club

  const [favorites, setFavorites] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Load favorites + saved searches from localStorage (so they persist)
  useEffect(() => {
    try {
      const favRaw = window.localStorage.getItem("sl_favorites");
      const savedRaw = window.localStorage.getItem("sl_saved_searches");
      if (favRaw) setFavorites(JSON.parse(favRaw));
      if (savedRaw) setSavedSearches(JSON.parse(savedRaw));
    } catch (e) {
      console.warn("Could not load saved search data", e);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("sl_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.warn("Could not save favorites", e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "sl_saved_searches",
        JSON.stringify(savedSearches)
      );
    } catch (e) {
      console.warn("Could not save searches", e);
    }
  }, [savedSearches]);

  function toggleFavorite(id) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSaveSearch() {
    // If no filters at all, don't save
    if (
      !query.trim() &&
      !position &&
      !nationality &&
      !minAge &&
      !maxAge &&
      sortBy === "nameAsc"
    ) {
      return;
    }

    const labelParts = [];
    if (query.trim()) labelParts.push(`"${query.trim()}"`);
    if (position) labelParts.push(position.toUpperCase());
    if (nationality) labelParts.push(nationality);
    if (minAge || maxAge) {
      labelParts.push(`Age ${minAge || "–"}–${maxAge || "–"}`);
    }
    labelParts.push(
      sortBy === "nameAsc"
        ? "Name ↑"
        : sortBy === "ageAsc"
        ? "Age ↑"
        : sortBy === "ageDesc"
        ? "Age ↓"
        : sortBy === "position"
        ? "Position"
        : "Club"
    );

    const label = labelParts.join(" • ");

    const newSearch = {
      id: Date.now(),
      label,
      query,
      position,
      nationality,
      minAge,
      maxAge,
      sortBy,
    };

    setSavedSearches((prev) => [newSearch, ...prev].slice(0, 10)); // keep last 10
  }

  function applySavedSearch(saved) {
    setQuery(saved.query || "");
    setPosition(saved.position || "");
    setNationality(saved.nationality || "");
    setMinAge(saved.minAge || "");
    setMaxAge(saved.maxAge || "");
    setSortBy(saved.sortBy || "nameAsc");
  }

  // ---- Filtering ----
  const filtered = baseList.filter((p) => {
    const name =
      p.full_name || p.username || p.email || "";
    const club = p.club || "";
    const pos = p.position || "";
    const nat = p.nationality || "";

    if (
      query.trim() &&
      !(
        name.toLowerCase().includes(query.toLowerCase()) ||
        club.toLowerCase().includes(query.toLowerCase())
      )
    ) {
      return false;
    }

    if (position && !pos.toLowerCase().includes(position.toLowerCase())) {
      return false;
    }

    if (
      nationality &&
      !nat.toLowerCase().includes(nationality.toLowerCase())
    ) {
      return false;
    }

    // Age filter
    const age = calculateAge(p.dob);
    const ageIsNumber =
      typeof age === "number" && !Number.isNaN(age);

    if (minAge && ageIsNumber && age < Number(minAge)) {
      return false;
    }
    if (maxAge && ageIsNumber && age > Number(maxAge)) {
      return false;
    }

    // If age is missing and age filter is set, we keep them by default.
    // If you prefer to hide players without DOB when age filter is used,
    // you could change this logic.

    return true;
  });

  // ---- Sorting ----
  const sorted = [...filtered].sort((a, b) => {
    const nameA =
      (a.full_name || a.username || a.email || "").toLowerCase();
    const nameB =
      (b.full_name || b.username || b.email || "").toLowerCase();

    const ageA = calculateAge(a.dob);
    const ageB = calculateAge(b.dob);
    const clubA = (a.club || "").toLowerCase();
    const clubB = (b.club || "").toLowerCase();
    const posA = (a.position || "").toLowerCase();
    const posB = (b.position || "").toLowerCase();

    if (sortBy === "ageAsc") {
      return (ageA || 0) - (ageB || 0);
    }
    if (sortBy === "ageDesc") {
      return (ageB || 0) - (ageA || 0);
    }
    if (sortBy === "position") {
      if (posA < posB) return -1;
      if (posA > posB) return 1;
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "club") {
      if (clubA < clubB) return -1;
      if (clubA > clubB) return 1;
      return nameA.localeCompare(nameB);
    }

    // default: nameAsc
    return nameA.localeCompare(nameB);
  });

  return (
    <div style={styles.container}>
      <h2>Search players</h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Discover players and coaches. Use filters and sorting to narrow down
        your search, then click a card to view the public profile.
      </p>

      {/* Filters row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,2.5fr) minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <input
          style={styles.input}
          placeholder="Search by name or club..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Position (e.g. ST, CM, CB)"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Nationality (e.g. Nigeria)"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
        />
        <input
          style={styles.input}
          type="number"
          min="10"
          max="60"
          placeholder="Min age"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
        />
        <input
          style={styles.input}
          type="number"
          min="10"
          max="60"
          placeholder="Max age"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
        />
      </div>

      {/* Sorting + Save search */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              ...styles.input,
              width: "auto",
              paddingRight: 28,
            }}
          >
            <option value="nameAsc">Name (A–Z)</option>
            <option value="ageAsc">Age (youngest first)</option>
            <option value="ageDesc">Age (oldest first)</option>
            <option value="position">Position</option>
            <option value="club">Club</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSaveSearch}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Save this search
        </button>
      </div>

      {/* Saved searches */}
      {savedSearches.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            Saved searches:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {savedSearches.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applySavedSearch(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {sorted.length === 0 ? (
        <p style={{ color: "#9ca3af", marginTop: 12 }}>
          No profiles match these filters yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
            marginTop: 8,
          }}
        >
          {sorted.map((p) => {
            const age = calculateAge(p.dob);
            const isFavorite = favorites.includes(p.id);

            return (
              <div
                key={p.id}
                style={{
                  ...styles.postCard,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
                onClick={() => onOpenProfile && onOpenProfile(p.id)}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  {p.photo_url && (
                    <img
                      src={p.photo_url}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                        fontSize: 15,
                      }}
                    >
                      {p.full_name || p.username || p.email}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginBottom: 4,
                      }}
                    >
                      {p.position && (
                        <span style={styles.pill}>{p.position}</span>
                      )}
                      {p.club && <span style={styles.pill}>{p.club}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {p.nationality
                        ? `${getFlagEmoji(p.nationality)} ${
                            p.nationality
                          }`
                        : ""}
                      {age !== "" && ` • Age ${age}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // don’t open profile when toggling favorite
                      toggleFavorite(p.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                    title={
                      isFavorite ? "Remove from favourites" : "Add to favourites"
                    }
                  >
                    {isFavorite ? "★" : "☆"}
                  </button>
                </div>

                {p.bio && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      maxHeight: 40,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.bio}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- MESSAGES VIEW (SUPABASE-BACKED) ----------
function MessagesView({ profiles, currentUserId, messages, onSendMessage }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [draft, setDraft] = useState("");

  const contacts = (profiles || []).filter(
    (p) => p && p.id && p.id !== currentUserId
  );

  const selectedUser =
    contacts.find((p) => p.id === selectedUserId) || null;

  const chatMessages = (messages || []).filter(
    (m) =>
      (m.from_id === currentUserId && m.to_id === selectedUserId) ||
      (m.to_id === currentUserId && m.from_id === selectedUserId)
  );

  function handleSend() {
    if (!draft.trim() || !selectedUserId || !currentUserId) return;
    onSendMessage(selectedUserId, draft.trim());
    setDraft("");
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionHeader}>Messages</h2>
      <p style={styles.sectionSub}>
        Real chat stored in Supabase. Select a profile to start a conversation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
          minHeight: 300,
        }}
      >
        {/* Contacts */}
        <div
          style={{
            borderRight: "1px solid #1f2937",
            paddingRight: 12,
          }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Chats</h3>
          {contacts.length === 0 ? (
            <p style={styles.emptyText}>No other profiles found yet.</p>
          ) : (
            <div>
              {contacts.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    cursor: "pointer",
                    background:
                      selectedUserId === u.id ? "#111827" : "transparent",
                    border:
                      selectedUserId === u.id
                        ? "1px solid #22c55e"
                        : "1px solid #1f2937",
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 6,
                    gap: 8,
                  }}
                >
                  {u.photo_url && (
                    <img
                      src={u.photo_url}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {u.full_name || u.username || u.email}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {u.position || ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat window */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {!selectedUser ? (
            <p style={styles.emptyText}>
              Select a profile on the left to start a conversation.
            </p>
          ) : (
            <>
              <div
                style={{
                  borderBottom: "1px solid #1f2937",
                  paddingBottom: 8,
                  marginBottom: 8,
                }}
              >
                <strong>
                  Chat with{" "}
                  {selectedUser.full_name ||
                    selectedUser.username ||
                    selectedUser.email}
                </strong>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 8,
                  borderRadius: 12,
                  border: "1px solid #1f2937",
                  marginBottom: 8,
                  maxHeight: 320,
                }}
              >
                {chatMessages.length === 0 ? (
                  <p style={styles.emptyText}>No messages yet. Say hi 👋</p>
                ) : (
                  chatMessages.map((m) => {
                    const isMine = m.from_id === currentUserId;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "6px 10px",
                            borderRadius: 12,
                            background: isMine ? "#2563eb" : "#111827",
                            color: "white",
                            fontSize: 14,
                          }}
                        >
                          {m.text}
                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 2,
                              opacity: 0.7,
                            }}
                          >
                            {m.created_at
                              ? new Date(m.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: "#22c55e",
                    color: "#020617",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                  }}
                  onClick={handleSend}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- PUBLIC PROFILE VIEW ----------
function PublicProfileView({ profile, highlights }) {
  const p = profile;

  if (!p) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.sectionHeader}>Loading profile…</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, padding: 0 }}>
      {/* COVER BANNER */}
      <div
        style={{
          width: "100%",
          height: 220,
          backgroundImage: p.cover_photo
            ? `url(${p.cover_photo})`
            : "linear-gradient(to right, #003087, #d4af37)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {p.photo_url && (
          <img
            src={p.photo_url}
            alt=""
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              border: "5px solid white",
              position: "absolute",
              bottom: -70,
              left: "50%",
              transform: "translateX(-50%)",
              objectFit: "cover",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
          />
        )}
      </div>

      {/* MAIN HEADER */}
      <div style={{ marginTop: 80, textAlign: "center", padding: 16 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>
          {p.full_name || p.username}
        </h1>

        <div style={{ fontSize: 16, color: "#d1d5db", marginBottom: 2 }}>
          {p.position || "Player"}{" "}
          {p.nationality &&
            `· ${getFlagEmoji(p.nationality)} ${p.nationality}`}
        </div>

        <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 6 }}>
          {p.club ? `Club: ${p.club}` : "No club listed"}
        </div>

        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          Age: {calculateAge(p.dob) || "—"} · Height: {p.height || "—"} ·
          Weight: {p.weight || "—"} · Foot: {p.preferred_foot || "—"}
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{ padding: 20 }}>
        <h2 style={styles.sectionHeader}>About</h2>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14 }}>
          {p.summary || "No summary provided yet."}
        </p>
      </div>

      {/* ATTRIBUTES */}
      <div style={{ padding: 20 }}>
        <h2 style={styles.sectionHeader}>Attributes</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {p.attributes &&
            Object.entries(p.attributes).map(([attr, value]) => (
              <div
                key={attr}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  border: "6px solid #003087",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#003087",
                  background: "white",
                }}
              >
                <div style={{ fontSize: 20 }}>{value}</div>
                <div
                  style={{ fontSize: 11, marginTop: 4, textTransform: "capitalize" }}
                >
                  {attr}
                </div>
              </div>
            ))}
          {!p.attributes && (
            <p style={styles.emptyText}>No attribute scores added yet.</p>
          )}
        </div>
      </div>

      {/* CAREER STATS */}
      <div style={{ padding: 20 }}>
        <h2 style={styles.sectionHeader}>Career stats</h2>
        {Array.isArray(p.stats) && p.stats.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 10,
            }}
          >
            <thead>
              <tr style={{ background: "#003087", color: "white" }}>
                <th style={styles.th}>Season</th>
                <th style={styles.th}>Club</th>
                <th style={styles.th}>Matches</th>
                <th style={styles.th}>Goals</th>
                <th style={styles.th}>Assists</th>
                <th style={styles.th}>Clean Sheets</th>
              </tr>
            </thead>
            <tbody>
              {p.stats.map((row, i) => (
                <tr key={i}>
                  <td style={styles.td}>{row.season}</td>
                  <td style={styles.td}>{row.club}</td>
                  <td style={styles.td}>{row.matches}</td>
                  <td style={styles.td}>{row.goals}</td>
                  <td style={styles.td}>{row.assists}</td>
                  <td style={styles.td}>{row.clean_sheets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.emptyText}>No stats available.</p>
        )}
      </div>

      {/* CAREER HISTORY */}
      <div style={{ padding: 20 }}>
        <h2 style={styles.sectionHeader}>Career history</h2>
        {Array.isArray(p.career_history) && p.career_history.length > 0 ? (
          p.career_history.map((club, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                borderLeft: "4px solid #003087",
                marginBottom: 10,
                background: "#f9f9f9",
                color: "#111827",
              }}
            >
              <strong>{club.years}</strong> — {club.club}
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>No history provided yet.</p>
        )}
      </div>

      {/* HIGHLIGHTS */}
      <div style={{ padding: 20 }}>
        <h2 style={styles.sectionHeader}>Highlights</h2>
        {highlights.length === 0 ? (
          <p style={styles.emptyText}>No highlights uploaded for this player.</p>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {highlights.map((h) => (
              <div key={h.id}>
                <strong>{h.title}</strong>
                <video
                  src={h.video_url}
                  controls
                  style={{ width: "100%", borderRadius: 12, marginTop: 8 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- MAIN APP ----------
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // add this:
  const [forceLoggedOut, setForceLoggedOut] = useState(false);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  // feed | profile | publicProfile | search | messages
 const [view, setView] = useState("feed"); // feed | profile | publicProfile | search


  const [highlights, setHighlights] = useState([]);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [highlightFile, setHighlightFile] = useState(null);

  const [publicProfileUser, setPublicProfileUser] = useState(null);
  const [publicProfileHighlights, setPublicProfileHighlights] = useState([]);

  const [allProfiles, setAllProfiles] = useState([]);
  const [messages, setMessages] = useState([]);

  const [favorites, setFavorites] = useState([]); // array of profile IDs
const [savedSearches, setSavedSearches] = useState([]); // array of {id, label, query, position, nationality}

  // ---------- SUPABASE CONNECTION TEST ----------
  useEffect(() => {
    async function testSupabase() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(1);

        if (error) {
          console.error("Supabase TEST error:", error);
        } else {
          console.log("Supabase TEST success. Example row:", data?.[0]);
        }
      } catch (err) {
        console.error("Supabase TEST fatal error:", err);
      }
    }

    testSupabase();
  }, []);

// ---------- AUTH ----------
async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
}

async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { error };
}

async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { error };
}

async function signOut() {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch (error) {
    console.error("Error signing out:", error);
  }

  // tell the app: treat user as logged out from now on
  setForceLoggedOut(true);

  // clear all local state
  setSession(null);
  setProfile(null);
  setPosts([]);
  setHighlights([]);
  setPublicProfileUser(null);
  setPublicProfileHighlights([]);
  setAllProfiles([]);
  setMessages([]);
  setView("feed");
}

  // ---------- PROFILE ----------
 async function fetchProfile() {
  if (!session?.user) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error loading profile:", error);
  } else {
    setProfile(data);

    // If this looks like a brand new user (no profile yet),
    // push them to the Profile screen so they can fill it.
    if (!data || !data.full_name) {
      setView("profile");
    }
  }
}

  async function saveProfile(updates) {
    if (!session?.user) return;

    let photo_url = profile?.photo_url || null;

    if (updates.photoFile) {
      const file = updates.photoFile;
      const ext = file.name.split(".").pop();
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file);

      if (uploadError) {
        alert("Error uploading photo: " + uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);
        photo_url = publicUrlData.publicUrl;
      }
    }

    const payload = {
      id: session.user.id,
      ...(profile || {}),
      ...updates,
      photoFile: undefined,
      photo_url,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setProfile(data);
      alert("Profile saved!");
    }
  }

  // ---------- SEARCH HELPERS (favorites + saved searches) ----------
function toggleFavorite(profileId) {
  setFavorites((prev) =>
    prev.includes(profileId)
      ? prev.filter((id) => id !== profileId)
      : [...prev, profileId]
  );
}

function saveSearch(search) {
  const { query, position, nationality } = search;

  // Don't save completely empty filters
  if (!query && !position && !nationality) return;

  const parts = [];
  parts.push(query || "All players");
  if (position) parts.push(position);
  if (nationality) parts.push(nationality);
  const label = parts.join(" • ");

  setSavedSearches((prev) => [
    {
      id: Date.now(),
      label,
      query: query || "",
      position: position || "",
      nationality: nationality || "",
    },
    ...prev,
  ]);
}

function deleteSearch(id) {
  setSavedSearches((prev) => prev.filter((s) => s.id !== id));
}

  // ---------- POSTS ----------
  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
    } else {
      setPosts(data || []);
    }
  }

  async function createPost() {
    if (!session?.user || !newPost.trim()) return;

    const { error } = await supabase.from("posts").insert({
      user_id: session.user.id,
      content: newPost.trim(),
    });

    if (error) {
      alert(error.message);
    } else {
      setNewPost("");
      fetchPosts();
    }
  }

  // ---------- HIGHLIGHTS ----------
  async function fetchHighlights() {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading highlights:", error);
    } else {
      setHighlights(data || []);
    }
  }

  async function uploadHighlight() {
    if (!session?.user || !highlightFile || !highlightTitle.trim()) return;

    const file = highlightFile;
    const ext = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("highlights")
      .upload(filePath, file);

    if (uploadError) {
      alert("Error uploading highlight: " + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("highlights")
      .getPublicUrl(filePath);

    const video_url = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("highlights").insert({
      user_id: session.user.id,
      title: highlightTitle.trim(),
      video_url,
    });

    if (insertError) {
      alert("Error saving highlight record: " + insertError.message);
    } else {
      setHighlightTitle("");
      setHighlightFile(null);
      fetchHighlights();
    }
  }

    // ---------- MESSAGES (SUPABASE-BACKED) ----------
  async function fetchMessages() {
    if (!session?.user) return;
    const userId = session.user.id;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`from_id.eq.${userId},to_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }
  }

  async function sendMessage(toId, text) {
    if (!session?.user || !toId || !text.trim()) return;

    const userId = session.user.id;

    // Optimistic local update (instant UI)
    const tempMessage = {
      id: Date.now(), // temp local id
      from_id: userId,
      to_id: toId,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        from_id: userId,
        to_id: toId,
        text: text.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      // Optional: rollback or show toast
    } else if (data) {
      // Replace the temp message with real one
      setMessages((prev) => {
        return [...prev.filter((m) => m !== tempMessage), data];
      });
    }
  }

  // ---------- PUBLIC PROFILE ----------
  async function fetchPublicProfileData(userId) {
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (pErr) {
      console.error("Error loading public profile:", pErr);
    } else {
      setPublicProfileUser(p);
    }

    const { data: hData, error: hErr } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (hErr) {
      console.error("Error loading public highlights:", hErr);
    } else {
      setPublicProfileHighlights(hData || []);
    }
  }

  function openPublicProfile(userId) {
    setPublicProfileUser(null);
    setPublicProfileHighlights([]);
    setView("publicProfile");
    fetchPublicProfileData(userId);
  }

  // ---------- ALL PROFILES (search, messages) ----------
  async function fetchAllProfiles() {
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
      console.error("Error loading all profiles:", error);
    } else {
      setAllProfiles(data || []);
    }
  }

  // ---------- EFFECTS ----------
 useEffect(() => {
  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!forceLoggedOut) {
      setSession(session);
    }
    setLoading(false);

    supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!forceLoggedOut) {
        setSession(newSession);
      }
    });
  }
  init();
}, [forceLoggedOut]);

useEffect(() => {
  if (session?.user && !forceLoggedOut) {
    // These should already exist in your App:
    fetchProfile();
    fetchPosts();
    fetchHighlights();
    fetchAllProfiles();
    fetchMessages();  // 👉 new
  } else if (!session?.user) {
    // Optional: clear state when logged out
    setProfile(null);
    setPosts([]);
    setHighlights([]);
    setAllProfiles([]);
    setMessages([]);
  }
}, [session, forceLoggedOut]);

// ---------- REALTIME MESSAGES SUBSCRIPTION ----------
useEffect(() => {
  if (!session?.user || forceLoggedOut) return;

  const userId = session.user.id;

  const channel = supabase
    .channel("messages-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const msg = payload.new;
        // Only care about messages that involve this user
        if (msg.from_id === userId || msg.to_id === userId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session, forceLoggedOut]);


// Load favorites & saved searches from localStorage on first load
useEffect(() => {
  try {
    const favRaw = window.localStorage.getItem("sl_favorites");
    if (favRaw) {
      setFavorites(JSON.parse(favRaw));
    }
    const searchRaw = window.localStorage.getItem("sl_saved_searches");
    if (searchRaw) {
      setSavedSearches(JSON.parse(searchRaw));
    }
  } catch (e) {
    console.warn("Could not load saved favorites/searches", e);
  }
}, []);

// Persist favorites & saved searches whenever they change
useEffect(() => {
  try {
    window.localStorage.setItem("sl_favorites", JSON.stringify(favorites));
    window.localStorage.setItem(
      "sl_saved_searches",
      JSON.stringify(savedSearches)
    );
  } catch (e) {
    console.warn("Could not save favorites/searches", e);
  }
}, [favorites, savedSearches]);



  // ---------- RENDER ----------
  if (loading) {
    return (
      <div style={styles.page}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!session || forceLoggedOut) {
    return (
      <AuthScreen
        signIn={signIn}
        signUp={signUp}
        resetPassword={resetPassword}
      />
    );
  }

  const currentUserId = session.user.id;

  return (
    <div style={styles.page}>
      <div style={styles.appShell}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoCircle}>SL</div>
            <div>
              <div style={styles.brandTextMain}>SportsLink</div>
              <div style={styles.brandTextSub}>
                Football profiles • Highlights • Connections
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              style={view === "feed" ? styles.tabActive : styles.tab}
              onClick={() => setView("feed")}
            >
              Feed
            </button>
            <button
              style={view === "search" ? styles.tabActive : styles.tab}
              onClick={() => setView("search")}
            >
              Search
            </button>
            <button
              style={view === "messages" ? styles.tabActive : styles.tab}
              onClick={() => setView("messages")}
            >
              Messages
            </button>
            <button
              style={view === "profile" ? styles.tabActive : styles.tab}
              onClick={() => setView("profile")}
            >
              Profile
            </button>
            <button style={styles.logout} onClick={signOut}>
              Logout
            </button>
          </div>
        </header>

        {view === "profile" && (
          <ProfileView
            profile={profile}
            onSave={saveProfile}
            email={session.user.email}
          />
        )}

        {view === "feed" && (
          <FeedView
            posts={posts}
            newPost={newPost}
            setNewPost={setNewPost}
            createPost={createPost}
            highlights={highlights}
            highlightTitle={highlightTitle}
            setHighlightTitle={setHighlightTitle}
            setHighlightFile={setHighlightFile}
            uploadHighlight={uploadHighlight}
          />
        )}

        {view === "publicProfile" && (
          <PublicProfileView
            profile={publicProfileUser}
            highlights={publicProfileHighlights}
          />
        )}

        {view === "search" && (
          <SearchView
            profiles={allProfiles}
            currentUserId={currentUserId}
            onOpenProfile={openPublicProfile}
          />
        )}

        {view === "messages" && (
          <MessagesView
            profiles={allProfiles}
            currentUserId={currentUserId}
            messages={messages}
            onSendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
}

export default App;
