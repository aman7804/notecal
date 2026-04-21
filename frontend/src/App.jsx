import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  TextField,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  const [notesByDate, setNotesByDate] = useState({});  // date -> { id, title, text } | null
  const [selectedDate, setSelectedDate] = useState(null);
  const [localNote, setLocalNote] = useState({ title: "", text: "" });
  const [noteId, setNoteId] = useState(null);          // null = no note saved yet for this date
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [dates, setDates] = useState([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // --- GET ---
  const fetchNote = async (date) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${noteApi}/${date}`);
      if (data) {
        setNotesByDate((prev) => ({ ...prev, [date]: data }));
        setNoteId(data.id);
        setLocalNote({ title: data.title, text: data.text });
      } else {
        // No note for this day yet — show blank fields, don't create anything
        setNotesByDate((prev) => ({ ...prev, [date]: null }));
        setNoteId(null);
        setLocalNote({ title: "", text: "" });
      }
    } catch (err) {
      console.error("Failed to fetch note:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE (create or update depending on whether note exists) ---
  const saveNote = async (date, id, note) => {
    const isEmpty = !note.title.trim() && !note.text.trim();
    if (isEmpty) return;

    try {
      if (id) {
        // Note already exists — update it
        await axios.put(`${noteApi}/${date}`, note);
        setNotesByDate((prev) => ({
          ...prev,
          [date]: { ...prev[date], ...note },
        }));
      } else {
        // First save for this date — create it
        const { data: created } = await axios.post(`${noteApi}/${date}`, note);
        setNoteId(created.id);
        setNotesByDate((prev) => ({
          ...prev,
          [date]: created,
        }));
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleNoteChange = (field, value) => {
    setLocalNote((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = () => {
    saveNote(selectedDate, noteId, localNote);
  };

  // --- Open / Close modal ---
  const openModal = async (date) => {
    const fmt = typeof date === "string" ? date : date.format("DD-MM-YYYY");
    setSelectedDate(fmt);
    setModalOpen(true);
    await fetchNote(fmt);
  };

  const closeModal = () => {
    saveNote(selectedDate, noteId, localNote);
    setModalOpen(false);
  };

  const hasNote = (date) => {
    const fmt = date.format("DD-MM-YYYY");
    const note = notesByDate[fmt];
    return note && (note.title || note.text);
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
          const noted = hasNote(day.date);
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
              {noted && (
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    mt: 0.5,
                  }}
                />
              )}
            </Paper>
          );
        })}
      </Box>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={closeModal}>
        <Box sx={modalStyle}>
          {/* Modal header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              pt: 1.5,
              pb: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {getSelectedDateFormatted()}
            </Typography>
            <IconButton size="small" onClick={closeModal}>
              <CloseIcon fontSize="small" />
            </IconButton>
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
          ) : (
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
                onBlur={handleBlur}
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
                  onBlur={handleBlur}
                  placeholder="Write your brilliant life plans..."
                  InputProps={{ disableUnderline: true }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}