import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  TextField,
  IconButton,
  Button,
  Select,
  MenuItem,
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
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("calendar-notes");
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("calendar-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    setDates(generateCalendar(currentMonth));
  }, [currentMonth]);

  function goToday() {
    setCurrentMonth(dayjs());
  }

  function generateCalendar(month) {
    const monthStart = month.startOf("month");
    const calendarStart = monthStart.subtract(monthStart.day(), "day");

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = calendarStart.add(i, "day");
      days.push({
        date: day,
        isCurrentMonth: day.month() === month.month(),
      });
    }
    return days;
  }
  useEffect(() => {
    console.log(currentMonth.format("MM-YYYY"));
  }, [currentMonth]);

  const openModal = (date) => {
    setSelectedDate(date.format("DD-MM-YYYY"));
    setModalOpen(true);
  };

  const handleNoteChange = (e) => {
    if (!selectedDate) return;
    setNotes((prev) => ({ ...prev, [selectedDate]: e.target.value }));
  };

  const handlePrev = () => {
    
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };
  const handleNext = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };
  const [locked, setLocked] = useState(false);
  // const [view, setView] = useState("month");
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
        {/* logo */}
        {/* <Box display="flex" alignItems="center" gap={1}>
          <Logo size={36} />
          <Typography variant="h5" fontWeight="bold">
            NoteCal
          </Typography>
        </Box> */}

        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePrev}>{"<"}</IconButton>
          <IconButton onClick={handleNext}>{">"}</IconButton>
          <Typography variant="h5">
            {currentMonth.format("MMMM YYYY")}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            onClick={goToday}
            sx={{
              borderRadius: "999px",
              px: 3,
              textTransform: "none",
            }}
          >
            Today
          </Button>
          {/* <Select
            value={view}
            onChange={(e) => setView(e.target.value)}
            sx={{
              borderRadius: "25px",
              height: "35px",
              width: "120",
              minWidth: "140",
              px: 2,
              "& .MuiSelect-select": { py: 1, px: 1 },
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: "25px",
              },
            }}
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="threeDay">3-Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </Select> */}
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

          if (e.deltaY > 0) handleNext();
          else handlePrev();

          setTimeout(() => setLocked(false), 1000);
        }}
      >
        {dates.map((day, i) => (
          <Paper
            key={i}
            sx={{
              p: 1,
              cursor: "pointer",
              opacity: day.isCurrentMonth ? 1 : 0.4,
            }}
            onClick={() => openModal(day.date)}
          >
            <Typography
              component="div"
              sx={{
                fontSize: "12px",
              }}
            >
              {day.date.isSame(dayjs(), "day") ? (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {day.date.date()}
                </Box>
              ) : (
                day.date.date()
              )}
            </Typography>
          </Paper>
        ))}
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
              autoFocus
              variant="standard"
              multiline
              minRows={5}
              value={selectedDate ? notes[selectedDate] || "" : ""}
              onChange={handleNoteChange}
              placeholder="Write your brilliant life plans..."
              InputProps={{
                disableUnderline: true,
              }}
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
