import { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  TextField,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import dayjs from "dayjs";

const noteApi = import.meta.env.VITE_NOTE_API;

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 440,
  maxHeight: 540,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 0,
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const searchDropdownStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  width: 320,
  bgcolor: "background.paper",
  boxShadow: 4,
  borderRadius: 2,
  zIndex: 1300,
  overflow: "hidden",
  maxHeight: 360,
  overflowY: "auto",
};

export default function App() {
  const [notesByDate, setNotesByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [localNote, setLocalNote] = useState({ title: "", text: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [dates, setDates] = useState([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Refs to avoid stale closures
  const localNoteRef = useRef(localNote);
  const selectedDateRef = useRef(selectedDate);
  const selectedNoteIdRef = useRef(selectedNoteId);

  useEffect(() => {
    localNoteRef.current = localNote;
  }, [localNote]);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);
  useEffect(() => {
    selectedNoteIdRef.current = selectedNoteId;
  }, [selectedNoteId]);

  useEffect(() => {
    setDates(generateCalendar(currentMonth));
  }, [currentMonth]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await axios.get(`${noteApi}/search`, {
          params: { q: searchQuery },
        });
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [searchQuery]);

  function generateCalendar(month) {
    const monthStart = month.startOf("month");
    const calendarStart = monthStart.subtract(monthStart.day(), "day");
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = calendarStart.add(i, "day");
      days.push({ date: day, isCurrentMonth: day.month() === month.month() });
    }
    return days;
  }

  const handlePrev = () => setCurrentMonth((p) => p.subtract(1, "month"));
  const handleNext = () => setCurrentMonth((p) => p.add(1, "month"));
  const goToday = () => setCurrentMonth(dayjs());

  // --- POST ---
  const createNote = async (date, title = "", text = "") => {
    try {
      const { data: newNote } = await axios.post(`${noteApi}/${date}`, {
        title,
        text,
      });
      setNotesByDate((prev) => ({
        ...prev,
        [date]: [...(prev[date] || []), newNote],
      }));
      return newNote;
    } catch (err) {
      console.error("Failed to create note:", err);
      return null;
    }
  };

  // --- GET ---
  const fetchNotes = async (date, selectNoteId = null) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${noteApi}/${date}`);
      if (data.length > 0) {
        setNotesByDate((prev) => ({ ...prev, [date]: data }));
        const target = selectNoteId
          ? data.find((n) => n.id === selectNoteId)
          : data[0];
        const note = target || data[0];
        setSelectedNoteId(note.id);
        setLocalNote({ title: note.title, text: note.text });
      } else {
        const created = await createNote(date);
        if (created) {
          setSelectedNoteId(created.id);
          setLocalNote({ title: "", text: "" });
        }
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- PUT ---
  const saveNote = async () => {
    const date = selectedDateRef.current;
    const noteId = selectedNoteIdRef.current;
    const note = localNoteRef.current;
    if (!date || !noteId) return;
    try {
      await axios.put(`${noteApi}/${date}/${noteId}`, note);
      setNotesByDate((prev) => ({
        ...prev,
        [date]: (prev[date] || []).map((n) =>
          n.id === noteId ? { ...n, ...note } : n,
        ),
      }));
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleNoteChange = (field, value) => {
    setLocalNote((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabSwitch = async (note) => {
    await saveNote();
    setSelectedNoteId(note.id);
    setLocalNote({ title: note.title, text: note.text });
  };

  // --- DELETE ---
  const deleteNote = async (noteId) => {
    try {
      const res = await axios
        .delete(`${noteApi}/${selectedDate}/${noteId}`)
        .catch((err) => err.response);

      if (res?.status === 400) {
        setLocalNote({ title: "", text: "" });
        return;
      }

      setNotesByDate((prev) => {
        const updated = (prev[selectedDate] || []).filter(
          (n) => n.id !== noteId,
        );
        if (noteId === selectedNoteId && updated.length > 0) {
          setSelectedNoteId(updated[0].id);
          setLocalNote({ title: updated[0].title, text: updated[0].text });
        }
        return { ...prev, [selectedDate]: updated };
      });
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // --- Open modal (optionally jump to a specific note) ---
  const openModal = async (date, selectNoteId = null) => {
    const fmt = typeof date === "string" ? date : date.format("DD-MM-YYYY");
    // Navigate calendar to the correct month
    const [dd, mm, yyyy] = fmt.split("-");
    setCurrentMonth(dayjs(`${yyyy}-${mm}-${dd}`));
    setSelectedDate(fmt);
    setModalOpen(true);
    await fetchNotes(fmt, selectNoteId);
  };

  const closeModal = async () => {
    await saveNote();
    setModalOpen(false);
  };

  const handleAddNote = async () => {
    await saveNote();
    const created = await createNote(selectedDate);
    if (created) {
      setSelectedNoteId(created.id);
      setLocalNote({ title: "", text: "" });
    }
  };

  // --- Search result click ---
  const handleSearchSelect = async (result) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    await openModal(result.date, result.id);
  };

  const handleTextKeyDown = (e) => {
    const ta = e.target;
    const { selectionStart: ss, selectionEnd: se, value } = ta;

    if (e.key === "Tab") {
      e.preventDefault();
      const indent = "    ";
      const newValue = value.slice(0, ss) + indent + value.slice(se);
      handleNoteChange("text", newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = ss + indent.length;
      });
    }

    if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      const selected = value.slice(ss, se);
      if (!selected) return;
      if (selected.startsWith("**") && selected.endsWith("**")) {
        const unwrapped = selected.slice(2, -2);
        handleNoteChange(
          "text",
          value.slice(0, ss) + unwrapped + value.slice(se),
        );
        requestAnimationFrame(() => {
          ta.selectionStart = ss;
          ta.selectionEnd = ss + unwrapped.length;
        });
      } else {
        handleNoteChange(
          "text",
          value.slice(0, ss) + `**${selected}**` + value.slice(se),
        );
        requestAnimationFrame(() => {
          ta.selectionStart = ss + 2;
          ta.selectionEnd = se + 2;
        });
      }
    }
  };

  const dayNotes = (selectedDate && notesByDate[selectedDate]) || [];

  const getNoteCount = (date) => {
    const fmt = date.format("DD-MM-YYYY");
    return (notesByDate[fmt] || []).filter((n) => n.title || n.text).length;
  };

  const getSelectedDateFormatted = () => {
    if (!selectedDate) return "";
    const [dd, mm, yyyy] = selectedDate.split("-");
    return dayjs(`${yyyy}-${mm}-${dd}`).format("dddd, MMMM D, YYYY");
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text || "";
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <Box component="span" sx={{ fontWeight: 700, color: "primary.main" }}>
          {text.slice(idx, idx + query.length)}
        </Box>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        px: 2,
        py: 1,
        gap: 1,
      }}
    >
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePrev}>{"<"}</IconButton>
          <IconButton onClick={handleNext}>{">"}</IconButton>
          <Typography variant="h5">
            {currentMonth.format("MMMM YYYY")}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Search */}
          <Box ref={searchRef} sx={{ position: "relative" }}>
            {searchOpen ? (
              <TextField
                autoFocus
                size="small"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                sx={{ width: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searchLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SearchIcon fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <IconButton onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </IconButton>
            )}

            {/* Dropdown results */}
            {searchOpen &&
              (searchResults.length > 0 || (searchQuery && !searchLoading)) && (
                <Box sx={searchDropdownStyle}>
                  {searchResults.length === 0 ? (
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No notes found
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {searchResults.map((result, idx) => {
                        const [dd, mm, yyyy] = result.date.split("-");
                        const formatted = dayjs(`${yyyy}-${mm}-${dd}`).format(
                          "MMM D, YYYY",
                        );
                        return (
                          <Box key={result.id}>
                            {idx > 0 && <Divider />}
                            <ListItemButton
                              onClick={() => handleSearchSelect(result)}
                              sx={{ py: 1, px: 2 }}
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    noWrap
                                  >
                                    {highlightMatch(
                                      result.title || "Untitled",
                                      searchQuery,
                                    )}
                                  </Typography>
                                }
                                secondary={
                                  <Box
                                    component="span"
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      noWrap
                                      sx={{ maxWidth: 180 }}
                                    >
                                      {highlightMatch(result.text, searchQuery)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.disabled"
                                      sx={{ ml: 1, flexShrink: 0 }}
                                    >
                                      {formatted}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItemButton>
                          </Box>
                        );
                      })}
                    </List>
                  )}
                </Box>
              )}
          </Box>

          <Button
            variant="contained"
            onClick={goToday}
            sx={{ borderRadius: "999px", px: 3, textTransform: "none" }}
          >
            Today
          </Button>
        </Box>
      </Box>

      {/* WEEKDAYS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          fontSize: "10px",
        }}
      >
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
          <Box key={d} sx={{ textAlign: "center", fontWeight: "bold" }}>
            {d}
          </Box>
        ))}
      </Box>

      {/* CALENDAR GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          gap: 0.1,
        }}
        onWheel={(e) => {
          if (locked) return;
          setLocked(true);
          e.deltaY > 0 ? handleNext() : handlePrev();
          setTimeout(() => setLocked(false), 1000);
        }}
      >
        {dates.map((day, i) => {
          const count = getNoteCount(day.date);
          return (
            <Paper
              key={i}
              sx={{
                p: 1,
                cursor: "pointer",
                opacity: day.isCurrentMonth ? 1 : 0.4,
                position: "relative",
              }}
              onClick={() => openModal(day.date)}
            >
              <Typography component="div" sx={{ fontSize: "12px" }}>
                {day.date.isSame(dayjs(), "day") ? (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {day.date.date()}
                  </Box>
                ) : (
                  day.date.date()
                )}
              </Typography>
              {count > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    gap: "2px",
                    mt: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                    <Box
                      key={di}
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        backgroundColor: "primary.main",
                      }}
                    />
                  ))}
                  {count > 3 && (
                    <Typography
                      sx={{
                        fontSize: "9px",
                        color: "primary.main",
                        lineHeight: "5px",
                      }}
                    >
                      +{count - 3}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={closeModal}>
        <Box sx={modalStyle}>
          {/* Tabs row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              pt: 1.5,
              pb: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              overflowX: "auto",
              flexShrink: 0,
              "&::-webkit-scrollbar": { height: 4 },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: 2,
                bgcolor: "divider",
              },
            }}
          >
            {dayNotes.map((note, idx) => (
              <Box
                key={note.id}
                onClick={() => handleTabSwitch(note)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: "12px",
                  fontWeight: note.id === selectedNoteId ? 600 : 400,
                  bgcolor:
                    note.id === selectedNoteId
                      ? "primary.main"
                      : "action.hover",
                  color:
                    note.id === selectedNoteId
                      ? "primary.contrastText"
                      : "text.primary",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor:
                      note.id === selectedNoteId
                        ? "primary.dark"
                        : "action.selected",
                  },
                }}
              >
                {note.id === selectedNoteId
                  ? localNote.title?.trim() || `Note ${idx + 1}`
                  : note.title?.trim() || `Note ${idx + 1}`}
                {dayNotes.length > 1 && (
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      ml: 0.3,
                      opacity: 0.6,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </Box>
                )}
              </Box>
            ))}

            <Tooltip title="Add note">
              <IconButton
                size="small"
                onClick={handleAddNote}
                sx={{ flexShrink: 0, ml: 0.5 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ ml: "auto", flexShrink: 0 }}>
              <IconButton size="small" onClick={closeModal}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Note content */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
                py: 4,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : selectedNoteId ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                px: 2,
                py: 1.5,
                overflow: "hidden",
              }}
            >
              <TextField
                fullWidth
                autoFocus
                variant="standard"
                value={localNote.title}
                onChange={(e) => handleNoteChange("title", e.target.value)}
                onBlur={saveNote}
                placeholder="Title"
                InputProps={{ disableUnderline: true }}
                inputProps={{ style: { fontSize: "18px", fontWeight: 600 } }}
              />
              <Box sx={{ mt: 1.5, overflowY: "auto", flex: 1 }}>
                <TextField
                  fullWidth
                  variant="standard"
                  multiline
                  minRows={6}
                  value={localNote.text}
                  onChange={(e) => handleNoteChange("text", e.target.value)}
                  onKeyDown={handleTextKeyDown}
                  onBlur={saveNote}
                  placeholder="Write your brilliant life plans..."
                  InputProps={{ disableUnderline: true }}
                />
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  mt: 1,
                  pt: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {getSelectedDateFormatted()}
                </Typography>
                {dayNotes.length > 1 && (
                  <Tooltip title="Delete this note">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteNote(selectedNoteId)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          ) : null}
        </Box>
      </Modal>
    </Box>
  );
}
