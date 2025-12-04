import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  const [view, setView] = useState("feed"); // "feed" | "profile" | "search" | "messages"

  // Highlights (videos)
  const [highlights, setHighlights] = useState([]);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [highlightFile, setHighlightFile] = useState(null);

  // Search & follow
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    country: "",
    position: "",
    minAge: "",
    maxAge: "",
  });
  const [followingIds, setFollowingIds] = useState([]);

  // Messaging
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ---------- AUTH SESSION ----------
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // When logged in, load profile, posts, highlights, profiles, follows
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchPosts();
      fetchHighlights();
      fetchAllProfiles();
      fetchFollowing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ---------- AUTH ----------
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000",
      },
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Sign up successful. You can now log in.");
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setPosts([]);
    setHighlights([]);
    setAllProfiles([]);
    setFollowingIds([]);
    setSelectedChatUserId(null);
    setMessages([]);
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
    }
  }

  async function saveProfile(updates) {
    if (!session?.user) return;

    let photo_url = profile?.photo_url || null;

    // If a new image file was selected
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

  // ---------- POSTS ----------
  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
    } else {
      setPosts(data || []);
    }
  }

  async function createPost() {
    if (!session?.user) return;

    const content = newPost.trim();
    if (!content) return;

    const { error } = await supabase.from("posts").insert({
      content,
      user_id: session.user.id,
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
    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading highlights:", error);
    } else {
      setHighlights(data || []);
    }
  }

  async function uploadHighlight() {
    if (!session?.user || !highlightFile) return;

    const file = highlightFile;
    const ext = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("highlights")
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("highlights")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("highlights").insert({
      user_id: session.user.id,
      title: highlightTitle,
      video_url: publicData.publicUrl,
    });

    if (insertError) {
      alert(insertError.message);
    } else {
      setHighlightTitle("");
      setHighlightFile(null);
      fetchHighlights();
    }
  }

  // ---------- SEARCH & FOLLOW ----------
  async function fetchAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error loading profiles:", error);
    } else {
      setAllProfiles(data || []);
    }
  }

  async function fetchFollowing() {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", session.user.id);

    if (error) {
      console.error("Error loading follows:", error);
    } else {
      setFollowingIds((data || []).map((r) => r.followee_id));
    }
  }

  async function followUser(targetUserId) {
    if (!session?.user) return;
    if (followingIds.includes(targetUserId)) return;

    const { error } = await supabase.from("follows").insert({
      follower_id: session.user.id,
      followee_id: targetUserId,
    });

    if (error) {
      alert(error.message);
    } else {
      setFollowingIds((prev) => [...prev, targetUserId]);
    }
  }

  async function unfollowUser(targetUserId) {
    if (!session?.user) return;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("followee_id", targetUserId);

    if (error) {
      alert(error.message);
    } else {
      setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
    }
  }

  // ---------- MESSAGES ----------
  async function openChatWith(userId) {
    setSelectedChatUserId(userId);
    await fetchMessagesWith(userId);
  }

  async function fetchMessagesWith(userId) {
    if (!session?.user || !userId) return;

    const me = session.user.id;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${me},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }
  }

  async function sendMessage() {
    if (!session?.user || !selectedChatUserId) return;

    const content = newMessage.trim();
    if (!content) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: session.user.id,
      receiver_id: selectedChatUserId,
      content,
    });

    if (error) {
      alert(error.message);
    } else {
      setNewMessage("");
      fetchMessagesWith(selectedChatUserId);
    }
  }

  // ---------- RENDER ----------
  if (loading) {
    return (
      <div style={styles.page}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen signIn={signIn} signUp={signUp} />;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2>SportsLink</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={view === "feed" ? styles.tabActive : styles.tab}
            onClick={() => setView("feed")}
          >
            Feed
          </button>
          <button
            style={view === "profile" ? styles.tabActive : styles.tab}
            onClick={() => setView("profile")}
          >
            Profile
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

      {view === "search" && (
        <SearchView
          profiles={allProfiles}
          filters={searchFilters}
          setFilters={setSearchFilters}
          currentUserId={session.user.id}
          followingIds={followingIds}
          onFollow={followUser}
          onUnfollow={unfollowUser}
          onOpenChat={openChatWith}
          setView={setView}
        />
      )}

      {view === "messages" && (
        <MessagesView
          profiles={allProfiles}
          currentUserId={session.user.id}
          selectedChatUserId={selectedChatUserId}
          openChatWith={openChatWith}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
}

// ---------- AUTH SCREEN ----------
function AuthScreen({ signIn, signUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1>SportsLink</h1>
        <p style={{ color: "#9ca3af", marginBottom: 20 }}>
          Sign in or create an account to connect players, coaches, and clubs.
        </p>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={styles.buttonPrimary}
          onClick={() => signIn(email, password)}
        >
          Log In
        </button>

        <button
          style={styles.buttonSecondary}
          onClick={() => signUp(email, password)}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

// ---------- PROFILE VIEW ----------
function ProfileView({ profile, onSave, email }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [role, setRole] = useState(profile?.role || "Player");
  const [position, setPosition] = useState(profile?.position || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [bio, setBio] = useState(profile?.bio || "");

  const [country, setCountry] = useState(profile?.country || "");
  const [age, setAge] = useState(profile?.age || "");
  const [heightCm, setHeightCm] = useState(profile?.height_cm || "");
  const [preferredFoot, setPreferredFoot] = useState(
    profile?.preferred_foot || "Right"
  );
  const [mainPosition, setMainPosition] = useState(
    profile?.main_position || ""
  );
  const [secondaryPosition, setSecondaryPosition] = useState(
    profile?.secondary_position || ""
  );
  const [clubName, setClubName] = useState(profile?.club_name || "");
  const [achievements, setAchievements] = useState(
    profile?.achievements || ""
  );
  const [photoFile, setPhotoFile] = useState(null);

  return (
    <div style={styles.container}>
      <h2>Your Profile</h2>

      {profile?.photo_url && (
        <img
          src={profile.photo_url}
          alt="Profile"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 15,
          }}
        />
      )}

      <label style={styles.label}>Email (login)</label>
      <div style={{ marginBottom: 10 }}>{email}</div>

      <label style={styles.label}>Full Name</label>
      <input
        style={styles.input}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <label style={styles.label}>Role</label>
      <select
        style={styles.input}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option>Player</option>
        <option>Coach</option>
        <option>Scout</option>
        <option>Club</option>
      </select>

      <label style={styles.label}>Position</label>
      <input
        style={styles.input}
        placeholder="e.g. Left Winger, Striker"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
      />

      <label style={styles.label}>Location</label>
      <input
        style={styles.input}
        placeholder="City, Country"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <label style={styles.label}>Country</label>
      <input
        style={styles.input}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      />

      <label style={styles.label}>Age</label>
      <input
        style={styles.input}
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />

      <label style={styles.label}>Height (cm)</label>
      <input
        style={styles.input}
        type="number"
        value={heightCm}
        onChange={(e) => setHeightCm(e.target.value)}
      />

      <label style={styles.label}>Preferred Foot</label>
      <select
        style={styles.input}
        value={preferredFoot}
        onChange={(e) => setPreferredFoot(e.target.value)}
      >
        <option>Right</option>
        <option>Left</option>
        <option>Both</option>
      </select>

      <label style={styles.label}>Main Position</label>
      <input
        style={styles.input}
        placeholder="e.g. Striker, CB, LW"
        value={mainPosition}
        onChange={(e) => setMainPosition(e.target.value)}
      />

      <label style={styles.label}>Secondary Position</label>
      <input
        style={styles.input}
        placeholder="e.g. RW, LB"
        value={secondaryPosition}
        onChange={(e) => setSecondaryPosition(e.target.value)}
      />

      <label style={styles.label}>Club / Academy</label>
      <input
        style={styles.input}
        value={clubName}
        onChange={(e) => setClubName(e.target.value)}
      />

      <label style={styles.label}>Achievements</label>
      <textarea
        style={styles.textarea}
        placeholder="e.g. Won Nationwide League Div 2 2024..."
        value={achievements}
        onChange={(e) => setAchievements(e.target.value)}
      />

      <label style={styles.label}>Bio</label>
      <textarea
        style={styles.textarea}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <label style={styles.label}>Profile Photo</label>
      <input
        type="file"
        accept="image/*"
        style={{ marginBottom: 15 }}
        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
      />

      <button
        style={{ ...styles.buttonPrimary, marginTop: 10 }}
        onClick={() =>
          onSave({
            full_name: fullName,
            role,
            position,
            location,
            bio,
            country,
            age: age ? Number(age) : null,
            height_cm: heightCm ? Number(heightCm) : null,
            preferred_foot: preferredFoot,
            main_position: mainPosition,
            secondary_position: secondaryPosition,
            club_name: clubName,
            achievements,
            photoFile,
          })
        }
      >
        Save Profile
      </button>
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
  const [highlightPreview, setHighlightPreview] = useState(null);
  const [highlightError, setHighlightError] = useState("");

  const handleHighlightFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setHighlightError("");
    setHighlightFile(file);
    setHighlightPreview(null);

    if (!file) return;

    // 1) Size limit: 50 MB
    const maxMb = 50;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setHighlightError(`File too big. Max size is ${maxMb} MB.`);
      setHighlightFile(null);
      return;
    }

    // 2) Type check: allow MP4 + MOV
    const allowedTypes = ["video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setHighlightError("Only MP4 or MOV videos are allowed.");
      setHighlightFile(null);
      return;
    }

    // 3) MOV compatibility note
    if (file.type === "video/quicktime") {
      setHighlightError(
        "Note: MOV works, but some phone videos may play audio only in some browsers."
      );
    }

    // 4) Preview URL
    const url = URL.createObjectURL(file);
    setHighlightPreview(url);
  };

  return (
    <div style={styles.container}>
      <h2>Feed</h2>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Share your latest match, training, or opportunity.
      </p>

      <textarea
        style={styles.textarea}
        placeholder="e.g. Scored 2 goals today, open to trials this summer..."
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
      />

      <button style={styles.buttonPrimary} onClick={createPost}>
        Post
      </button>

      <h3 style={{ marginTop: 30 }}>Upload Highlight</h3>
      <input
        style={styles.input}
        placeholder="Title (e.g. Hat-trick vs XYZ FC)"
        value={highlightTitle}
        onChange={(e) => setHighlightTitle(e.target.value)}
      />

      {/* Preview (if selected) */}
      {highlightPreview && (
        <video
          src={highlightPreview}
          controls
          style={{ width: "100%", marginBottom: 10, borderRadius: 8 }}
        />
      )}

      <input
        type="file"
        accept="video/mp4, video/quicktime"
        style={{ marginBottom: 10 }}
        onChange={handleHighlightFileChange}
      />

      {/* Error / warning message */}
      {highlightError && (
        <div
          style={{
            color: "#f97316",
            fontSize: 13,
            marginBottom: 10,
            maxWidth: "100%",
          }}
        >
          {highlightError}
        </div>
      )}

      <button style={styles.buttonPrimary} onClick={uploadHighlight}>
        Upload Highlight
      </button>

      <div style={{ marginTop: 20 }}>
        {highlights.map((h) => (
          <div key={h.id} style={styles.post}>
            <strong>{h.title}</strong>
            <br />
            <video
              src={h.video_url}
              controls
              style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
            />
            <small style={{ color: "#9ca3af" }}>
              {new Date(h.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Recent Posts</h3>
        {posts.length === 0 && (
          <div style={{ color: "#9ca3af" }}>No posts yet. Be the first.</div>
        )}
        {posts.map((p) => (
          <div key={p.id} style={styles.post}>
            <p>{p.content}</p>
            <small style={{ color: "#9ca3af" }}>
              {new Date(p.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- SEARCH VIEW ----------
function SearchView({
  profiles,
  filters,
  setFilters,
  currentUserId,
  followingIds,
  onFollow,
  onUnfollow,
  onOpenChat,
  setView,
}) {
  const filtered = profiles.filter((p) => {
    if (!p) return false;
    if (p.id === currentUserId) return false;

    if (
      filters.country &&
      !(p.country || "").toLowerCase().includes(filters.country.toLowerCase())
    ) {
      return false;
    }

    if (filters.position) {
      const pos = filters.position.toLowerCase();
      const mainPos = (p.main_position || "").toLowerCase();
      const secPos = (p.secondary_position || "").toLowerCase();
      if (!mainPos.includes(pos) && !secPos.includes(pos)) {
        return false;
      }
    }

    if (filters.minAge && (!p.age || p.age < Number(filters.minAge))) {
      return false;
    }
    if (filters.maxAge && (!p.age || p.age > Number(filters.maxAge))) {
      return false;
    }

    return true;
  });

  return (
    <div style={styles.container}>
      <h2>Search Players</h2>

      <label style={styles.label}>Country</label>
      <input
        style={styles.input}
        value={filters.country}
        onChange={(e) =>
          setFilters({ ...filters, country: e.target.value })
        }
      />

      <label style={styles.label}>Position</label>
      <input
        style={styles.input}
        placeholder="e.g. Striker, CB, LW"
        value={filters.position}
        onChange={(e) =>
          setFilters({ ...filters, position: e.target.value })
        }
      />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Min age</label>
          <input
            style={styles.input}
            type="number"
            value={filters.minAge}
            onChange={(e) =>
              setFilters({ ...filters, minAge: e.target.value })
            }
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Max age</label>
          <input
            style={styles.input}
            type="number"
            value={filters.maxAge}
            onChange={(e) =>
              setFilters({ ...filters, maxAge: e.target.value })
            }
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {filtered.length === 0 && (
          <div style={{ color: "#9ca3af" }}>No players match your filters.</div>
        )}

        {filtered.map((p) => {
          const isFollowing = followingIds.includes(p.id);
          return (
            <div key={p.id} style={styles.post}>
              <div style={{ display: "flex", gap: 10 }}>
                {p.photo_url && (
                  <img
                    src={p.photo_url}
                    alt={p.full_name || "Player"}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <strong>{p.full_name || "Unnamed Player"}</strong>
                  <div>{p.country}</div>
                  <div>
                    {p.main_position}
                    {p.secondary_position
                      ? ` / ${p.secondary_position}`
                      : ""}
                  </div>
                  <div>
                    Age: {p.age || "N/A"} | Foot:{" "}
                    {p.preferred_foot || "N/A"}
                  </div>
                  <div>Club: {p.club_name || "-"}</div>
                  {p.achievements && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <em>{p.achievements}</em>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                {!isFollowing ? (
                  <button
                    style={styles.buttonPrimary}
                    onClick={() => onFollow(p.id)}
                  >
                    Follow
                  </button>
                ) : (
                  <button
                    style={styles.buttonSecondary}
                    onClick={() => onUnfollow(p.id)}
                  >
                    Unfollow
                  </button>
                )}

                <button
                  style={styles.buttonSecondary}
                  onClick={() => {
                    onOpenChat(p.id);
                    setView("messages");
                  }}
                >
                  Message
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- MESSAGES VIEW ----------
function MessagesView({
  profiles,
  currentUserId,
  selectedChatUserId,
  openChatWith,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
}) {
  const otherUsers = profiles.filter((p) => p && p.id !== currentUserId);
  const activeUser =
    profiles.find((p) => p && p.id === selectedChatUserId) || null;

  return (
    <div style={styles.container}>
      <h2>Messages</h2>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Left: list of users to chat with */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16 }}>Players & Coaches</h3>
          {otherUsers.length === 0 && (
            <div style={{ color: "#9ca3af" }}>
              No other profiles yet. Ask others to sign up.
            </div>
          )}
          {otherUsers.map((u) => (
            <div
              key={u.id}
              style={{
                ...styles.post,
                cursor: "pointer",
                border:
                  selectedChatUserId === u.id
                    ? "1px solid #22c55e"
                    : "1px solid transparent",
              }}
              onClick={() => openChatWith(u.id)}
            >
              <strong>{u.full_name || "Unnamed"}</strong>
              <div>{u.main_position}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {u.country} {u.club_name ? `• ${u.club_name}` : ""}
              </div>
            </div>
          ))}
        </div>

        {/* Right: chat window */}
        <div style={{ flex: 2 }}>
          {activeUser ? (
            <>
              <h3 style={{ fontSize: 16 }}>
                Chat with {activeUser.full_name || "Player"}
              </h3>
              <div
                style={{
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: 10,
                  height: 260,
                  overflowY: "auto",
                  background: "#020617",
                  marginBottom: 10,
                }}
              >
                {messages.length === 0 && (
                  <div style={{ color: "#9ca3af" }}>
                    No messages yet. Say hello!
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 8,
                      textAlign:
                        m.sender_id === currentUserId ? "right" : "left",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: 10,
                        background:
                          m.sender_id === currentUserId
                            ? "#22c55e"
                            : "#1e293b",
                        color:
                          m.sender_id === currentUserId ? "#022c22" : "white",
                      }}
                    >
                      {m.content}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                style={styles.textarea}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />

              <button style={styles.buttonPrimary} onClick={sendMessage}>
                Send
              </button>
            </>
          ) : (
            <div style={{ color: "#9ca3af", marginTop: 20 }}>
              Select a player or coach on the left to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#0f172a",
    color: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 5,
    marginBottom: 15,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "white",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    padding: 10,
    minHeight: 80,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "white",
    marginBottom: 15,
    fontSize: 14,
  },
  buttonPrimary: {
    padding: 10,
    background: "#22c55e",
    border: "none",
    borderRadius: 8,
    marginBottom: 10,
    cursor: "pointer",
    fontWeight: "bold",
    color: "#022c22",
  },
  buttonSecondary: {
    padding: 10,
    background: "#475569",
    border: "none",
    borderRadius: 8,
    marginBottom: 10,
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
  },
  tab: {
    background: "#475569",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
  },
  tabActive: {
    background: "#22c55e",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#022c22",
    fontWeight: "bold",
  },
  logout: {
    background: "#ef4444",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    color: "#cbd5f5",
    marginBottom: 4,
  },
  post: {
    background: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
};

export default App;
