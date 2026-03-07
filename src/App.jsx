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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

  // Refs so saveNote always reads latest values — never stale
  const localNoteRef = useRef(localNote);
  const selectedDateRef = useRef(selectedDate);
  const selectedNoteIdRef = useRef(selectedNoteId);

  // Keep refs in sync with state
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
  const fetchNotes = async (date) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${noteApi}/${date}`);
      if (data.length > 0) {
        setNotesByDate((prev) => ({ ...prev, [date]: data }));
        setSelectedNoteId(data[0].id);
        setLocalNote({ title: data[0].title, text: data[0].text });
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

  // --- PUT: reads from refs — always fresh, no stale closure ---
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

  // --- Typing: only touches localNote state (zero extra re-renders elsewhere) ---
  const handleNoteChange = (field, value) => {
    setLocalNote((prev) => ({ ...prev, [field]: value }));
  };

  // --- Tab switch: save current, then load new ---
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

  // --- Open modal ---
  const openModal = async (date) => {
    const fmt = date.format("DD-MM-YYYY");
    setSelectedDate(fmt);
    setModalOpen(true);
    await fetchNotes(fmt);
  };

  // --- Close modal ---
  const closeModal = async () => {
    await saveNote();
    setModalOpen(false);
  };

  // --- Add note ---
  const handleAddNote = async () => {
    await saveNote(); // save current before switching
    const created = await createNote(selectedDate);
    if (created) {
      setSelectedNoteId(created.id);
      setLocalNote({ title: "", text: "" });
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
        <Button
          variant="contained"
          onClick={goToday}
          sx={{ borderRadius: "999px", px: 3, textTransform: "none" }}
        >
          Today
        </Button>
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
                {/* Active tab shows live localNote title */}
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
