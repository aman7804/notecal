import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import Logo from "./components/Logo.jsx";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  maxHeight: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
};

export default function App() {
  const [notes, setNotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("week"); // "month" | "week"

  // Load notes
  useEffect(() => {
    const saved = localStorage.getItem("calendar-notes");
    if (saved) setNotes(JSON.parse(saved));
    setLoaded(true);
  }, []);

  // Save notes safely
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes, loaded]);

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = startOfMonth.day();

  let days = [];

  if (view === "month") {
    const startOfMonth = currentMonth.startOf("month");
    const daysInMonth = currentMonth.daysInMonth();
    const startDay = startOfMonth.day();

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(currentMonth.date(i));
  } else {
    const startOfWeek = currentMonth.startOf("week");

    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, "day"));
    }
  }

  const openModal = (date) => {
    setSelectedDate(date.format("DD-MM-YYYY"));
    setModalOpen(true);
  };

  const handleNoteChange = (e) => {
    if (!selectedDate) return;
    const value = e.target.value;
    setNotes((prev) => ({ ...prev, [selectedDate]: value }));
  };

  const handlePrev = () => {
    setCurrentMonth((prev) =>
      view === "month" ? prev.subtract(1, "month") : prev.subtract(1, "week"),
    );
  };

  const handleNext = () => {
    setCurrentMonth((prev) =>
      view === "month" ? prev.add(1, "month") : prev.add(1, "week"),
    );
  };
  const goToToday = () => {
    setCurrentMonth(dayjs());
  };

  return (
    <Box sx={{ height: "100vh", p: 2 }}>
      {/* HEADER */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ cursor: "pointer" }}
          onClick={goToToday}
        >
          <Logo size={36} />
          <Typography variant="h5" fontWeight="bold">
            NoteCal
          </Typography>
        </Box>

        {/* LEFT: DATE + ARROWS */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h4" sx={{ width: 255, textAlign: "center" }}>
            {currentMonth.format("MMMM YYYY")}
          </Typography>
          <IconButton onClick={handlePrev}>{"<"}</IconButton>
          <IconButton onClick={handleNext}>{">"}</IconButton>
        </Box>

        {/* RIGHT: VIEW SWITCH */}
        <Box>
          <IconButton
            color={view === "week" ? "primary" : "default"}
            onClick={() => setView("week")}
          >
            W
          </IconButton>
          <IconButton
            color={view === "month" ? "primary" : "default"}
            onClick={() => setView("month")}
          >
            M
          </IconButton>
        </Box>
      </Box>

      {/* CALENDAR GRID */}
      <Box
        sx={{
          height: "calc(100vh - 120px)",
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows:
            view === "month" ? "auto repeat(6, 1fr)" : "auto repeat(1, 1fr)",

          gap: 1,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Box key={d} sx={{ textAlign: "center", fontWeight: "bold" }}>
            {d}
          </Box>
        ))}

        {days.map((day, index) => {
          const key = day ? day.format("DD-MM-YYYY") : index;
          const note = day ? notes[day.format("DD-MM-YYYY")] : "";
          const isToday = day && day.isSame(dayjs(), "day");

          return (
            <Paper
              key={key}
              onClick={() => day && openModal(day)}
              sx={{
                p: 1,
                cursor: day ? "pointer" : "default",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                border: isToday ? "2px solid" : "1px solid transparent",
                borderColor: isToday ? "primary.main" : "transparent",
              }}
            >
              {day && (
                <>
                  <Typography variant="caption">{day.date()}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      whiteSpace: "pre-line", // 👈 keeps line breaks
                      wordBreak: "break-word",
                    }}
                  >
                    {note}
                  </Typography>
                </>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Note for {selectedDate}</Typography>
            <IconButton onClick={() => setModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ mt: 2, overflowY: "auto" }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              value={selectedDate ? notes[selectedDate] || "" : ""}
              onChange={handleNoteChange}
              placeholder="Write your brilliant life plans..."
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
